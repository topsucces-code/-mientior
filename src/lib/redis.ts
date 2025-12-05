import Redis from 'ioredis'
import { getSearchCacheTTL, getSuggestionsCacheTTL, getFacetsCacheTTL } from './cache-config'

const redisUrl = process.env.REDIS_URL

// Redis is optional - graceful degradation when not available (e.g., Vercel)
let redis: Redis | null = null
let isConnected = false

function createRedisClient(): Redis | null {
  if (!redisUrl) {
    console.log('[Redis] No REDIS_URL configured - running without cache')
    return null
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('[Redis] Max retries reached, giving up')
          return null
        }
        // Exponential backoff: 200ms, 400ms, 800ms
        return Math.min(times * 200, 2000)
      },
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 3000,
      enableReadyCheck: true,
      reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT']
        return targetErrors.some(e => err.message.includes(e))
      },
    })

    client.on('connect', () => {
      console.log('[Redis] Connected successfully')
      isConnected = true
    })

    client.on('ready', () => {
      console.log('[Redis] Ready to accept commands')
    })

    client.on('error', (err) => {
      console.warn('[Redis] Connection error:', err.message)
      isConnected = false
    })

    client.on('close', () => {
      console.log('[Redis] Connection closed')
      isConnected = false
    })

    client.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...')
    })

    return client
  } catch (err) {
    console.error('[Redis] Failed to create client:', err)
    return null
  }
}

redis = createRedisClient()

/**
 * Check if Redis is currently connected
 */
export function isRedisConnected(): boolean {
  return isConnected && redis !== null
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    await redis.quit()
    redis = null
    isConnected = false
    console.log('[Redis] Connection closed gracefully')
  }
}

export { redis }

/**
 * Track cache hit metrics: increment hits counter, push latency to list (keep last 100), and set expiration.
 */
async function trackCacheHit(keyPrefix: string, latency: number): Promise<void> {
  if (!redis) return
  try {
    await redis.incr(`cache:metrics:hits:${keyPrefix}`)
    await redis.lpush(`cache:metrics:latency:${keyPrefix}`, latency.toString())
    await redis.ltrim(`cache:metrics:latency:${keyPrefix}`, 0, 99) // Keep last 100 samples
    const retentionHours = parseInt(process.env.CACHE_METRICS_RETENTION_HOURS || '24', 10)
    const retentionSeconds = retentionHours * 3600
    await redis.expire(`cache:metrics:hits:${keyPrefix}`, retentionSeconds)
    await redis.expire(`cache:metrics:latency:${keyPrefix}`, retentionSeconds)
  } catch (err) {
    console.warn('Metrics tracking error:', err)
  }
}

/**
 * Track cache miss metrics: increment misses counter, push latency to list (keep last 100), and set expiration.
 */
async function trackCacheMiss(keyPrefix: string, latency: number): Promise<void> {
  if (!redis) return
  try {
    await redis.incr(`cache:metrics:misses:${keyPrefix}`)
    await redis.lpush(`cache:metrics:latency:${keyPrefix}`, latency.toString())
    await redis.ltrim(`cache:metrics:latency:${keyPrefix}`, 0, 99) // Keep last 100 samples
    const retentionHours = parseInt(process.env.CACHE_METRICS_RETENTION_HOURS || '24', 10)
    const retentionSeconds = retentionHours * 3600
    await redis.expire(`cache:metrics:misses:${keyPrefix}`, retentionSeconds)
    await redis.expire(`cache:metrics:latency:${keyPrefix}`, retentionSeconds)
  } catch (err) {
    console.warn('Metrics tracking error:', err)
  }
}

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 60,
  trackMetrics = true,
  keyPrefix?: string
): Promise<T> {
  // If Redis is not available, just call the fetcher
  if (!redis) {
    return fetcher()
  }
  
  const startTime = Date.now()
  try {
    const cached = await redis.get(key)
    if (cached) {
      const latency = Date.now() - startTime
      if (trackMetrics && keyPrefix) {
        await trackCacheHit(keyPrefix, latency)
      }
      return JSON.parse(cached) as T
    }
    const data = await fetcher()
    const latency = Date.now() - startTime
    await redis.setex(key, ttl, JSON.stringify(data))
    if (trackMetrics && keyPrefix) {
      await trackCacheMiss(keyPrefix, latency)
    }
    return data
  } catch (err) {
    console.error('Redis error', err)
    const data = await fetcher()
    // Do not track metrics on error to avoid noise
    return data
  }
}

export async function invalidateCache(pattern: string) {
  if (!redis) return
  try {
    // Use SCAN for better performance in production with large datasets
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, matchedKeys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      cursor = nextCursor;
      keys.push(...matchedKeys);
    } while (cursor !== '0');

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('Redis invalidateCache error:', err);
    // Fallback to keys command if scan fails
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
    } catch (fallbackErr) {
      console.error('Redis fallback invalidateCache error:', fallbackErr);
    }
  }
}

/**
 * Wrapper for caching search results with 30min TTL and metrics tracking.
 */
export async function getCachedSearchResults<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const ttl = getSearchCacheTTL()
  return getCachedData(key, fetcher, ttl, true, 'search:products')
}

/**
 * Wrapper for caching suggestions with 1h TTL and metrics tracking.
 */
export async function getCachedSuggestions<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const ttl = getSuggestionsCacheTTL()
  return getCachedData(key, fetcher, ttl, true, 'search:suggestions')
}

/**
 * Invalidate search results cache using SCAN pattern.
 */
export async function invalidateSearchCache(pattern: string): Promise<void> {
  // If pattern is '*', invalidate both products and global search
  if (pattern === '*') {
    await Promise.all([
      invalidateCache('search:products:*'),
      invalidateCache('search:global:*')
    ])
    return
  }
  
  // Otherwise, invalidate specific pattern in products
  return invalidateCache(`search:products:${pattern}`)
}

/**
 * Invalidate global search cache
 */
export async function invalidateGlobalSearchCache(pattern: string): Promise<void> {
  return invalidateCache(`search:global:${pattern}`)
}

/**
 * Invalidate suggestions cache using SCAN pattern.
 */
export async function invalidateSuggestionsCache(pattern: string): Promise<void> {
  return invalidateCache(`search:suggestions:${pattern}`)
}

/**
 * Retrieve cache metrics (hits, misses, avg latency) for a key prefix.
 */
/**
 * Retrieve cache metrics (hits, misses, avg latency) for a key prefix.
 */
export async function getCacheMetrics(keyPrefix: string): Promise<import('@/types').CacheMetrics> {
  if (!redis) {
    return { keyPrefix, hits: 0, misses: 0, hitRate: 0, avgLatency: 0, totalRequests: 0 }
  }
  try {
    // Use exact keyPrefix as passed (no normalization)
    const [hits, misses, latencies] = await Promise.all([
      redis.get(`cache:metrics:hits:${keyPrefix}`),
      redis.get(`cache:metrics:misses:${keyPrefix}`),
      redis.lrange(`cache:metrics:latency:${keyPrefix}`, 0, -1)
    ])
    
    const hitsCount = parseInt(hits || '0', 10)
    const missesCount = parseInt(misses || '0', 10)
    const latencyValues = latencies.map(l => parseInt(l, 10)).filter(l => !isNaN(l))
    const avgLatency = latencyValues.length > 0 ? latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length : 0
    
    const totalRequests = hitsCount + missesCount
    const hitRate = totalRequests > 0 ? (hitsCount / totalRequests) * 100 : 0

    return { 
      keyPrefix,
      hits: hitsCount, 
      misses: missesCount, 
      hitRate,
      avgLatency,
      totalRequests
    }
  } catch (err) {
    console.warn('Get cache metrics error:', err)
    return { 
      keyPrefix,
      hits: 0, 
      misses: 0, 
      hitRate: 0,
      avgLatency: 0,
      totalRequests: 0
    }
  }
}

/**
 * Reset cache metrics counters and latency lists for a key prefix (or all if none specified).
 */
export async function resetCacheMetrics(keyPrefix?: string): Promise<void> {
  if (!redis) return
  try {
    if (keyPrefix) {
      await redis.del(`cache:metrics:hits:${keyPrefix}`, `cache:metrics:misses:${keyPrefix}`, `cache:metrics:latency:${keyPrefix}`)
    } else {
      // Reset all metrics keys
      const keys: string[] = []
      let cursor = '0'
      do {
        const [nextCursor, matchedKeys] = await redis.scan(cursor, 'MATCH', 'cache:metrics:*', 'COUNT', 100)
        cursor = nextCursor
        keys.push(...matchedKeys)
      } while (cursor !== '0')
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    }
  } catch (err) {
    console.warn('Reset cache metrics error:', err)
  }
}

/**
 * Get or set spell correction in cache
 * @param query - Original search query
 * @param fetcher - Function to compute correction if not cached
 * @returns Corrected query or null
 */
export async function getCachedSpellCorrection(
  query: string,
  fetcher: () => Promise<string | null>
): Promise<string | null> {
  if (!redis) return fetcher()
  
  const cacheKey = `search:correction:${query.toLowerCase()}`
  const ttl = 3600 // 1 hour

  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      return cached === 'null' ? null : cached
    }

    const correction = await fetcher()

    // Cache both positive results and null (to avoid repeated lookups)
    await redis.setex(cacheKey, ttl, correction || 'null')

    return correction
  } catch (err) {
    console.error('Redis spell correction cache error:', err)
    return fetcher()
  }
}

/**
 * Cache facets with configurable TTL (default: 5 minutes)
 * Key format: facets:{hash}
 */
export async function getCachedFacets<T>(
  key: string,
  computeFn: () => Promise<T>
): Promise<T> {
  const ttl = getFacetsCacheTTL()
  
  // Use getCachedData to ensure consistent metrics tracking
  return getCachedData(key, computeFn, ttl, true, 'facets')
}

/**
 * Invalidate facets cache for a specific query/filter combination
 */
export async function invalidateFacetsCache(pattern: string): Promise<void> {
  if (!redis) return
  try {
    const keys = await redis.keys(`facets:${pattern}*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.warn('Redis cache invalidation error:', error)
  }
}

// ==================== USER PREFERENCES CACHE ====================

const USER_PREFERENCES_TTL = 3600 // 1 hour

/**
 * Get cached user preferences
 * 
 * @param userId - User ID
 * @returns Cached preferences or null if not found/expired
 */
export async function getCachedUserPreferences(userId: string): Promise<import('@/types/personalization').UserPreferences | null> {
  if (!redis) return null
  try {
    const cached = await redis.get(`user:preferences:${userId}`)
    if (cached) {
      return JSON.parse(cached)
    }
    return null
  } catch (error) {
    console.warn(`[redis] Error getting cached preferences for user ${userId}:`, error)
    return null
  }
}

/**
 * Set cached user preferences
 * 
 * @param userId - User ID
 * @param preferences - User preferences to cache
 */
export async function setCachedUserPreferences(
  userId: string, 
  preferences: import('@/types/personalization').UserPreferences
): Promise<void> {
  if (!redis) return
  try {
    await redis.setex(
      `user:preferences:${userId}`,
      USER_PREFERENCES_TTL,
      JSON.stringify(preferences)
    )
  } catch (error) {
    console.warn(`[redis] Error caching preferences for user ${userId}:`, error)
  }
}

/**
 * Invalidate cached user preferences
 * 
 * @param userId - User ID
 */
export async function invalidateUserPreferencesCache(userId: string): Promise<void> {
  if (!redis) return
  try {
    await redis.del(`user:preferences:${userId}`)
  } catch (error) {
    console.warn(`[redis] Error invalidating preferences cache for user ${userId}:`, error)
  }
}

/**
 * Invalidate all user preferences cache
 * Used after bulk recalculation
 */
export async function invalidateAllUserPreferencesCache(): Promise<void> {
  if (!redis) return
  try {
    const keys = await redis.keys('user:preferences:*')
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`[redis] Invalidated ${keys.length} user preferences cache entries`)
    }
  } catch (error) {
    console.warn('[redis] Error invalidating all preferences cache:', error)
  }
}

import { redis } from '@/lib/redis'
import { ExportFormat, ExportQueryParams } from './export-validation'

/**
 * Export cache configuration
 */
const CACHE_CONFIG = {
  TTL: 5 * 60, // 5 minutes
  KEY_PREFIX: 'export:cache',
  MAX_CACHE_SIZE: 10 * 1024 * 1024, // 10MB max per cached export
}

/**
 * Generate cache key for export
 */
function generateCacheKey(
  customerId: string,
  format: ExportFormat,
  params: ExportQueryParams
): string {
  const paramsHash = Buffer.from(JSON.stringify(params)).toString('base64')
  return `${CACHE_CONFIG.KEY_PREFIX}:${customerId}:${format}:${paramsHash}`
}

/**
 * Cache export data
 */
export async function cacheExport(
  customerId: string,
  format: ExportFormat,
  params: ExportQueryParams,
  data: Buffer | string
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(customerId, format, params)
    
    // Check size limit
    const dataSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data, 'utf8')
    if (dataSize > CACHE_CONFIG.MAX_CACHE_SIZE) {
      console.warn(`Export too large to cache: ${dataSize} bytes`)
      return
    }

    // Store with TTL
    const serializedData = Buffer.isBuffer(data) 
      ? data.toString('base64')
      : Buffer.from(data, 'utf8').toString('base64')
    
    const cacheValue = JSON.stringify({
      data: serializedData,
      isBuffer: Buffer.isBuffer(data),
      size: dataSize,
      timestamp: Date.now(),
    })

    await redis.setex(cacheKey, CACHE_CONFIG.TTL, cacheValue)
  } catch (error) {
    console.error('Failed to cache export:', error)
    // Don't throw - caching is optional
  }
}

/**
 * Retrieve cached export data
 */
export async function getCachedExport(
  customerId: string,
  format: ExportFormat,
  params: ExportQueryParams
): Promise<Buffer | string | null> {
  try {
    const cacheKey = generateCacheKey(customerId, format, params)
    const cachedValue = await redis.get(cacheKey)
    
    if (!cachedValue) {
      return null
    }

    const parsed = JSON.parse(cachedValue)
    const data = Buffer.from(parsed.data, 'base64')
    
    // Return as Buffer or string based on original type
    return parsed.isBuffer ? data : data.toString('utf8')
  } catch (error) {
    console.error('Failed to retrieve cached export:', error)
    return null
  }
}

/**
 * Clear export cache for a customer
 */
export async function clearExportCache(customerId: string): Promise<void> {
  try {
    const pattern = `${CACHE_CONFIG.KEY_PREFIX}:${customerId}:*`
    const keys = await redis.keys(pattern)
    
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Failed to clear export cache:', error)
  }
}

/**
 * Get cache statistics
 */
export async function getExportCacheStats(): Promise<{
  totalKeys: number
  totalSize: number
  oldestEntry: Date | null
}> {
  try {
    const pattern = `${CACHE_CONFIG.KEY_PREFIX}:*`
    const keys = await redis.keys(pattern)
    
    let totalSize = 0
    let oldestTimestamp = Date.now()
    
    for (const key of keys) {
      const value = await redis.get(key)
      if (value) {
        try {
          const parsed = JSON.parse(value)
          totalSize += parsed.size || 0
          if (parsed.timestamp < oldestTimestamp) {
            oldestTimestamp = parsed.timestamp
          }
        } catch {
          // Skip invalid entries
        }
      }
    }

    return {
      totalKeys: keys.length,
      totalSize,
      oldestEntry: keys.length > 0 ? new Date(oldestTimestamp) : null,
    }
  } catch (error) {
    console.error('Failed to get cache stats:', error)
    return {
      totalKeys: 0,
      totalSize: 0,
      oldestEntry: null,
    }
  }
}
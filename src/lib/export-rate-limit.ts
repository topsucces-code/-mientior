import { redis } from '@/lib/redis';

export interface ExportRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
  retryAfter?: number;
}

export interface ExportRateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Rate limit configurations for export operations
 */
export const EXPORT_RATE_LIMITS = {
  CUSTOMER_EXPORT: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  BULK_EXPORT: {
    maxRequests: 2,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
} as const;

/**
 * Rate limit export operations using Redis with sliding window algorithm
 * 
 * @param identifier - IP address or user ID
 * @param operation - Type of export operation
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 */
export async function rateLimitExport(
  identifier: string,
  operation: 'customer' | 'bulk',
  config?: ExportRateLimitConfig
): Promise<ExportRateLimitResult> {
  const defaultConfig = operation === 'bulk' 
    ? EXPORT_RATE_LIMITS.BULK_EXPORT 
    : EXPORT_RATE_LIMITS.CUSTOMER_EXPORT;
  
  const finalConfig = config || defaultConfig;
  const redisKey = `export:ratelimit:${operation}:${identifier}`;
  const now = Date.now();
  const windowStart = now - finalConfig.windowMs;

  try {
    // Use Lua script for atomic rate limiting operations
    const luaScript = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowStart = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])
      local requestId = ARGV[4]
      local expirySeconds = tonumber(ARGV[5])
      
      -- Remove old entries outside the window
      redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
      
      -- Count current requests in window
      local currentCount = redis.call('ZCARD', key)
      
      -- Check if limit exceeded
      if currentCount >= maxRequests then
        -- Get the oldest request timestamp for reset calculation
        local oldestRequests = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local oldestTimestamp = now
        if #oldestRequests > 1 then
          oldestTimestamp = tonumber(oldestRequests[2])
        end
        
        return {0, currentCount, oldestTimestamp}
      end
      
      -- Add current request to sorted set
      redis.call('ZADD', key, now, requestId)
      
      -- Set expiry on the key (cleanup)
      redis.call('EXPIRE', key, expirySeconds)
      
      -- Return success with new count
      return {1, currentCount + 1, now}
    `;

    const requestId = `${now}:${Math.random()}`;
    const expirySeconds = Math.ceil(finalConfig.windowMs / 1000);

    // Execute Lua script atomically
    const result = await redis.eval(
      luaScript,
      1, // number of keys
      redisKey,
      now.toString(),
      windowStart.toString(),
      finalConfig.maxRequests.toString(),
      requestId,
      expirySeconds.toString()
    ) as [number, number, number];

    const [allowed, count, timestamp] = result;

    if (allowed === 0) {
      // Request blocked - limit exceeded
      const oldestTimestamp = timestamp;
      const resetTime = oldestTimestamp + finalConfig.windowMs;
      const resetAt = new Date(resetTime);
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit: finalConfig.maxRequests,
        retryAfter,
      };
    }

    // Request allowed
    const resetAt = new Date(now + finalConfig.windowMs);

    return {
      allowed: true,
      remaining: finalConfig.maxRequests - count,
      resetAt,
      limit: finalConfig.maxRequests,
    };
  } catch (error) {
    console.error('Export rate limit error:', error);
    // Fail open: allow request if Redis is unavailable
    return {
      allowed: true,
      remaining: finalConfig.maxRequests,
      resetAt: new Date(now + finalConfig.windowMs),
      limit: finalConfig.maxRequests,
    };
  }
}

/**
 * Clear export rate limit for testing or manual intervention
 */
export async function clearExportRateLimit(
  identifier: string,
  operation: 'customer' | 'bulk'
): Promise<void> {
  const redisKey = `export:ratelimit:${operation}:${identifier}`;
  await redis.del(redisKey);
}

/**
 * Get current export rate limit status without incrementing
 */
export async function getExportRateLimitStatus(
  identifier: string,
  operation: 'customer' | 'bulk'
): Promise<{ count: number; limit: number; remaining: number }> {
  const config = operation === 'bulk' 
    ? EXPORT_RATE_LIMITS.BULK_EXPORT 
    : EXPORT_RATE_LIMITS.CUSTOMER_EXPORT;
  
  const redisKey = `export:ratelimit:${operation}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    // Remove old entries
    await redis.zremrangebyscore(redisKey, 0, windowStart);
    
    // Count current requests
    const count = await redis.zcard(redisKey);

    return {
      count,
      limit: config.maxRequests,
      remaining: Math.max(0, config.maxRequests - count),
    };
  } catch (error) {
    console.error('Get export rate limit status error:', error);
    return {
      count: 0,
      limit: config.maxRequests,
      remaining: config.maxRequests,
    };
  }
}
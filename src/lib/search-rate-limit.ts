import { redis } from '@/lib/redis'

interface SearchRateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  retryAfter?: number
}

/**
 * Rate limit search operations to prevent abuse
 * Allows 100 searches per minute per admin user
 */
export async function rateLimitSearch(
  adminUserId: string,
  ipAddress: string
): Promise<SearchRateLimitResult> {
  const key = `search_rate_limit:${adminUserId}:${ipAddress}`
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 100
  
  try {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Use Redis sorted set for sliding window rate limiting
    const pipeline = redis.pipeline()
    
    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart)
    
    // Count current requests
    pipeline.zcard(key)
    
    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`)
    
    // Set expiry
    pipeline.expire(key, Math.ceil(windowMs / 1000))
    
    const results = await pipeline.exec()
    
    if (!results) {
      throw new Error('Redis pipeline failed')
    }
    
    const currentCount = (results[1][1] as number) + 1 // +1 for the request we just added
    
    const resetAt = new Date(now + windowMs)
    
    if (currentCount > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil(windowMs / 1000)
      }
    }
    
    return {
      allowed: true,
      remaining: maxRequests - currentCount,
      resetAt
    }
    
  } catch (error) {
    console.error('Search rate limit error:', error)
    // Fail open - allow the request if Redis is unavailable
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: new Date(Date.now() + windowMs)
    }
  }
}
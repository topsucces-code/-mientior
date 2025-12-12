/**
 * Rate Limiting Utility
 *
 * Implements sliding window rate limiting using Redis for distributed rate limiting.
 * Falls back gracefully when Redis is unavailable.
 *
 * Security features:
 * - Tracks requests by IP address and/or email
 * - Configurable limits per endpoint
 * - Returns 429 status with Retry-After header
 * - Sliding window algorithm for accurate rate limiting
 */

import { redis } from './redis'

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number

  /**
   * Time window in seconds
   */
  windowSeconds: number

  /**
   * Optional custom error message
   */
  errorMessage?: string
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean

  /**
   * Number of requests remaining in the current window
   */
  remaining: number

  /**
   * Unix timestamp when the rate limit resets
   */
  resetAt: number

  /**
   * Seconds until the rate limit resets
   */
  retryAfter?: number
}

/**
 * Check if a request should be rate limited
 *
 * @param identifier - Unique identifier for rate limiting (IP, email, or combination)
 * @param config - Rate limit configuration
 * @returns Rate limit result with allowed status and metadata
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // If Redis is not available, allow all requests (graceful degradation)
  if (!redis) {
    console.warn('[RateLimit] Redis unavailable, allowing request without rate limiting')
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowSeconds * 1000,
    }
  }

  const key = `ratelimit:${identifier}`
  const now = Date.now()
  const windowStart = now - config.windowSeconds * 1000

  try {
    // Use Redis sorted set with scores as timestamps for sliding window
    // Remove old entries outside the time window
    await redis.zremrangebyscore(key, 0, windowStart)

    // Count requests in current window
    const requestCount = await redis.zcard(key)

    // Check if limit exceeded
    if (requestCount >= config.maxRequests) {
      // Get the oldest request timestamp to calculate retry-after
      const oldestRequests = await redis.zrange(key, 0, 0, 'WITHSCORES')
      const oldestTimestamp = oldestRequests.length > 1
        ? parseInt(oldestRequests[1], 10)
        : now

      const resetAt = oldestTimestamp + config.windowSeconds * 1000
      const retryAfter = Math.ceil((resetAt - now) / 1000)

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter,
      }
    }

    // Add current request to the window
    await redis.zadd(key, now, `${now}-${Math.random()}`)

    // Set expiry on the key to auto-cleanup (TTL = window + buffer)
    await redis.expire(key, config.windowSeconds + 60)

    // Calculate remaining requests and reset time
    const remaining = config.maxRequests - requestCount - 1
    const resetAt = now + config.windowSeconds * 1000

    return {
      allowed: true,
      remaining,
      resetAt,
    }
  } catch (error) {
    console.error('[RateLimit] Error checking rate limit:', error)
    // On error, allow the request (fail open)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowSeconds * 1000,
    }
  }
}

/**
 * Clear rate limit for an identifier
 * Useful for testing or manual intervention
 */
export async function clearRateLimit(identifier: string): Promise<void> {
  if (!redis) return

  const key = `ratelimit:${identifier}`
  try {
    await redis.del(key)
  } catch (error) {
    console.error('[RateLimit] Error clearing rate limit:', error)
  }
}

/**
 * Get rate limit status without incrementing
 */
export async function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!redis) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowSeconds * 1000,
    }
  }

  const key = `ratelimit:${identifier}`
  const now = Date.now()
  const windowStart = now - config.windowSeconds * 1000

  try {
    // Clean up old entries
    await redis.zremrangebyscore(key, 0, windowStart)

    // Count requests in current window
    const requestCount = await redis.zcard(key)

    if (requestCount >= config.maxRequests) {
      const oldestRequests = await redis.zrange(key, 0, 0, 'WITHSCORES')
      const oldestTimestamp = oldestRequests.length > 1
        ? parseInt(oldestRequests[1], 10)
        : now

      const resetAt = oldestTimestamp + config.windowSeconds * 1000
      const retryAfter = Math.ceil((resetAt - now) / 1000)

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter,
      }
    }

    return {
      allowed: true,
      remaining: config.maxRequests - requestCount,
      resetAt: now + config.windowSeconds * 1000,
    }
  } catch (error) {
    console.error('[RateLimit] Error getting rate limit status:', error)
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: now + config.windowSeconds * 1000,
    }
  }
}

// Predefined rate limit configurations for common auth operations

export const RATE_LIMITS = {
  /**
   * Password reset request: 3 requests per hour per email
   */
  PASSWORD_RESET_REQUEST: {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    errorMessage: 'Too many password reset requests. Please try again later.',
  } as RateLimitConfig,

  /**
   * Email verification resend: 3 requests per hour per email
   */
  EMAIL_VERIFICATION_RESEND: {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    errorMessage: 'Too many verification email requests. Please try again later.',
  } as RateLimitConfig,

  /**
   * 2FA verification attempts: 5 attempts per 15 minutes per session
   */
  TWO_FACTOR_VERIFY: {
    maxRequests: 5,
    windowSeconds: 900, // 15 minutes
    errorMessage: 'Too many verification attempts. Please try again later.',
  } as RateLimitConfig,

  /**
   * Login attempts: 10 attempts per hour per email
   */
  LOGIN_ATTEMPTS: {
    maxRequests: 10,
    windowSeconds: 3600, // 1 hour
    errorMessage: 'Too many login attempts. Please try again later.',
  } as RateLimitConfig,

  /**
   * Password reset validation: 5 attempts per 15 minutes per token
   */
  PASSWORD_RESET_VALIDATION: {
    maxRequests: 5,
    windowSeconds: 900, // 15 minutes
    errorMessage: 'Too many password reset attempts. Please request a new reset link.',
  } as RateLimitConfig,

  /**
   * 2FA setup: 3 attempts per hour per user
   */
  TWO_FACTOR_SETUP: {
    maxRequests: 3,
    windowSeconds: 3600, // 1 hour
    errorMessage: 'Too many 2FA setup attempts. Please try again later.',
  } as RateLimitConfig,
} as const

/**
 * Create a rate limit identifier from request information
 */
export function createRateLimitKey(
  prefix: string,
  identifiers: string[]
): string {
  return `${prefix}:${identifiers.join(':')}`.toLowerCase()
}

/**
 * Get client IP address from request headers
 */
export function getClientIp(headers: Headers): string {
  // Check common headers set by proxies
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Fallback to a default value (should rarely happen with Next.js)
  return 'unknown'
}

/**
 * Helper to apply rate limiting in API routes
 *
 * @example
 * ```ts
 * const rateLimit = await applyRateLimit(
 *   request,
 *   createRateLimitKey('password-reset', [email]),
 *   RATE_LIMITS.PASSWORD_RESET_REQUEST
 * )
 *
 * if (!rateLimit.allowed) {
 *   return NextResponse.json(
 *     { error: RATE_LIMITS.PASSWORD_RESET_REQUEST.errorMessage },
 *     {
 *       status: 429,
 *       headers: { 'Retry-After': rateLimit.retryAfter?.toString() || '3600' }
 *     }
 *   )
 * }
 * ```
 */
export async function applyRateLimit(
  request: Request,
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const headers = new Headers(request.headers)
  const ip = getClientIp(headers)

  // Combine identifier with IP for better rate limiting
  const fullIdentifier = `${identifier}:${ip}`

  return checkRateLimit(fullIdentifier, config)
}

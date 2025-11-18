import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple in-memory rate limiter for checkout endpoints
 * In production, use Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyPrefix?: string // Prefix for rate limit keys
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

/**
 * Clean up expired entries periodically
 */
function cleanupExpired() {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpired, 60000)
}

/**
 * Get client identifier from request
 */
function getClientId(request: NextRequest): string {
  // Use IP address + User-Agent for identification
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  // Create a simple hash
  return `${ip}:${userAgent.substring(0, 50)}`
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): RateLimitResult {
  const clientId = getClientId(request)
  const key = `${config.keyPrefix || 'rl'}:${clientId}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    }
    rateLimitStore.set(key, entry)

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: entry.resetTime,
    }
  }

  // Increment counter
  entry.count++

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Rate limit middleware for checkout endpoints
 */
export function rateLimitMiddleware(
  config: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 10,
    keyPrefix: 'checkout',
  }
) {
  return (
    request: NextRequest,
    handler: (req: NextRequest) => NextResponse | Promise<NextResponse>
  ) => {
    const result = checkRateLimit(request, config)

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)

      return NextResponse.json(
        {
          success: false,
          error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetTime.toString(),
          },
        }
      )
    }

    // Add rate limit headers to response
    const response = handler(request)
    if (response instanceof Promise) {
      return response.then((res) => {
        if (res instanceof NextResponse) {
          res.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
          res.headers.set('X-RateLimit-Remaining', result.remaining.toString())
          res.headers.set('X-RateLimit-Reset', result.resetTime.toString())
        }
        return res
      })
    }

    if (response instanceof NextResponse) {
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
    }

    return response
  }
}

/**
 * Stricter rate limit for payment operations
 */
export const paymentRateLimit: RateLimitConfig = {
  windowMs: 300000, // 5 minutes
  maxRequests: 3, // Only 3 payment attempts per 5 minutes
  keyPrefix: 'payment',
}

/**
 * Standard rate limit for checkout steps
 */
export const checkoutRateLimit: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 20,
  keyPrefix: 'checkout',
}

/**
 * Rate limit for coupon validation
 */
export const couponRateLimit: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 10,
  keyPrefix: 'coupon',
}

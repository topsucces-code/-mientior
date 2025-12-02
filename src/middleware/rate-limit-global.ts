import { NextRequest, NextResponse } from 'next/server'
import { Redis } from 'ioredis'

// Rate limit configuration for different route types
export const RATE_LIMIT_CONFIG = {
  // API routes (general)
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  },
  // Authentication routes
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
  },
  // Checkout routes
  checkout: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
  },
  // Admin routes
  admin: {
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute (higher for admin)
  },
  // Public routes
  public: {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
  },
  // Search routes
  search: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
  },
} as const

type RateLimitType = keyof typeof RATE_LIMIT_CONFIG

/**
 * Get rate limit configuration based on route
 */
function getRateLimitConfig(pathname: string): {
  type: RateLimitType
  config: typeof RATE_LIMIT_CONFIG[RateLimitType]
} {
  if (pathname.startsWith('/api/auth')) {
    return { type: 'auth', config: RATE_LIMIT_CONFIG.auth }
  }
  if (pathname.startsWith('/api/checkout')) {
    return { type: 'checkout', config: RATE_LIMIT_CONFIG.checkout }
  }
  if (pathname.startsWith('/api/admin')) {
    return { type: 'admin', config: RATE_LIMIT_CONFIG.admin }
  }
  if (pathname.startsWith('/api/search')) {
    return { type: 'search', config: RATE_LIMIT_CONFIG.search }
  }
  if (pathname.startsWith('/api/public')) {
    return { type: 'public', config: RATE_LIMIT_CONFIG.public }
  }
  // Default to general API limit
  return { type: 'api', config: RATE_LIMIT_CONFIG.api }
}

/**
 * Get client identifier (IP address)
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  if (realIp) {
    return realIp
  }
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Fallback to connection remote address
  return (request as NextRequest & { ip?: string }).ip || 'unknown'
}

/**
 * Global rate limiting middleware
 * Uses Redis for distributed rate limiting
 */
export async function globalRateLimitMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  // Skip rate limiting for static files
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/)
  ) {
    return null
  }

  const { type, config } = getRateLimitConfig(pathname)
  const clientId = getClientId(request)
  const key = `rate-limit:${type}:${clientId}`

  try {
    // Initialize Redis client (reuse from existing connection)
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

    // Get current count
    const current = await redis.get(key)
    const count = current ? parseInt(current, 10) : 0

    // Check if limit exceeded
    if (count >= config.max) {
      const ttl = await redis.ttl(key)
      const resetTime = new Date(Date.now() + ttl * 1000).toISOString()

      redis.disconnect()

      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(ttl / 60)} minutes.`,
          retryAfter: ttl,
          resetTime,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': ttl.toString(),
            'X-RateLimit-Limit': config.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime,
          },
        }
      )
    }

    // Increment counter
    const newCount = await redis.incr(key)

    // Set expiry on first request
    if (newCount === 1) {
      await redis.pexpire(key, config.windowMs)
    }

    const remaining = Math.max(0, config.max - newCount)
    const ttl = await redis.ttl(key)
    const resetTime = new Date(Date.now() + ttl * 1000).toISOString()

    redis.disconnect()

    // Add rate limit headers to response (will be merged by Next.js)
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', config.max.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', resetTime)

    return null // Continue to next middleware
  } catch (error) {
    console.error('Rate limiting error:', error)
    // On Redis error, allow request to continue (fail open)
    return null
  }
}

/**
 * Check if IP is whitelisted (for admin IPs, monitoring services, etc.)
 */
export function isWhitelisted(ip: string): boolean {
  const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || []
  return whitelist.includes(ip)
}

/**
 * Manual rate limit check (for use in API routes)
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = 'api'
): Promise<{
  allowed: boolean
  remaining: number
  resetTime: Date
}> {
  const config = RATE_LIMIT_CONFIG[type]
  const key = `rate-limit:${type}:${identifier}`

  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

    const current = await redis.get(key)
    const count = current ? parseInt(current, 10) : 0

    if (count >= config.max) {
      const ttl = await redis.ttl(key)
      redis.disconnect()

      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + ttl * 1000),
      }
    }

    const newCount = await redis.incr(key)
    if (newCount === 1) {
      await redis.pexpire(key, config.windowMs)
    }

    const ttl = await redis.ttl(key)
    redis.disconnect()

    return {
      allowed: true,
      remaining: Math.max(0, config.max - newCount),
      resetTime: new Date(Date.now() + ttl * 1000),
    }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // Fail open on error
    return {
      allowed: true,
      remaining: 0,
      resetTime: new Date(),
    }
  }
}

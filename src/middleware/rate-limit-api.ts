import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limiter'

/**
 * Rate limit configuration per route pattern
 */
const RATE_LIMIT_CONFIGS: Record<string, { limit: number; window: number; keyPrefix: string }> = {
  // Authentication routes - Very strict
  '/api/auth': {
    limit: 5, // 5 requests
    window: 60, // per minute
    keyPrefix: 'auth',
  },
  // Checkout routes - Strict
  '/api/checkout': {
    limit: 10, // 10 requests
    window: 60, // per minute
    keyPrefix: 'checkout',
  },
  // Order creation - Strict
  '/api/orders/create': {
    limit: 5, // 5 requests
    window: 60, // per minute
    keyPrefix: 'order-create',
  },
  // Payment routes - Very strict
  '/api/payment': {
    limit: 3, // 3 requests
    window: 60, // per minute
    keyPrefix: 'payment',
  },
  // Search routes - Moderate
  '/api/search': {
    limit: 30, // 30 requests
    window: 60, // per minute
    keyPrefix: 'search',
  },
  // General API routes - Lenient
  '/api': {
    limit: 100, // 100 requests
    window: 60, // per minute
    keyPrefix: 'api',
  },
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest): string {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'

  return ipAddress
}

/**
 * Find the most specific rate limit config for a pathname
 */
function getRateLimitConfig(pathname: string) {
  // Sort by specificity (longer paths first)
  const sortedPatterns = Object.keys(RATE_LIMIT_CONFIGS).sort((a, b) => b.length - a.length)

  for (const pattern of sortedPatterns) {
    if (pathname.startsWith(pattern)) {
      return RATE_LIMIT_CONFIGS[pattern]
    }
  }

  return null
}

/**
 * Apply rate limiting to API routes
 */
export async function rateLimitApiMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  // Only apply to API routes
  if (!pathname.startsWith('/api')) {
    return null
  }

  // Skip health checks and webhooks
  if (pathname.includes('/health') || pathname.includes('/webhook')) {
    return null
  }

  // Get rate limit config for this route
  const config = getRateLimitConfig(pathname)
  if (!config) {
    return null
  }

  const clientId = getClientIdentifier(request)
  const result = await rateLimit(clientId, config)

  // Add rate limit headers
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', result.limit.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', result.resetAt.toISOString())

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please try again later.',
        retryAfter: result.resetAt.toISOString(),
        limit: result.limit,
        window: config.window,
      },
      {
        status: 429,
        headers,
      }
    )
  }

  // Pass through with rate limit headers
  return null // null means continue to next middleware/handler
}

import { redis } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  limit: number;
}

export interface RateLimitOptions {
  limit?: number; // Max requests per window
  window?: number; // Window in seconds
  keyPrefix?: string;
}

/**
 * Rate limit a request based on a key (e.g., IP address or user ID)
 */
export async function rateLimit(
  key: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const limit = options.limit || parseInt(process.env.RATE_LIMIT_MAX || '100');
  const window = options.window || parseInt(process.env.RATE_LIMIT_WINDOW || '60');
  const keyPrefix = options.keyPrefix || 'ratelimit';

  const redisKey = `${keyPrefix}:${key}`;
  const now = Date.now();
  const windowMs = window * 1000;
  const resetAt = new Date(now + windowMs);

  try {
    // Get current count
    const current = await redis.get(redisKey);
    const count = current ? parseInt(current as string) : 0;

    if (count >= limit) {
      // Rate limit exceeded
      const ttl = await redis.ttl(redisKey);
      const resetTime = new Date(now + ttl * 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt: resetTime,
        limit,
      };
    }

    // Increment counter
    const newCount = await redis.incr(redisKey);

    // Set expiration on first request
    if (newCount === 1) {
      await redis.expire(redisKey, window);
    }

    return {
      allowed: true,
      remaining: limit - newCount,
      resetAt,
      limit,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open: allow request if Redis is unavailable
    return {
      allowed: true,
      remaining: limit,
      resetAt,
      limit,
    };
  }
}

/**
 * Get the client identifier from a request (IP address)
 */
function getClientIdentifier(request: NextRequest): string {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  return ipAddress;
}

/**
 * Middleware to apply rate limiting to API routes
 */
export function rateLimitMiddleware(options: RateLimitOptions = {}) {
  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const clientId = getClientIdentifier(request);
    const result = await rateLimit(clientId, options);

    // Add rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', result.limit.toString());
    headers.set('X-RateLimit-Remaining', result.remaining.toString());
    headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: result.resetAt.toISOString(),
        },
        {
          status: 429,
          headers,
        }
      );
    }

    // Execute the handler
    const response = await handler();

    // Add rate limit headers to successful response
    result.remaining--;
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Higher-order function to wrap an API handler with rate limiting
 */
export function withRateLimit<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  options: RateLimitOptions = {}
): T {
  return (async (...args: any[]) => {
    const request = args[0] as NextRequest;
    const clientId = getClientIdentifier(request);
    const result = await rateLimit(clientId, options);

    // Add rate limit headers
    if (!result.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: result.resetAt.toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetAt.toISOString(),
          },
        }
      );
    }

    // Execute the handler
    const response = await handler(...args);

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetAt.toISOString());

    return response;
  }) as T;
}

/**
 * Clear rate limit for a specific key
 */
export async function clearRateLimit(
  key: string,
  keyPrefix: string = 'ratelimit'
): Promise<void> {
  const redisKey = `${keyPrefix}:${key}`;
  await redis.del(redisKey);
}

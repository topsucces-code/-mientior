import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Security middleware for additional runtime security checks
 * This complements the headers set in next.config.mjs
 */
export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next()

  // Add security headers that need runtime logic
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  // Store nonce for CSP (if needed for inline scripts)
  response.headers.set('X-Nonce', nonce)

  // Prevent caching of sensitive pages
  if (
    request.nextUrl.pathname.startsWith('/account') ||
    request.nextUrl.pathname.startsWith('/checkout') ||
    request.nextUrl.pathname.startsWith('/admin')
  ) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    )
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from './src/lib/auth-server'
import { rateLimitApiMiddleware } from './src/middleware/rate-limit-api'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply rate limiting to API routes first
  if (pathname.startsWith('/api')) {
    const rateLimitResponse = await rateLimitApiMiddleware(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    // Continue for other API route handling
    return NextResponse.next()
  }

  // Skip middleware for static files, Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/graphql') ||
    pathname.includes('/admin') ||
    pathname.includes('.')  // static files
  ) {
    return NextResponse.next()
  }

  // Get current session
  const session = await getSession()

  // Protect /account routes
  if (pathname.startsWith('/account')) {
    if (!session?.user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect /checkout routes
  if (pathname.startsWith('/checkout')) {
    if (!session?.user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all paths including API routes for rate limiting
     * Exclude: _next/static, _next/image, favicon, other static files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.svg|.*\\.gif|.*\\.webp).*)'
  ]
}

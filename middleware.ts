import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from './src/lib/auth-server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files, Next.js internals, and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/graphql') ||
    pathname.includes('/admin') || // Payload admin auth handled by @payload-auth/better-auth-plugin
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
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/|graphql).*)'
  ]
}

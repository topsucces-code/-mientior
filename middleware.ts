import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from './src/lib/auth-server'
import { rateLimitApiMiddleware } from './src/middleware/rate-limit-api'
import { securityMiddleware } from './src/middleware/security'
import { prisma } from './src/lib/prisma'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apply security middleware first (for all routes)
  const securityResponse = securityMiddleware(request)
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api')) {
    const rateLimitResponse = await rateLimitApiMiddleware(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }
    // Continue for other API route handling
    return securityResponse
  }

  // Skip middleware for static files, Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/graphql') ||
    pathname.includes('.')  // static files
  ) {
    return securityResponse
  }

  // Protect /admin routes (except login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    try {
      // Import getAdminSession dynamically to avoid circular dependencies
      const { getAdminSession } = await import('./src/lib/auth-admin')
      const adminSession = await getAdminSession()
      
      // Redirect to login if no admin session or admin user is not active
      if (!adminSession) {
        const loginUrl = new URL('/admin/login', request.url)
        loginUrl.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(loginUrl)
      }

      // Additional check: ensure admin user is active
      // (getAdminSession already checks this, but we make it explicit)
      if (!adminSession.adminUser.isActive) {
        const loginUrl = new URL('/admin/login', request.url)
        loginUrl.searchParams.set('error', 'account_deactivated')
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      console.error('Error checking admin authentication:', error)
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('error', 'auth_error')
      return NextResponse.redirect(loginUrl)
    }
  }

  // Get current session
  const session = await getSession()

  // Allow access to verification-related pages without email verification
  const isVerificationPage = pathname === '/verify-email' || 
                             pathname === '/verify-email-prompt' ||
                             pathname.startsWith('/api/auth/resend-verification') ||
                             pathname.startsWith('/api/auth/verify-email')

  // Protect /account routes
  if (pathname.startsWith('/account')) {
    if (!session?.user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check email verification for authenticated users
    if (!isVerificationPage && session.user) {
      try {
        const betterAuthUser = await prisma.better_auth_users.findUnique({
          where: { id: session.user.id },
          select: { emailVerified: true, email: true },
        })

        if (!betterAuthUser?.emailVerified) {
          const verifyUrl = new URL('/verify-email-prompt', request.url)
          verifyUrl.searchParams.set('email', betterAuthUser?.email || session.user.email || '')
          return NextResponse.redirect(verifyUrl)
        }
      } catch (error) {
        console.error('Error checking email verification:', error)
      }
    }
  }

  // Protect /checkout routes
  if (pathname.startsWith('/checkout')) {
    if (!session?.user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check email verification for authenticated users
    if (!isVerificationPage && session.user) {
      try {
        const betterAuthUser = await prisma.better_auth_users.findUnique({
          where: { id: session.user.id },
          select: { emailVerified: true, email: true },
        })

        if (!betterAuthUser?.emailVerified) {
          const verifyUrl = new URL('/verify-email-prompt', request.url)
          verifyUrl.searchParams.set('email', betterAuthUser?.email || session.user.email || '')
          return NextResponse.redirect(verifyUrl)
        }
      } catch (error) {
        console.error('Error checking email verification:', error)
      }
    }
  }

  return securityResponse
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

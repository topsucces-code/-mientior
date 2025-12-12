/**
 * Role-based Route Protection Middleware
 * 
 * Protects routes based on user roles (CLIENT, VENDOR)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'
import type { UserRole } from '@prisma/client'

interface RoleProtectionConfig {
  /** Routes that require VENDOR role */
  vendorRoutes: string[]
  /** Routes that require CLIENT role (most routes) */
  clientRoutes: string[]
  /** Redirect URL when user doesn't have required role */
  unauthorizedRedirect: string
  /** Redirect URL when user is not authenticated */
  loginRedirect: string
}

const defaultConfig: RoleProtectionConfig = {
  vendorRoutes: [
    '/vendor',
    '/vendor/dashboard',
    '/vendor/products',
    '/vendor/orders',
    '/vendor/analytics',
    '/vendor/settings',
  ],
  clientRoutes: [
    '/account',
    '/checkout',
    '/orders',
  ],
  unauthorizedRedirect: '/unauthorized',
  loginRedirect: '/login',
}

/**
 * Check if a pathname matches any of the protected routes
 */
function matchesRoute(pathname: string, routes: string[]): boolean {
  return routes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  )
}

/**
 * Role protection middleware
 * Call this from the main middleware.ts for role-based route protection
 */
export async function roleProtectionMiddleware(
  request: NextRequest,
  config: Partial<RoleProtectionConfig> = {}
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl
  const mergedConfig = { ...defaultConfig, ...config }

  // Check if route requires vendor role
  const requiresVendor = matchesRoute(pathname, mergedConfig.vendorRoutes)
  
  // If route doesn't require special role, allow access
  if (!requiresVendor) {
    return null
  }

  // Get current session
  const session = await getSession()
  
  // If not authenticated, redirect to login
  if (!session?.user?.email) {
    const loginUrl = new URL(mergedConfig.loginRedirect, request.url)
    loginUrl.searchParams.set('next', pathname)
    loginUrl.searchParams.set('reason', 'auth_required')
    return NextResponse.redirect(loginUrl)
  }

  // Get user with role from database
  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    })

    // If user not found in our database, they might be a new OAuth user
    // Allow them to continue (they'll be created with CLIENT role by default)
    if (!user) {
      if (requiresVendor) {
        const unauthorizedUrl = new URL(mergedConfig.unauthorizedRedirect, request.url)
        unauthorizedUrl.searchParams.set('reason', 'vendor_required')
        return NextResponse.redirect(unauthorizedUrl)
      }
      return null
    }

    // Check vendor routes
    if (requiresVendor && user.role !== 'VENDOR') {
      const unauthorizedUrl = new URL(mergedConfig.unauthorizedRedirect, request.url)
      unauthorizedUrl.searchParams.set('reason', 'vendor_required')
      return NextResponse.redirect(unauthorizedUrl)
    }

    // User has required role, allow access
    return null
  } catch (error) {
    console.error('Error checking user role:', error)
    // On error, allow access but log the issue
    return null
  }
}

/**
 * Helper to create a role check response for API routes
 */
export function createRoleCheckResponse(
  requiredRole: UserRole,
  userRole: UserRole | null
): { authorized: boolean; error?: string } {
  if (!userRole) {
    return { authorized: false, error: 'Authentication required' }
  }
  
  if (userRole !== requiredRole) {
    return { authorized: false, error: `Role ${requiredRole} required` }
  }
  
  return { authorized: true }
}

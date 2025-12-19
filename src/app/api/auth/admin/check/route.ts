import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth-admin'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'
import { getMergedPermissions } from '@/lib/rbac'
import { Permission } from '@/lib/permissions'

/**
 * Admin authentication check endpoint
 * 
 * Used by Refine auth provider to verify admin authentication status
 * 
 * Requirements:
 * - 5.1: Verify admin session exists
 * - 5.2: Verify AdminUser record exists and is active
 */
export async function GET() {
  try {
    // First check if there's a basic session
    const basicSession = await getSession()
    
    if (!basicSession) {
      return NextResponse.json(
        { authenticated: false, message: 'No session found' },
        { status: 401 }
      )
    }

    // Check if admin user exists and is active
    const adminUser = await prisma.admin_users.findFirst({
      where: {
        OR: [
          { email: basicSession.user.email },
          { authUserId: basicSession.user.id },
        ],
      },
    })

    if (!adminUser) {
      return NextResponse.json(
        { authenticated: false, message: 'Admin user not found' },
        { status: 401 }
      )
    }

    if (!adminUser.isActive) {
      return NextResponse.json(
        { authenticated: false, message: 'Account is deactivated' },
        { status: 403 }
      )
    }

    // Get full admin session
    const session = await getAdminSession()

    if (!session) {
      return NextResponse.json(
        { authenticated: false, message: 'Failed to get admin session' },
        { status: 401 }
      )
    }

    // Get merged permissions (role permissions + custom permissions)
    const customPermissions = session.adminUser.permissions as Permission[] | null
    const permissions = getMergedPermissions(
      session.adminUser.role,
      customPermissions || undefined
    )

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.adminUser.id,
        email: session.adminUser.email,
        firstName: session.adminUser.firstName,
        lastName: session.adminUser.lastName,
        role: session.adminUser.role,
        permissions,
      },
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json(
      { authenticated: false, message: 'Authentication check failed' },
      { status: 401 }
    )
  }
}

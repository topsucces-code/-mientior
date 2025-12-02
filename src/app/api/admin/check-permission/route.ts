import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth-admin'
import { canAccessResource } from '@/lib/rbac'

/**
 * Permission check endpoint for Refine access control
 * 
 * Requirements:
 * - 5.3: Check admin permissions for resources
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { resource, action } = body

    if (!resource || !action) {
      return NextResponse.json(
        { can: false, message: 'Resource and action are required' },
        { status: 400 }
      )
    }

    // Get admin session
    const session = await getAdminSession()

    if (!session) {
      return NextResponse.json(
        { can: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if admin has permission for this resource and action
    const can = canAccessResource(session.adminUser.role, resource, action)

    return NextResponse.json({ can })
  } catch (error) {
    console.error('Permission check error:', error)
    return NextResponse.json(
      { can: false, message: 'Permission check failed' },
      { status: 500 }
    )
  }
}

/**
 * REST API endpoint for individual user operations (Refine admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'
import { getAdminSession } from '@/lib/auth-admin'
import { withPermission } from '@/middleware/admin-auth'
import { logUpdate } from '@/lib/audit-logger'

async function handleGET(
  request: NextRequest,
  { params, adminSession }: { params: Record<string, string>, adminSession?: any }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        loyaltyPoints: true,
        loyaltyLevel: true,
        totalOrders: true,
        totalSpent: true,
        addresses: true,
        recentlyViewed: true,
        createdAt: true,
        updatedAt: true,
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            reviews: true
          }
        }
      }
    }) as any

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Transform to ensure correct shape with top-level fields
    const transformedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      loyaltyPoints: user.loyaltyPoints,
      // Return uppercase enum value as-is (BRONZE, SILVER, GOLD, PLATINUM)
      loyaltyLevel: user.loyaltyLevel,
      // Top-level fields for admin UI compatibility
      totalOrders: user.totalOrders,
      totalSpent: user.totalSpent,
      addresses: user.addresses,
      recentlyViewed: user.recentlyViewed,
      reviews: user.reviews,
      reviewCount: user._count.reviews,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    return NextResponse.json(transformedUser)
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

async function handlePUT(
  request: NextRequest,
  { params, adminSession }: { params: Record<string, string>, adminSession?: any }
) {
  try {
    const body = await request.json()

    // Authorization check: user can only update their own profile unless admin
    if (!adminSession) {
      const session = await getSession()
      if (session?.user?.id !== params.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Capture before state for audit logging
    const before = existing

    // Update user
    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        addresses: body.addresses,
        loyaltyPoints: body.loyaltyPoints
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        loyaltyPoints: true,
        loyaltyLevel: true,
        totalOrders: true,
        totalSpent: true,
        addresses: true,
        recentlyViewed: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reviews: true
          }
        }
      }
    })

    // Audit log the update (only if admin is making the change)
    if (adminSession) {
      await logUpdate({
        resource: 'user',
        resourceId: params.id,
        before,
        after: user,
        adminUser: adminSession.adminUser,
        request
      })
    }

    // Transform to ensure correct shape with top-level fields (matching GET)
    const transformedUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      loyaltyPoints: user.loyaltyPoints,
      // Return uppercase enum value as-is (BRONZE, SILVER, GOLD, PLATINUM)
      loyaltyLevel: user.loyaltyLevel,
      // Top-level fields for admin UI compatibility
      totalOrders: user.totalOrders,
      totalSpent: user.totalSpent,
      addresses: user.addresses,
      recentlyViewed: user.recentlyViewed,
      reviewCount: user._count.reviews,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }

    return NextResponse.json(transformedUser)
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// Export wrapped handlers with permission checks
// GET can be accessed by users or admins
export const GET = async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Try to get admin session (won't throw if not admin)
  const adminSession = await getAdminSession(request)

  // If admin session exists, check permissions
  if (adminSession) {
    return withPermission(Permission.USERS_READ, handleGET)(request, { params })
  }

  // Otherwise, allow regular user access
  return handleGET(request, { params, adminSession: null })
}

// PUT can be accessed by users (own profile) or admins (any profile)
export const PUT = async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Try to get admin session (won't throw if not admin)
  const adminSession = await getAdminSession(request)

  // If admin session exists, check permissions
  if (adminSession) {
    return withPermission(Permission.USERS_WRITE, handlePUT)(request, { params })
  }

  // Otherwise, allow regular user access (handler will validate ownership)
  return handlePUT(request, { params, adminSession: null })
}

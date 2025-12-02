/**
 * REST API endpoint for users (Refine admin)
 * Supports pagination, filtering, and sorting
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { withPermission } from '@/middleware/admin-auth'

async function handleGET(request: NextRequest, { adminSession: _adminSession }: { adminSession: unknown }) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination parameters (Refine uses _start and _end)
    const _start = parseInt(searchParams.get('_start') || '0')
    const _end = parseInt(searchParams.get('_end') || '10')
    const skip = _start
    const take = _end - _start

    // Sorting parameters
    const _sort = searchParams.get('_sort') || 'createdAt'
    const _order = searchParams.get('_order') || 'desc'

    // Build where clause for filtering
    const where: Prisma.UserWhereInput = {}

    // Filter by email (search)
    const email_like = searchParams.get('email_like')
    if (email_like) {
      where.email = {
        contains: email_like,
        mode: 'insensitive'
      }
    }

    // Filter by loyaltyLevel
    const loyaltyLevel = searchParams.get('loyaltyLevel')
    if (loyaltyLevel) {
      where.loyaltyLevel = loyaltyLevel.toUpperCase() as Prisma.EnumLoyaltyLevelFilter
    }

    // Build orderBy clause
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [_sort]: _order as 'asc' | 'desc'
    }

    // Fetch users with aggregations
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        where,
        orderBy,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          loyaltyPoints: true,
          loyaltyLevel: true,
          totalOrders: true,
          totalSpent: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              reviews: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])

    // Transform to match frontend User type
    const transformedUsers = users.map(user => ({
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
      reviewCount: user._count.reviews,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))

    return NextResponse.json(transformedUsers, {
      headers: {
        'X-Total-Count': totalCount.toString(),
      },
    })
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// Export wrapped handler with permission check
export const GET = withPermission(Permission.USERS_READ, handleGET)

/**
 * REST API endpoint for users (Refine admin)
 * Supports pagination, filtering, and sorting
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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
    const where: any = {}

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
      where.loyaltyLevel = loyaltyLevel.toUpperCase()
    }

    // Build orderBy clause
    const orderBy: any = {}
    orderBy[_sort] = _order

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
      // Map Prisma enum (BRONZE) to frontend type (Bronze)
      loyaltyLevel: user.loyaltyLevel.charAt(0) + user.loyaltyLevel.slice(1).toLowerCase(),
      totals: {
        orders: user.totalOrders,
        spent: user.totalSpent
      },
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

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth-admin'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { calculateBehavioralAnalytics } from '@/lib/behavioral-analytics'

/**
 * GET /api/admin/customers/[id]/analytics
 * 
 * Get customer's behavioral analytics
 * 
 * Requirements:
 * - 10.1: Display most viewed product categories
 * - 10.2: Display most purchased product categories
 * - 10.3: Show average session duration and total sessions
 * - 10.4: Show device usage breakdown
 * - 10.5: Show preferred shopping times
 * - 19.1: Verify admin has customer view permissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require USERS_READ permission
    await requirePermission(Permission.USERS_READ)

    const customerId = params.id

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    // Verify customer exists
    const customer = await prisma.users.findUnique({
      where: { id: customerId },
      select: { id: true }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Calculate behavioral analytics
    const analytics = await calculateBehavioralAnalytics(customerId)

    return NextResponse.json({
      topViewedCategories: analytics.topViewedCategories,
      topPurchasedCategories: analytics.topPurchasedCategories,
      sessionStats: {
        totalSessions: analytics.sessionStats.totalSessions,
        averageDuration: analytics.sessionStats.averageDuration,
        averageSessionsPerDay: analytics.sessionStats.averageSessionsPerDay,
      },
      deviceBreakdown: analytics.deviceBreakdown,
      shoppingTimes: {
        dayOfWeek: analytics.shoppingTimes.dayOfWeek,
        hourOfDay: analytics.shoppingTimes.hourOfDay,
      },
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    console.error('Error fetching customer analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer analytics' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth-admin'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/customers/[id]/loyalty
 * 
 * Get customer's loyalty program status
 * 
 * Requirements:
 * - 4.1: Display loyalty tier, points balance, and lifetime points
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

    // Get user with loyalty data
    const user = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        name: true,
        loyaltyLevel: true,
        loyaltyPoints: true,
        totalOrders: true,
        totalSpent: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // For now, return mock data for transactions and referrals
    // These would be populated from a loyalty system when implemented
    const recentTransactions: any[] = []
    const expiringPoints = 0
    const referralCount = 0
    const referralCode = `REF-${customerId.slice(0, 8).toUpperCase()}`

    return NextResponse.json({
      tier: user.loyaltyLevel,
      pointsBalance: user.loyaltyPoints,
      lifetimePoints: user.loyaltyPoints, // For now, same as balance
      referralCode,
      referralCount,
      expiringPoints,
      recentTransactions
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

    console.error('Error fetching customer loyalty:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer loyalty' },
      { status: 500 }
    )
  }
}

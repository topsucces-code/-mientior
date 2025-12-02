import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth-admin'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/customers/[id]/support
 * 
 * Get customer's support ticket history
 * 
 * Requirements:
 * - 6.1: Display all support tickets in reverse chronological order
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
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // For now, return empty support tickets
    // This would be populated from a support ticket system when implemented
    const tickets: any[] = []
    const totalTickets = 0
    const averageResolutionTime = 0
    const openTickets = 0

    return NextResponse.json({
      tickets,
      totalTickets,
      averageResolutionTime,
      openTickets
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

    console.error('Error fetching customer support:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer support' },
      { status: 500 }
    )
  }
}

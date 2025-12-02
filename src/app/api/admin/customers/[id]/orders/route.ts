import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth-admin'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/customers/[id]/orders
 * 
 * Get customer's order history with metrics
 * 
 * Requirements:
 * - 2.1: Display all orders in reverse chronological order
 * - 19.1: Verify admin has customer view permissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require ORDERS_READ permission
    await requirePermission(Permission.ORDERS_READ)

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

    // Get orders with items
    const orders = await prisma.order.findMany({
      where: { userId: customerId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate metrics
    const completedOrders = orders.filter(o => o.status === 'DELIVERED')
    const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0)
    const averageOrderValue = completedOrders.length > 0 
      ? totalRevenue / completedOrders.length 
      : 0

    return NextResponse.json({
      orders,
      totalOrders: orders.length,
      totalRevenue,
      averageOrderValue
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

    console.error('Error fetching customer orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer orders' },
      { status: 500 }
    )
  }
}

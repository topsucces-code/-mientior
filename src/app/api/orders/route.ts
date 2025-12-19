/**
 * REST API endpoint for orders (Refine admin)
 * Supports pagination, filtering, and sorting
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma, admin_users } from '@prisma/client'

type AdminUser = admin_users
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { withPermission } from '@/middleware/admin-auth'

interface AdminSession {
  adminUser: AdminUser | null;
}

async function handleGET(request: NextRequest, { adminSession: _adminSession }: { adminSession: AdminSession }) {
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
    const where: Prisma.ordersWhereInput = {}

    // Filter by status
    const status = searchParams.get('status')
    if (status) {
      where.status = status.toUpperCase() as Prisma.EnumOrderStatusFilter
    }

    // Filter by paymentStatus
    const paymentStatus = searchParams.get('paymentStatus')
    if (paymentStatus) {
      where.paymentStatus = paymentStatus.toUpperCase() as Prisma.EnumPaymentStatusFilter
    }

    // Filter by userId
    const userId = searchParams.get('userId')
    if (userId) {
      where.userId = userId
    }

    // Filter by date range
    const createdAt_gte = searchParams.get('createdAt_gte')
    const createdAt_lte = searchParams.get('createdAt_lte')
    if (createdAt_gte || createdAt_lte) {
      where.createdAt = {}
      if (createdAt_gte) {
        where.createdAt.gte = new Date(createdAt_gte)
      }
      if (createdAt_lte) {
        where.createdAt.lte = new Date(createdAt_lte)
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.ordersOrderByWithRelationInput = {
      [_sort]: _order as 'asc' | 'desc'
    }

    // Fetch orders with relations
    const [orders, totalCount] = await Promise.all([
      prisma.orders.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          order_items: {
            include: {
              products: true
            }
          },
          users: true
        }
      }),
      prisma.orders.count({ where })
    ])

    // Transform to match frontend Order type
    const transformedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      // Return uppercase enum values as-is (PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
      status: order.status,
      // Return uppercase enum values as-is (PENDING, PAID, FAILED, REFUNDED)
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      total: order.total,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      notes: order.notes || undefined,
      items: order.order_items.map((item: { id: string; productId: string; products: { name: string }; quantity: number; price: number }) => ({
        id: item.id,
        productId: item.productId,
        productName: item.products.name,
        quantity: item.quantity,
        price: item.price
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }))

    return NextResponse.json(transformedOrders, {
      headers: {
        'X-Total-Count': totalCount.toString(),
      },
    })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

// Export wrapped handler with permission check
export const GET = withPermission(Permission.ORDERS_READ, handleGET)

/**
 * REST API endpoint for orders (Refine admin)
 * Supports pagination, filtering, and sorting
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
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
    const where: Prisma.OrderWhereInput = {}

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
    const orderBy: Prisma.OrderOrderByWithRelationInput = {
      [_sort]: _order as 'asc' | 'desc'
    }

    // Fetch orders with relations
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          items: {
            include: {
              product: true
            }
          },
          user: true
        }
      }),
      prisma.order.count({ where })
    ])

    // Transform to match frontend Order type
    const transformedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status.toLowerCase(),
      paymentStatus: order.paymentStatus.toLowerCase(),
      subtotal: order.subtotal,
      shipping: order.shipping,
      tax: order.tax,
      total: order.total,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      notes: order.notes || undefined,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
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

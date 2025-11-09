/**
 * API endpoint for fetching a single order by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'
import type { Order } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const session = await requireAuth()
    const userId = session.user.id

    // Fetch order with relations
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: {
                  orderBy: { order: 'asc' },
                  take: 1
                }
              }
            },
            variant: {
              select: {
                sku: true,
                size: true,
                color: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user owns this order (unless admin)
    // TODO: Implement admin role check when role system is added
    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Transform to frontend Order type
    const transformedOrder: Order = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        variant: item.variant ? {
          sku: item.variant.sku,
          size: item.variant.size,
          color: item.variant.color
        } : undefined,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })),
      status: order.status.toLowerCase() as any,
      paymentStatus: order.paymentStatus.toLowerCase() as any,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      shippingAddress: order.shippingAddress as any,
      billingAddress: order.billingAddress as any,
      trackingNumber: order.trackingNumber || undefined,
      estimatedDelivery: order.estimatedDeliveryMin && order.estimatedDeliveryMax ? {
        min: order.estimatedDeliveryMin,
        max: order.estimatedDeliveryMax
      } : undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }

    return NextResponse.json(transformedOrder)
  } catch (error: any) {
    console.error('Order fetch error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}


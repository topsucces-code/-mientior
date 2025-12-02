/**
 * API endpoint for fetching a single order by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'
import { getAdminSession, type AdminSession } from '@/lib/auth-admin'
import { withPermission } from '@/middleware/admin-auth'
import { logUpdate } from '@/lib/audit-logger'
import { triggerOrderUpdate } from '@/lib/pusher'
import { triggerCustomerOrderUpdate } from '@/lib/real-time-updates'
import type { Order, Address } from '@/types'

// Type for OrderItem with product relation
type OrderItemWithProduct = {
  productId: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    images: Array<{ url: string }>
  }
}

async function handleGET(
  request: NextRequest,
  { params, adminSession }: { params: Record<string, string>, adminSession?: AdminSession | null }
) {
  try {
    // Check if admin access or require user authentication
    let userId: string | null = null
    if (!adminSession) {
      const session = await requireAuth()
      userId = session.user.id
    }

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
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user owns this order (unless admin)
    if (userId && order.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Transform to frontend Order type
    const transformedOrder: Order = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      items: order.items.map((item: OrderItemWithProduct) => ({
        productId: item.productId,
        name: item.product.name,
        productImage: item.product.images[0]?.url || '',
        variant: undefined, // Variant data not available in current schema
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      // Return uppercase enum values as-is for admin UI compatibility
      status: order.status.toLowerCase() as Order['status'],
      paymentStatus: order.paymentStatus.toLowerCase() as Order['paymentStatus'],
      subtotal: order.subtotal,
      shippingCost: order.shipping,
      tax: order.tax,
      discount: 0,
      total: order.total,
      shippingAddress: order.shippingAddress as unknown as Address,
      billingAddress: order.billingAddress as unknown as Address | undefined,
      trackingNumber: undefined,
      estimatedDelivery: undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Order fetch error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}

async function handlePUT(
  request: NextRequest,
  { params, adminSession }: { params: Record<string, string>, adminSession: AdminSession }
) {
  try {
    const body = await request.json()

    // Check if order exists
    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Capture before state for audit logging
    const before = existing

    // Update order
    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        status: body.status?.toUpperCase(),
        paymentStatus: body.paymentStatus?.toUpperCase(),
        notes: body.notes
      },
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
            }
          }
        },
      }
    })

    // Audit log the update
    await logUpdate(
      'order',
      params.id as string,
      before,
      order,
      adminSession.adminUser,
      request
    )

    // Trigger real-time notification via Pusher to notify admins of order updates
    await triggerOrderUpdate(order.id, {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total
    })

    // Trigger Customer 360 real-time update
    await triggerCustomerOrderUpdate(order.userId, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      timestamp: new Date(),
    })

    // Transform response to match GET endpoint (consistent shape)
    const transformedOrder: Order = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      items: order.items.map((item: OrderItemWithProduct) => ({
        productId: item.productId,
        name: item.product.name,
        productImage: item.product.images[0]?.url || '',
        variant: undefined, // Variant data not available in current schema
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      // Return uppercase enum values as-is for admin UI compatibility
      status: order.status.toLowerCase() as Order['status'],
      paymentStatus: order.paymentStatus.toLowerCase() as Order['paymentStatus'],
      subtotal: order.subtotal,
      shippingCost: order.shipping,
      tax: order.tax,
      discount: 0,
      total: order.total,
      shippingAddress: order.shippingAddress as unknown as Address,
      billingAddress: order.billingAddress as unknown as Address | undefined,
      trackingNumber: undefined, // Not in schema
      estimatedDelivery: undefined, // Not in schema
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

// Export wrapped handlers with permission checks
// GET can be accessed by users or admins (users checked inside handler)
export const GET = async (request: NextRequest, { params }: { params: { id: string } }) => {
  // Try to get admin session (won't throw if not admin)
  const adminSession = await getAdminSession()

  // If admin session exists, check permissions
  if (adminSession) {
    return withPermission(Permission.ORDERS_READ, handleGET)(request, { params })
  }

  // Otherwise, allow regular user access (handler will validate ownership)
  return handleGET(request, { params, adminSession: null })
}

export const PUT = withPermission(Permission.ORDERS_WRITE, handlePUT)


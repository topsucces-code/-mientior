/**
 * API endpoint for fetching a single order by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { Permission } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth, getSession } from '@/lib/auth-server'
import { getAdminSession } from '@/lib/auth-admin'
import { withPermission } from '@/middleware/admin-auth'
import { logUpdate } from '@/lib/audit-logger'
import { triggerOrderUpdate } from '@/lib/pusher'
import type { Order } from '@/types'

async function handleGET(
  request: NextRequest,
  { params, adminSession }: { params: { id: string }, adminSession: any }
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
    if (userId && order.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Transform to frontend Order type
    const transformedOrder: Order = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.images[0]?.url,
        variant: item.variant ? {
          sku: item.variant.sku,
          size: item.variant.size,
          color: item.variant.color
        } : undefined,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      // Return uppercase enum values as-is for admin UI compatibility
      status: order.status as any,
      paymentStatus: order.paymentStatus as any,
      subtotal: order.subtotal,
      shippingCost: order.shipping,
      tax: order.tax,
      discount: 0,
      total: order.total,
      shippingAddress: order.shippingAddress as any,
      billingAddress: order.billingAddress as any,
      trackingNumber: undefined,
      estimatedDelivery: undefined,
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

async function handlePUT(
  request: NextRequest,
  { params, adminSession }: { params: { id: string }, adminSession: any }
) {
  try {
    const body = await request.json()

    // Check if order exists
    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            product: true,
            variant: true
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
        trackingNumber: body.trackingNumber,
        estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined,
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
            },
            variant: {
              select: {
                sku: true,
                size: true,
                color: true
              }
            }
          }
        },
        user: true
      }
    })

    // Audit log the update
    await logUpdate({
      resource: 'order',
      resourceId: params.id,
      before,
      after: order,
      adminUser: adminSession.adminUser,
      request
    })

    // Trigger real-time notification via Pusher to notify admins of order updates
    await triggerOrderUpdate(order.id, {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total
    })

    // Transform response to match GET endpoint (consistent shape)
    const transformedOrder: Order = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      items: order.items.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        productImage: item.product.images[0]?.url,
        variant: item.variant ? {
          sku: item.variant.sku,
          size: item.variant.size,
          color: item.variant.color
        } : undefined,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      // Return uppercase enum values as-is for admin UI compatibility
      status: order.status as any,
      paymentStatus: order.paymentStatus as any,
      subtotal: order.subtotal,
      shippingCost: order.shipping,
      tax: order.tax,
      discount: 0,
      total: order.total,
      shippingAddress: order.shippingAddress as any,
      billingAddress: order.billingAddress as any,
      trackingNumber: order.trackingNumber || undefined,
      estimatedDelivery: order.estimatedDelivery || undefined,
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
  const adminSession = await getAdminSession(request)

  // If admin session exists, check permissions
  if (adminSession) {
    return withPermission(Permission.ORDERS_READ, handleGET)(request, { params })
  }

  // Otherwise, allow regular user access (handler will validate ownership)
  return handleGET(request, { params, adminSession: null })
}

export const PUT = withPermission(Permission.ORDERS_WRITE, handlePUT)


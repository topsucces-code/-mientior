/**
 * API endpoint for tracking an order by order number
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Order } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    // Find order by order number using Prisma
    const order = await prisma.order.findUnique({
      where: {
        orderNumber: params.orderNumber,
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
                  take: 1,
                },
              },
            },
            variant: {
              select: {
                sku: true,
                size: true,
                color: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Transform to frontend Order type
    const transformedOrder: Order = {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        variant: item.variant ? {
          sku: item.variant.sku,
          size: item.variant.size,
          color: item.variant.color,
        } : undefined,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
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
        max: order.estimatedDeliveryMax,
      } : undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }

    // Build tracking information
    const tracking = {
      status: order.status || 'pending',
      location: order.shippingAddress?.city || 'Unknown',
      timestamp: new Date(order.updatedAt),
      events: [
        {
          status: 'pending',
          location: 'Warehouse',
          timestamp: new Date(order.createdAt),
          description: 'Commande reçue',
        },
      ],
    }

    // Add more events based on order status
    if (order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      tracking.events.push({
        status: 'processing',
        location: 'Warehouse',
        timestamp: new Date(order.createdAt),
        description: 'Commande en préparation',
      })
    }

    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      const shippedDate = new Date(order.updatedAt)
      shippedDate.setDate(shippedDate.getDate() - 2) // Estimate shipped 2 days before current update
      tracking.events.push({
        status: 'shipped',
        location: 'En transit',
        timestamp: shippedDate,
        description: 'Colis expédié',
      })
    }

    if (order.status === 'DELIVERED') {
      tracking.events.push({
        status: 'delivered',
        location: order.shippingAddress?.city || 'Destination',
        timestamp: new Date(order.updatedAt),
        description: 'Colis livré',
      })
    }

    // Sort events by timestamp
    tracking.events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    return NextResponse.json({
      order: transformedOrder,
      tracking,
    })
  } catch (error) {
    console.error('Order tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track order' },
      { status: 500 }
    )
  }
}


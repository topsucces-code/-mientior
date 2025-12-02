/**
 * Order History Page
 * Displays all orders for the authenticated user
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { OrderHistoryClient } from './orders-client'

export const metadata: Metadata = {
  title: 'Mes Commandes | Mientior',
  description: 'Consultez l\'historique de vos commandes',
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function getOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              images: {
                take: 1,
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      },
    },
  })

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    tax: order.tax,
    discount: order.discount,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    estimatedDeliveryMin: order.estimatedDeliveryMin?.toISOString(),
    estimatedDeliveryMax: order.estimatedDeliveryMax?.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName || item.product?.name || 'Produit',
      productSlug: item.product?.slug,
      productImage: item.productImage || item.product?.images[0]?.url || '/images/placeholder.svg',
      quantity: item.quantity,
      price: item.price,
    })),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  }))
}

export default async function OrdersPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login?redirect=/account/orders')
  }

  const orders = await getOrders(session.user.id)

  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        <OrderHistoryClient orders={orders} />
      </div>
    </div>
  )
}

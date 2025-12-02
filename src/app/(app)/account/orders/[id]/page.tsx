/**
 * Order Detail Page
 * Displays full details of a specific order
 */

import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { OrderDetailClient } from './order-detail-client'

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: OrderDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const order = await prisma.order.findUnique({
    where: { id },
    select: { orderNumber: true },
  })

  return {
    title: order ? `Commande ${order.orderNumber} | Mientior` : 'Commande introuvable',
    description: 'Détails de votre commande',
  }
}

async function getOrderDetails(orderId: string, userId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
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

  if (!order || order.userId !== userId) {
    return null
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentGateway: order.paymentGateway,
    total: order.total,
    subtotal: order.subtotal,
    shippingCost: order.shippingCost,
    tax: order.tax,
    discount: order.discount,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    estimatedDeliveryMin: order.estimatedDeliveryMin?.toISOString(),
    estimatedDeliveryMax: order.estimatedDeliveryMax?.toISOString(),
    shippingAddress: order.shippingAddress as Record<string, string>,
    billingAddress: order.billingAddress as Record<string, string> | null,
    notes: order.notes,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName || item.product?.name || 'Produit',
      productSlug: item.product?.slug,
      productImage: item.productImage || item.product?.images[0]?.url || '/images/placeholder.svg',
      quantity: item.quantity,
      price: item.price,
      subtotal: item.price * item.quantity,
    })),
  }
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const session = await getSession()

  if (!session) {
    redirect('/login?redirect=/account/orders')
  }

  const { id } = await params
  const order = await getOrderDetails(id, session.user.id)

  if (!order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        <OrderDetailClient order={order} />
      </div>
    </div>
  )
}

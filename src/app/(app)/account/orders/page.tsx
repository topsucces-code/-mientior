/**
 * Order History Page
 * Displays all orders for the authenticated user with pagination and filters
 */

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { OrderHistoryClient } from './orders-client'
import { ordersQuerySchema } from '@/lib/validations/orders'

export const metadata: Metadata = {
  title: 'Mes Commandes | Mientior',
  description: 'Consultez l\'historique de vos commandes',
}

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const session = await getSession()

  if (!session) {
    redirect('/login?redirect=/account/orders')
  }

  // Parse and validate searchParams
  const params = await searchParams
  const query = ordersQuerySchema.parse({
    page: params.page,
    limit: params.limit,
    status: params.status,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    search: params.search,
  })

  // Build where clause for Prisma
  const where = {
    userId: session.user.id,
    ...(query.status && { status: query.status }),
    ...(query.dateFrom || query.dateTo
      ? {
          createdAt: {
            ...(query.dateFrom && { gte: query.dateFrom }),
            ...(query.dateTo && { lte: query.dateTo }),
          },
        }
      : {}),
    ...(query.search && {
      OR: [
        { orderNumber: { contains: query.search, mode: 'insensitive' as const } },
        {
          items: {
            some: {
              productName: { contains: query.search, mode: 'insensitive' as const },
            },
          },
        },
      ],
    }),
  }

  // Fetch orders with pagination
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
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
    }),
    prisma.order.count({ where }),
  ])

  // Transform orders for client
  const transformedOrders = orders.map((order) => ({
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
      productImage:
        item.productImage ||
        item.product?.images[0]?.url ||
        '/images/placeholder.svg',
      quantity: item.quantity,
      price: item.price,
    })),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
  }))

  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        <OrderHistoryClient
          orders={transformedOrders}
          pagination={{
            page: query.page,
            limit: query.limit,
            total,
            hasMore: query.page * query.limit < total,
          }}
          filters={query}
        />
      </div>
    </div>
  )
}

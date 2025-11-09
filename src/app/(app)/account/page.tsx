/**
 * Account Dashboard Page
 * Main account overview with stats, recent orders, and quick actions
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { AccountPageClient } from './account-client'
import type { DashboardStats, Order } from '@/components/account/dashboard-overview'

export const metadata: Metadata = {
  title: 'My Account | Mientior',
  description: 'Manage your account, orders, and preferences',
}

async function getAccountData(userId: string) {
  try {
    // Fetch user's orders using Prisma
    const orders = await prisma.order.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          take: 1,
        },
      },
    })

    // Transform orders
    const transformedOrders: Order[] = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt.toISOString(),
      status: order.status,
      total: order.total,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        quantity: item.quantity,
        price: item.price,
      })),
    }))

    // Calculate stats
    const totalOrders = orders.length
    const pendingOrders = orders.filter(
      (order) => order.status === 'PENDING' || order.status === 'PROCESSING'
    ).length

    // Get user for loyalty info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        loyaltyPoints: true,
        wishlist: true,
      },
    })

    const stats: DashboardStats = {
      totalOrders,
      pendingOrders,
      wishlistItems: user?.wishlist?.length || 0,
      loyaltyPoints: user?.loyaltyPoints,
    }

    return {
      orders: transformedOrders,
      stats,
    }
  } catch (error) {
    console.error('Error fetching account data:', error)
    return {
      orders: [],
      stats: {
        totalOrders: 0,
        pendingOrders: 0,
        wishlistItems: 0,
      },
    }
  }
}

export default async function AccountPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login?redirect=/account')
  }

  const { orders, stats } = await getAccountData(session.user.id)

  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        <AccountPageClient
          user={{
            name: session.user.name || 'User',
            email: session.user.email,
          }}
          stats={stats}
          recentOrders={orders}
        />
      </div>
    </div>
  )
}

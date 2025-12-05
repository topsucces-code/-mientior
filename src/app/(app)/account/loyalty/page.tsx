/**
 * Loyalty Program Page
 * Display user's loyalty points, tier, and rewards
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { LoyaltyPageClient } from './loyalty-client'

export const metadata: Metadata = {
  title: 'Loyalty Program | Mientior',
  description: 'View your loyalty points, tier, and available rewards',
}

export const dynamic = 'force-dynamic'

interface LoyaltyTransaction {
  id: string
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST'
  points: number
  description: string
  orderId?: string
  createdAt: string
}

async function getLoyaltyData(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        loyaltyPoints: true,
        loyaltyLevel: true,
        orders: {
          where: { paymentStatus: 'PAID' },
          select: {
            id: true,
            orderNumber: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!user) return null

    // Calculate tier progress
    const tiers = [
      { name: 'Bronze', minPoints: 0, benefits: ['5% off next order', 'Birthday bonus'] },
      { name: 'Silver', minPoints: 500, benefits: ['10% off next order', 'Free shipping', 'Birthday bonus'] },
      { name: 'Gold', minPoints: 1500, benefits: ['15% off next order', 'Free shipping', 'Priority support', 'Birthday bonus'] },
      { name: 'Platinum', minPoints: 5000, benefits: ['20% off next order', 'Free express shipping', 'Priority support', 'Exclusive access', 'Birthday bonus'] },
    ]

    const currentTierIndex = tiers.findIndex((t, i) => {
      const nextTier = tiers[i + 1]
      return !nextTier || user.loyaltyPoints < nextTier.minPoints
    })

    const currentTier = tiers[currentTierIndex] || tiers[0]
    const nextTier = tiers[currentTierIndex + 1]

    // Simulate transaction history from orders
    const transactions: LoyaltyTransaction[] = user.orders.map(order => ({
      id: order.id,
      type: 'EARN' as const,
      points: Math.floor(order.total), // 1 point per euro spent
      description: `Order #${order.orderNumber}`,
      orderId: order.id,
      createdAt: order.createdAt.toISOString(),
    }))

    return {
      points: user.loyaltyPoints,
      level: user.loyaltyLevel || 'Bronze',
      currentTier,
      nextTier,
      pointsToNextTier: nextTier ? nextTier.minPoints - user.loyaltyPoints : 0,
      transactions,
      tiers,
    }
  } catch (error) {
    console.error('Error fetching loyalty data:', error)
    return null
  }
}

export default async function LoyaltyPage() {
  const session = await getSession()

  if (!session) {
    redirect('/login?redirect=/account/loyalty')
  }

  const loyaltyData = await getLoyaltyData(session.user.id)

  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        <LoyaltyPageClient data={loyaltyData} />
      </div>
    </div>
  )
}

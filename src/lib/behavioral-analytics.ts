import { prisma } from '@/lib/prisma'

export interface CategoryStat {
  categoryId: string
  categoryName: string
  viewCount?: number
  purchaseCount: number
  revenue: number
}

export interface SessionStats {
  totalSessions: number
  averageDuration: number // in minutes
  averageSessionsPerDay: number
}

export interface DeviceStats {
  mobile: number
  desktop: number
  tablet: number
  unknown: number
}

export interface TimeStats {
  dayOfWeek: Record<string, number> // 0-6 (Sunday-Saturday)
  hourOfDay: Record<string, number> // 0-23
}

export interface BehavioralAnalytics {
  topViewedCategories: CategoryStat[]
  topPurchasedCategories: CategoryStat[]
  sessionStats: SessionStats
  deviceBreakdown: DeviceStats
  shoppingTimes: TimeStats
}

/**
 * Calculate behavioral analytics for a customer
 */
export async function calculateBehavioralAnalytics(
  customerId: string
): Promise<BehavioralAnalytics> {
  // Get all orders with items and product categories
  const orders = await prisma.orders.findMany({
    where: {
      userId: customerId,
      status: { not: 'CANCELLED' },
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Get sessions for the customer
  const sessions = await prisma.sessions.findMany({
    where: {
      userId: customerId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Calculate top purchased categories
  const categoryPurchases = new Map<
    string,
    { name: string; count: number; revenue: number }
  >()

  for (const order of orders) {
    for (const item of order.items) {
      const categoryId = item.product.categoryId
      const categoryName = item.product.category.name
      const existing = categoryPurchases.get(categoryId) || {
        name: categoryName,
        count: 0,
        revenue: 0,
      }
      categoryPurchases.set(categoryId, {
        name: categoryName,
        count: existing.count + item.quantity,
        revenue: existing.revenue + (item.price * item.quantity),
      })
    }
  }

  const topPurchasedCategories: CategoryStat[] = Array.from(
    categoryPurchases.entries()
  )
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: data.name,
      purchaseCount: data.count,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.purchaseCount - a.purchaseCount)
    .slice(0, 10)

  // For viewed categories, we'll use the same as purchased for now
  // In a real implementation, this would come from analytics tracking
  const topViewedCategories = topPurchasedCategories

  // Calculate session statistics
  const sessionStats = calculateSessionStats(sessions)

  // Calculate device breakdown
  const deviceBreakdown = calculateDeviceBreakdown(sessions)

  // Calculate shopping times
  const shoppingTimes = calculateShoppingTimes(orders)

  return {
    topViewedCategories,
    topPurchasedCategories,
    sessionStats,
    deviceBreakdown,
    shoppingTimes,
  }
}

interface SessionData {
  id: string
  userId: string
  createdAt: Date
  userAgent?: string | null
}

interface OrderData {
  id: string
  userId: string
  status: string
  createdAt: Date
  items: {
    quantity: number
    price: number
    product: {
      categoryId: string
      category: {
        name: string
      }
    }
  }[]
}

/**
 * Calculate session statistics
 */
function calculateSessionStats(sessions: SessionData[]): SessionStats {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      averageDuration: 0,
      averageSessionsPerDay: 0,
    }
  }

  // Calculate average session duration
  // For now, we'll estimate based on session creation times
  // In a real implementation, this would track actual session duration
  let totalDuration = 0
  for (let i = 0; i < sessions.length - 1; i++) {
    const current = new Date(sessions[i].createdAt)
    const next = new Date(sessions[i + 1].createdAt)
    const duration = Math.abs(current.getTime() - next.getTime()) / (1000 * 60) // minutes
    // Cap at 2 hours to avoid outliers
    totalDuration += Math.min(duration, 120)
  }

  const averageDuration =
    sessions.length > 1 ? totalDuration / (sessions.length - 1) : 30 // default 30 min

  // Calculate average sessions per day
  const firstSession = new Date(sessions[sessions.length - 1].createdAt)
  const lastSession = new Date(sessions[0].createdAt)
  const daysDiff =
    Math.max(
      1,
      Math.ceil(
        (lastSession.getTime() - firstSession.getTime()) / (1000 * 60 * 60 * 24)
      )
    )
  const averageSessionsPerDay = sessions.length / daysDiff

  return {
    totalSessions: sessions.length,
    averageDuration: Math.round(averageDuration),
    averageSessionsPerDay: Math.round(averageSessionsPerDay * 10) / 10,
  }
}

/**
 * Calculate device breakdown from user agents
 */
function calculateDeviceBreakdown(sessions: SessionData[]): DeviceStats {
  const stats: DeviceStats = {
    mobile: 0,
    desktop: 0,
    tablet: 0,
    unknown: 0,
  }

  for (const session of sessions) {
    const userAgent = session.userAgent?.toLowerCase() || ''

    if (!userAgent) {
      stats.unknown++
    } else if (
      userAgent.includes('mobile') ||
      userAgent.includes('android') ||
      userAgent.includes('iphone')
    ) {
      stats.mobile++
    } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
      stats.tablet++
    } else {
      stats.desktop++
    }
  }

  return stats
}

/**
 * Calculate shopping time patterns from orders
 */
function calculateShoppingTimes(orders: OrderData[]): TimeStats {
  const dayOfWeek: Record<string, number> = {
    '0': 0,
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    '6': 0,
  }

  const hourOfDay: Record<string, number> = {}
  for (let i = 0; i < 24; i++) {
    hourOfDay[i.toString()] = 0
  }

  for (const order of orders) {
    const date = new Date(order.createdAt)
    const day = date.getDay().toString()
    const hour = date.getHours().toString()

    dayOfWeek[day] = (dayOfWeek[day] || 0) + 1
    hourOfDay[hour] = (hourOfDay[hour] || 0) + 1
  }

  return {
    dayOfWeek,
    hourOfDay,
  }
}

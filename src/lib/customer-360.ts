/**
 * Customer 360 Data Aggregation Service
 * 
 * This service provides comprehensive customer data aggregation for the Customer 360 Dashboard.
 * It includes methods for fetching customer profiles, calculating metrics, health scores, and churn risk.
 * 
 * Features:
 * - Complete customer 360 view aggregation
 * - Customer metrics calculation (CLV, AOV, purchase frequency)
 * - Health score calculation based on multiple factors
 * - Churn risk assessment
 * - Redis caching with 30-second TTL
 */

import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import type {
  Customer360View,
  CustomerProfile,
  CustomerMetrics,
  HealthScore,
  ChurnRisk,
  Segment,
  Tag,
  Address,
} from '@/types/customer-360'
import { ChurnRiskLevel, LoyaltyLevel } from '@prisma/client'

// Cache TTL in seconds
const CACHE_TTL = 30

/**
 * Get complete Customer 360 view for a given customer ID
 * Aggregates all customer data including profile, metrics, health score, churn risk, segments, and tags
 */
export async function getCustomer360View(
  customerId: string
): Promise<Customer360View> {
  // Try to get from cache first
  const cacheKey = `customer:360:${customerId}`
  const cached = await redis.get(cacheKey)
  
  if (cached) {
    return JSON.parse(cached)
  }

  // Fetch all data in parallel
  const [profile, metrics, healthScore, churnRisk, segments, tags] =
    await Promise.all([
      getCustomerProfile(customerId),
      getCustomerMetrics(customerId),
      calculateHealthScore(customerId),
      calculateChurnRisk(customerId),
      getCustomerSegments(customerId),
      getCustomerTags(customerId),
    ])

  const customer360: Customer360View = {
    profile,
    metrics,
    healthScore,
    churnRisk,
    segments,
    tags,
  }

  // Cache the result
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(customer360))

  return customer360
}

/**
 * Get customer profile information
 */
async function getCustomerProfile(
  customerId: string
): Promise<CustomerProfile> {
  const user = await prisma.users.findUnique({
    where: { id: customerId },
    include: {
      savedAddresses: {
        orderBy: { isDefault: 'desc' },
      },
    },
  })

  if (!user) {
    throw new Error(`Customer not found: ${customerId}`)
  }

  const addresses: Address[] = user.savedAddresses.map((addr) => ({
    id: addr.id,
    firstName: addr.firstName,
    lastName: addr.lastName,
    line1: addr.line1,
    line2: addr.line2 || undefined,
    city: addr.city,
    postalCode: addr.postalCode,
    country: addr.country,
    phone: addr.phone,
    isDefault: addr.isDefault,
  }))

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: undefined, // Phone is not in the User model, would need to be added
    avatar: user.image || undefined,
    registrationDate: user.createdAt,
    accountStatus: user.emailVerified ? 'active' : 'pending_verification',
    addresses,
    loyaltyLevel: user.loyaltyLevel,
  }
}

/**
 * Calculate customer metrics including CLV, AOV, purchase frequency, etc.
 */
export async function getCustomerMetrics(
  customerId: string
): Promise<CustomerMetrics> {
  const user = await prisma.users.findUnique({
    where: { id: customerId },
    select: {
      createdAt: true,
      totalOrders: true,
      totalSpent: true,
    },
  })

  if (!user) {
    throw new Error(`Customer not found: ${customerId}`)
  }

  // Get order data for more detailed metrics
  const orders = await prisma.orders.findMany({
    where: {
      userId: customerId,
      status: { in: ['DELIVERED', 'COMPLETED'] }, // Only count completed orders
    },
    select: {
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalOrders = orders.length
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

  // Calculate days since last purchase
  const lastOrder = orders[0]
  const daysSinceLastPurchase = lastOrder
    ? Math.floor(
        (Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    : -1 // -1 indicates no purchases

  // Calculate purchase frequency (orders per month)
  const customerTenure = Math.floor(
    (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  )
  const tenureInMonths = Math.max(customerTenure / 30, 1) // At least 1 month
  const purchaseFrequency = totalOrders / tenureInMonths

  return {
    lifetimeValue: totalSpent,
    totalOrders,
    averageOrderValue,
    totalSpent,
    daysSinceLastPurchase,
    purchaseFrequency,
    customerTenure,
  }
}

/**
 * Calculate customer health score based on multiple factors
 * Score ranges from 0-100, with higher scores indicating healthier customers
 */
export async function calculateHealthScore(
  customerId: string
): Promise<HealthScore> {
  const metrics = await getCustomerMetrics(customerId)

  // Calculate individual factor scores (0-100)
  
  // Purchase score: based on order frequency and recency
  let purchaseScore = 0
  if (metrics.totalOrders > 0) {
    const frequencyScore = Math.min(metrics.purchaseFrequency * 20, 50) // Max 50 points
    const recencyScore =
      metrics.daysSinceLastPurchase >= 0
        ? Math.max(50 - metrics.daysSinceLastPurchase / 2, 0) // Max 50 points, decreases over time
        : 0
    purchaseScore = frequencyScore + recencyScore
  }

  // Engagement score: based on loyalty level and points
  const user = await prisma.users.findUnique({
    where: { id: customerId },
    select: { loyaltyLevel: true, loyaltyPoints: true },
  })

  let engagementScore = 0
  if (user) {
    const loyaltyLevelScore = {
      [LoyaltyLevel.BRONZE]: 25,
      [LoyaltyLevel.SILVER]: 50,
      [LoyaltyLevel.GOLD]: 75,
      [LoyaltyLevel.PLATINUM]: 100,
    }[user.loyaltyLevel]

    const pointsScore = Math.min(user.loyaltyPoints / 100, 50) // Max 50 points
    engagementScore = (loyaltyLevelScore + pointsScore) / 2
  }

  // Support score: based on support ticket history (placeholder - would need support ticket data)
  // For now, assume good support score if no data
  const supportScore = 75

  // Recency score: how recently they've been active
  const recencyScore =
    metrics.daysSinceLastPurchase >= 0
      ? Math.max(100 - metrics.daysSinceLastPurchase, 0)
      : 50

  // Calculate overall score (weighted average)
  const score = Math.round(
    purchaseScore * 0.35 +
      engagementScore * 0.25 +
      supportScore * 0.2 +
      recencyScore * 0.2
  )

  // Determine level
  let level: 'excellent' | 'good' | 'fair' | 'poor'
  if (score >= 80) level = 'excellent'
  else if (score >= 60) level = 'good'
  else if (score >= 40) level = 'fair'
  else level = 'poor'

  // Generate recommendations based on score
  const recommendations: string[] = []
  if (purchaseScore < 50) {
    recommendations.push('Encourage repeat purchases with targeted offers')
  }
  if (engagementScore < 50) {
    recommendations.push('Increase engagement through loyalty program benefits')
  }
  if (recencyScore < 50) {
    recommendations.push('Re-engage with personalized email campaign')
  }

  return {
    score,
    level,
    factors: {
      purchase: Math.round(purchaseScore),
      engagement: Math.round(engagementScore),
      support: Math.round(supportScore),
      recency: Math.round(recencyScore),
    },
    recommendations,
  }
}

/**
 * Calculate customer churn risk based on behavior patterns
 * Returns risk level (LOW, MEDIUM, HIGH) and contributing factors
 */
export async function calculateChurnRisk(
  customerId: string
): Promise<ChurnRisk> {
  const metrics = await getCustomerMetrics(customerId)

  // Calculate risk factors
  const daysSinceLastPurchase = metrics.daysSinceLastPurchase

  // Engagement decline: compare recent activity to historical average
  // For now, use a simple heuristic based on purchase frequency
  const engagementDecline =
    metrics.purchaseFrequency < 0.5 ? 75 : metrics.purchaseFrequency < 1 ? 50 : 25

  // Support issues: count of unresolved support tickets (placeholder)
  const supportIssues = 0 // Would need to query support tickets

  // Calculate risk score (0-100)
  let riskScore = 0

  // Days since last purchase contributes heavily to risk
  if (daysSinceLastPurchase < 0) {
    riskScore += 20 // Never purchased
  } else if (daysSinceLastPurchase > 90) {
    riskScore += 60
  } else if (daysSinceLastPurchase > 60) {
    riskScore += 40
  } else if (daysSinceLastPurchase > 30) {
    riskScore += 20
  }

  // Engagement decline
  riskScore += engagementDecline * 0.3

  // Support issues
  riskScore += supportIssues * 5

  // Cap at 100
  riskScore = Math.min(Math.round(riskScore), 100)

  // Determine risk level
  let riskLevel: ChurnRiskLevel
  if (riskScore >= 70) riskLevel = ChurnRiskLevel.HIGH
  else if (riskScore >= 40) riskLevel = ChurnRiskLevel.MEDIUM
  else riskLevel = ChurnRiskLevel.LOW

  // Generate retention strategies
  const retentionStrategies: string[] = []
  if (riskLevel === ChurnRiskLevel.HIGH) {
    retentionStrategies.push('Offer exclusive discount or promotion')
    retentionStrategies.push('Personal outreach from customer success team')
    retentionStrategies.push('Survey to understand pain points')
  } else if (riskLevel === ChurnRiskLevel.MEDIUM) {
    retentionStrategies.push('Send personalized product recommendations')
    retentionStrategies.push('Highlight new features or products')
    retentionStrategies.push('Loyalty points bonus offer')
  } else {
    retentionStrategies.push('Continue regular engagement')
    retentionStrategies.push('Encourage referrals')
  }

  return {
    level: riskLevel,
    score: riskScore,
    factors: {
      daysSinceLastPurchase,
      engagementDecline,
      supportIssues,
    },
    retentionStrategies,
  }
}

/**
 * Get customer segments
 */
async function getCustomerSegments(customerId: string): Promise<Segment[]> {
  const assignments = await prisma.customerSegmentAssignment.findMany({
    where: { customerId },
    include: {
      segment: true,
    },
  })

  return assignments.map((assignment) => ({
    id: assignment.segment.id,
    name: assignment.segment.name,
    description: assignment.segment.description || undefined,
    isAutomatic: assignment.segment.isAutomatic,
    assignedAt: assignment.assignedAt,
  }))
}

/**
 * Get customer tags
 */
async function getCustomerTags(customerId: string): Promise<Tag[]> {
  const assignments = await prisma.customerTagAssignment.findMany({
    where: { customerId },
    include: {
      tag: true,
    },
  })

  return assignments.map((assignment) => ({
    id: assignment.tag.id,
    name: assignment.tag.name,
    color: assignment.tag.color,
    description: assignment.tag.description || undefined,
  }))
}

/**
 * Invalidate cache for a customer
 * Should be called when customer data changes
 */
export async function invalidateCustomer360Cache(
  customerId: string
): Promise<void> {
  const cacheKey = `customer:360:${customerId}`
  await redis.del(cacheKey)
}

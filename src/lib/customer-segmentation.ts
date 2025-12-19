/**
 * Customer Segmentation Service
 * 
 * This service handles automatic and manual customer segment assignment.
 * Segments are used to classify customers based on behavior, value, or characteristics.
 * 
 * Features:
 * - Automatic segment assignment based on criteria
 * - Manual segment assignment by admins
 * - Segment removal
 * - Segment calculation based on customer metrics
 */

import { prisma } from '@/lib/prisma'
import { getCustomerMetrics } from '@/lib/customer-360'
import type { Prisma } from '@prisma/client'

export interface SegmentCriteria {
  // CLV-based criteria
  minLifetimeValue?: number
  maxLifetimeValue?: number
  
  // Order-based criteria
  minOrders?: number
  maxOrders?: number
  
  // Recency criteria
  maxDaysSinceLastPurchase?: number
  minDaysSinceLastPurchase?: number
  
  // Frequency criteria
  minPurchaseFrequency?: number
  
  // Loyalty level criteria
  loyaltyLevels?: string[]
  
  // Tenure criteria
  minTenureDays?: number
  maxTenureDays?: number
}

/**
 * Calculate which automatic segments a customer should belong to
 * Returns array of segment IDs that match the customer's profile
 */
export async function calculateAutomaticSegments(
  customerId: string
): Promise<string[]> {
  // Get customer metrics
  const metrics = await getCustomerMetrics(customerId)
  
  // Get customer loyalty level
  const user = await prisma.users.findUnique({
    where: { id: customerId },
    select: { loyaltyLevel: true },
  })
  
  if (!user) {
    throw new Error(`Customer not found: ${customerId}`)
  }
  
  // Get all automatic segments
  const segments = await prisma.customerSegment.findMany({
    where: { isAutomatic: true },
  })
  
  // Check which segments the customer matches
  const matchingSegmentIds: string[] = []
  
  for (const segment of segments) {
    const criteria = segment.criteria as SegmentCriteria
    
    if (matchesSegmentCriteria(metrics, user.loyaltyLevel, criteria)) {
      matchingSegmentIds.push(segment.id)
    }
  }
  
  return matchingSegmentIds
}

/**
 * Check if customer metrics match segment criteria
 */
function matchesSegmentCriteria(
  metrics: Awaited<ReturnType<typeof getCustomerMetrics>>,
  loyaltyLevel: string,
  criteria: SegmentCriteria
): boolean {
  // Check CLV criteria
  if (criteria.minLifetimeValue !== undefined && metrics.lifetimeValue < criteria.minLifetimeValue) {
    return false
  }
  if (criteria.maxLifetimeValue !== undefined && metrics.lifetimeValue > criteria.maxLifetimeValue) {
    return false
  }
  
  // Check order count criteria
  if (criteria.minOrders !== undefined && metrics.totalOrders < criteria.minOrders) {
    return false
  }
  if (criteria.maxOrders !== undefined && metrics.totalOrders > criteria.maxOrders) {
    return false
  }
  
  // Check recency criteria
  if (criteria.maxDaysSinceLastPurchase !== undefined) {
    if (metrics.daysSinceLastPurchase < 0 || metrics.daysSinceLastPurchase > criteria.maxDaysSinceLastPurchase) {
      return false
    }
  }
  if (criteria.minDaysSinceLastPurchase !== undefined) {
    if (metrics.daysSinceLastPurchase >= 0 && metrics.daysSinceLastPurchase < criteria.minDaysSinceLastPurchase) {
      return false
    }
  }
  
  // Check frequency criteria
  if (criteria.minPurchaseFrequency !== undefined && metrics.purchaseFrequency < criteria.minPurchaseFrequency) {
    return false
  }
  
  // Check loyalty level criteria
  if (criteria.loyaltyLevels && criteria.loyaltyLevels.length > 0) {
    if (!criteria.loyaltyLevels.includes(loyaltyLevel)) {
      return false
    }
  }
  
  // Check tenure criteria
  if (criteria.minTenureDays !== undefined && metrics.customerTenure < criteria.minTenureDays) {
    return false
  }
  if (criteria.maxTenureDays !== undefined && metrics.customerTenure > criteria.maxTenureDays) {
    return false
  }
  
  return true
}

/**
 * Assign automatic segments to a customer
 * Removes old automatic assignments and creates new ones based on current criteria
 */
export async function assignAutomaticSegments(
  customerId: string
): Promise<void> {
  const matchingSegmentIds = await calculateAutomaticSegments(customerId)
  
  // Get current automatic segment assignments
  const currentAssignments = await prisma.customerSegmentAssignment.findMany({
    where: {
      customerId,
      segment: { isAutomatic: true },
    },
    select: { segmentId: true },
  })
  
  const currentSegmentIds = currentAssignments.map((a) => a.segmentId)
  
  // Determine which segments to add and remove
  const toAdd = matchingSegmentIds.filter((id) => !currentSegmentIds.includes(id))
  const toRemove = currentSegmentIds.filter((id) => !matchingSegmentIds.includes(id))
  
  // Perform updates in a transaction
  await prisma.$transaction([
    // Remove old assignments
    prisma.customerSegmentAssignment.deleteMany({
      where: {
        customerId,
        segmentId: { in: toRemove },
      },
    }),
    // Add new assignments
    ...toAdd.map((segmentId) =>
      prisma.customerSegmentAssignment.create({
        data: {
          customerId,
          segmentId,
        },
      })
    ),
  ])
}

/**
 * Manually assign a segment to a customer
 * Only works for manual segments (isAutomatic: false)
 */
export async function assignManualSegment(
  customerId: string,
  segmentId: string
): Promise<void> {
  // Verify segment exists and is manual
  const segment = await prisma.customerSegment.findUnique({
    where: { id: segmentId },
  })
  
  if (!segment) {
    throw new Error(`Segment not found: ${segmentId}`)
  }
  
  if (segment.isAutomatic) {
    throw new Error('Cannot manually assign automatic segment')
  }
  
  // Check if already assigned
  const existing = await prisma.customerSegmentAssignment.findUnique({
    where: {
      customerId_segmentId: {
        customerId,
        segmentId,
      },
    },
  })
  
  if (existing) {
    // Already assigned, no-op
    return
  }
  
  // Create assignment
  await prisma.customerSegmentAssignment.create({
    data: {
      customerId,
      segmentId,
    },
  })
}

/**
 * Remove a manual segment assignment from a customer
 * Only works for manual segments
 */
export async function removeManualSegment(
  customerId: string,
  segmentId: string
): Promise<void> {
  // Verify segment exists and is manual
  const segment = await prisma.customerSegment.findUnique({
    where: { id: segmentId },
  })
  
  if (!segment) {
    throw new Error(`Segment not found: ${segmentId}`)
  }
  
  if (segment.isAutomatic) {
    throw new Error('Cannot manually remove automatic segment')
  }
  
  // Remove assignment
  await prisma.customerSegmentAssignment.deleteMany({
    where: {
      customerId,
      segmentId,
    },
  })
}

/**
 * Get all available segments
 */
export async function getAllSegments() {
  return prisma.customerSegment.findMany({
    orderBy: { name: 'asc' },
  })
}

/**
 * Create a new segment
 */
export async function createSegment(data: {
  name: string
  criteria: SegmentCriteria
  isAutomatic: boolean
  description?: string
}) {
  return prisma.customerSegment.create({
    data: {
      name: data.name,
      criteria: data.criteria as Prisma.JsonObject,
      isAutomatic: data.isAutomatic,
      description: data.description,
    },
  })
}

/**
 * Customer Comparison API Endpoint
 * 
 * Provides side-by-side comparison of up to 3 customers with metrics comparison
 * and segment overlap analysis.
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requirePermission } from '@/lib/auth-admin'
import { Permission } from '@/lib/permissions'
import { getCustomer360View } from '@/lib/customer-360'
import { apiSuccess, apiError, ErrorCodes } from '@/lib/api-response'
import type { CustomerComparison, ComparisonDifference } from '@/types/customer-360'

// Validation schema for comparison request
const compareSchema = z.object({
  customerIds: z
    .array(z.string().cuid())
    .min(2, 'At least 2 customers required for comparison')
    .max(3, 'Maximum 3 customers can be compared'),
})

/**
 * GET /api/admin/customers/compare
 * Compare multiple customers side-by-side
 */
export async function GET(request: NextRequest) {
  try {
    // Require USERS_READ permission
    await requirePermission(Permission.USERS_READ)

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const customerIdsParam = searchParams.get('customerIds')
    
    if (!customerIdsParam) {
      return apiError('customerIds parameter is required', ErrorCodes.VALIDATION_ERROR, 400)
    }

    const customerIds = customerIdsParam.split(',')
    const validation = compareSchema.safeParse({ customerIds })
    
    if (!validation.success) {
      return apiError('Invalid customer IDs', ErrorCodes.VALIDATION_ERROR, 400, validation.error.errors)
    }

    const { customerIds: validatedIds } = validation.data

    // Fetch customer data for all customers in parallel
    const customerDataPromises = validatedIds.map(async (customerId) => {
      try {
        const customer360 = await getCustomer360View(customerId)
        return customer360
      } catch (error) {
        // If customer not found, return null to handle gracefully
        // But if it's a different error, re-throw it
        if (error instanceof Error && error.message.includes('not found')) {
          return null
        }
        throw error
      }
    })

    const customerData = await Promise.all(customerDataPromises)

    // Filter out any null results (customers not found)
    const validCustomerData = customerData.filter((data) => data !== null)
    
    if (validCustomerData.length < 2) {
      return apiError('At least 2 valid customers required for comparison', ErrorCodes.VALIDATION_ERROR, 400)
    }

    // Extract profiles and metrics
    const customers = validCustomerData.map((data) => data!.profile)
    const metrics = validCustomerData.map((data) => data!.metrics)

    // Calculate segment overlap
    const allSegments = validCustomerData.map((data) => 
      data!.segments.map((segment) => segment.name)
    )
    
    const segmentOverlap = findSegmentOverlap(allSegments)

    // Calculate metric differences
    const differences = calculateMetricDifferences(metrics)

    const comparison: CustomerComparison = {
      customers,
      metrics,
      segmentOverlap,
      differences,
    }

    return apiSuccess(comparison)
  } catch (error) {
    console.error('Customer comparison error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return apiError(error.message, ErrorCodes.UNAUTHORIZED, 401)
      }
      if (error.message.includes('Forbidden')) {
        return apiError(error.message, ErrorCodes.FORBIDDEN, 403)
      }
    }
    
    return apiError('Failed to compare customers', ErrorCodes.INTERNAL_ERROR, 500)
  }
}

/**
 * Find segments that are common across customers
 */
function findSegmentOverlap(customerSegments: string[][]): string[] {
  if (customerSegments.length === 0) return []
  
  // Start with segments from first customer
  let overlap = customerSegments[0]
  
  // Find intersection with each subsequent customer's segments
  for (let i = 1; i < customerSegments.length; i++) {
    overlap = overlap.filter((segment) => customerSegments[i].includes(segment))
  }
  
  return overlap
}

/**
 * Calculate differences between customer metrics
 */
function calculateMetricDifferences(metrics: unknown[]): ComparisonDifference[] {
  if (metrics.length === 0) return []

  const differences: ComparisonDifference[] = []
  
  // Define metrics to compare
  const metricsToCompare = [
    'lifetimeValue',
    'totalOrders',
    'averageOrderValue',
    'totalSpent',
    'daysSinceLastPurchase',
    'purchaseFrequency',
    'customerTenure',
  ]

  for (const metricName of metricsToCompare) {
    const values = metrics.map((metric) => metric[metricName] || 0)
    
    // Calculate variance (standard deviation)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    )

    differences.push({
      metric: metricName,
      values,
      variance: Math.round(variance * 100) / 100, // Round to 2 decimal places
    })
  }

  return differences
}
/**
 * Delivery Estimation API Endpoint
 * POST /api/delivery/estimate
 * 
 * Calculates delivery estimates for a product based on location and shipping method
 * Results are cached in Redis for performance
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import {
  calculateLocationBasedEstimates,
  calculateBackorderDelivery,
  getDeliveryCacheKey,
} from '@/lib/delivery-calculation'
import type { ShippingOption, DeliveryEstimate } from '@/types/delivery'

// Request validation schema
const deliveryEstimateSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  location: z
    .object({
      country: z.string().optional(),
      region: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  shippingMethod: z.string().optional(),
})

type DeliveryEstimateRequest = z.infer<typeof deliveryEstimateSchema>

// Cache TTL: 30 minutes
const CACHE_TTL = 30 * 60

/**
 * POST /api/delivery/estimate
 * Calculate delivery estimates for a product
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request
    const validation = deliveryEstimateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { productId, variantId, location, shippingMethod } = validation.data

    // Generate cache key
    const cacheKey = getDeliveryCacheKey(productId, variantId, location)

    // Check Redis cache
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        const parsedCache = JSON.parse(cached)
        return NextResponse.json({
          estimates: parsedCache.estimates,
          cached: true,
          location: location || { country: 'France' },
        })
      }
    } catch (error) {
      // Cache miss or error, continue with calculation
      console.error('Redis cache error:', error)
    }

    // Fetch product data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        processingDays: true,
        stock: true,
        variants: variantId
          ? {
              where: { id: variantId },
              select: {
                id: true,
                stock: true,
              },
            }
          : undefined,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Determine stock status
    const variant = product.variants?.[0]
    const currentStock = variant?.stock ?? product.stock
    const isBackordered = currentStock <= 0

    // Get shipping options (hardcoded for now, could be from database)
    const shippingOptions: ShippingOption[] = [
      {
        id: 'standard',
        name: 'Standard Shipping',
        price: 5.99,
        estimatedDays: 5,
        description: 'Delivery in 5-7 business days',
      },
      {
        id: 'express',
        name: 'Express Shipping',
        price: 15.99,
        estimatedDays: 2,
        description: 'Delivery in 2-3 business days',
      },
      {
        id: 'next-day',
        name: 'Next Day Delivery',
        price: 25.99,
        estimatedDays: 1,
        description: 'Delivery next business day',
      },
    ]

    // Filter by shipping method if specified
    const filteredOptions = shippingMethod
      ? shippingOptions.filter((opt) => opt.id === shippingMethod)
      : shippingOptions

    if (filteredOptions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid shipping method' },
        { status: 400 }
      )
    }

    // Calculate estimates
    let estimates: DeliveryEstimate[]
    const currentDate = new Date()
    const processingDays = product.processingDays || 2

    if (isBackordered) {
      // Assume restock in 14 days for backordered items
      const restockDate = new Date()
      restockDate.setDate(restockDate.getDate() + 14)

      estimates = filteredOptions.map((option) => {
        const estimate = calculateBackorderDelivery(
          restockDate,
          processingDays,
          option.estimatedDays
        )
        return {
          ...estimate,
          shippingOption: option,
        }
      })
    } else {
      // Calculate location-based estimates
      estimates = calculateLocationBasedEstimates(
        currentDate,
        processingDays,
        filteredOptions,
        location
      )
    }

    // Serialize estimates for caching
    const cacheData = {
      estimates: estimates.map((est) => ({
        minDate: est.minDate.toISOString(),
        maxDate: est.maxDate.toISOString(),
        shippingOption: est.shippingOption,
        processingDays: est.processingDays,
      })),
      timestamp: Date.now(),
    }

    // Cache in Redis
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Failed to cache delivery estimates:', error)
      // Continue without caching
    }

    return NextResponse.json({
      estimates: cacheData.estimates,
      cached: false,
      location: location || { country: 'France' },
      isBackordered,
    })
  } catch (error) {
    console.error('Delivery estimation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to calculate delivery estimates',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

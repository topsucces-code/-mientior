/**
 * API endpoint for product stock information
 * Used as fallback when Pusher is unavailable
 * Implements Redis caching with 30s TTL (15.5)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

// Cache TTL: 30 seconds (as per requirements)
const STOCK_CACHE_TTL = 30

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const cacheKey = `stock:product:${productId}`

    // Try to get from cache first
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        const stockData = JSON.parse(cached)
        return NextResponse.json({
          ...stockData,
          cached: true,
        })
      }
    } catch (cacheError) {
      console.error('Redis cache error:', cacheError)
      // Continue to database query if cache fails
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const stockData = {
      productId,
      stock: product.stock,
      timestamp: Date.now(),
    }

    // Cache the result
    try {
      await redis.setex(cacheKey, STOCK_CACHE_TTL, JSON.stringify(stockData))
    } catch (cacheError) {
      console.error('Failed to cache stock data:', cacheError)
      // Continue without caching
    }

    return NextResponse.json({
      ...stockData,
      cached: false,
    })
  } catch (error) {
    console.error('Error fetching product stock:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock' },
      { status: 500 }
    )
  }
}

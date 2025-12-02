import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { requireAdminAuth } from '@/lib/auth-server'
import { Permission } from '@/lib/permissions'
import { z } from 'zod'

// Cache TTL: 1 hour (size guides don't change frequently)
const SIZE_GUIDE_CACHE_TTL = 60 * 60

const SizeMeasurementSchema = z.object({
  size: z.string(),
  chest: z.number().optional(),
  waist: z.number().optional(),
  hips: z.number().optional(),
  length: z.number().optional(),
  inseam: z.number().optional(),
  sleeve: z.number().optional(),
  unit: z.enum(['cm', 'in']),
})

const FitRecommendationSchema = z.object({
  size: z.string(),
  recommendation: z.string(),
})

const SizeGuideSchema = z.object({
  measurements: z.array(SizeMeasurementSchema),
  instructions: z.string().optional(),
  fitRecommendations: z.array(FitRecommendationSchema).optional(),
})

/**
 * GET /api/size-guides/[categoryId]
 * Get size guide for a specific category
 * Implements Redis caching with 1-hour TTL (15.5)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    const { categoryId } = params
    const cacheKey = `size-guide:category:${categoryId}`

    // Try to get from cache first
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        const sizeGuideData = JSON.parse(cached)
        return NextResponse.json({
          ...sizeGuideData,
          cached: true,
        })
      }
    } catch (cacheError) {
      console.error('Redis cache error:', cacheError)
      // Continue to database query if cache fails
    }

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Get size guide for category
    const sizeGuide = await prisma.sizeGuide.findUnique({
      where: { categoryId },
    })

    if (!sizeGuide) {
      return NextResponse.json(
        { error: 'Size guide not found for this category' },
        { status: 404 }
      )
    }

    // Parse measurements JSON
    const measurementsData = sizeGuide.measurements as {
      measurements: unknown[]
      fitRecommendations?: unknown[]
    }

    const sizeGuideData = {
      id: sizeGuide.id,
      categoryId: sizeGuide.categoryId,
      measurements: measurementsData.measurements || [],
      instructions: sizeGuide.instructions,
      fitRecommendations: measurementsData.fitRecommendations || [],
    }

    // Cache the result
    try {
      await redis.setex(cacheKey, SIZE_GUIDE_CACHE_TTL, JSON.stringify(sizeGuideData))
    } catch (cacheError) {
      console.error('Failed to cache size guide:', cacheError)
      // Continue without caching
    }

    return NextResponse.json({
      ...sizeGuideData,
      cached: false,
    })
  } catch (error) {
    console.error('Error fetching size guide:', error)
    return NextResponse.json(
      { error: 'Failed to fetch size guide' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/size-guides/[categoryId]
 * Create or update size guide for a category (Admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    // Require admin authentication with CATEGORIES_WRITE permission
    await requireAdminAuth(Permission.CATEGORIES_WRITE)

    const { categoryId } = params
    const body = await request.json()

    // Validate request body
    const validationResult = SizeGuideSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error },
        { status: 400 }
      )
    }

    const { measurements, instructions, fitRecommendations } = validationResult.data

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Prepare measurements data
    const measurementsData = {
      measurements,
      fitRecommendations: fitRecommendations || [],
    }

    // Create or update size guide
    const sizeGuide = await prisma.sizeGuide.upsert({
      where: { categoryId },
      create: {
        categoryId,
        measurements: measurementsData,
        instructions,
      },
      update: {
        measurements: measurementsData,
        instructions,
      },
    })

    // Invalidate cache after update
    const cacheKey = `size-guide:category:${categoryId}`
    try {
      await redis.del(cacheKey)
    } catch (cacheError) {
      console.error('Failed to invalidate size guide cache:', cacheError)
    }

    return NextResponse.json({
      id: sizeGuide.id,
      categoryId: sizeGuide.categoryId,
      measurements: sizeGuide.measurements,
      instructions: sizeGuide.instructions,
    })
  } catch (error) {
    console.error('Error creating/updating size guide:', error)
    return NextResponse.json(
      { error: 'Failed to create/update size guide' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/size-guides/[categoryId]
 * Delete size guide for a category (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {
    // Require admin authentication with CATEGORIES_DELETE permission
    await requireAdminAuth(Permission.CATEGORIES_DELETE)

    const { categoryId } = params

    // Delete size guide
    await prisma.sizeGuide.delete({
      where: { categoryId },
    })

    // Invalidate cache after deletion
    const cacheKey = `size-guide:category:${categoryId}`
    try {
      await redis.del(cacheKey)
    } catch (cacheError) {
      console.error('Failed to invalidate size guide cache:', cacheError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting size guide:', error)
    return NextResponse.json(
      { error: 'Failed to delete size guide' },
      { status: 500 }
    )
  }
}

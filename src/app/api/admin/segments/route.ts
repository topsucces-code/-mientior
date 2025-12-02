/**
 * Customer Segments API
 * 
 * GET /api/admin/segments - List all segments with pagination and caching
 * POST /api/admin/segments - Create a new segment with validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { checkPermission } from '@/lib/rbac'
import { createSegment } from '@/lib/customer-segmentation'
import { createSegmentSchema } from '@/lib/segment-validation'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { logAuditEvent } from '@/lib/audit-logger'

// Cache configuration
const SEGMENTS_CACHE_KEY = 'admin:segments:list'
const SEGMENTS_CACHE_TTL = 300 // 5 minutes

/**
 * GET /api/admin/segments
 * List customer segments with pagination, filtering, and caching
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - isAutomatic: Filter by automatic/manual (optional)
 * - search: Search by name (optional)
 * - sortBy: Sort field (name, createdAt) (default: createdAt)
 * - sortOrder: Sort order (asc, desc) (default: desc)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, 'customers:view')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const isAutomatic = searchParams.get('isAutomatic')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const skip = (page - 1) * limit

    // Build cache key with query params
    const cacheKey = `${SEGMENTS_CACHE_KEY}:${page}:${limit}:${isAutomatic}:${search}:${sortBy}:${sortOrder}`

    // Try to get from cache
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return NextResponse.json(JSON.parse(cached))
      }
    } catch (redisError) {
      console.warn('Redis cache unavailable:', redisError)
    }

    // Build where clause
    const where: any = {}
    
    if (isAutomatic !== null && isAutomatic !== undefined) {
      where.isAutomatic = isAutomatic === 'true'
    }
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      }
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sortBy === 'name' || sortBy === 'createdAt') {
      orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc'
    } else {
      orderBy.createdAt = 'desc'
    }

    // Fetch segments with pagination
    const [segments, total] = await Promise.all([
      prisma.customerSegment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: { customers: true },
          },
        },
      }),
      prisma.customerSegment.count({ where }),
    ])

    const response = {
      segments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    }

    // Cache the result
    try {
      await redis.setex(cacheKey, SEGMENTS_CACHE_TTL, JSON.stringify(response))
    } catch (redisError) {
      console.warn('Failed to cache segments:', redisError)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching segments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/segments
 * Create a new segment with validation and audit logging
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, 'customers:edit')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    
    // Validate with Zod schema
    const validationResult = createSegmentSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    const { name, criteria, isAutomatic, description } = validationResult.data

    // Create segment
    let segment
    try {
      segment = await createSegment({
        name,
        criteria,
        isAutomatic,
        description,
      })
    } catch (error) {
      // Handle unique constraint violation
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A segment with this name already exists' },
          { status: 409 }
        )
      }
      throw error
    }

    // Invalidate all segment list caches
    try {
      const cachePattern = `${SEGMENTS_CACHE_KEY}:*`
      const keys = await redis.keys(cachePattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (redisError) {
      console.warn('Failed to invalidate segment cache:', redisError)
    }

    // Log audit event
    try {
      await logAuditEvent({
        userId: session.user.id,
        action: 'segment.create',
        resourceType: 'segment',
        resourceId: segment.id,
        details: {
          name: segment.name,
          isAutomatic: segment.isAutomatic,
          criteriaKeys: Object.keys(criteria),
        },
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      })
    } catch (auditError) {
      console.error('Failed to log audit event:', auditError)
    }

    return NextResponse.json({ segment }, { status: 201 })
  } catch (error) {
    console.error('Error creating segment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

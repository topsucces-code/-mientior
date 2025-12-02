import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth-server'
import { Permission } from '@/lib/permissions'
import { apiSuccess, apiError, ErrorCodes } from '@/lib/api-response'
import { triggerCustomerTagsUpdate } from '@/lib/real-time-updates'
import { redis } from '@/lib/redis'
import { logAuditEvent } from '@/lib/audit-logger'

const CUSTOMER_TAGS_CACHE_TTL = 300 // 5 minutes

const assignTagSchema = z.object({
  tagId: z.string().cuid(),
})

/**
 * GET /api/admin/customers/[id]/tags
 * Get all tags assigned to a customer (with Redis caching)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication with USERS_READ permission
    await requireAdminAuth(Permission.USERS_READ)

    const customerId = params.id

    // Try cache first
    const cacheKey = `customer:${customerId}:tags`
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        return apiSuccess(JSON.parse(cached))
      }
    } catch (redisError) {
      console.warn('Redis cache unavailable:', redisError)
    }

    // Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true },
    })

    if (!customer) {
      return apiError('Customer not found', ErrorCodes.NOT_FOUND, 404)
    }

    // Get all tag assignments for this customer
    const tagAssignments = await prisma.customerTagAssignment.findMany({
      where: { customerId },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    })

    const response = {
      tags: tagAssignments.map((assignment) => ({
        id: assignment.tag.id,
        name: assignment.tag.name,
        color: assignment.tag.color,
        description: assignment.tag.description,
        isActive: assignment.tag.isActive,
        assignedBy: assignment.assignedBy,
        assignedAt: assignment.assignedAt,
      })),
    }

    // Cache the result
    try {
      await redis.setex(cacheKey, CUSTOMER_TAGS_CACHE_TTL, JSON.stringify(response))
    } catch (redisError) {
      console.warn('Failed to cache customer tags:', redisError)
    }

    return apiSuccess(response)
  } catch (error) {
    console.error('Error fetching customer tags:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Admin authentication required') {
        return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
      }
      if (error.message.includes('Permission denied')) {
        return apiError('Forbidden', ErrorCodes.FORBIDDEN, 403)
      }
    }

    return apiError('Failed to fetch customer tags', ErrorCodes.INTERNAL_ERROR, 500)
  }
}

/**
 * POST /api/admin/customers/[id]/tags
 * Assign a tag to a customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication with USERS_WRITE permission
    const adminSession = await requireAdminAuth(Permission.USERS_WRITE)

    const customerId = params.id

    // Parse and validate request body
    const body = await request.json()
    const validation = assignTagSchema.safeParse(body)

    if (!validation.success) {
      return apiError('Invalid request body', ErrorCodes.VALIDATION_ERROR, 400, validation.error.errors)
    }

    const { tagId } = validation.data

    // Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true },
    })

    if (!customer) {
      return apiError('Customer not found', ErrorCodes.NOT_FOUND, 404)
    }

    // Verify tag exists
    const tag = await prisma.customerTag.findUnique({
      where: { id: tagId },
    })

    if (!tag) {
      return apiError('Tag not found', ErrorCodes.NOT_FOUND, 404)
    }

    // Check if tag is already assigned (uniqueness check)
    const existingAssignment = await prisma.customerTagAssignment.findUnique({
      where: {
        customerId_tagId: {
          customerId,
          tagId,
        },
      },
    })

    if (existingAssignment) {
      return apiError('Tag already assigned to this customer', ErrorCodes.CONFLICT, 409)
    }

    // Create tag assignment
    const assignment = await prisma.customerTagAssignment.create({
      data: {
        customerId,
        tagId,
        assignedBy: adminSession.user.id,
      },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
            color: true,
            description: true,
          },
        },
      },
    })

    // Invalidate cache
    const cacheKey = `customer:${customerId}:tags`
    try {
      await redis.del(cacheKey)
    } catch (redisError) {
      console.warn('Failed to invalidate cache:', redisError)
    }

    // Log audit event
    try {
      await logAuditEvent({
        action: 'CUSTOMER_TAG_ASSIGNED',
        userId: adminSession.user.id,
        resource: 'customer',
        resourceId: customerId,
        metadata: {
          tagId,
          tagName: tag.name,
          assignmentId: assignment.id,
        },
      })
    } catch (auditError) {
      console.warn('Failed to log audit event:', auditError)
    }

    // Trigger Customer 360 real-time update for tags
    await triggerCustomerTagsUpdate(customerId, {
      tagId: assignment.tag.id,
      tagName: assignment.tag.name,
      action: 'added',
      timestamp: assignment.assignedAt,
    })

    return apiSuccess(
      {
        message: 'Tag assigned successfully',
        assignment: {
          id: assignment.id,
          tag: {
            id: assignment.tag.id,
            name: assignment.tag.name,
            color: assignment.tag.color,
            description: assignment.tag.description,
          },
          assignedBy: assignment.assignedBy,
          assignedAt: assignment.assignedAt,
        },
      },
      undefined,
      201
    )
  } catch (error) {
    console.error('Error assigning tag:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Admin authentication required') {
        return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
      }
      if (error.message.includes('Permission denied')) {
        return apiError('Forbidden', ErrorCodes.FORBIDDEN, 403)
      }
    }

    return apiError('Failed to assign tag', ErrorCodes.INTERNAL_ERROR, 500)
  }
}

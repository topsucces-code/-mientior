import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth-server'
import { Permission } from '@/lib/permissions'
import { apiSuccess, apiError, ErrorCodes } from '@/lib/api-response'
import { triggerCustomerTagsUpdate } from '@/lib/real-time-updates'
import { redis } from '@/lib/redis'
import { logAuditEvent } from '@/lib/audit-logger'

/**
 * DELETE /api/admin/customers/[id]/tags/[tagId]
 * Remove a tag from a customer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; tagId: string } }
) {
  try {
    // Require admin authentication with USERS_WRITE permission
    await requireAdminAuth(Permission.USERS_WRITE)

    const { id: customerId, tagId } = params

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

    // Find the assignment
    const assignment = await prisma.customerTagAssignment.findUnique({
      where: {
        customerId_tagId: {
          customerId,
          tagId,
        },
      },
    })

    if (!assignment) {
      return apiError('Tag not assigned to this customer', ErrorCodes.NOT_FOUND, 404)
    }

    // Delete the assignment
    await prisma.customerTagAssignment.delete({
      where: {
        id: assignment.id,
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
      const adminSession = await requireAdminAuth(Permission.USERS_WRITE)
      await logAuditEvent({
        action: 'CUSTOMER_TAG_REMOVED',
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
      tagId,
      tagName: tag.name,
      action: 'removed',
      timestamp: new Date(),
    })

    return apiSuccess({
      message: 'Tag removed successfully',
    })
  } catch (error) {
    console.error('Error removing tag:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Admin authentication required') {
        return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
      }
      if (error.message.includes('Permission denied')) {
        return apiError('Forbidden', ErrorCodes.FORBIDDEN, 403)
      }
    }

    return apiError('Failed to remove tag', ErrorCodes.INTERNAL_ERROR, 500)
  }
}

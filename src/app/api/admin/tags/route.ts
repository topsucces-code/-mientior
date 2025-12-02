import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth-server'
import { Permission } from '@/lib/permissions'
import { apiSuccess, apiError, ErrorCodes } from '@/lib/api-response'

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  description: z.string().optional(),
})

/**
 * GET /api/admin/tags
 * Get all customer tags
 */
export async function GET(request: NextRequest) {
  try {
    // Require admin authentication with USERS_READ permission
    await requireAdminAuth(Permission.USERS_READ)

    const tags = await prisma.customerTag.findMany({
      include: {
        _count: {
          select: {
            customers: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return apiSuccess({
      tags: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        description: tag.description,
        customerCount: tag._count.customers,
        createdAt: tag.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Admin authentication required') {
        return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
      }
      if (error.message.includes('Permission denied')) {
        return apiError('Forbidden', ErrorCodes.FORBIDDEN, 403)
      }
    }

    return apiError('Failed to fetch tags', ErrorCodes.INTERNAL_ERROR, 500)
  }
}

/**
 * POST /api/admin/tags
 * Create a new customer tag
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication with USERS_WRITE permission
    await requireAdminAuth(Permission.USERS_WRITE)

    // Parse and validate request body
    const body = await request.json()
    const validation = createTagSchema.safeParse(body)

    if (!validation.success) {
      return apiError('Invalid request body', ErrorCodes.VALIDATION_ERROR, 400, validation.error.errors)
    }

    const { name, color, description } = validation.data

    // Check if tag with same name already exists
    const existingTag = await prisma.customerTag.findUnique({
      where: { name },
    })

    if (existingTag) {
      return apiError('Tag with this name already exists', ErrorCodes.CONFLICT, 409)
    }

    // Create the tag
    const tag = await prisma.customerTag.create({
      data: {
        name,
        color,
        description,
      },
    })

    return apiSuccess(
      {
        message: 'Tag created successfully',
        tag: {
          id: tag.id,
          name: tag.name,
          color: tag.color,
          description: tag.description,
          createdAt: tag.createdAt,
        },
      },
      undefined,
      201
    )
  } catch (error) {
    console.error('Error creating tag:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Admin authentication required') {
        return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
      }
      if (error.message.includes('Permission denied')) {
        return apiError('Forbidden', ErrorCodes.FORBIDDEN, 403)
      }
    }

    return apiError('Failed to create tag', ErrorCodes.INTERNAL_ERROR, 500)
  }
}

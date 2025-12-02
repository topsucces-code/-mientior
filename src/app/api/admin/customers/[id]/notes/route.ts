import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth-server'
import { Permission } from '@/lib/permissions'
import { apiSuccess, apiError, ErrorCodes } from '@/lib/api-response'
import { triggerCustomerNotesUpdate } from '@/lib/real-time-updates'

// Validation schema for note creation
const createNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required').max(5000, 'Note content too long'),
})

// Validation schema for pagination
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

/**
 * GET /api/admin/customers/[id]/notes
 * Get all notes for a customer with pagination
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication with USERS_READ permission
    await requireAdminAuth(Permission.USERS_READ)

    const customerId = params.id

    // Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true },
    })

    if (!customer) {
      return apiError('Customer not found', ErrorCodes.NOT_FOUND, 404)
    }

    // Parse pagination parameters
    const { searchParams } = new URL(request.url)
    const validation = paginationSchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    })

    if (!validation.success) {
      return apiError('Invalid pagination parameters', ErrorCodes.VALIDATION_ERROR, 400, validation.error.errors)
    }

    const { page, limit } = validation.data
    const skip = (page - 1) * limit

    // Get total count
    const totalCount = await prisma.customerNote.count({
      where: { customerId },
    })

    // Get notes with author information
    const notes = await prisma.customerNote.findMany({
      where: { customerId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(totalCount / limit)

    return apiSuccess(
      { notes },
      {
        page,
        limit,
        total: totalCount,
        hasMore: page < totalPages,
      }
    )
  } catch (error) {
    console.error('Error fetching customer notes:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Admin authentication required') {
        return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
      }
      if (error.message.includes('Permission denied')) {
        return apiError('Forbidden', ErrorCodes.FORBIDDEN, 403)
      }
    }

    return apiError('Failed to fetch customer notes', ErrorCodes.INTERNAL_ERROR, 500)
  }
}

/**
 * POST /api/admin/customers/[id]/notes
 * Create a new note for a customer
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require admin authentication with USERS_WRITE permission
    const adminSession = await requireAdminAuth(Permission.USERS_WRITE)

    const customerId = params.id

    // Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true },
    })

    if (!customer) {
      return apiError('Customer not found', ErrorCodes.NOT_FOUND, 404)
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = createNoteSchema.safeParse(body)

    if (!validation.success) {
      return apiError('Invalid request body', ErrorCodes.VALIDATION_ERROR, 400, validation.error.errors)
    }

    const { content } = validation.data

    // Create note with author attribution
    const note = await prisma.customerNote.create({
      data: {
        customerId,
        content,
        createdBy: adminSession.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    // Trigger Customer 360 real-time update for notes
    await triggerCustomerNotesUpdate(customerId, {
      noteId: note.id,
      content: note.content,
      authorName: note.author.name || note.author.email,
      timestamp: note.createdAt,
    })

    return apiSuccess(
      {
        note,
        message: 'Note created successfully',
      },
      undefined,
      201
    )
  } catch (error) {
    console.error('Error creating customer note:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Admin authentication required') {
        return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
      }
      if (error.message.includes('Permission denied')) {
        return apiError('Forbidden', ErrorCodes.FORBIDDEN, 403)
      }
    }

    return apiError('Failed to create customer note', ErrorCodes.INTERNAL_ERROR, 500)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminAuth } from '@/middleware/admin-auth'
import { Permission } from '@/lib/permissions'
import { apiSuccess, apiError } from '@/lib/api-response'
import { updateSynonym, deleteSynonym } from '@/lib/synonyms-manager'

/**
 * PUT /api/admin/search/synonyms/[key]
 * Update an existing synonym
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Authenticate and authorize
    await requireAdminAuth(request, Permission.SEARCH_MANAGE)

    // Decode key from URL
    const key = decodeURIComponent(params.key)

    // Parse request body
    const body = await request.json()

    // Validation schema
    const updateSynonymSchema = z.object({
      terms: z
        .array(z.string().min(1).max(50))
        .min(2, { message: 'At least 2 terms required' })
        .max(20, { message: 'Maximum 20 terms allowed' }),
    })

    // Validate
    const validation = updateSynonymSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message).join(', ')
      return apiError(`Validation error: ${errors}`, 400)
    }

    const { terms } = validation.data

    // Normalize terms
    const normalizedTerms = terms.map((t) => t.toLowerCase().trim())

    // Check for duplicate terms
    const uniqueTerms = new Set(normalizedTerms)
    if (uniqueTerms.size !== normalizedTerms.length) {
      return apiError('Duplicate terms are not allowed', 400)
    }

    // Update synonym
    await updateSynonym(key, normalizedTerms)

    // Return updated synonym
    return apiSuccess({
      key,
      terms: normalizedTerms,
    })
  } catch (error: any) {
    console.error(`PUT /api/admin/search/synonyms/${params.key} error:`, error)

    if (error.message?.includes('Unauthorized')) {
      return apiError('Unauthorized', 401)
    }

    if (error.message?.includes('not found')) {
      return apiError(error.message, 404)
    }

    return apiError(error.message || 'Failed to update synonym', 500)
  }
}

/**
 * DELETE /api/admin/search/synonyms/[key]
 * Delete a synonym
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    // Authenticate and authorize
    await requireAdminAuth(request, Permission.SEARCH_MANAGE)

    // Decode key from URL
    const key = decodeURIComponent(params.key)

    // Delete synonym
    await deleteSynonym(key)

    // Return success message
    return apiSuccess({
      message: `Synonym "${key}" deleted successfully`,
    })
  } catch (error: any) {
    console.error(
      `DELETE /api/admin/search/synonyms/${params.key} error:`,
      error
    )

    if (error.message?.includes('Unauthorized')) {
      return apiError('Unauthorized', 401)
    }

    if (error.message?.includes('not found')) {
      return apiError(error.message, 404)
    }

    return apiError(error.message || 'Failed to delete synonym', 500)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminAuth } from '@/middleware/admin-auth'
import { Permission } from '@/lib/permissions'
import { apiSuccess, apiError } from '@/lib/api-response'
import {
  getSynonymsWithMetadata,
  addSynonym,
  SynonymEntry,
} from '@/lib/synonyms-manager'

/**
 * GET /api/admin/search/synonyms
 * Get all synonyms
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize
    await requireAdminAuth(request, Permission.SEARCH_MANAGE)

    // Get all synonyms with metadata
    const { synonyms: synonymsMap, lastUpdated, version } = await getSynonymsWithMetadata()

    // Transform map to array
    const synonymsArray: SynonymEntry[] = Object.entries(synonymsMap).map(
      ([key, terms]) => ({
        key,
        terms,
      })
    )

    // Sort alphabetically by key
    synonymsArray.sort((a, b) => a.key.localeCompare(b.key))

    return apiSuccess({
      synonyms: synonymsArray,
      count: synonymsArray.length,
      lastUpdated,
      version,
    })
  } catch (error: any) {
    console.error('GET /api/admin/search/synonyms error:', error)

    if (error.message?.includes('Unauthorized')) {
      return apiError('Unauthorized', 401)
    }

    return apiError(error.message || 'Failed to get synonyms', 500)
  }
}

/**
 * POST /api/admin/search/synonyms
 * Add a new synonym
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    await requireAdminAuth(request, Permission.SEARCH_MANAGE)

    // Parse request body
    const body = await request.json()

    // Validation schema
    const createSynonymSchema = z.object({
      key: z
        .string()
        .min(1)
        .max(50)
        .regex(/^[a-zà-ÿ0-9\s-]+$/, {
          message:
            'Key must be lowercase, alphanumeric with spaces/hyphens only',
        }),
      terms: z
        .array(z.string().min(1).max(50))
        .min(2, { message: 'At least 2 terms required' })
        .max(20, { message: 'Maximum 20 terms allowed' }),
    })

    // Validate
    const validation = createSynonymSchema.safeParse(body)
    if (!validation.success) {
      const errors = validation.error.errors.map((e) => e.message).join(', ')
      return apiError(`Validation error: ${errors}`, 400)
    }

    const { key, terms } = validation.data

    // Normalize
    const normalizedKey = key.toLowerCase().trim()
    const normalizedTerms = terms.map((t) => t.toLowerCase().trim())

    // Check for duplicate terms
    const uniqueTerms = new Set(normalizedTerms)
    if (uniqueTerms.size !== normalizedTerms.length) {
      return apiError('Duplicate terms are not allowed', 400)
    }

    // Add synonym
    await addSynonym(normalizedKey, normalizedTerms)

    // Return created synonym
    return NextResponse.json(
      {
        success: true,
        data: {
          key: normalizedKey,
          terms: normalizedTerms,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('POST /api/admin/search/synonyms error:', error)

    if (error.message?.includes('Unauthorized')) {
      return apiError('Unauthorized', 401)
    }

    if (error.message?.includes('already exists')) {
      return apiError(error.message, 409)
    }

    return apiError(error.message || 'Failed to add synonym', 500)
  }
}

import { NextRequest } from 'next/server'
import { requireAdminAuth } from '@/middleware/admin-auth'
import { Permission } from '@/lib/permissions'
import { apiSuccess, apiError } from '@/lib/api-response'
import { applySynonymsToMeiliSearch } from '@/lib/synonyms-manager'

/**
 * POST /api/admin/search/synonyms/sync
 * Manually sync synonyms to MeiliSearch
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and authorize
    await requireAdminAuth(request, Permission.SEARCH_MANAGE)

    // Apply synonyms to MeiliSearch
    await applySynonymsToMeiliSearch()

    return apiSuccess({
      message: 'Synonyms synced to MeiliSearch successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('POST /api/admin/search/synonyms/sync error:', error)

    if (error.message?.includes('Unauthorized')) {
      return apiError('Unauthorized', 401)
    }

    return apiError(error.message || 'Failed to sync synonyms', 500)
  }
}

/**
 * Admin API: Recalculate User Preferences
 *
 * POST /api/admin/personalization/recalculate
 * GET /api/admin/personalization/recalculate
 *
 * Triggers batch preference recalculation for users with optional filters.
 * Requires admin authentication with PRODUCTS_WRITE permission for POST,
 * PRODUCTS_READ permission for GET.
 */

import { NextRequest, NextResponse } from 'next/server'
import { batchCalculatePreferences, getPreferenceStatistics, getPersonalizationConfig } from '@/lib/personalization-service'
import { invalidateAllUserPreferencesCache } from '@/lib/redis'
import type { BatchCalculateOptions } from '@/types/personalization'
import { withPermission } from '@/middleware/admin-auth'
import { Permission } from '@/lib/permissions'
import type { AdminSession } from '@/lib/auth-admin'

/**
 * POST /api/admin/personalization/recalculate
 *
 * Recalculates user preferences for personalized search
 *
 * Query parameters:
 * - userId: Calculate for a specific user only
 * - batchSize: Number of users per batch (default: 50, max: 1000)
 * - onlyUninitialized: Only calculate for users with null preferences
 * - invalidateCache: Invalidate Redis cache after completion (default: true)
 */
async function handlePOST(
  request: NextRequest,
  { adminSession: _adminSession }: { params?: unknown; adminSession?: AdminSession }
) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId') || undefined
    const batchSize = searchParams.get('batchSize')
      ? parseInt(searchParams.get('batchSize')!, 10)
      : 50
    const onlyUninitialized = searchParams.get('onlyUninitialized') === 'true'
    const invalidateCache = searchParams.get('invalidateCache') !== 'false' // default true

    // Validate batch size
    if (batchSize < 1 || batchSize > 1000) {
      return NextResponse.json(
        { error: 'Batch size must be between 1 and 1000' },
        { status: 400 }
      )
    }

    // Build options
    const options: BatchCalculateOptions = {
      batchSize,
      userId,
      onlyUninitialized,
    }

    console.log('[Admin] Starting preference recalculation with options:', options)

    // Execute batch calculation
    const result = await batchCalculatePreferences(options)

    // Invalidate cache if requested
    if (invalidateCache && result.updated > 0) {
      console.log('[Admin] Invalidating user preferences cache')
      try {
        await invalidateAllUserPreferencesCache()
      } catch (error) {
        console.error('[Admin] Failed to invalidate cache:', error)
        // Continue - non-critical error
      }
    }

    // Fetch updated statistics
    const stats = await getPreferenceStatistics()
    const config = getPersonalizationConfig()

    return NextResponse.json({
      success: true,
      result: {
        total: result.total,
        updated: result.updated,
        skipped: result.skipped,
        failed: result.failed,
        duration: result.duration,
        statistics: result.statistics,
      },
      currentStatistics: stats,
      config: {
        purchasesWeight: config.purchasesWeight,
        searchesWeight: config.searchesWeight,
        viewsWeight: config.viewsWeight,
        categoryBoost: config.categoryBoost,
        brandBoost: config.brandBoost,
        minInteractions: config.minInteractions,
      },
      errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined, // Return first 10 errors
      message:
        result.failed > 0
          ? `Recalculation completed with ${result.failed} errors. Check logs for details.`
          : `Successfully calculated preferences for ${result.updated} users`,
    })
  } catch (error) {
    console.error('[Admin] Preference recalculation failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to recalculate user preferences',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/personalization/recalculate
 *
 * Get current personalization statistics without recalculating
 */
async function handleGET(
  _request: NextRequest,
  { adminSession: _adminSession }: { params?: unknown; adminSession?: AdminSession }
) {
  try {
    const stats = await getPreferenceStatistics()
    const config = getPersonalizationConfig()

    return NextResponse.json({
      success: true,
      statistics: stats,
      config: {
        purchasesWeight: config.purchasesWeight,
        searchesWeight: config.searchesWeight,
        viewsWeight: config.viewsWeight,
        categoryBoost: config.categoryBoost,
        brandBoost: config.brandBoost,
        minInteractions: config.minInteractions,
        maxCategories: config.maxCategories,
        maxBrands: config.maxBrands,
      },
    })
  } catch (error) {
    console.error('[Admin] Failed to fetch personalization statistics:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

// Export with admin permission checks
export const POST = withPermission(Permission.PRODUCTS_WRITE, handlePOST)
export const GET = withPermission(Permission.PRODUCTS_READ, handleGET)

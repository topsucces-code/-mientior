/**
 * Admin API: Recalculate Product Popularity
 *
 * POST /api/admin/ranking/recalculate
 *
 * Triggers batch popularity recalculation for products with optional filters.
 * Requires admin authentication with PRODUCTS_WRITE permission.
 */

import { NextRequest, NextResponse } from 'next/server'
import { batchUpdatePopularity, getRankingStatistics } from '@/lib/ranking-service'
import { enqueueReindexJob } from '@/lib/search-queue'
import type { BatchUpdateOptions } from '@/types/ranking'
import { withPermission } from '@/middleware/admin-auth'
import { Permission } from '@/lib/permissions'
import type { AdminSession } from '@/lib/auth-admin'

/**
 * POST /api/admin/ranking/recalculate
 *
 * Recalculates popularity scores for all products (or filtered subset)
 *
 * Query parameters:
 * - categoryId: Filter by category ID
 * - vendorId: Filter by vendor ID
 * - batchSize: Number of products per batch (default: 100)
 * - onlyUninitialized: Only update products with popularity = 0
 * - triggerReindex: Trigger MeiliSearch reindex after completion (default: true)
 */
async function handlePOST(
  request: NextRequest,
  { adminSession }: { params?: unknown; adminSession?: AdminSession }
) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId') || undefined
    const vendorId = searchParams.get('vendorId') || undefined
    const batchSize = searchParams.get('batchSize')
      ? parseInt(searchParams.get('batchSize')!, 10)
      : 100
    const onlyUninitialized = searchParams.get('onlyUninitialized') === 'true'
    const triggerReindex = searchParams.get('triggerReindex') !== 'false' // default true

    // Validate batch size
    if (batchSize < 1 || batchSize > 1000) {
      return NextResponse.json(
        { error: 'Batch size must be between 1 and 1000' },
        { status: 400 }
      )
    }

    // Build options
    const options: BatchUpdateOptions = {
      batchSize,
      categoryId,
      vendorId,
      onlyUninitialized,
    }

    console.log('[Admin] Starting popularity recalculation with options:', options)

    // Execute batch update
    const result = await batchUpdatePopularity(options)

    // Trigger MeiliSearch reindex if requested
    let reindexJobId: string | undefined
    if (triggerReindex && result.updated > 0) {
      console.log('[Admin] Triggering MeiliSearch reindex after popularity update')
      try {
        // Build filters for reindex job (same filters used for popularity calculation)
        const reindexFilters: { categoryId?: string; vendorId?: string; status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED' } = {}
        if (categoryId) reindexFilters.categoryId = categoryId
        if (vendorId) reindexFilters.vendorId = vendorId
        // Only reindex ACTIVE products by default
        reindexFilters.status = 'ACTIVE'

        // Enqueue reindex job
        reindexJobId = await enqueueReindexJob(reindexFilters)
        console.log(`[Admin] Reindex job queued with ID: ${reindexJobId}`)
      } catch (error) {
        console.error('[Admin] Failed to trigger reindex:', error)
        // Continue - non-critical error
      }
    }

    // Fetch updated statistics
    const stats = await getRankingStatistics()

    return NextResponse.json({
      success: true,
      result: {
        total: result.total,
        updated: result.updated,
        failed: result.failed,
        duration: result.duration,
        averagePopularity: result.averagePopularity,
        maxPopularity: result.maxPopularity,
        minPopularity: result.minPopularity,
      },
      statistics: stats,
      reindexJobId,
      errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined, // Return first 10 errors
      message:
        result.failed > 0
          ? `Recalculation completed with ${result.failed} errors. Check logs for details.`
          : reindexJobId
          ? 'Popularity scores recalculated successfully. MeiliSearch reindex job queued.'
          : 'Popularity scores recalculated successfully',
    })
  } catch (error) {
    console.error('[Admin] Popularity recalculation failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        message: 'Failed to recalculate popularity scores',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/ranking/recalculate
 *
 * Get current ranking statistics without recalculating
 */
async function handleGET(
  request: NextRequest,
  { adminSession }: { params?: unknown; adminSession?: AdminSession }
) {
  try {
    const stats = await getRankingStatistics()

    return NextResponse.json({
      success: true,
      statistics: stats,
    })
  } catch (error) {
    console.error('[Admin] Failed to fetch ranking statistics:', error)

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

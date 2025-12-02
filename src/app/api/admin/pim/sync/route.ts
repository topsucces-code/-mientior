/**
 * Admin API: Manual PIM Synchronization
 *
 * POST /api/admin/pim/sync
 * Manually trigger product synchronization from Akeneo PIM to Mientior.
 * Supports two modes: targeted sync (specific product IDs) or batch sync (filters).
 * Requires admin authentication with PRODUCTS_WRITE permission.
 *
 * GET /api/admin/pim/sync
 * Check current PIM sync queue status and recent activity.
 * Returns real-time queue statistics and last 10 sync operations.
 *
 * @see src/lib/pim-sync-queue.ts - Queue operations
 * @see src/lib/pim-sync-worker.ts - Worker that processes jobs
 * @see src/app/api/admin/search/reindex/route.ts - Similar pattern for search reindex
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enqueuePimSyncJob, getPimSyncStats } from '@/lib/pim-sync-queue'
import { logCreate } from '@/lib/audit-logger'
import { withPermission } from '@/middleware/admin-auth'
import { Permission } from '@/lib/permissions'

/**
 * Request body for POST /api/admin/pim/sync
 */
interface SyncRequestBody {
  productIds?: string[]
  filters?: {
    categoryId?: string
    vendorId?: string
    status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  }
  dryRun?: boolean
}

/**
 * Response for POST /api/admin/pim/sync
 */
interface SyncResponse {
  success: boolean
  message: string
  jobIds?: string[]
  estimatedProducts: number
  mode: 'productIds' | 'filters'
  queuedAt?: string
  productIds?: string[]
  filters?: Record<string, unknown>
}

/**
 * Response for GET /api/admin/pim/sync
 */
interface StatusResponse {
  success: boolean
  queueStats: {
    pending: number
    processing: number
    failed: number
    timestamp: number
  }
  recentActivity: Array<{
    id: string
    operation: string
    status: string
    productId: string | null
    duration: number | null
    createdAt: Date
    error: string | null
    product?: { name: string; slug: string } | null
  }>
  timestamp: string
}

/**
 * POST Handler - Trigger manual PIM synchronization
 *
 * @param request - Next.js request object
 * @param context - Context with adminSession (injected by withPermission middleware)
 * @returns JSON response with enqueued job IDs and sync details
 *
 * @example
 * // Sync specific products by Akeneo ID
 * POST /api/admin/pim/sync
 * {
 *   "productIds": ["akeneo-prod-123", "akeneo-prod-456"],
 *   "dryRun": false
 * }
 *
 * @example
 * // Batch sync all active products in a category
 * POST /api/admin/pim/sync
 * {
 *   "filters": {
 *     "categoryId": "cat-uuid",
 *     "status": "ACTIVE"
 *   },
 *   "dryRun": true
 * }
 */
async function handlePOST(
  request: NextRequest,
  context: { adminSession: { adminUser: { id: string } } }
) {
  try {
    // Parse request body
    const body = (await request.json()) as SyncRequestBody
    const { productIds, filters, dryRun = false } = body

    // Input validation
    if (!productIds && !filters) {
      return NextResponse.json(
        {
          error: 'Either productIds or filters must be provided',
        },
        { status: 400 }
      )
    }

    if (productIds && filters) {
      return NextResponse.json(
        {
          error: 'Cannot provide both productIds and filters - choose one mode',
        },
        { status: 400 }
      )
    }

    // Validate productIds mode
    if (productIds) {
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return NextResponse.json(
          {
            error: 'productIds must be a non-empty array',
          },
          { status: 400 }
        )
      }

      if (productIds.length > 1000) {
        return NextResponse.json(
          {
            error: 'Maximum 1000 products can be synced at once',
          },
          { status: 400 }
        )
      }
    }

    // Validate filters mode
    if (filters) {
      const hasFilters =
        filters.categoryId || filters.vendorId || filters.status
      if (!hasFilters) {
        return NextResponse.json(
          {
            error: 'At least one filter must be provided',
          },
          { status: 400 }
        )
      }
    }

    // Determine mode
    const mode = productIds ? 'productIds' : 'filters'

    let count = 0
    let existingMappings: Map<string, string> = new Map() // akeneoProductId -> internalProductId
    let productsToSync: Array<{ id: string; akeneoProductId: string }> = []

    // Product count estimation - productIds mode
    if (productIds) {
      count = productIds.length

      // Query existing mappings to determine CREATE vs UPDATE operations
      const mappings = await prisma.pimProductMapping.findMany({
        where: {
          akeneoProductId: { in: productIds },
        },
        select: {
          akeneoProductId: true,
          productId: true,
        },
      })

      for (const mapping of mappings) {
        existingMappings.set(mapping.akeneoProductId, mapping.productId)
      }

      // Build productsToSync array
      productsToSync = productIds.map((akeneoId) => ({
        id: existingMappings.get(akeneoId) || '', // Empty string for new products
        akeneoProductId: akeneoId,
      }))
    }

    // Product count estimation - filters mode
    if (filters) {
      const where: any = {}

      if (filters.categoryId) {
        where.categoryId = filters.categoryId
      }

      if (filters.vendorId) {
        where.vendorId = filters.vendorId
      }

      if (filters.status) {
        where.status = filters.status
      }

      // Count matching products
      count = await prisma.product.count({ where })

      if (count === 0) {
        return NextResponse.json<SyncResponse>({
          success: true,
          message: 'No products found matching criteria',
          estimatedProducts: 0,
          mode: 'filters',
          filters: filters as Record<string, unknown>,
        })
      }

      // Fetch products with their PIM mappings
      const products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          pimMapping: {
            select: {
              akeneoProductId: true,
            },
          },
        },
      })

      // Only include products that have Akeneo mappings
      productsToSync = products
        .filter((p) => p.pimMapping?.akeneoProductId)
        .map((p) => ({
          id: p.id,
          akeneoProductId: p.pimMapping!.akeneoProductId,
        }))

      // Update count to reflect only syncable products
      count = productsToSync.length

      if (count === 0) {
        return NextResponse.json<SyncResponse>({
          success: true,
          message: 'No products with Akeneo mappings found matching criteria',
          estimatedProducts: 0,
          mode: 'filters',
          filters: filters as Record<string, unknown>,
        })
      }
    }

    // Dry run mode - return estimate without enqueueing
    if (dryRun) {
      return NextResponse.json<SyncResponse>({
        success: true,
        message: 'Dry run - no jobs enqueued',
        estimatedProducts: count,
        mode,
        ...(productIds && { productIds }),
        ...(filters && { filters: filters as Record<string, unknown> }),
      })
    }

    // Enqueue jobs
    const jobIds: string[] = []

    try {
      for (const product of productsToSync) {
        const operation = product.id ? 'UPDATE' : 'CREATE'

        const jobId = await enqueuePimSyncJob(
          product.akeneoProductId,
          operation,
          {
            triggeredBy: 'manual',
            adminUserId: context.adminSession.adminUser.id,
            ...(filters && { filters }),
          }
        )

        jobIds.push(jobId)
      }
    } catch (error) {
      console.error('[Admin PIM Sync] Queue error:', error)
      return NextResponse.json(
        {
          error: 'Failed to enqueue PIM sync jobs',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }

    // Audit logging (fire-and-forget)
    try {
      await logCreate(
        'pim_sync_manual',
        {
          mode,
          ...(productIds && { productIds }),
          ...(filters && { filters }),
          estimatedProducts: count,
          jobIds,
        },
        context.adminSession.adminUser,
        request
      )
    } catch (error) {
      console.error('[Admin PIM Sync] Audit log error:', error)
      // Don't fail the request if audit logging fails
    }

    // Success response
    return NextResponse.json<SyncResponse>({
      success: true,
      message: `PIM sync jobs queued for ${count.toLocaleString()} product${count !== 1 ? 's' : ''}`,
      jobIds,
      estimatedProducts: count,
      mode,
      queuedAt: new Date().toISOString(),
      ...(productIds && { productIds }),
      ...(filters && { filters: filters as Record<string, unknown> }),
    })
  } catch (error) {
    console.error('[Admin PIM Sync] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to queue PIM sync jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET Handler - Check PIM sync status
 *
 * @param request - Next.js request object
 * @param context - Context with adminSession (injected by withPermission middleware)
 * @returns JSON response with queue statistics and recent activity
 *
 * @example
 * GET /api/admin/pim/sync
 * Response:
 * {
 *   "success": true,
 *   "queueStats": {
 *     "pending": 15,
 *     "processing": 2,
 *     "failed": 1,
 *     "timestamp": 1701234567890
 *   },
 *   "recentActivity": [...]
 * }
 */
async function handleGET(
  request: NextRequest,
  context: { adminSession: { adminUser: { id: string } } }
) {
  try {
    // Get real-time queue statistics
    const stats = await getPimSyncStats()

    // Query recent sync activity
    const recentLogs = await prisma.pimSyncLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        operation: true,
        status: true,
        productId: true,
        duration: true,
        createdAt: true,
        error: true,
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    })

    // Success response
    return NextResponse.json<StatusResponse>({
      success: true,
      queueStats: {
        pending: stats.mainQueue,
        processing: stats.processingQueue,
        failed: stats.failedQueue,
        timestamp: stats.timestamp,
      },
      recentActivity: recentLogs,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Admin PIM Sync] Status check error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve sync status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Export handlers with permission middleware
export const POST = withPermission(Permission.PRODUCTS_WRITE, handlePOST)
export const GET = withPermission(Permission.PRODUCTS_WRITE, handleGET)

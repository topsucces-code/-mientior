/**
 * Admin API: Manual PIM Synchronization
 *
 * POST /api/admin/pim/sync
 * Manually trigger product synchronization from Akeneo PIM to Mientior.
 * Supports two modes: targeted sync (specific product IDs) or batch sync (filters).
 * Requires admin authentication with PRODUCTS_WRITE permission.
 *
 * @see src/lib/pim-sync-queue.ts - Queue operations
 * @see src/lib/pim-sync-worker.ts - Worker that processes jobs
 * @see src/app/api/admin/search/reindex/route.ts - Similar pattern for search reindex
 * @see src/app/api/admin/pim/sync/status/route.ts - Status endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { enqueuePimSyncJob } from '@/lib/pim-sync-queue'
import { logCreate } from '@/lib/audit-logger'
import { withPermission, type AuthenticatedApiHandler } from '@/middleware/admin-auth'
import { Permission } from '@/lib/permissions'

/**
 * Zod schema for POST /api/admin/pim/sync request validation
 * Enforces that exactly one of productIds or filters is provided
 */
const SyncRequestSchema = z
  .object({
    productIds: z
      .array(z.string())
      .min(1, 'productIds must be a non-empty array')
      .max(1000, 'Maximum 1000 products can be synced at once')
      .optional(),
    filters: z
      .object({
        categoryId: z.string().optional(),
        vendorId: z.string().optional(),
        status: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
      })
      .optional(),
    dryRun: z.boolean().optional(),
  })
  .refine((data) => (data.productIds && !data.filters) || (!data.productIds && data.filters), {
    message: 'Either productIds or filters must be provided (but not both)',
  })
  .refine(
    (data) => {
      if (data.filters) {
        return data.filters.categoryId || data.filters.vendorId || data.filters.status
      }
      return true
    },
    {
      message: 'At least one filter must be provided when using filters mode',
    }
  )

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
 * POST Handler - Trigger manual PIM synchronization
 *
 * @param request - Next.js request object
 * @param context - Context with params and adminSession (injected by withPermission middleware)
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
const handlePOST: AuthenticatedApiHandler = async (request, context) => {
  try {
    // Parse and validate request body with Zod
    const parseResult = SyncRequestSchema.safeParse(await request.json())

    if (!parseResult.success) {
      const errors = parseResult.error.flatten()
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: errors.formErrors.length > 0 ? errors.formErrors : errors.fieldErrors,
        },
        { status: 400 }
      )
    }

    const { productIds, filters, dryRun = false } = parseResult.data

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

// Export handler with permission middleware
export const POST = withPermission(Permission.PRODUCTS_WRITE, handlePOST)

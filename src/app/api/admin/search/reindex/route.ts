/**
 * Admin API endpoint for manual MeiliSearch reindexing
 * POST /api/admin/search/reindex
 */

import { NextRequest, NextResponse } from 'next/server'
import { Permission } from '@/lib/permissions'
import { withPermission } from '@/middleware/admin-auth'
import { type AdminSession } from '@/lib/auth-admin'
import { enqueueReindexJob } from '@/lib/search-queue'
import { isAvailable, ENABLE_MEILISEARCH } from '@/lib/meilisearch-client'
import { prisma } from '@/lib/prisma'
import { logCreate } from '@/lib/audit-logger'

interface ReindexRequestBody {
  filters?: {
    categoryId?: string
    vendorId?: string
    status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  }
  dryRun?: boolean
}

async function handlePOST(
  request: NextRequest,
  { adminSession }: { params?: unknown; adminSession?: AdminSession }
): Promise<NextResponse> {
  try {
    // Check if MeiliSearch is enabled
    if (!ENABLE_MEILISEARCH) {
      return NextResponse.json(
        { error: 'MeiliSearch indexing is disabled' },
        { status: 400 }
      )
    }

    // Check if MeiliSearch is available
    const available = await isAvailable()
    if (!available) {
      return NextResponse.json(
        { error: 'MeiliSearch is not available' },
        { status: 503 }
      )
    }

    // Parse request body
    const body = await request.json() as ReindexRequestBody
    const { filters, dryRun = false } = body

    // Build where clause for count query
    const where: any = {}
    if (filters?.categoryId) where.categoryId = filters.categoryId
    if (filters?.vendorId) where.vendorId = filters.vendorId
    if (filters?.status) where.status = filters.status

    // Get count of products to be reindexed
    const estimatedProducts = await prisma.product.count({ where })

    if (estimatedProducts === 0) {
      return NextResponse.json({
        success: true,
        message: 'No products found matching the specified filters',
        estimatedProducts: 0,
      })
    }

    // If dry run, return count without indexing
    if (dryRun) {
      return NextResponse.json({
        success: true,
        message: 'Dry run - no indexing performed',
        estimatedProducts,
        filters: filters || {},
      })
    }

    // Enqueue reindex job
    const jobId = await enqueueReindexJob(filters)

    // Audit log the reindex action
    if (adminSession?.adminUser) {
      await logCreate(
        'search_reindex',
        { filters, estimatedProducts, jobId },
        adminSession.adminUser as unknown as import('@prisma/client').AdminUser,
        request
      )
    }

    return NextResponse.json({
      success: true,
      message: `Reindex job queued for ${estimatedProducts.toLocaleString()} products`,
      jobId,
      estimatedProducts,
      filters: filters || {},
      queuedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Admin] Reindex error:', error)
    return NextResponse.json(
      { error: 'Failed to queue reindex job' },
      { status: 500 }
    )
  }
}

// Export with admin permission check
export const POST = withPermission(Permission.PRODUCTS_READ, handlePOST)

/**
 * Admin API: PIM Sync Status Check
 *
 * GET /api/admin/pim/sync/status
 * Check current PIM sync queue status and recent activity.
 * Returns real-time queue statistics and last 10 sync operations.
 * Requires admin authentication with PRODUCTS_WRITE permission.
 *
 * @see src/lib/pim-sync-queue.ts - Queue operations
 * @see src/lib/pim-sync-worker.ts - Worker that processes jobs
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPimSyncStats } from '@/lib/pim-sync-queue'
import { withPermission, type AuthenticatedApiHandler } from '@/middleware/admin-auth'
import { Permission } from '@/lib/permissions'

/**
 * Response for GET /api/admin/pim/sync/status
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
 * GET Handler - Check PIM sync status
 *
 * @param request - Next.js request object
 * @param context - Context with params and adminSession (injected by withPermission middleware)
 * @returns JSON response with queue statistics and recent activity
 *
 * @example
 * GET /api/admin/pim/sync/status
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
const handleGET: AuthenticatedApiHandler = async (request, context) => {
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
    console.error('[Admin PIM Sync Status] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve sync status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Export handler with permission middleware
export const GET = withPermission(Permission.PRODUCTS_WRITE, handleGET)

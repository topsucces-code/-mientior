/**
 * REST API endpoint for PIM sync statistics (Admin)
 *
 * GET /api/admin/pim/stats - Aggregate statistics for sync operations
 *
 * Returns comprehensive statistics including:
 * - sync: Total, success, failed, partial, pending counts and success rate
 * - performance: Average sync duration
 * - operations: Breakdown by operation type (CREATE, UPDATE, DELETE)
 * - queue: Current queue statistics from Redis
 * - recentFailures: Last 5 failed sync attempts with product info
 */

import { NextRequest, NextResponse } from 'next/server';
import { PimSyncStatus, PimSyncOperation } from '@prisma/client';
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';
import { getPimSyncStats } from '@/lib/pim-sync-queue';
import type { AdminSession } from '@/middleware/admin-auth';

/**
 * Handler for PIM sync statistics aggregation.
 *
 * Returns comprehensive statistics including:
 * - sync: Total, success, failed, partial, pending counts and success rate
 * - performance: Average sync duration
 * - operations: Breakdown by operation type (CREATE, UPDATE, DELETE)
 * - queue: Current queue statistics from Redis
 * - recentFailures: Last 5 failed sync attempts with product info
 *
 * @returns JSON object with structured statistics
 */
async function handleGET(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: AdminSession }
): Promise<NextResponse> {
  try {
    // Execute all queries in parallel for better performance
    const [
      totalCount,
      successCount,
      failedCount,
      partialCount,
      pendingCount,
      avgDuration,
      createCount,
      updateCount,
      deleteCount,
      queueStats,
      recentFailures,
    ] = await Promise.all([
      // Total synced count
      prisma.pimSyncLog.count(),

      // Success count
      prisma.pimSyncLog.count({ where: { status: PimSyncStatus.SUCCESS } }),

      // Failed count
      prisma.pimSyncLog.count({ where: { status: PimSyncStatus.FAILED } }),

      // Partial count
      prisma.pimSyncLog.count({ where: { status: PimSyncStatus.PARTIAL } }),

      // Pending count
      prisma.pimSyncLog.count({ where: { status: PimSyncStatus.PENDING } }),

      // Average duration
      prisma.pimSyncLog.aggregate({
        _avg: { duration: true },
        where: { duration: { not: null } },
      }),

      // Operation breakdown - CREATE
      prisma.pimSyncLog.count({ where: { operation: PimSyncOperation.CREATE } }),

      // Operation breakdown - UPDATE
      prisma.pimSyncLog.count({ where: { operation: PimSyncOperation.UPDATE } }),

      // Operation breakdown - DELETE
      prisma.pimSyncLog.count({ where: { operation: PimSyncOperation.DELETE } }),

      // Queue stats from Redis
      getPimSyncStats(),

      // Recent failed logs
      prisma.pimSyncLog.findMany({
        where: { status: PimSyncStatus.FAILED },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    // Calculate success rate
    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

    // Construct structured response
    const stats = {
      sync: {
        total: totalCount,
        success: successCount,
        failed: failedCount,
        partial: partialCount,
        pending: pendingCount,
        successRate: Math.round(successRate * 100) / 100, // Round to 2 decimals
      },
      performance: {
        averageDuration: avgDuration._avg.duration || 0,
      },
      operations: {
        create: createCount,
        update: updateCount,
        delete: deleteCount,
      },
      queue: {
        mainQueue: queueStats.mainQueue,
        processingQueue: queueStats.processingQueue,
        failedQueue: queueStats.failedQueue,
        timestamp: queueStats.timestamp,
      },
      recentFailures: recentFailures.map((log) => ({
        id: log.id,
        akeneoProductId: log.akeneoProductId,
        operation: log.operation,
        source: log.source,
        errorMessage: log.errorMessage,
        createdAt: log.createdAt,
        product: log.product,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('[PIM Stats]', error);
    return NextResponse.json(
      { error: 'Failed to fetch PIM sync statistics' },
      { status: 500 }
    );
  }
}

// Export wrapped handler with permission check
export const GET = withPermission(Permission.DASHBOARD_READ, handleGET);

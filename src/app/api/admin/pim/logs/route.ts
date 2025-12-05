/**
 * REST API endpoint for PIM sync logs (Admin)
 *
 * GET /api/admin/pim/logs - List sync logs with pagination, filtering, and sorting
 *
 * Supports filtering by status, operation, source, and date range.
 * Returns Refine-compatible pagination with X-Total-Count header.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma, PimSyncStatus, PimSyncOperation } from '@prisma/client';
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';
import type { AdminSession } from '@/middleware/admin-auth';

/**
 * Handler for listing PIM sync logs with pagination and filtering.
 *
 * Query Parameters:
 * - _start: Starting index for pagination (default: 0)
 * - _end: Ending index for pagination (default: 10)
 * - _sort: Field to sort by (default: 'createdAt')
 * - _order: Sort direction 'asc' or 'desc' (default: 'desc')
 * - status: Filter by PimSyncStatus (SUCCESS, FAILED, PENDING, PARTIAL)
 * - operation: Filter by PimSyncOperation (CREATE, UPDATE, DELETE)
 * - source: Filter by source string
 * - startDate: Filter by created date >= startDate (ISO string)
 * - endDate: Filter by created date <= endDate (ISO string)
 *
 * @returns JSON array of sync logs with X-Total-Count header
 */
async function handleGETLogs(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: AdminSession }
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination parameters (Refine uses _start and _end)
    const _start = parseInt(searchParams.get('_start') || '0');
    const _end = parseInt(searchParams.get('_end') || '10');
    const skip = _start;
    const take = _end - _start;

    // Sorting parameters
    const _sort = searchParams.get('_sort') || 'createdAt';
    const _order = searchParams.get('_order') || 'desc';

    // Build where clause for filtering
    const where: Prisma.PimSyncLogWhereInput = {};

    // Filter by status
    const status = searchParams.get('status');
    if (status) {
      // Validate status is a valid PimSyncStatus enum value
      if (Object.values(PimSyncStatus).includes(status as PimSyncStatus)) {
        where.status = status as PimSyncStatus;
      } else {
        return NextResponse.json(
          { error: `Invalid status value: ${status}` },
          { status: 400 }
        );
      }
    }

    // Filter by operation
    const operation = searchParams.get('operation');
    if (operation) {
      // Validate operation is a valid PimSyncOperation enum value
      if (Object.values(PimSyncOperation).includes(operation as PimSyncOperation)) {
        where.operation = operation as PimSyncOperation;
      } else {
        return NextResponse.json(
          { error: `Invalid operation value: ${operation}` },
          { status: 400 }
        );
      }
    }

    // Filter by source
    const source = searchParams.get('source');
    if (source) {
      where.source = source;
    }

    // Filter by date range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return NextResponse.json(
            { error: `Invalid startDate format: ${startDate}` },
            { status: 400 }
          );
        }
        where.createdAt.gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return NextResponse.json(
            { error: `Invalid endDate format: ${endDate}` },
            { status: 400 }
          );
        }
        where.createdAt.lte = end;
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.PimSyncLogOrderByWithRelationInput = {
      [_sort]: _order as 'asc' | 'desc',
    };

    // Fetch PIM sync logs with product relations
    const [logs, totalCount] = await Promise.all([
      prisma.pimSyncLog.findMany({
        skip,
        take,
        where,
        orderBy,
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
      prisma.pimSyncLog.count({ where }),
    ]);

    return NextResponse.json(logs, {
      headers: {
        'X-Total-Count': totalCount.toString(),
      },
    });
  } catch (error) {
    console.error('[PIM Logs]', error);
    return NextResponse.json(
      { error: 'Failed to fetch PIM sync logs' },
      { status: 500 }
    );
  }
}

// Export wrapped handler with permission check
export const GET = withPermission(Permission.DASHBOARD_READ, handleGETLogs);

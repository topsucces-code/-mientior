/**
 * REST API endpoint for audit logs (Admin)
 * Supports pagination, filtering by resource, action, adminUserId, date range
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@/lib/permissions';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';

async function handleGET(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: any }
) {
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
    const where: Prisma.AuditLogWhereInput = {};

    // Filter by resource
    const resource = searchParams.get('resource');
    if (resource) {
      where.resource = resource;
    }

    // Filter by action
    const action = searchParams.get('action');
    if (action) {
      where.action = action;
    }

    // Filter by adminUserId
    const adminUserId = searchParams.get('adminUserId');
    if (adminUserId) {
      where.adminUserId = adminUserId;
    }

    // Filter by resourceId
    const resourceId = searchParams.get('resourceId');
    if (resourceId) {
      where.resourceId = resourceId;
    }

    // Filter by date range
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {
      [_sort]: _order as 'asc' | 'desc',
    };

    // Fetch audit logs with relations
    const [auditLogs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          adminUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json(auditLogs, {
      headers: {
        'X-Total-Count': totalCount.toString(),
      },
    });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// Export wrapped handler
export const GET = withPermission(Permission.AUDIT_LOGS_READ, handleGET);

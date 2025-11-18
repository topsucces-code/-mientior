import { prisma } from '@/lib/prisma';
import { AdminUser } from '@prisma/client';
import { NextRequest } from 'next/server';

export interface AuditLogParams {
  action: string;
  resource: string;
  resourceId?: string;
  adminUserId?: string;
  metadata?: Record<string, any>;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Extract client information from a Next.js request
 */
export function getClientInfo(request: NextRequest): {
  ipAddress: string;
  userAgent: string;
} {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

/**
 * Log an action to the audit log
 */
export async function logAction(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        adminUserId: params.adminUserId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata as any,
        changes: params.changes as any,
      },
    });
  } catch (error) {
    // Log error but don't throw to avoid breaking the main operation
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Log a create action
 */
export async function logCreate(
  resource: string,
  data: Record<string, any>,
  adminUser: AdminUser,
  request: NextRequest
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(request);

  await logAction({
    action: 'CREATE',
    resource,
    resourceId: data.id,
    adminUserId: adminUser.id,
    metadata: data,
    ipAddress,
    userAgent,
  });
}

/**
 * Log an update action with before/after diff
 */
export async function logUpdate(
  resource: string,
  id: string,
  before: Record<string, any>,
  after: Record<string, any>,
  adminUser: AdminUser,
  request: NextRequest
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(request);

  // Calculate the diff
  const changes = calculateDiff(before, after);

  await logAction({
    action: 'UPDATE',
    resource,
    resourceId: id,
    adminUserId: adminUser.id,
    changes: {
      before,
      after,
    },
    metadata: changes,
    ipAddress,
    userAgent,
  });
}

/**
 * Log a delete action
 */
export async function logDelete(
  resource: string,
  id: string,
  data: Record<string, any>,
  adminUser: AdminUser,
  request: NextRequest
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(request);

  await logAction({
    action: 'DELETE',
    resource,
    resourceId: id,
    adminUserId: adminUser.id,
    metadata: data,
    ipAddress,
    userAgent,
  });
}

/**
 * Log a bulk action
 */
export async function logBulkAction(
  resource: string,
  ids: string[],
  action: string,
  adminUser: AdminUser,
  request: NextRequest,
  metadata?: Record<string, any>
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(request);

  await logAction({
    action: `BULK_${action.toUpperCase()}`,
    resource,
    adminUserId: adminUser.id,
    metadata: {
      ids,
      count: ids.length,
      ...metadata,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Calculate the difference between two objects
 */
function calculateDiff(
  before: Record<string, any>,
  after: Record<string, any>
): Record<string, { before: any; after: any }> {
  const changes: Record<string, { before: any; after: any }> = {};

  // Check for changed or removed fields
  for (const key in before) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes[key] = {
        before: before[key],
        after: after[key],
      };
    }
  }

  // Check for new fields
  for (const key in after) {
    if (!(key in before)) {
      changes[key] = {
        before: undefined,
        after: after[key],
      };
    }
  }

  return changes;
}

/**
 * Log an export action
 */
export async function logExport(
  resource: string,
  format: string,
  count: number,
  adminUser: AdminUser,
  request: NextRequest,
  filters?: Record<string, any>
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(request);

  await logAction({
    action: 'EXPORT',
    resource,
    adminUserId: adminUser.id,
    metadata: {
      format,
      count,
      filters,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log an import action
 */
export async function logImport(
  resource: string,
  successCount: number,
  errorCount: number,
  adminUser: AdminUser,
  request: NextRequest
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(request);

  await logAction({
    action: 'IMPORT',
    resource,
    adminUserId: adminUser.id,
    metadata: {
      successCount,
      errorCount,
      totalCount: successCount + errorCount,
    },
    ipAddress,
    userAgent,
  });
}

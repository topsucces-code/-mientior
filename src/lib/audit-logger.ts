import { prisma } from '@/lib/prisma';
import { admin_users, Prisma } from '@prisma/client'
import { NextRequest } from 'next/server';

type AdminUser = admin_users;
type JsonValue = Prisma.JsonValue;

export interface AuditLogParams {
  action: string;
  resource: string;
  resourceId?: string;
  adminUserId?: string;
  metadata?: Record<string, JsonValue>;
  changes?: {
    before?: Record<string, JsonValue>;
    after?: Record<string, JsonValue>;
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
    // Verify adminUserId exists if provided
    let validAdminUserId = params.adminUserId;
    if (validAdminUserId) {
      const adminExists = await prisma.admin_users.findUnique({
        where: { id: validAdminUserId },
        select: { id: true },
      });
      if (!adminExists) {
        console.warn(`Audit log: adminUserId ${validAdminUserId} not found, logging without user reference`);
        validAdminUserId = undefined;
      }
    }

    await prisma.audit_logs.create({
      data: {
        id: crypto.randomUUID(),
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId,
        adminUserId: validAdminUserId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        metadata: params.metadata as Prisma.InputJsonValue,
        changes: params.changes as Prisma.InputJsonValue,
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
  data: Record<string, JsonValue>,
  adminUser: AdminUser,
  request: NextRequest
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(request);

  await logAction({
    action: 'CREATE',
    resource,
    resourceId: data.id as string | undefined,
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
  before: Record<string, JsonValue>,
  after: Record<string, JsonValue>,
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
  data: Record<string, JsonValue>,
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
  metadata?: Record<string, JsonValue>
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
  before: Record<string, JsonValue>,
  after: Record<string, JsonValue>
): Record<string, { before: JsonValue | null; after: JsonValue | null }> {
  const changes: Record<string, { before: JsonValue | null; after: JsonValue | null }> = {};

  // Check for changed or removed fields
  for (const key in before) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes[key] = {
        before: before[key] ?? null,
        after: after[key] ?? null,
      };
    }
  }

  // Check for new fields
  for (const key in after) {
    if (!(key in before)) {
      changes[key] = {
        before: null,
        after: after[key] ?? null,
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
  filters?: Record<string, JsonValue>
): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(request);

  await logAction({
    action: 'EXPORT',
    resource,
    adminUserId: adminUser.id,
    metadata: {
      format,
      count,
      ...(filters && { filters }),
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

/**
 * Alias for logAction for backward compatibility
 */
export const logAdminAction = logAction;
export const logAuditEvent = logAction;
export const logAuditAction = logAction;

import {
  getAdminSession,
  requireAdminAuth,
  requirePermission,
  requireRole,
  type AdminSession,
} from '@/lib/auth-admin';
import { logAction } from '@/lib/audit-logger';
import { Permission, Role } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export type ApiHandler = (
  request: NextRequest,
  context: { params: Record<string, string> }
) => Promise<NextResponse>;

export type AuthenticatedApiHandler = (
  request: NextRequest,
  context: { params: Record<string, string>; adminSession: AdminSession }
) => Promise<NextResponse>;

interface WithAdminAuthOptions {
  logAction?: boolean;
}

/**
 * Higher-order function that wraps an API route handler with admin authentication
 */
export function withAdminAuth(
  handler: AuthenticatedApiHandler,
  options: WithAdminAuthOptions = { logAction: true }
): ApiHandler {
  return async (request: NextRequest, context: { params: Record<string, string> }) => {
    try {
      const adminSession = await requireAdminAuth();

      // Optionally log the action
      if (options.logAction) {
        const { pathname } = new URL(request.url);
        const ipAddress =
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await logAction({
          action: request.method,
          resource: pathname,
          adminUserId: adminSession.adminUser.id,
          ipAddress,
          userAgent,
        });
      }

      return await handler(request, {
        ...context,
        adminSession,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          return NextResponse.json(
            { error: 'Unauthorized: Admin access required' },
            { status: 401 }
          );
        }
      }
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function that wraps an API route handler with permission check
 */
export function withPermission(
  permission: Permission,
  handler: AuthenticatedApiHandler,
  options: WithAdminAuthOptions = { logAction: true }
): ApiHandler {
  return async (request: NextRequest, context: { params: Record<string, string> }) => {
    try {
      const adminSession = await requirePermission(permission);

      // Optionally log the action
      if (options.logAction) {
        const { pathname } = new URL(request.url);
        const ipAddress =
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await logAction({
          action: request.method,
          resource: pathname,
          adminUserId: adminSession.adminUser.id,
          ipAddress,
          userAgent,
          metadata: {
            permission,
          },
        });
      }

      return await handler(request, {
        ...context,
        adminSession,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          return NextResponse.json(
            { error: 'Unauthorized: Admin access required' },
            { status: 401 }
          );
        }
        if (error.message.includes('Forbidden')) {
          return NextResponse.json(
            {
              error: `Forbidden: Missing permission ${permission}`,
            },
            { status: 403 }
          );
        }
      }
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Higher-order function that wraps an API route handler with role check
 */
export function withRole(
  minRole: Role,
  handler: AuthenticatedApiHandler,
  options: WithAdminAuthOptions = { logAction: true }
): ApiHandler {
  return async (request: NextRequest, context: { params: Record<string, string> }) => {
    try {
      const adminSession = await requireRole(minRole);

      // Optionally log the action
      if (options.logAction) {
        const { pathname } = new URL(request.url);
        const ipAddress =
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await logAction({
          action: request.method,
          resource: pathname,
          adminUserId: adminSession.adminUser.id,
          ipAddress,
          userAgent,
          metadata: {
            minRole,
          },
        });
      }

      return await handler(request, {
        ...context,
        adminSession,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          return NextResponse.json(
            { error: 'Unauthorized: Admin access required' },
            { status: 401 }
          );
        }
        if (error.message.includes('Forbidden')) {
          return NextResponse.json(
            {
              error: `Forbidden: Minimum role ${minRole} required`,
            },
            { status: 403 }
          );
        }
      }
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Get admin session without throwing errors
 * Useful for optional authentication
 */
export async function getOptionalAdminAuth(
  _request: NextRequest
): Promise<AdminSession | null> {
  try {
    return await getAdminSession();
  } catch (error) {
    return null;
  }
}

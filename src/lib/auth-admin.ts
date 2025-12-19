import { getSession } from '@/lib/auth-server';
import { type Session } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  // hasPermission, // Unused
  hasRoleHierarchy,
  getMergedPermissions,
} from '@/lib/rbac';
import { AdminUser, Role } from '@prisma/client';
import { Permission } from '@/lib/permissions';

export interface AdminSession extends Session {
  adminUser: AdminUser;
}

/**
 * Get the current admin session
 * Returns null if not authenticated or not an admin
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  // Log critical warning if SKIP_AUTH is set in production
  if (process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV === 'production') {
    console.error('🚨 CRITICAL SECURITY WARNING: SKIP_AUTH is enabled in production! This is a severe security vulnerability. Admin authentication bypass is DISABLED in production.');
  }

  // Bypass auth in development if SKIP_AUTH is set
  if (process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV === 'development') {
    return {
      user: {
        id: 'mock-admin-id',
        email: 'admin@mientior.com',
        name: 'Super Admin',
        image: null,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: 'mock-session-id',
        userId: 'mock-admin-id',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: 'mock-token',
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'MockAgent',
      },
      adminUser: {
        id: 'mock-admin-id',
        email: 'admin@mientior.com',
        firstName: 'Super',
        lastName: 'Admin',
        role: Role.SUPER_ADMIN,
        isActive: true,
        permissions: Object.values(Permission),
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        authUserId: 'mock-admin-id',
      }
    } as unknown as AdminSession;
  }

  try {
    const session = await getSession();
    if (!session || !session.user) {
      return null;
    }

    // Find admin user by email or authUserId
    const adminUser = await prisma.admin_users.findFirst({
      where: {
        OR: [
          { email: session.user.email },
          { authUserId: session.user.id },
        ],
      },
    });

    if (!adminUser || !adminUser.isActive) {
      return null;
    }

    // Update last login time only if it's been more than 5 minutes since last update
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    if (!adminUser.lastLoginAt || adminUser.lastLoginAt < fiveMinutesAgo) {
      // Update asynchronously without blocking
      prisma.admin_users.update({
        where: { id: adminUser.id },
        data: { lastLoginAt: now },
      }).catch(err => console.error('Failed to update lastLoginAt:', err));
    }

    return {
      ...session,
      adminUser,
    };
  } catch (error) {
    console.error('Error getting admin session:', error);
    return null;
  }
}

/**
 * Require admin authentication
 * Throws an error if not authenticated or not an admin
 */
export async function requireAdminAuth(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error('Unauthorized: Admin access required');
  }
  return session;
}

/**
 * Require a specific permission
 * Throws an error if the admin doesn't have the permission
 */
export async function requirePermission(
  permission: Permission
): Promise<AdminSession> {
  const session = await requireAdminAuth();

  const customPermissions = session.adminUser.permissions as Permission[] | null;
  const mergedPermissions = getMergedPermissions(
    session.adminUser.role,
    customPermissions || undefined
  );

  if (!mergedPermissions.includes(permission)) {
    throw new Error(`Forbidden: Missing permission ${permission}`);
  }

  return session;
}

/**
 * Require a minimum role
 * Throws an error if the admin doesn't have the required role level
 */
export async function requireRole(minRole: Role): Promise<AdminSession> {
  const session = await requireAdminAuth();

  if (!hasRoleHierarchy(session.adminUser.role, minRole)) {
    throw new Error(`Forbidden: Minimum role ${minRole} required`);
  }

  return session;
}

/**
 * Check if the current admin has a specific permission
 * Returns false if not authenticated or doesn't have permission
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return false;
    }

    const customPermissions = session.adminUser.permissions as Permission[] | null;
    const mergedPermissions = getMergedPermissions(
      session.adminUser.role,
      customPermissions || undefined
    );

    return mergedPermissions.includes(permission);
  } catch (error) {
    return false;
  }
}

/**
 * Check if the current admin has a minimum role
 * Returns false if not authenticated or doesn't have the role
 */
export async function checkRole(minRole: Role): Promise<boolean> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return false;
    }

    return hasRoleHierarchy(session.adminUser.role, minRole);
  } catch (error) {
    return false;
  }
}

/**
 * Get the current admin user's permissions
 * Returns empty array if not authenticated
 */
export async function getCurrentPermissions(): Promise<Permission[]> {
  try {
    const session = await getAdminSession();
    if (!session) {
      return [];
    }

    const customPermissions = session.adminUser.permissions as Permission[] | null;
    return getMergedPermissions(
      session.adminUser.role,
      customPermissions || undefined
    );
  } catch (error) {
    return [];
  }
}

import { Role, Permission } from '@prisma/client';

// Role hierarchy: higher roles inherit permissions from lower roles
export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 5,
  ADMIN: 4,
  MANAGER: 3,
  SUPPORT: 2,
  VIEWER: 1,
};

// Permission matrix: maps each role to its allowed permissions
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_WRITE,
    Permission.PRODUCTS_DELETE,
    Permission.ORDERS_READ,
    Permission.ORDERS_WRITE,
    Permission.ORDERS_DELETE,
    Permission.USERS_READ,
    Permission.USERS_WRITE,
    Permission.USERS_DELETE,
    Permission.CATEGORIES_READ,
    Permission.CATEGORIES_WRITE,
    Permission.CATEGORIES_DELETE,
    Permission.AUDIT_LOGS_READ,
    Permission.DASHBOARD_READ,
    Permission.SETTINGS_WRITE,
    Permission.VENDORS_READ,
    Permission.VENDORS_WRITE,
    Permission.VENDORS_DELETE,
    Permission.MARKETING_READ,
    Permission.MARKETING_WRITE,
    Permission.SEGMENTS_READ,
    Permission.SEGMENTS_WRITE,
  ],
  ADMIN: [
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_WRITE,
    Permission.PRODUCTS_DELETE,
    Permission.ORDERS_READ,
    Permission.ORDERS_WRITE,
    Permission.ORDERS_DELETE,
    Permission.USERS_READ,
    Permission.USERS_WRITE,
    Permission.CATEGORIES_READ,
    Permission.CATEGORIES_WRITE,
    Permission.CATEGORIES_DELETE,
    Permission.AUDIT_LOGS_READ,
    Permission.DASHBOARD_READ,
    Permission.VENDORS_READ,
    Permission.VENDORS_WRITE,
    Permission.MARKETING_READ,
    Permission.MARKETING_WRITE,
    Permission.SEGMENTS_READ,
    Permission.SEGMENTS_WRITE,
  ],
  MANAGER: [
    Permission.PRODUCTS_READ,
    Permission.PRODUCTS_WRITE,
    Permission.ORDERS_READ,
    Permission.ORDERS_WRITE,
    Permission.USERS_READ,
    Permission.CATEGORIES_READ,
    Permission.CATEGORIES_WRITE,
    Permission.DASHBOARD_READ,
    Permission.VENDORS_READ,
    Permission.MARKETING_READ,
    Permission.SEGMENTS_READ,
  ],
  SUPPORT: [
    Permission.PRODUCTS_READ,
    Permission.ORDERS_READ,
    Permission.ORDERS_WRITE,
    Permission.USERS_READ,
    Permission.CATEGORIES_READ,
    Permission.DASHBOARD_READ,
    Permission.VENDORS_READ,
  ],
  VIEWER: [
    Permission.PRODUCTS_READ,
    Permission.ORDERS_READ,
    Permission.USERS_READ,
    Permission.CATEGORIES_READ,
    Permission.DASHBOARD_READ,
  ],
};

// Resource to permission mapping
export const RESOURCE_PERMISSIONS: Record<
  string,
  { read: Permission; write: Permission; delete: Permission }
> = {
  products: {
    read: Permission.PRODUCTS_READ,
    write: Permission.PRODUCTS_WRITE,
    delete: Permission.PRODUCTS_DELETE,
  },
  orders: {
    read: Permission.ORDERS_READ,
    write: Permission.ORDERS_WRITE,
    delete: Permission.ORDERS_DELETE,
  },
  users: {
    read: Permission.USERS_READ,
    write: Permission.USERS_WRITE,
    delete: Permission.USERS_DELETE,
  },
  categories: {
    read: Permission.CATEGORIES_READ,
    write: Permission.CATEGORIES_WRITE,
    delete: Permission.CATEGORIES_DELETE,
  },
  'audit-logs': {
    read: Permission.AUDIT_LOGS_READ,
    write: Permission.AUDIT_LOGS_READ,
    delete: Permission.AUDIT_LOGS_READ,
  },
  dashboard: {
    read: Permission.DASHBOARD_READ,
    write: Permission.DASHBOARD_READ,
    delete: Permission.DASHBOARD_READ,
  },
  settings: {
    read: Permission.SETTINGS_WRITE,
    write: Permission.SETTINGS_WRITE,
    delete: Permission.SETTINGS_WRITE,
  },
  vendors: {
    read: Permission.VENDORS_READ,
    write: Permission.VENDORS_WRITE,
    delete: Permission.VENDORS_DELETE,
  },
  campaigns: {
    read: Permission.MARKETING_READ,
    write: Permission.MARKETING_WRITE,
    delete: Permission.MARKETING_WRITE,
  },
  'promo-codes': {
    read: Permission.MARKETING_READ,
    write: Permission.MARKETING_WRITE,
    delete: Permission.MARKETING_WRITE,
  },
  segments: {
    read: Permission.SEGMENTS_READ,
    write: Permission.SEGMENTS_WRITE,
    delete: Permission.SEGMENTS_WRITE,
  },
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a role can access a resource with a specific action
 */
export function canAccessResource(
  role: Role,
  resource: string,
  action: 'read' | 'write' | 'delete'
): boolean {
  const resourcePermissions = RESOURCE_PERMISSIONS[resource];
  if (!resourcePermissions) {
    return false;
  }

  const requiredPermission = resourcePermissions[action];
  return hasPermission(role, requiredPermission);
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role has a higher or equal hierarchy level than another role
 */
export function hasRoleHierarchy(
  userRole: Role,
  requiredRole: Role
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Type guard for Role
 */
export function isValidRole(role: string): role is Role {
  return Object.keys(ROLE_HIERARCHY).includes(role);
}

/**
 * Type guard for Permission
 */
export function isValidPermission(permission: string): permission is Permission {
  return Object.values(ROLE_PERMISSIONS)
    .flat()
    .includes(permission as Permission);
}

/**
 * Get custom permissions from JSON field (merged with role permissions)
 */
export function getMergedPermissions(
  role: Role,
  customPermissions?: Permission[]
): Permission[] {
  const rolePermissions = getPermissionsForRole(role);
  if (!customPermissions || customPermissions.length === 0) {
    return rolePermissions;
  }

  // Merge and deduplicate
  return [...new Set([...rolePermissions, ...customPermissions])];
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  role: Role,
  permissions: Permission[],
  customPermissions?: Permission[]
): boolean {
  const mergedPermissions = getMergedPermissions(role, customPermissions);
  return permissions.some((p) => mergedPermissions.includes(p));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  role: Role,
  permissions: Permission[],
  customPermissions?: Permission[]
): boolean {
  const mergedPermissions = getMergedPermissions(role, customPermissions);
  return permissions.every((p) => mergedPermissions.includes(p));
}

// Export constants
export const ROLES = Object.keys(ROLE_HIERARCHY) as Role[];
export const PERMISSIONS = [...new Set(Object.values(ROLE_PERMISSIONS).flat())] as Permission[];

/**
 * Get all roles that have a specific permission
 */
export function getRolesWithPermission(permission: Permission): Role[] {
  return ROLES.filter((role) => hasPermission(role, permission));
}

/**
 * Check if a role has minimum role requirement
 */
export function hasMinimumRole(currentRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[currentRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Assert a permission is valid (throws if not)
 */
export function assertPermission(permission: string): asserts permission is Permission {
  if (!isValidPermission(permission)) {
    throw new Error(`Invalid permission: ${permission}`);
  }
}

/**
 * Assert a role is valid (throws if not)
 */
export function assertRole(role: string): asserts role is Role {
  if (!isValidRole(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
}

/**
 * Get a human-readable description for a permission
 */
export function getPermissionDescription(permission: Permission): string {
  const descriptions: Record<Permission, string> = {
    [Permission.PRODUCTS_READ]: 'View products',
    [Permission.PRODUCTS_WRITE]: 'Create and edit products',
    [Permission.PRODUCTS_DELETE]: 'Delete products',
    [Permission.ORDERS_READ]: 'View orders',
    [Permission.ORDERS_WRITE]: 'Create and edit orders',
    [Permission.ORDERS_DELETE]: 'Delete orders',
    [Permission.USERS_READ]: 'View users',
    [Permission.USERS_WRITE]: 'Create and edit users',
    [Permission.USERS_DELETE]: 'Delete users',
    [Permission.CATEGORIES_READ]: 'View categories',
    [Permission.CATEGORIES_WRITE]: 'Create and edit categories',
    [Permission.CATEGORIES_DELETE]: 'Delete categories',
    [Permission.AUDIT_LOGS_READ]: 'View audit logs',
    [Permission.DASHBOARD_READ]: 'View dashboard',
    [Permission.SETTINGS_WRITE]: 'Manage settings and admin users',
    [Permission.VENDORS_READ]: 'View vendors',
    [Permission.VENDORS_WRITE]: 'Create and edit vendors',
    [Permission.VENDORS_DELETE]: 'Delete vendors',
    [Permission.MARKETING_READ]: 'View marketing campaigns and promotions',
    [Permission.MARKETING_WRITE]: 'Create and edit marketing campaigns',
    [Permission.SEGMENTS_READ]: 'View customer segments',
    [Permission.SEGMENTS_WRITE]: 'Create and edit customer segments',
  };

  return descriptions[permission] || permission;
}

/**
 * Get a human-readable description for a role
 */
export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    [Role.SUPER_ADMIN]: 'Full system access including user management',
    [Role.ADMIN]: 'Full access to products, orders, and users',
    [Role.MANAGER]: 'Manage products, orders, and categories',
    [Role.SUPPORT]: 'Handle customer orders and support requests',
    [Role.VIEWER]: 'Read-only access to all resources',
  };

  return descriptions[role] || role;
}

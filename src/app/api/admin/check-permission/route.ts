/**
 * API endpoint to check user permissions for access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkPermission } from '@/lib/auth-admin';
import { Permission } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resource, action } = body;

    // Map Refine actions to permissions
    const permissionMap: Record<string, Partial<Record<string, Permission>>> = {
      products: {
        list: Permission.PRODUCTS_READ,
        show: Permission.PRODUCTS_READ,
        create: Permission.PRODUCTS_WRITE,
        edit: Permission.PRODUCTS_WRITE,
        delete: Permission.PRODUCTS_DELETE,
      },
      categories: {
        list: Permission.CATEGORIES_READ,
        show: Permission.CATEGORIES_READ,
        create: Permission.CATEGORIES_WRITE,
        edit: Permission.CATEGORIES_WRITE,
        delete: Permission.CATEGORIES_DELETE,
      },
      orders: {
        list: Permission.ORDERS_READ,
        show: Permission.ORDERS_READ,
        edit: Permission.ORDERS_WRITE,
      },
      users: {
        list: Permission.USERS_READ,
        show: Permission.USERS_READ,
        edit: Permission.USERS_WRITE,
      },
      'audit-logs': {
        list: Permission.AUDIT_LOGS_READ,
        show: Permission.AUDIT_LOGS_READ,
      },
      dashboard: {
        list: Permission.DASHBOARD_READ,
      },
      settings: {
        list: Permission.SETTINGS_WRITE,
        edit: Permission.SETTINGS_WRITE,
      },
      roles: {
        list: Permission.SETTINGS_WRITE,
        show: Permission.SETTINGS_WRITE,
        edit: Permission.SETTINGS_WRITE,
      },
      'feature-flags': {
        list: Permission.SETTINGS_WRITE,
        edit: Permission.SETTINGS_WRITE,
      },
    };

    const permission = permissionMap[resource]?.[action];
    
    // If no specific permission required, allow access
    if (!permission) {
      return NextResponse.json({ can: true });
    }

    // Check permission server-side
    const can = await checkPermission(permission);
    
    return NextResponse.json({ can });
  } catch (error) {
    console.error('Permission check error:', error);
    return NextResponse.json({ can: false }, { status: 500 });
  }
}

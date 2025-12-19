/**
 * REST API endpoint for admin user roles (Admin)
 * GET: List all admin users with optional role filtering
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

    // Pagination parameters
    const _start = parseInt(searchParams.get('_start') || '0');
    const _end = parseInt(searchParams.get('_end') || '10');
    const skip = _start;
    const take = _end - _start;

    // Sorting parameters
    const _sort = searchParams.get('_sort') || 'createdAt';
    const _order = searchParams.get('_order') || 'desc';

    // Build where clause for filtering
    const where: Prisma.AdminUserWhereInput = {};

    // Filter by role
    const role = searchParams.get('role');
    if (role) {
      where.role = role as any;
    }

    // Filter by isActive
    const isActive = searchParams.get('isActive');
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Filter by email (search)
    const email_like = searchParams.get('email_like');
    if (email_like) {
      where.email = {
        contains: email_like,
        mode: 'insensitive',
      };
    }

    // Build orderBy clause
    const orderBy: Prisma.AdminUserOrderByWithRelationInput = {
      [_sort]: _order as 'asc' | 'desc',
    };

    // Fetch admin users
    const [adminUsers, totalCount] = await Promise.all([
      prisma.admin_users.findMany({
        skip,
        take,
        where,
        orderBy,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          permissions: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.admin_users.count({ where }),
    ]);

    return NextResponse.json(adminUsers, {
      headers: {
        'X-Total-Count': totalCount.toString(),
      },
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin users' },
      { status: 500 }
    );
  }
}

// Export wrapped handler
export const GET = withPermission(Permission.USERS_READ, handleGET);

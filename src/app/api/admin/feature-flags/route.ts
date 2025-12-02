/**
 * REST API endpoint for feature flags (Admin)
 * GET: List all feature flags
 * POST: Create new feature flag
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@/lib/permissions';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withAdminAuth, withPermission } from '@/middleware/admin-auth';
import { logCreate } from '@/lib/audit-logger';

async function handleGET(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: any }
) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const _start = parseInt(searchParams.get('_start') || '0');
    const _end = parseInt(searchParams.get('_end') || '20');
    const skip = _start;
    const take = _end - _start;

    // Sorting parameters
    const _sort = searchParams.get('_sort') || 'createdAt';
    const _order = searchParams.get('_order') || 'desc';

    // Build where clause for filtering
    const where: Prisma.FeatureFlagWhereInput = {};

    // Filter by enabled status
    const enabled = searchParams.get('enabled');
    if (enabled !== null && enabled !== undefined) {
      where.enabled = enabled === 'true';
    }

    // Filter by key (search)
    const key_like = searchParams.get('key_like');
    if (key_like) {
      where.key = {
        contains: key_like,
        mode: 'insensitive',
      };
    }

    // Build orderBy clause
    const orderBy: Prisma.FeatureFlagOrderByWithRelationInput = {
      [_sort]: _order as 'asc' | 'desc',
    };

    // Fetch feature flags
    const [featureFlags, totalCount] = await Promise.all([
      prisma.featureFlag.findMany({
        skip,
        take,
        where,
        orderBy,
        select: {
          id: true,
          key: true,
          name: true,
          description: true,
          enabled: true,
          roles: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.featureFlag.count({ where }),
    ]);

    return NextResponse.json(featureFlags, {
      headers: {
        'X-Total-Count': totalCount.toString(),
      },
    });
  } catch (error) {
    console.error('Feature flags fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

async function handlePOST(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: any }
) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.key || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: key, name' },
        { status: 400 }
      );
    }

    // Create feature flag
    const featureFlag = await prisma.featureFlag.create({
      data: {
        key: body.key,
        name: body.name,
        description: body.description || null,
        enabled: body.enabled || false,
        roles: body.roles || null,
      },
      select: {
        id: true,
        key: true,
        name: true,
        description: true,
        enabled: true,
        roles: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log feature flag creation
    await logCreate(
      'featureFlag',
      featureFlag,
      adminSession.adminUser,
      request
    );

    return NextResponse.json(featureFlag, { status: 201 });
  } catch (error) {
    console.error('Feature flag creation error:', error);

    // Handle unique constraint violation
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'A feature flag with this key already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create feature flag' },
      { status: 500 }
    );
  }
}

// Export wrapped handlers
export const GET = withAdminAuth(handleGET);
export const POST = withPermission(Permission.SETTINGS_WRITE, handlePOST);

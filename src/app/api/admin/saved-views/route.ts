/**
 * REST API endpoint for saved views (Admin)
 * GET: List user's saved views for a resource
 * POST: Create new saved view
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/middleware/admin-auth';
import { logCreate } from '@/lib/audit-logger';

async function handleGET(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: any }
) {
  try {
    const { searchParams } = new URL(request.url);

    // Build where clause - filter by resource and adminUserId
    const where: Prisma.SavedViewWhereInput = {
      adminUserId: adminSession.adminUser.id,
    };

    // Filter by resource (required for listing)
    const resource = searchParams.get('resource');
    if (resource) {
      where.resource = resource;
    }

    // Fetch saved views
    const savedViews = await prisma.savedView.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        resource: true,
        filters: true,
        sorting: true,
        columns: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(savedViews, {
      headers: {
        'X-Total-Count': savedViews.length.toString(),
      },
    });
  } catch (error) {
    console.error('Saved views fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved views' },
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
    if (!body.name || !body.resource) {
      return NextResponse.json(
        { error: 'Missing required fields: name, resource' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults for this resource
    if (body.isDefault) {
      await prisma.savedView.updateMany({
        where: {
          adminUserId: adminSession.adminUser.id,
          resource: body.resource,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Create saved view
    const savedView = await prisma.savedView.create({
      data: {
        name: body.name,
        resource: body.resource,
        filters: body.filters || null,
        sorting: body.sorting || null,
        columns: body.columns || null,
        isDefault: body.isDefault || false,
        adminUserId: adminSession.adminUser.id,
      },
      select: {
        id: true,
        name: true,
        resource: true,
        filters: true,
        sorting: true,
        columns: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log saved view creation
    await logCreate({
      resource: 'savedView',
      resourceId: savedView.id,
      after: savedView,
      adminUser: adminSession.adminUser,
      request,
    });

    return NextResponse.json(savedView, { status: 201 });
  } catch (error) {
    console.error('Saved view creation error:', error);

    // Handle unique constraint violation
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'A saved view with this name already exists for this resource' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create saved view' },
      { status: 500 }
    );
  }
}

// Export wrapped handlers
export const GET = withAdminAuth(handleGET);
export const POST = withAdminAuth(handlePOST);

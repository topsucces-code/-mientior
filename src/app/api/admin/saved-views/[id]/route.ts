/**
 * REST API endpoint for individual saved view management (Admin)
 * GET: Get single saved view
 * PUT: Update saved view
 * DELETE: Delete saved view
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/middleware/admin-auth';
import { logUpdate, logDelete } from '@/lib/audit-logger';

async function handleGET(
  request: NextRequest,
  { params, adminSession }: { params: { id: string }; adminSession: any }
) {
  try {
    const { id } = params;

    const savedView = await prisma.savedView.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        resource: true,
        filters: true,
        sorting: true,
        columns: true,
        isDefault: true,
        adminUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!savedView) {
      return NextResponse.json(
        { error: 'Saved view not found' },
        { status: 404 }
      );
    }

    // Only allow users to access their own saved views
    if (savedView.adminUserId !== adminSession.adminUser.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only access your own saved views' },
        { status: 403 }
      );
    }

    return NextResponse.json(savedView);
  } catch (error) {
    console.error('Saved view fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved view' },
      { status: 500 }
    );
  }
}

async function handlePUT(
  request: NextRequest,
  { params, adminSession }: { params: { id: string }; adminSession: any }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Fetch existing saved view
    const existingSavedView = await prisma.savedView.findUnique({
      where: { id },
    });

    if (!existingSavedView) {
      return NextResponse.json(
        { error: 'Saved view not found' },
        { status: 404 }
      );
    }

    // Only allow users to update their own saved views
    if (existingSavedView.adminUserId !== adminSession.adminUser.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own saved views' },
        { status: 403 }
      );
    }

    // If setting as default, unset other defaults for this resource
    if (body.isDefault && !existingSavedView.isDefault) {
      await prisma.savedView.updateMany({
        where: {
          adminUserId: adminSession.adminUser.id,
          resource: existingSavedView.resource,
          id: { not: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Prepare update data
    const updateData: any = {};

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.filters !== undefined) {
      updateData.filters = body.filters;
    }

    if (body.sorting !== undefined) {
      updateData.sorting = body.sorting;
    }

    if (body.columns !== undefined) {
      updateData.columns = body.columns;
    }

    if (body.isDefault !== undefined) {
      updateData.isDefault = body.isDefault;
    }

    // Update saved view
    const updatedSavedView = await prisma.savedView.update({
      where: { id },
      data: updateData,
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

    // Log the update
    await logUpdate({
      resource: 'savedView',
      resourceId: id,
      before: existingSavedView,
      after: updatedSavedView,
      adminUser: adminSession.adminUser,
      request,
    });

    return NextResponse.json(updatedSavedView);
  } catch (error) {
    console.error('Saved view update error:', error);

    // Handle unique constraint violation
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'A saved view with this name already exists for this resource' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update saved view' },
      { status: 500 }
    );
  }
}

async function handleDELETE(
  request: NextRequest,
  { params, adminSession }: { params: { id: string }; adminSession: any }
) {
  try {
    const { id } = params;

    // Fetch existing saved view
    const existingSavedView = await prisma.savedView.findUnique({
      where: { id },
    });

    if (!existingSavedView) {
      return NextResponse.json(
        { error: 'Saved view not found' },
        { status: 404 }
      );
    }

    // Only allow users to delete their own saved views
    if (existingSavedView.adminUserId !== adminSession.adminUser.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own saved views' },
        { status: 403 }
      );
    }

    // Delete saved view
    await prisma.savedView.delete({
      where: { id },
    });

    // Log the deletion
    await logDelete({
      resource: 'savedView',
      resourceId: id,
      before: existingSavedView,
      adminUser: adminSession.adminUser,
      request,
    });

    return NextResponse.json({ message: 'Saved view deleted successfully' });
  } catch (error) {
    console.error('Saved view deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved view' },
      { status: 500 }
    );
  }
}

// Export wrapped handlers
export const GET = withAdminAuth(handleGET);
export const PUT = withAdminAuth(handlePUT);
export const DELETE = withAdminAuth(handleDELETE);

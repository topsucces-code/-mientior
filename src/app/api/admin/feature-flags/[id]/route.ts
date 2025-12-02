/**
 * REST API endpoint for individual feature flag management (Admin)
 * GET: Get single feature flag
 * PUT: Update feature flag
 * DELETE: Delete feature flag
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withPermission, withAdminAuth } from '@/middleware/admin-auth';
import { logUpdate, logDelete } from '@/lib/audit-logger';

async function handleGET(
  request: NextRequest,
  { params, adminSession }: { params: { id: string }; adminSession: any }
) {
  try {
    const { id } = params;

    const featureFlag = await prisma.featureFlag.findUnique({
      where: { id },
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

    if (!featureFlag) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(featureFlag);
  } catch (error) {
    console.error('Feature flag fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flag' },
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

    // Fetch existing feature flag for audit log
    const existingFeatureFlag = await prisma.featureFlag.findUnique({
      where: { id },
    });

    if (!existingFeatureFlag) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (body.key !== undefined) {
      updateData.key = body.key;
    }

    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    if (body.enabled !== undefined) {
      updateData.enabled = body.enabled;
    }

    if (body.roles !== undefined) {
      updateData.roles = body.roles;
    }

    // Update feature flag
    const updatedFeatureFlag = await prisma.featureFlag.update({
      where: { id },
      data: updateData,
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

    // Log the update
    await logUpdate({
      resource: 'featureFlag',
      resourceId: id,
      before: existingFeatureFlag,
      after: updatedFeatureFlag,
      adminUser: adminSession.adminUser,
      request,
    });

    return NextResponse.json(updatedFeatureFlag);
  } catch (error) {
    console.error('Feature flag update error:', error);

    // Handle unique constraint violation
    if ((error as any).code === 'P2002') {
      return NextResponse.json(
        { error: 'A feature flag with this key already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update feature flag' },
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

    // Fetch existing feature flag for audit log
    const existingFeatureFlag = await prisma.featureFlag.findUnique({
      where: { id },
    });

    if (!existingFeatureFlag) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      );
    }

    // Delete feature flag
    await prisma.featureFlag.delete({
      where: { id },
    });

    // Log the deletion
    await logDelete({
      resource: 'featureFlag',
      resourceId: id,
      before: existingFeatureFlag,
      adminUser: adminSession.adminUser,
      request,
    });

    return NextResponse.json({ message: 'Feature flag deleted successfully' });
  } catch (error) {
    console.error('Feature flag deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete feature flag' },
      { status: 500 }
    );
  }
}

// Export wrapped handlers
export const GET = withAdminAuth(handleGET);
export const PUT = withPermission(Permission.SETTINGS_WRITE, handlePUT);
export const DELETE = withPermission(Permission.SETTINGS_WRITE, handleDELETE);

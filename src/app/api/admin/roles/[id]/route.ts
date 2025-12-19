/**
 * REST API endpoint for individual admin user role management (Admin)
 * GET: Get single admin user
 * PUT: Update admin user role and permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';
import { logUpdate } from '@/lib/audit-logger';

async function handleGET(
  request: NextRequest,
  { params, adminSession }: { params: { id: string }; adminSession: any }
) {
  try {
    const { id } = params;

    const adminUser = await prisma.admin_users.findUnique({
      where: { id },
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
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(adminUser);
  } catch (error) {
    console.error('Admin user fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin user' },
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

    // Fetch existing admin user for audit log
    const existingAdminUser = await prisma.admin_users.findUnique({
      where: { id },
    });

    if (!existingAdminUser) {
      return NextResponse.json(
        { error: 'Admin user not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (body.role !== undefined) {
      updateData.role = body.role;
    }

    if (body.permissions !== undefined) {
      updateData.permissions = body.permissions;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive;
    }

    if (body.firstName !== undefined) {
      updateData.firstName = body.firstName;
    }

    if (body.lastName !== undefined) {
      updateData.lastName = body.lastName;
    }

    // Update admin user
    const updatedAdminUser = await prisma.admin_users.update({
      where: { id },
      data: updateData,
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
    });

    // Log the update
    await logUpdate({
      resource: 'adminUser',
      resourceId: id,
      before: existingAdminUser,
      after: updatedAdminUser,
      adminUser: adminSession.adminUser,
      request,
    });

    return NextResponse.json(updatedAdminUser);
  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json(
      { error: 'Failed to update admin user' },
      { status: 500 }
    );
  }
}

// Export wrapped handlers
export const GET = withPermission(Permission.USERS_READ, handleGET);
export const PUT = withPermission(Permission.SETTINGS_WRITE, handlePUT);

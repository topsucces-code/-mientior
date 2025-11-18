import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';
import { Permission } from '@prisma/client';
import { logAuditAction } from '@/lib/audit-logger';
import { invalidateCache } from '@/lib/redis';

// GET /api/vendors/[id] - Get single vendor
const handleGET = async (req: NextRequest, { params }: any) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id },
    include: {
      products: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      payouts: {
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          products: true,
          orders: true,
        },
      },
    },
  });

  if (!vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  }

  return NextResponse.json(vendor);
};

export const GET = withPermission(Permission.VENDORS_READ, handleGET);

// PATCH /api/vendors/[id] - Update vendor
const handlePATCH = async (req: NextRequest, { params, adminSession }: any) => {
  const adminUser = adminSession.adminUser;
  const body = await req.json();

  // Get old vendor data for audit log
  const oldVendor = await prisma.vendor.findUnique({
    where: { id: params.id },
  });

  if (!oldVendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  }

  // Update vendor
  const vendor = await prisma.vendor.update({
    where: { id: params.id },
    data: {
      businessName: body.businessName,
      email: body.email,
      phone: body.phone,
      logo: body.logo,
      description: body.description,
      status: body.status,
      commissionRate: body.commissionRate,
      documents: body.documents,
      bankDetails: body.bankDetails,
    },
    include: {
      _count: {
        select: {
          products: true,
          orders: true,
        },
      },
    },
  });

  // Calculate changes for audit log
  const changes: any = {};
  Object.keys(body).forEach((key) => {
    if (oldVendor[key as keyof typeof oldVendor] !== body[key]) {
      changes[key] = {
        old: oldVendor[key as keyof typeof oldVendor],
        new: body[key],
      };
    }
  });

  // Log audit action
  await logAuditAction({
    action: 'UPDATE',
    resource: 'vendors',
    resourceId: vendor.id,
    adminUserId: adminUser.id,
    metadata: { businessName: vendor.businessName },
    changes,
  });

  // Invalidate cache
  await invalidateCache('vendors:*');

  return NextResponse.json(vendor);
};

export const PATCH = withPermission(Permission.VENDORS_WRITE, handlePATCH);

// DELETE /api/vendors/[id] - Delete vendor (soft delete)
const handleDELETE = async (req: NextRequest, { params, adminSession }: any) => {
  const adminUser = adminSession.adminUser;
  // Check if vendor has active orders
  const activeOrders = await prisma.order.count({
    where: {
      vendorId: params.id,
      status: {
        in: ['PENDING', 'PROCESSING', 'SHIPPED'],
      },
    },
  });

  if (activeOrders > 0) {
    return NextResponse.json(
      { error: 'Cannot delete vendor with active orders. Please complete or cancel all orders first.' },
      { status: 400 }
    );
  }

  // Soft delete by setting status to BANNED
  const vendor = await prisma.vendor.update({
    where: { id: params.id },
    data: { status: 'BANNED' },
  });

  // Log audit action
  await logAuditAction({
    action: 'DELETE',
    resource: 'vendors',
    resourceId: vendor.id,
    adminUserId: adminUser.id,
    metadata: { businessName: vendor.businessName },
  });

  // Invalidate cache
  await invalidateCache('vendors:*');

  return NextResponse.json({ message: 'Vendor deleted successfully' });
};

export const DELETE = withPermission(Permission.VENDORS_DELETE, handleDELETE);

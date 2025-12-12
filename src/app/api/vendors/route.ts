import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';
import { Prisma } from '@prisma/client';
import { Permission } from '@/lib/permissions';
import { logAction } from '@/lib/audit-logger';
import { getCachedData, invalidateCache } from '@/lib/redis';

interface AdminSession {
  adminUser: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  }
}

// GET /api/vendors - List vendors with pagination and filtering
const handleGET = async (req: NextRequest, { adminSession: _adminSession }: { adminSession?: AdminSession; params?: unknown }) => {
  const searchParams = req.nextUrl.searchParams;
  const _start = parseInt(searchParams.get('_start') || '0');
  const _end = parseInt(searchParams.get('_end') || '10');
  const _sort = searchParams.get('_sort') || 'createdAt';
  const _order = searchParams.get('_order') || 'desc';
  const status = searchParams.get('status');
  const search = searchParams.get('q');

  const cacheKey = `vendors:${_start}:${_end}:${_sort}:${_order}:${status}:${search}`;

  const result = await getCachedData(cacheKey, async () => {
    // Build where clause
    const where: Prisma.VendorWhereInput = {};
    if (status) {
      where.status = status as Prisma.EnumVendorStatusFilter;
    }
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.vendor.count({ where });

    // Get vendors with relations
    const vendors = await prisma.vendor.findMany({
      where,
      skip: _start,
      take: _end - _start,
      orderBy: { [_sort]: _order },
      include: {
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    return { vendors, total };
  }, 300); // 5 minutes cache

  const headers = new Headers();
  headers.set('X-Total-Count', result.total.toString());
  headers.set('Access-Control-Expose-Headers', 'X-Total-Count');

  return NextResponse.json(result.vendors, { headers });
};

// POST /api/vendors - Create new vendor
const handlePOST = async (req: NextRequest, { adminSession }: { adminSession?: AdminSession; params?: unknown }) => {
  const adminUser = adminSession?.adminUser;
  const body = await req.json();

  // Validate required fields
  if (!body.businessName || !body.email) {
    return NextResponse.json(
      { error: 'Business name and email are required' },
      { status: 400 }
    );
  }

  // Check if email already exists
  const existing = await prisma.vendor.findUnique({
    where: { email: body.email },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'A vendor with this email already exists' },
      { status: 400 }
    );
  }

  // Generate slug from business name
  const slug = body.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  // Ensure slug uniqueness
  let slugSuffix = 0;
  let finalSlug = slug;
  while (await prisma.vendor.findUnique({ where: { slug: finalSlug } })) {
    slugSuffix++;
    finalSlug = `${slug}-${slugSuffix}`;
  }

  // Create vendor (admin-created vendors may not have user association initially)
  const vendor = await prisma.vendor.create({
    data: {
      businessName: body.businessName,
      slug: finalSlug,
      email: body.email,
      phone: body.phone,
      logo: body.logo,
      description: body.description,
      status: body.status || 'PENDING',
      commissionRate: body.commissionRate || 10.0,
      documents: body.documents,
      bankDetails: body.bankDetails,
      userId: body.userId, // Optional: link to existing user account
    } as Prisma.VendorUncheckedCreateInput,
    include: {
      _count: {
        select: {
          products: true,
          orders: true,
        },
      },
    },
  });

  // Log audit action
  if (adminUser) {
    await logAction({
      action: 'CREATE',
      resource: 'vendors',
      resourceId: vendor.id,
      adminUserId: adminUser.id,
      metadata: { businessName: vendor.businessName },
    });
  }

  // Invalidate cache
  await invalidateCache('vendors:*');

  return NextResponse.json(vendor, { status: 201 });
};

export const GET = withPermission(Permission.VENDORS_READ, handleGET);
export const POST = withPermission(Permission.VENDORS_WRITE, handlePOST);

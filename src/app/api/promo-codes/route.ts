import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';
import { Permission } from '@/lib/permissions';
import { logAuditAction } from '@/lib/audit-logger';
import { getCachedData, invalidateCache } from '@/lib/redis';

// GET /api/promo-codes - List promo codes with pagination and filtering
const handleGET = async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const _start = parseInt(searchParams.get('_start') || '0');
  const _end = parseInt(searchParams.get('_end') || '10');
  const _sort = searchParams.get('_sort') || 'createdAt';
  const _order = searchParams.get('_order') || 'desc';
  const type = searchParams.get('type');
  const isActive = searchParams.get('isActive');
  const search = searchParams.get('q');

  const cacheKey = `promo-codes:${_start}:${_end}:${_sort}:${_order}:${type}:${isActive}:${search}`;

  const result = await getCachedData(cacheKey, async () => {
    // Build where clause
    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    if (search) {
      where.code = { contains: search, mode: 'insensitive' };
    }

    // Get total count
    const total = await prisma.promoCode.count({ where });

    // Get promo codes with usage count
    const promoCodes = await prisma.promoCode.findMany({
      where,
      skip: _start,
      take: _end - _start,
      orderBy: { [_sort]: _order },
      include: {
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    return { promoCodes, total };
  }, 300); // 5 minutes cache

  const headers = new Headers();
  headers.set('X-Total-Count', result.total.toString());
  headers.set('Access-Control-Expose-Headers', 'X-Total-Count');

  return NextResponse.json(result.promoCodes, { headers });
};

export const GET = withPermission(Permission.MARKETING_READ, handleGET);

// POST /api/promo-codes - Create new promo code
const handlePOST = async (req: NextRequest, { adminSession }: any) => {
  const adminUser = adminSession.adminUser;
  const body = await req.json();

  // Validate required fields
  if (!body.code || !body.type || body.value === undefined) {
    return NextResponse.json(
      { error: 'Code, type, and value are required' },
      { status: 400 }
    );
  }

  // Check if code already exists
  const existing = await prisma.promoCode.findUnique({
    where: { code: body.code.toUpperCase() },
  });

  if (existing) {
    return NextResponse.json(
      { error: 'A promo code with this code already exists' },
      { status: 400 }
    );
  }

  // Create promo code
  const promoCode = await prisma.promoCode.create({
    data: {
      code: body.code.toUpperCase(),
      type: body.type,
      value: body.value,
      minOrderAmount: body.minOrderAmount,
      maxDiscount: body.maxDiscount,
      usageLimit: body.usageLimit,
      validFrom: body.validFrom ? new Date(body.validFrom) : null,
      validTo: body.validTo ? new Date(body.validTo) : null,
      conditions: body.conditions,
      isActive: body.isActive !== undefined ? body.isActive : true,
    },
    include: {
      _count: {
        select: {
          usages: true,
        },
      },
    },
  });

  // Log audit action
  await logAuditAction({
    action: 'CREATE',
    resource: 'promo-codes',
    resourceId: promoCode.id,
    adminUserId: adminUser.id,
    metadata: { code: promoCode.code, type: promoCode.type },
  });

  // Invalidate cache
  await invalidateCache('promo-codes:*');

  return NextResponse.json(promoCode, { status: 201 });
};

export const POST = withPermission(Permission.MARKETING_WRITE, handlePOST);

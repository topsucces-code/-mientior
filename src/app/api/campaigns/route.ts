import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';
import { Permission } from '@/lib/permissions';
import { logAuditAction } from '@/lib/audit-logger';
import { getCachedData, invalidateCache } from '@/lib/redis';

// GET /api/campaigns - List campaigns with pagination and filtering
const handleGET = async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams;
  const _start = parseInt(searchParams.get('_start') || '0');
  const _end = parseInt(searchParams.get('_end') || '10');
  const _sort = searchParams.get('_sort') || 'createdAt';
  const _order = searchParams.get('_order') || 'desc';
  const status = searchParams.get('status');
  const type = searchParams.get('type');
  const search = searchParams.get('q');

  const cacheKey = `campaigns:${_start}:${_end}:${_sort}:${_order}:${status}:${type}:${search}`;

  const result = await getCachedData(cacheKey, async () => {
    // Build where clause
    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.campaign.count({ where });

    // Get campaigns
    const campaigns = await prisma.campaign.findMany({
      where,
      skip: _start,
      take: _end - _start,
      orderBy: { [_sort]: _order },
    });

    return { campaigns, total };
  }, 300); // 5 minutes cache

  const headers = new Headers();
  headers.set('X-Total-Count', result.total.toString());
  headers.set('Access-Control-Expose-Headers', 'X-Total-Count');

  return NextResponse.json(result.campaigns, { headers });
};

export const GET = withPermission(Permission.MARKETING_READ, handleGET);

// POST /api/campaigns - Create new campaign
const handlePOST = async (req: NextRequest, { adminSession }: any) => {
  const adminUser = adminSession.adminUser;
  const body = await req.json();

  // Validate required fields
  if (!body.name || !body.type || !body.content) {
    return NextResponse.json(
      { error: 'Name, type, and content are required' },
      { status: 400 }
    );
  }

  // Create campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: body.name,
      type: body.type,
      status: body.status || 'DRAFT',
      subject: body.subject,
      content: body.content,
      segmentFilters: body.segmentFilters,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      stats: body.stats || {},
    },
  });

  // Log audit action
  await logAuditAction({
    action: 'CREATE',
    resource: 'campaigns',
    resourceId: campaign.id,
    adminUserId: adminUser.id,
    metadata: { name: campaign.name, type: campaign.type },
  });

  // Invalidate cache
  await invalidateCache('campaigns:*');

  return NextResponse.json(campaign, { status: 201 });
};

export const POST = withPermission(Permission.MARKETING_WRITE, handlePOST);

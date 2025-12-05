import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth-admin';
import { Permission } from '@/lib/permissions';
import { ContentBlockType } from '@prisma/client';

// GET /api/content-blocks - List all content blocks
export async function GET(request: NextRequest) {
  try {
    await requirePermission(Permission.PRODUCTS_READ);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('_start') || '0') / parseInt(searchParams.get('_end') || '10') + 1 || 1;
    const limit = parseInt(searchParams.get('_end') || '10') - parseInt(searchParams.get('_start') || '0') || 10;
    const sortField = searchParams.get('_sort') || 'createdAt';
    const sortOrder = searchParams.get('_order')?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const type = searchParams.get('type') as ContentBlockType | null;
    const isActive = searchParams.get('isActive');
    const pageId = searchParams.get('pageId');

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (pageId) where.pageId = pageId;
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [blocks, total] = await Promise.all([
      prisma.contentBlock.findMany({
        where,
        include: { page: { select: { id: true, title: true, slug: true } } },
        orderBy: { [sortField]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contentBlock.count({ where }),
    ]);

    return NextResponse.json(blocks, {
      headers: {
        'x-total-count': total.toString(),
        'Access-Control-Expose-Headers': 'x-total-count',
      },
    });
  } catch (error) {
    console.error('Error fetching content blocks:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch content blocks' }, { status: 500 });
  }
}

// POST /api/content-blocks - Create a new content block
export async function POST(request: NextRequest) {
  try {
    await requirePermission(Permission.PRODUCTS_WRITE);

    const body = await request.json();
    const { name, content, type, settings, order, pageId, isActive } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const block = await prisma.contentBlock.create({
      data: {
        name,
        content: content || {},
        type: type as ContentBlockType,
        settings,
        order: order || 0,
        pageId,
        isActive: isActive ?? true,
      },
      include: { page: { select: { id: true, title: true, slug: true } } },
    });

    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error('Error creating content block:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create content block' }, { status: 500 });
  }
}

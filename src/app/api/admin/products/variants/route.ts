import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth-admin';
import { Permission } from '@/lib/permissions';

// GET /api/admin/products/variants - List all variants
export async function GET(request: NextRequest) {
  try {
    await requirePermission(Permission.PRODUCTS_READ);

    const { searchParams } = new URL(request.url);
    const start = parseInt(searchParams.get('_start') || '0');
    const end = parseInt(searchParams.get('_end') || '20');
    const sortField = searchParams.get('_sort') || 'createdAt';
    const sortOrder = searchParams.get('_order')?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const query = searchParams.get('q');
    const productId = searchParams.get('productId');

    const where: Record<string, unknown> = {};
    
    if (query) {
      where.OR = [
        { sku: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    if (productId) {
      where.productId = productId;
    }

    const [variants, total] = await Promise.all([
      prisma.productVariant.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { [sortField]: sortOrder },
        skip: start,
        take: end - start,
      }),
      prisma.productVariant.count({ where }),
    ]);

    return NextResponse.json(variants, {
      headers: {
        'x-total-count': total.toString(),
        'Access-Control-Expose-Headers': 'x-total-count',
      },
    });
  } catch (error) {
    console.error('Error fetching variants:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 });
  }
}

// POST /api/admin/products/variants - Create a new variant
export async function POST(request: NextRequest) {
  try {
    await requirePermission(Permission.PRODUCTS_WRITE);

    const body = await request.json();
    const { productId, sku, size, color, stock, priceModifier } = body;

    if (!productId || !sku) {
      return NextResponse.json({ error: 'Product ID and SKU are required' }, { status: 400 });
    }

    // Check if SKU already exists
    const existing = await prisma.productVariant.findUnique({ where: { sku } });
    if (existing) {
      return NextResponse.json({ error: 'A variant with this SKU already exists' }, { status: 400 });
    }

    const variant = await prisma.productVariant.create({
      data: {
        productId,
        sku,
        size,
        color,
        stock: stock || 0,
        priceModifier: priceModifier || 0,
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(variant, { status: 201 });
  } catch (error) {
    console.error('Error creating variant:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 });
  }
}

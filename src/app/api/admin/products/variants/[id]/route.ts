import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth-admin';
import { Permission } from '@/lib/permissions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/products/variants/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(Permission.PRODUCTS_READ);
    const { id } = await params;

    const variant = await prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, slug: true, price: true } },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
    }

    return NextResponse.json(variant);
  } catch (error) {
    console.error('Error fetching variant:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch variant' }, { status: 500 });
  }
}

// PATCH /api/admin/products/variants/[id]
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(Permission.PRODUCTS_WRITE);
    const { id } = await params;

    const body = await request.json();
    const { size, color, stock, priceModifier } = body;

    const variant = await prisma.productVariant.update({
      where: { id },
      data: {
        ...(size !== undefined && { size }),
        ...(color !== undefined && { color }),
        ...(stock !== undefined && { stock }),
        ...(priceModifier !== undefined && { priceModifier }),
      },
      include: {
        product: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(variant);
  } catch (error) {
    console.error('Error updating variant:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 });
  }
}

// DELETE /api/admin/products/variants/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(Permission.PRODUCTS_DELETE);
    const { id } = await params;

    await prisma.productVariant.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting variant:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete variant' }, { status: 500 });
  }
}

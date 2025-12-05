import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth-admin';
import { Permission } from '@/lib/permissions';
import { ContentBlockType } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/content-blocks/[id] - Get a single content block
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(Permission.PRODUCTS_READ);
    const { id } = await params;

    const block = await prisma.contentBlock.findUnique({
      where: { id },
      include: { page: { select: { id: true, title: true, slug: true } } },
    });

    if (!block) {
      return NextResponse.json({ error: 'Content block not found' }, { status: 404 });
    }

    return NextResponse.json(block);
  } catch (error) {
    console.error('Error fetching content block:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to fetch content block' }, { status: 500 });
  }
}

// PATCH /api/content-blocks/[id] - Update a content block
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(Permission.PRODUCTS_WRITE);
    const { id } = await params;

    const body = await request.json();
    const { name, content, type, settings, order, pageId, isActive } = body;

    const block = await prisma.contentBlock.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type: type as ContentBlockType }),
        ...(settings !== undefined && { settings }),
        ...(order !== undefined && { order }),
        ...(pageId !== undefined && { pageId }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { page: { select: { id: true, title: true, slug: true } } },
    });

    return NextResponse.json(block);
  } catch (error) {
    console.error('Error updating content block:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update content block' }, { status: 500 });
  }
}

// DELETE /api/content-blocks/[id] - Delete a content block
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    await requirePermission(Permission.PRODUCTS_DELETE);
    const { id } = await params;

    await prisma.contentBlock.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content block:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete content block' }, { status: 500 });
  }
}

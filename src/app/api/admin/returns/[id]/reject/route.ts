import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';

async function handlePOST(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; adminSession: { email: string } }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { reason, note } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id },
    });

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Return request not found' },
        { status: 404 }
      );
    }

    if (returnRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Return request is not pending' },
        { status: 400 }
      );
    }

    const timeline = (returnRequest.timeline as Array<Record<string, unknown>>) || [];
    timeline.push({
      action: 'Return rejected',
      date: new Date().toISOString(),
      user: context.adminSession.email,
      note: `Reason: ${reason}${note ? ` - ${note}` : ''}`,
    });

    await prisma.returnRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        timeline,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error rejecting return:', error);
    return NextResponse.json(
      { error: 'Failed to reject return' },
      { status: 500 }
    );
  }
}

export const POST = withPermission(Permission.ORDERS_WRITE, handlePOST);

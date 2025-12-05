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
    const { note } = body;

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
      action: 'Return approved',
      date: new Date().toISOString(),
      user: context.adminSession.email,
      note: note || undefined,
    });

    await prisma.returnRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        timeline,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving return:', error);
    return NextResponse.json(
      { error: 'Failed to approve return' },
      { status: 500 }
    );
  }
}

export const POST = withPermission(Permission.ORDERS_WRITE, handlePOST);

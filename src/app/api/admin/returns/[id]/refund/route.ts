import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';
import { RefundMethod } from '@prisma/client';

async function handlePOST(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; adminSession: { email: string } }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { refundAmount, refundMethod, note } = body;

    if (!refundAmount || refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid refund amount is required' },
        { status: 400 }
      );
    }

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: true,
        user: true,
      },
    });

    if (!returnRequest) {
      return NextResponse.json(
        { error: 'Return request not found' },
        { status: 404 }
      );
    }

    if (returnRequest.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Return request must be approved before refund' },
        { status: 400 }
      );
    }

    if (refundAmount > returnRequest.totalAmount) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed total amount' },
        { status: 400 }
      );
    }

    const timeline = (returnRequest.timeline as Array<Record<string, unknown>>) || [];
    timeline.push({
      action: 'Refund processed',
      date: new Date().toISOString(),
      user: context.adminSession.email,
      note: `Amount: €${refundAmount.toFixed(2)} via ${refundMethod}${note ? ` - ${note}` : ''}`,
    });

    // Update return request
    await prisma.returnRequest.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        refundAmount,
        refundMethod: refundMethod as RefundMethod,
        timeline,
        updatedAt: new Date(),
      },
    });

    // If refund method is store credit, add to user's loyalty points
    if (refundMethod === 'STORE_CREDIT') {
      const pointsToAdd = Math.floor(refundAmount * 10); // 10 points per euro
      await prisma.user.update({
        where: { id: returnRequest.userId },
        data: {
          loyaltyPoints: { increment: pointsToAdd },
        },
      });
    }

    // TODO: Integrate with payment gateway for actual refund processing
    // For now, we just mark it as completed

    return NextResponse.json({ 
      success: true,
      message: 'Refund processed successfully',
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}

export const POST = withPermission(Permission.ORDERS_WRITE, handlePOST);

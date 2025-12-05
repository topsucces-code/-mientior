/**
 * REST API endpoint for returns management (Admin)
 * GET: List all return requests with filters
 * POST: Create a new return request (admin-initiated)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withPermission, type AdminSession } from '@/middleware/admin-auth';

async function handleGET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: { params: Record<string, string>; adminSession: AdminSession }
) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const returns = await prisma.returnRequest.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data for frontend
    const transformedReturns = returns.map((r) => ({
      id: r.id,
      orderId: r.order.id,
      orderNumber: r.order.orderNumber,
      customerId: r.user.id,
      customerName: `${r.user.firstName} ${r.user.lastName}`,
      customerEmail: r.user.email,
      status: r.status,
      reason: r.reason,
      reasonDetails: r.reasonDetails,
      items: r.items.map((item) => ({
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.price,
        condition: item.condition,
      })),
      totalAmount: r.totalAmount,
      refundAmount: r.refundAmount,
      refundMethod: r.refundMethod,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      timeline: r.timeline as Array<{ action: string; date: string; user: string; note?: string }>,
    }));

    return NextResponse.json({ returns: transformedReturns });
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch returns' },
      { status: 500 }
    );
  }
}

async function handlePOST(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: { params: Record<string, string>; adminSession: AdminSession }
) {
  try {
    const body = await request.json();
    const { orderId, userId, reason, reasonDetails, items } = body;

    if (!orderId || !userId || !reason || !items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );

    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId,
        userId,
        reason,
        reasonDetails: reasonDetails || '',
        status: 'PENDING',
        totalAmount,
        refundAmount: totalAmount,
        refundMethod: 'ORIGINAL',
        timeline: [
          {
            action: 'Return request created',
            date: new Date().toISOString(),
            user: 'Admin',
          },
        ],
        items: {
          create: items.map((item: { productId: string; quantity: number; price: number; condition: string }) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            condition: item.condition || 'UNOPENED',
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ returnRequest }, { status: 201 });
  } catch (error) {
    console.error('Error creating return:', error);
    return NextResponse.json(
      { error: 'Failed to create return request' },
      { status: 500 }
    );
  }
}

export const GET = withPermission(Permission.ORDERS_READ, handleGET);
export const POST = withPermission(Permission.ORDERS_WRITE, handlePOST);

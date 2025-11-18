/**
 * REST API endpoint for admin notifications
 * GET: List admin's notifications (unread first)
 * PUT: Mark notification(s) as read
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withAdminAuth } from '@/middleware/admin-auth';

async function handleGET(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: any }
) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const _start = parseInt(searchParams.get('_start') || '0');
    const _end = parseInt(searchParams.get('_end') || '20');
    const skip = _start;
    const take = _end - _start;

    // Filter parameters
    const read = searchParams.get('read');

    // Build where clause - always filter by current admin user
    const where: Prisma.NotificationWhereInput = {
      adminUserId: adminSession.adminUser.id,
    };

    // Filter by read status
    if (read !== null && read !== undefined) {
      where.read = read === 'true';
    }

    // Fetch notifications (unread first, then by date)
    const [notifications, totalCount] = await Promise.all([
      prisma.notification.findMany({
        skip,
        take,
        where,
        orderBy: [{ read: 'asc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          data: true,
          read: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return NextResponse.json(notifications, {
      headers: {
        'X-Total-Count': totalCount.toString(),
      },
    });
  } catch (error) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

async function handlePUT(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: any }
) {
  try {
    const body = await request.json();

    // Support both single ID and array of IDs
    const notificationIds = Array.isArray(body.ids)
      ? body.ids
      : body.id
        ? [body.id]
        : [];

    if (notificationIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing notification ID(s)' },
        { status: 400 }
      );
    }

    // Update notifications - only those belonging to the current admin user
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        adminUserId: adminSession.adminUser.id,
      },
      data: {
        read: body.read !== undefined ? body.read : true,
      },
    });

    return NextResponse.json({
      message: 'Notifications updated successfully',
      count: result.count,
    });
  } catch (error) {
    console.error('Notifications update error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

// Export wrapped handlers
export const GET = withAdminAuth(handleGET);
export const PUT = withAdminAuth(handlePUT);

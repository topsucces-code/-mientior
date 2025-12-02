/**
 * REST API endpoint for dashboard statistics (Admin)
 * Returns aggregated stats for products, orders, users, and revenue
 */

import { NextRequest, NextResponse } from 'next/server';
import { PaymentStatus } from '@prisma/client';
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';

async function handleGET(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: any }
) {
  try {
    // Get current date for "this month" calculations
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel for better performance
    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      totalUsers,
      newUsersThisMonth,
      recentOrders,
    ] = await Promise.all([
      // Total products count
      prisma.product.count(),

      // Active products count
      prisma.product.count({
        where: { status: 'ACTIVE' },
      }),

      // Low stock products (stock < 10)
      prisma.product.count({
        where: { stock: { lt: 10 } },
      }),

      // Total orders count
      prisma.order.count(),

      // Pending orders count
      prisma.order.count({
        where: { status: 'PENDING' },
      }),

      // Total revenue (sum of paid orders)
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: PaymentStatus.PAID },
      }),

      // Total users count
      prisma.user.count(),

      // New users this month
      prisma.user.count({
        where: {
          createdAt: { gte: firstDayOfMonth },
        },
      }),

      // Recent 5 orders with user and items
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
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
                  slug: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const stats = {
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
      },
      revenue: {
        total: totalRevenue._sum.total || 0,
      },
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentStatus: order.paymentStatus,
        total: order.total,
        createdAt: order.createdAt,
        user: order.user,
        items: order.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          product: item.product,
        })),
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

// Export wrapped handler
export const GET = withPermission(Permission.DASHBOARD_READ, handleGET);

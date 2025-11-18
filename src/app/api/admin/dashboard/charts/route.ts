/**
 * REST API endpoint for dashboard charts data (Admin)
 * Returns revenue by day, orders by status, and top products by revenue
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';

async function handleGET(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: any }
) {
  try {
    // Calculate date range for last 30 days
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Fetch orders for the last 30 days (paid orders only for revenue)
    const recentOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        paymentStatus: PaymentStatus.PAID,
      },
      select: {
        createdAt: true,
        total: true,
        status: true,
      },
    });

    // Group revenue by day
    const revenueByDay: Record<string, number> = {};
    recentOrders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!revenueByDay[dateKey]) {
        revenueByDay[dateKey] = 0;
      }
      revenueByDay[dateKey] += order.total;
    });

    // Convert to array format for charting
    const revenueData = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({
        date,
        revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Fetch orders by status count
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const ordersByStatusData = ordersByStatus.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));

    // Fetch top 5 products by revenue
    const topProductsData = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        price: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          price: 'desc',
        },
      },
      take: 5,
    });

    // Fetch product details for top products
    const productIds = topProductsData.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    // Map products to their revenue
    const topProducts = topProductsData.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        productId: item.productId,
        productName: product?.name || 'Unknown Product',
        productSlug: product?.slug || '',
        revenue: item._sum.price || 0,
        orderCount: item._count.id,
      };
    });

    const chartData = {
      revenueByDay: revenueData,
      ordersByStatus: ordersByStatusData,
      topProducts,
    };

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Dashboard charts fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard charts data' },
      { status: 500 }
    );
  }
}

// Export wrapped handler
export const GET = withPermission(Permission.DASHBOARD_READ, handleGET);

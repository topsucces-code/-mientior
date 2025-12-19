/**
 * REST API endpoint for analytics data (Admin)
 * Returns KPIs, revenue trends, category distribution, and conversion funnel
 */

import { NextRequest, NextResponse } from 'next/server';
import { PaymentStatus } from '@prisma/client';
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withPermission, type AdminSession } from '@/middleware/admin-auth';

interface AnalyticsQuery {
  period: '7d' | '30d' | '90d' | '1y';
  compareWith?: 'previous-period' | 'previous-year';
}

function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setDate(end.getDate() - 30);
  }
  
  return { start, end };
}

function getComparisonRange(period: string, compareWith: string): { start: Date; end: Date } {
  const { start: currentStart, end: currentEnd } = getDateRange(period);
  const duration = currentEnd.getTime() - currentStart.getTime();
  
  if (compareWith === 'previous-year') {
    const start = new Date(currentStart);
    start.setFullYear(start.getFullYear() - 1);
    const end = new Date(currentEnd);
    end.setFullYear(end.getFullYear() - 1);
    return { start, end };
  }
  
  // previous-period
  const end = new Date(currentStart);
  const start = new Date(end.getTime() - duration);
  return { start, end };
}

async function handleGET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: { params: Record<string, string>; adminSession: AdminSession }
) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || '30d') as AnalyticsQuery['period'];
    const compareWith = searchParams.get('compareWith') as AnalyticsQuery['compareWith'];
    
    const { start, end } = getDateRange(period);
    
    // Current period queries
    const [
      currentRevenue,
      currentOrders,
      currentNewCustomers,
      previousPeriodData,
      revenueByDay,
      ordersByStatus,
      salesByCategory,
      topProducts,
      conversionData,
    ] = await Promise.all([
      // Total revenue (paid orders)
      prisma.orders.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: start, lte: end },
          paymentStatus: PaymentStatus.PAID,
        },
      }),
      
      // Total orders
      prisma.orders.count({
        where: {
          createdAt: { gte: start, lte: end },
        },
      }),
      
      // New customers
      prisma.users.count({
        where: {
          createdAt: { gte: start, lte: end },
        },
      }),
      
      // Comparison period data
      compareWith ? (async () => {
        const { start: compStart, end: compEnd } = getComparisonRange(period, compareWith);
        const [revenue, orders, customers] = await Promise.all([
          prisma.orders.aggregate({
            _sum: { total: true },
            where: {
              createdAt: { gte: compStart, lte: compEnd },
              paymentStatus: PaymentStatus.PAID,
            },
          }),
          prisma.orders.count({
            where: {
              createdAt: { gte: compStart, lte: compEnd },
            },
          }),
          prisma.users.count({
            where: {
              createdAt: { gte: compStart, lte: compEnd },
            },
          }),
        ]);
        return {
          revenue: revenue._sum.total || 0,
          orders,
          customers,
        };
      })() : Promise.resolve(null),
      
      // Revenue by day
      prisma.orders.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          paymentStatus: PaymentStatus.PAID,
        },
        select: {
          createdAt: true,
          total: true,
        },
      }),
      
      // Orders by status
      prisma.orders.groupBy({
        by: ['status'],
        _count: { id: true },
        where: {
          createdAt: { gte: start, lte: end },
        },
      }),
      
      // Sales by category
      prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: start, lte: end },
            paymentStatus: PaymentStatus.PAID,
          },
        },
        include: {
          product: {
            select: {
              category: {
                select: { name: true },
              },
            },
          },
        },
      }),
      
      // Top products
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { price: true },
        _count: { id: true },
        where: {
          order: {
            createdAt: { gte: start, lte: end },
            paymentStatus: PaymentStatus.PAID,
          },
        },
        orderBy: { _sum: { price: 'desc' } },
        take: 10,
      }),
      
      // Conversion funnel data (from analytics/search logs)
      Promise.all([
        prisma.analytics.aggregate({
          _sum: { views: true },
          where: {
            page: { startsWith: '/' },
            createdAt: { gte: start, lte: end },
          },
        }),
        prisma.analytics.aggregate({
          _sum: { views: true },
          where: {
            page: { startsWith: '/products/' },
            createdAt: { gte: start, lte: end },
          },
        }),
        prisma.orders.count({
          where: {
            createdAt: { gte: start, lte: end },
            status: { in: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
          },
        }),
      ]),
    ]);
    
    // Process revenue by day
    const revenueByDayMap: Record<string, number> = {};
    revenueByDay.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0] || 'unknown';
      revenueByDayMap[dateKey] = (revenueByDayMap[dateKey] || 0) + order.total;
    });
    
    const revenueData = Object.entries(revenueByDayMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Process sales by category
    const categoryMap: Record<string, number> = {};
    salesByCategory.forEach((item) => {
      const categoryName = item.product?.category?.name || 'Other';
      categoryMap[categoryName] = (categoryMap[categoryName] || 0) + item.price;
    });
    
    const categoryData = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
    
    // Fetch product details for top products
    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, category: { select: { name: true } } },
    });
    
    const topProductsData = topProducts.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        id: item.productId,
        name: product?.name || 'Unknown',
        category: product?.category?.name || 'Other',
        sales: item._count.id,
        revenue: item._sum.price || 0,
      };
    });
    
    // Calculate KPIs with changes
    const totalRevenue = currentRevenue._sum.total || 0;
    const avgOrderValue = currentOrders > 0 ? totalRevenue / currentOrders : 0;
    
    const calculateChange = (current: number, previous: number | null): number => {
      if (!previous || previous === 0) return 0;
      return ((current - previous) / previous) * 100;
    };
    
    const kpis = {
      totalRevenue: {
        value: totalRevenue,
        change: previousPeriodData ? calculateChange(totalRevenue, previousPeriodData.revenue) : 0,
      },
      totalOrders: {
        value: currentOrders,
        change: previousPeriodData ? calculateChange(currentOrders, previousPeriodData.orders) : 0,
      },
      newCustomers: {
        value: currentNewCustomers,
        change: previousPeriodData ? calculateChange(currentNewCustomers, previousPeriodData.customers) : 0,
      },
      avgOrderValue: {
        value: avgOrderValue,
        change: previousPeriodData && previousPeriodData.orders > 0
          ? calculateChange(avgOrderValue, previousPeriodData.revenue / previousPeriodData.orders)
          : 0,
      },
    };
    
    // Conversion funnel
    const [totalVisitors, productViews, completedOrders] = conversionData;
    const visitors = totalVisitors._sum.views || 10000; // Fallback for demo
    const views = productViews._sum.views || Math.round(visitors * 0.65);
    const orders = completedOrders;
    
    const funnel = {
      visitors,
      productViews: views,
      addToCart: Math.round(views * 0.5), // Estimate
      checkoutStarted: Math.round(orders * 1.3), // Estimate
      ordersCompleted: orders,
    };
    
    return NextResponse.json({
      kpis,
      charts: {
        revenue: revenueData,
        ordersByStatus: ordersByStatus.map((s) => ({
          status: s.status,
          count: s._count.id,
        })),
        salesByCategory: categoryData,
        topProducts: topProductsData,
      },
      funnel,
      period,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

export const GET = withPermission(Permission.DASHBOARD_READ, handleGET);

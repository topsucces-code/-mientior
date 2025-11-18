/**
 * REST API endpoint for analytics funnel data (Admin)
 * GET: Fetch conversion funnel metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';
import { getCachedData } from '@/lib/redis';

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  dropoff?: number;
}

async function handleGET(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: any }
) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, all
    const categoryId = searchParams.get('categoryId');
    const source = searchParams.get('source'); // organic, paid, social, etc.

    // Calculate date range
    let startDate: Date | undefined;
    const now = new Date();

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = undefined; // All time
    }

    // Cache key based on parameters
    const cacheKey = `analytics:funnel:${period}:${categoryId || 'all'}:${source || 'all'}`;

    // Cache funnel data for 15 minutes
    const funnelData = await getCachedData(
      cacheKey,
      async () => {
        // Build where clause for filtering
        const whereClause: any = {};
        if (startDate) {
          whereClause.createdAt = { gte: startDate };
        }

        // Stage 1: Visitors (estimated from users + some multiplier)
        // In a real implementation, this would come from Analytics model or external service
        const totalUsers = await prisma.user.count({
          where: startDate ? { createdAt: { gte: startDate } } : undefined,
        });

        // Estimate visitors as 10x users (assumes 10% signup rate)
        const visitors = totalUsers > 0 ? totalUsers * 10 : 1000;

        // Stage 2: Product Views
        // In production, track via Analytics model with page views
        // For now, estimate from products with recent orders
        const productsWithViews = await prisma.product.findMany({
          where: {
            orders: {
              some: {
                createdAt: startDate ? { gte: startDate } : undefined,
              },
            },
            ...(categoryId && { categoryId }),
          },
          select: {
            _count: {
              select: { orders: true },
            },
          },
        });

        const productViews = productsWithViews.length > 0
          ? productsWithViews.reduce((sum, p) => sum + p._count.orders, 0) * 5 // Assume 5 views per order
          : Math.floor(visitors * 0.6); // 60% of visitors view products

        // Stage 3: Add to Cart
        // In production, track cart additions via Analytics or CartEvent model
        // For now, estimate from orders
        const ordersCount = await prisma.order.count({
          where: whereClause,
        });

        const addToCart = ordersCount > 0
          ? Math.floor(ordersCount * 1.8) // Assume 1.8 cart additions per order (80% cart abandonment typical)
          : Math.floor(productViews * 0.3); // 30% of product viewers add to cart

        // Stage 4: Checkout Initiated
        // Estimate as orders + abandoned checkouts (assume 50% checkout abandonment)
        const checkoutInitiated = Math.floor(ordersCount * 2);

        // Stage 5: Orders Completed
        const ordersCompleted = ordersCount;

        // Build funnel stages
        const stages: FunnelStage[] = [
          {
            name: 'Visitors',
            count: visitors,
            percentage: 100,
          },
          {
            name: 'Product Views',
            count: productViews,
            percentage: (productViews / visitors) * 100,
            dropoff: ((visitors - productViews) / visitors) * 100,
          },
          {
            name: 'Add to Cart',
            count: addToCart,
            percentage: (addToCart / visitors) * 100,
            dropoff: ((productViews - addToCart) / productViews) * 100,
          },
          {
            name: 'Checkout',
            count: checkoutInitiated,
            percentage: (checkoutInitiated / visitors) * 100,
            dropoff: ((addToCart - checkoutInitiated) / addToCart) * 100,
          },
          {
            name: 'Purchase',
            count: ordersCompleted,
            percentage: (ordersCompleted / visitors) * 100,
            dropoff: ((checkoutInitiated - ordersCompleted) / checkoutInitiated) * 100,
          },
        ];

        // Calculate overall conversion rate
        const conversionRate = (ordersCompleted / visitors) * 100;

        // Calculate average order value
        const orderStats = await prisma.order.aggregate({
          where: whereClause,
          _avg: {
            totalAmount: true,
          },
          _sum: {
            totalAmount: true,
          },
        });

        const avgOrderValue = orderStats._avg.totalAmount || 0;
        const revenue = orderStats._sum.totalAmount || 0;

        return {
          stages,
          conversionRate,
          avgOrderValue,
          revenue,
          period,
          filters: {
            categoryId,
            source,
          },
        };
      },
      900 // 15 minutes cache
    );

    return NextResponse.json(funnelData);
  } catch (error) {
    console.error('Analytics funnel error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funnel data' },
      { status: 500 }
    );
  }
}

// Export wrapped handler with DASHBOARD_READ permission
export const GET = withPermission(Permission.DASHBOARD_READ, handleGET);

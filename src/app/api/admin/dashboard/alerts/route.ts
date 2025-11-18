/**
 * REST API endpoint for dashboard alerts (Admin)
 * GET: Fetch system alerts and notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';
import { getCachedData, invalidateCache } from '@/lib/redis';

interface Alert {
  id: string;
  type: 'urgent' | 'attention' | 'info';
  title: string;
  message: string;
  link?: string;
  count?: number;
  timestamp: Date;
}

async function handleGET(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: any }
) {
  try {
    // Cache alerts for 5 minutes
    const alerts = await getCachedData(
      'dashboard:alerts',
      async () => {
        const alertsList: Alert[] = [];

        // Check for low stock products (urgent)
        const lowStockCount = await prisma.product.count({
          where: {
            stock: { lt: 10 },
            status: 'ACTIVE'
          },
        });

        if (lowStockCount > 0) {
          alertsList.push({
            id: 'low-stock',
            type: 'urgent',
            title: 'Low Stock Alert',
            message: `${lowStockCount} product${lowStockCount > 1 ? 's' : ''} running low on stock`,
            link: '/admin/products?filter=low-stock',
            count: lowStockCount,
            timestamp: new Date(),
          });
        }

        // Check for failed payments (urgent)
        const failedPaymentsCount = await prisma.order.count({
          where: {
            paymentStatus: 'FAILED',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
        });

        if (failedPaymentsCount > 0) {
          alertsList.push({
            id: 'failed-payments',
            type: 'urgent',
            title: 'Failed Payments',
            message: `${failedPaymentsCount} failed payment${failedPaymentsCount > 1 ? 's' : ''} in the last 24 hours`,
            link: '/admin/orders?paymentStatus=FAILED',
            count: failedPaymentsCount,
            timestamp: new Date(),
          });
        }

        // Check for pending vendor approvals (attention)
        const pendingVendorsCount = await prisma.vendor.count({
          where: { status: 'PENDING' },
        });

        if (pendingVendorsCount > 0) {
          alertsList.push({
            id: 'pending-vendors',
            type: 'attention',
            title: 'Pending Vendor Approvals',
            message: `${pendingVendorsCount} vendor${pendingVendorsCount > 1 ? 's' : ''} awaiting approval`,
            link: '/admin/vendors?status=PENDING',
            count: pendingVendorsCount,
            timestamp: new Date(),
          });
        }

        // Check for pending orders (attention)
        const pendingOrdersCount = await prisma.order.count({
          where: { status: 'PENDING' },
        });

        if (pendingOrdersCount > 0) {
          alertsList.push({
            id: 'pending-orders',
            type: 'attention',
            title: 'Pending Orders',
            message: `${pendingOrdersCount} order${pendingOrdersCount > 1 ? 's' : ''} need processing`,
            link: '/admin/orders?status=PENDING',
            count: pendingOrdersCount,
            timestamp: new Date(),
          });
        }

        // Check for products awaiting review (info)
        const draftProductsCount = await prisma.product.count({
          where: { status: 'DRAFT' },
        });

        if (draftProductsCount > 0) {
          alertsList.push({
            id: 'draft-products',
            type: 'info',
            title: 'Draft Products',
            message: `${draftProductsCount} product${draftProductsCount > 1 ? 's' : ''} in draft status`,
            link: '/admin/products?status=DRAFT',
            count: draftProductsCount,
            timestamp: new Date(),
          });
        }

        // Check for inactive vendors (info)
        const inactiveVendorsCount = await prisma.vendor.count({
          where: {
            status: 'ACTIVE',
            products: {
              none: {
                status: 'ACTIVE',
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
              }
            }
          },
        });

        if (inactiveVendorsCount > 0) {
          alertsList.push({
            id: 'inactive-vendors',
            type: 'info',
            title: 'Inactive Vendors',
            message: `${inactiveVendorsCount} vendor${inactiveVendorsCount > 1 ? 's have' : ' has'} not added products in 30 days`,
            link: '/admin/vendors?filter=inactive',
            count: inactiveVendorsCount,
            timestamp: new Date(),
          });
        }

        // Sort by type priority and count
        const typePriority = { urgent: 0, attention: 1, info: 2 };
        alertsList.sort((a, b) => {
          if (a.type !== b.type) {
            return typePriority[a.type] - typePriority[b.type];
          }
          return (b.count || 0) - (a.count || 0);
        });

        return {
          urgent: alertsList.filter(a => a.type === 'urgent'),
          attention: alertsList.filter(a => a.type === 'attention'),
          info: alertsList.filter(a => a.type === 'info'),
          total: alertsList.length,
        };
      },
      300 // 5 minutes cache
    );

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Dashboard alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard alerts' },
      { status: 500 }
    );
  }
}

// Export wrapped handler with DASHBOARD_READ permission
export const GET = withPermission(Permission.DASHBOARD_READ, handleGET);

/**
 * REST API endpoint for data export (Admin)
 * POST: Export resource data to CSV or JSON format
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';
import { withRateLimit } from '@/lib/rate-limiter';

// Helper function to convert JSON to CSV
function jsonToCSV(data: any[]): string {
  if (data.length === 0) {
    return '';
  }

  // Get all unique keys from all objects (handles nested data)
  const headers = Array.from(
    new Set(data.flatMap((obj) => Object.keys(flattenObject(obj))))
  );

  // Create CSV header row
  const csvRows = [headers.join(',')];

  // Create CSV data rows
  for (const row of data) {
    const flatRow = flattenObject(row);
    const values = headers.map((header) => {
      const value = flatRow[header];
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      if (
        stringValue.includes(',') ||
        stringValue.includes('"') ||
        stringValue.includes('\n')
      ) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Helper function to flatten nested objects
function flattenObject(obj: any, prefix = ''): any {
  const flattened: any = {};

  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined) {
      flattened[prefix + key] = obj[key];
    } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
      Object.assign(flattened, flattenObject(obj[key], `${prefix}${key}.`));
    } else if (Array.isArray(obj[key])) {
      flattened[prefix + key] = JSON.stringify(obj[key]);
    } else if (obj[key] instanceof Date) {
      flattened[prefix + key] = obj[key].toISOString();
    } else {
      flattened[prefix + key] = obj[key];
    }
  }

  return flattened;
}

async function handlePOST(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: any }
) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.resource || !body.format) {
      return NextResponse.json(
        { error: 'Missing required fields: resource, format' },
        { status: 400 }
      );
    }

    const { resource, format, filters } = body;

    // Validate format
    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json(
        { error: 'Invalid format. Must be "csv" or "json"' },
        { status: 400 }
      );
    }

    // Fetch data based on resource
    let data: any[] = [];
    let filename = '';

    switch (resource) {
      case 'products':
        data = await prisma.product.findMany({
          where: filters || {},
          include: {
            category: true,
            images: true,
            variants: true,
          },
        });
        filename = `products_export_${Date.now()}`;
        break;

      case 'orders':
        data = await prisma.order.findMany({
          where: filters || {},
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
        });
        filename = `orders_export_${Date.now()}`;
        break;

      case 'users':
        data = await prisma.user.findMany({
          where: filters || {},
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            loyaltyLevel: true,
            loyaltyPoints: true,
            totalOrders: true,
            totalSpent: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        filename = `users_export_${Date.now()}`;
        break;

      case 'categories':
        data = await prisma.category.findMany({
          where: filters || {},
        });
        filename = `categories_export_${Date.now()}`;
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported resource: ${resource}` },
          { status: 400 }
        );
    }

    // Format data based on requested format
    if (format === 'csv') {
      const csv = jsonToCSV(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    } else {
      // JSON format
      const json = JSON.stringify(data, null, 2);
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

// Export wrapped handler with rate limiting (outermost) and DASHBOARD_READ permission
export const POST = withRateLimit(
  withPermission(Permission.DASHBOARD_READ, handlePOST),
  {
    limit: 10,
    window: 60,
    keyPrefix: 'export',
  }
);

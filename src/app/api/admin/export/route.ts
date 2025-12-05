/**
 * REST API endpoint for data export (Admin)
 * POST: Export resource data to CSV, JSON, PDF, or XLSX format
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withPermission, type AdminSession } from '@/middleware/admin-auth';
import { withRateLimit } from '@/lib/rate-limiter';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';

// Analytics export handler
async function handleAnalyticsExport(
  format: string,
  period: string,
  data: {
    kpis: Record<string, { value: number; change: number }>;
    charts: {
      revenue: Array<{ date: string; revenue: number }>;
      topProducts: Array<{ name: string; sales: number; revenue: number }>;
    };
  }
): Promise<NextResponse> {
  const filename = `analytics-${period}-${new Date().toISOString().split('T')[0]}`;

  if (format === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    
    // KPIs sheet
    const kpisSheet = workbook.addWorksheet('KPIs');
    kpisSheet.columns = [
      { header: 'Metric', key: 'metric', width: 25 },
      { header: 'Value', key: 'value', width: 15 },
      { header: 'Change (%)', key: 'change', width: 15 },
    ];
    Object.entries(data.kpis).forEach(([key, val]) => {
      kpisSheet.addRow({ metric: key, value: val.value, change: val.change.toFixed(2) });
    });

    // Revenue sheet
    const revenueSheet = workbook.addWorksheet('Revenue');
    revenueSheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Revenue', key: 'revenue', width: 15 },
    ];
    data.charts.revenue.forEach((r) => {
      revenueSheet.addRow({ date: r.date, revenue: r.revenue });
    });

    // Top Products sheet
    const productsSheet = workbook.addWorksheet('Top Products');
    productsSheet.columns = [
      { header: 'Product', key: 'name', width: 30 },
      { header: 'Sales', key: 'sales', width: 10 },
      { header: 'Revenue', key: 'revenue', width: 15 },
    ];
    data.charts.topProducts.forEach((p) => {
      productsSheet.addRow({ name: p.name, sales: p.sales, revenue: p.revenue });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });
  }

  if (format === 'pdf') {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text('Analytics Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Period: ${period}`, 20, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 38);

    // KPIs
    doc.setFontSize(14);
    doc.text('Key Performance Indicators', 20, 55);
    doc.setFontSize(10);
    let y = 65;
    Object.entries(data.kpis).forEach(([key, val]) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      doc.text(`${label}: ${val.value.toLocaleString()} (${val.change >= 0 ? '+' : ''}${val.change.toFixed(1)}%)`, 25, y);
      y += 8;
    });

    // Top Products
    y += 10;
    doc.setFontSize(14);
    doc.text('Top Products', 20, y);
    y += 10;
    doc.setFontSize(10);
    data.charts.topProducts.slice(0, 5).forEach((p) => {
      doc.text(`${p.name}: ${p.sales} sales, €${p.revenue.toLocaleString()}`, 25, y);
      y += 8;
    });

    const pdfBuffer = doc.output('arraybuffer');
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      },
    });
  }

  // Default: JSON
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}.json"`,
    },
  });
}

// Helper function to convert JSON to CSV
function jsonToCSV(data: Record<string, unknown>[]): string {
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
function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};

  for (const key in obj) {
    if (obj[key] === null || obj[key] === undefined) {
      flattened[prefix + key] = obj[key];
    } else if (typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
      Object.assign(flattened, flattenObject(obj[key] as Record<string, unknown>, `${prefix}${key}.`));
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: { params: Record<string, string>; adminSession: AdminSession }
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
    const validFormats = ['csv', 'json', 'pdf', 'xlsx'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be "csv", "json", "pdf", or "xlsx"' },
        { status: 400 }
      );
    }

    // Handle analytics export separately
    if (body.type === 'analytics') {
      return handleAnalyticsExport(format, body.period, body.data);
    }

    // Fetch data based on resource
    let data: Record<string, unknown>[] = [];
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

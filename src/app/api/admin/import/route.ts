/**
 * REST API endpoint for data import (Admin)
 * POST: Import data from CSV or JSON format
 */

import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma';
import { withPermission } from '@/middleware/admin-auth';
import { withRateLimit } from '@/lib/rate-limiter';

// Helper to validate and prepare product data
function validateProductData(item: any): boolean {
  return !!(item.name && item.slug && item.price !== undefined && item.categoryId);
}

// Helper to validate and prepare category data
function validateCategoryData(item: any): boolean {
  return !!(item.name && item.slug);
}

// Helper to validate and prepare tag data
function validateTagData(item: any): boolean {
  return !!(item.name && item.slug);
}

async function handlePOST(
  request: NextRequest,
  { adminSession }: { params: any; adminSession: any }
) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.resource || !body.data || !body.mode) {
      return NextResponse.json(
        { error: 'Missing required fields: resource, data, mode' },
        { status: 400 }
      );
    }

    const { resource, data, mode } = body;

    // Validate mode
    if (mode !== 'create' && mode !== 'upsert') {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "create" or "upsert"' },
        { status: 400 }
      );
    }

    // Validate data is an array
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Data must be an array' },
        { status: 400 }
      );
    }

    let imported = 0;
    const errors: any[] = [];

    // Process import based on resource type
    switch (resource) {
      case 'products':
        // Check permission
        if (!adminSession.adminUser) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }

        for (let i = 0; i < data.length; i++) {
          const item = data[i];

          try {
            // Validate required fields
            if (!validateProductData(item)) {
              errors.push({
                index: i,
                error: 'Missing required fields: name, slug, price, categoryId',
                data: item,
              });
              continue;
            }

            if (mode === 'create') {
              // Create new product
              await prisma.product.create({
                data: {
                  name: item.name,
                  slug: item.slug,
                  description: item.description || null,
                  price: parseFloat(item.price),
                  compareAtPrice: item.compareAtPrice ? parseFloat(item.compareAtPrice) : null,
                  stock: parseInt(item.stock || '0'),
                  badge: item.badge || null,
                  featured: item.featured === true || item.featured === 'true',
                  onSale: item.onSale === true || item.onSale === 'true',
                  status: item.status || 'ACTIVE',
                  categoryId: item.categoryId,
                  specifications: item.specifications || null,
                  seo: item.seo || null,
                },
              });
              imported++;
            } else {
              // Upsert product (update if slug exists, create otherwise)
              await prisma.product.upsert({
                where: { slug: item.slug },
                update: {
                  name: item.name,
                  description: item.description || null,
                  price: parseFloat(item.price),
                  compareAtPrice: item.compareAtPrice ? parseFloat(item.compareAtPrice) : null,
                  stock: parseInt(item.stock || '0'),
                  badge: item.badge || null,
                  featured: item.featured === true || item.featured === 'true',
                  onSale: item.onSale === true || item.onSale === 'true',
                  status: item.status || 'ACTIVE',
                  categoryId: item.categoryId,
                  specifications: item.specifications || null,
                  seo: item.seo || null,
                },
                create: {
                  name: item.name,
                  slug: item.slug,
                  description: item.description || null,
                  price: parseFloat(item.price),
                  compareAtPrice: item.compareAtPrice ? parseFloat(item.compareAtPrice) : null,
                  stock: parseInt(item.stock || '0'),
                  badge: item.badge || null,
                  featured: item.featured === true || item.featured === 'true',
                  onSale: item.onSale === true || item.onSale === 'true',
                  status: item.status || 'ACTIVE',
                  categoryId: item.categoryId,
                  specifications: item.specifications || null,
                  seo: item.seo || null,
                },
              });
              imported++;
            }
          } catch (error: any) {
            errors.push({
              index: i,
              error: error.message || 'Failed to import item',
              data: item,
            });
          }
        }
        break;

      case 'categories':
        for (let i = 0; i < data.length; i++) {
          const item = data[i];

          try {
            // Validate required fields
            if (!validateCategoryData(item)) {
              errors.push({
                index: i,
                error: 'Missing required fields: name, slug',
                data: item,
              });
              continue;
            }

            if (mode === 'create') {
              // Create new category
              await prisma.category.create({
                data: {
                  name: item.name,
                  slug: item.slug,
                  description: item.description || null,
                  image: item.image || null,
                  order: parseInt(item.order || '0'),
                  isActive: item.isActive === true || item.isActive === 'true',
                  parentId: item.parentId || null,
                },
              });
              imported++;
            } else {
              // Upsert category
              await prisma.category.upsert({
                where: { slug: item.slug },
                update: {
                  name: item.name,
                  description: item.description || null,
                  image: item.image || null,
                  order: parseInt(item.order || '0'),
                  isActive: item.isActive === true || item.isActive === 'true',
                  parentId: item.parentId || null,
                },
                create: {
                  name: item.name,
                  slug: item.slug,
                  description: item.description || null,
                  image: item.image || null,
                  order: parseInt(item.order || '0'),
                  isActive: item.isActive === true || item.isActive === 'true',
                  parentId: item.parentId || null,
                },
              });
              imported++;
            }
          } catch (error: any) {
            errors.push({
              index: i,
              error: error.message || 'Failed to import item',
              data: item,
            });
          }
        }
        break;

      case 'tags':
        for (let i = 0; i < data.length; i++) {
          const item = data[i];

          try {
            // Validate required fields
            if (!validateTagData(item)) {
              errors.push({
                index: i,
                error: 'Missing required fields: name, slug',
                data: item,
              });
              continue;
            }

            if (mode === 'create') {
              // Create new tag
              await prisma.tag.create({
                data: {
                  name: item.name,
                  slug: item.slug,
                },
              });
              imported++;
            } else {
              // Upsert tag
              await prisma.tag.upsert({
                where: { slug: item.slug },
                update: {
                  name: item.name,
                },
                create: {
                  name: item.name,
                  slug: item.slug,
                },
              });
              imported++;
            }
          } catch (error: any) {
            errors.push({
              index: i,
              error: error.message || 'Failed to import item',
              data: item,
            });
          }
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unsupported resource: ${resource}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      imported,
      errors,
      total: data.length,
      success: errors.length === 0,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Failed to import data' },
      { status: 500 }
    );
  }
}

// Export wrapped handler with rate limiting (outermost) and appropriate permission
// Note: We use PRODUCTS_WRITE here but in reality should check based on resource
export const POST = withRateLimit(
  withPermission(Permission.PRODUCTS_WRITE, handlePOST),
  {
    limit: 5,
    window: 60,
    keyPrefix: 'import',
  }
);

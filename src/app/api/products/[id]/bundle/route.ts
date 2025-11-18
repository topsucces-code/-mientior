import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PDP_CONFIG } from '@/lib/constants';

/**
 * Normalize Prisma image type to frontend discriminated union
 * Maps: IMAGE -> 'image', VIDEO -> 'video', THREE_SIXTY -> '360'
 */
const normalizeImageType = (prismaType: string): 'image' | 'video' | '360' => {
  switch (prismaType) {
    case 'VIDEO':
      return 'video';
    case 'THREE_SIXTY':
      return '360';
    case 'IMAGE':
    default:
      return 'image';
  }
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Find the product
    const product = await prisma.product.findUnique({
      where: { id },
      select: { id: true, categoryId: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Strategy: Find products frequently bought together based on order history
    // 1. Get orders containing this product
    const ordersWithProduct = await prisma.order.findMany({
      where: {
        items: {
          some: { productId: id },
        },
        paymentStatus: 'PAID',
      },
      include: {
        items: {
          select: { productId: true },
        },
      },
      take: 100, // Limit for performance
    });

    // 2. Count co-purchased products
    const coPurchaseCounts: Record<string, number> = {};

    for (const order of ordersWithProduct) {
      for (const item of order.items) {
        if (item.productId !== id) {
          coPurchaseCounts[item.productId] =
            (coPurchaseCounts[item.productId] || 0) + 1;
        }
      }
    }

    // 3. Get top 3 most frequently co-purchased products
    const topProductIds = Object.entries(coPurchaseCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 3)
      .map(([productId]) => productId);

    // If not enough co-purchased products, fall back to category-based recommendations
    if (topProductIds.length < 3) {
      const categoryProducts = await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          status: 'ACTIVE',
          id: { not: id },
        },
        orderBy: { reviewCount: 'desc' },
        take: 3 - topProductIds.length,
        select: { id: true },
      });

      topProductIds.push(...categoryProducts.map((p) => p.id));
    }

    // 4. Fetch full product details
    const bundleProducts = await prisma.product.findMany({
      where: {
        id: { in: topProductIds },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        rating: true,
        reviewCount: true,
        badge: true,
        featured: true,
        onSale: true,
        description: true,
        images: {
          where: { order: 0 },
          take: 1,
          select: {
            url: true,
            alt: true,
            type: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        tags: {
          select: {
            tag: {
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

    // Handle empty bundle
    if (bundleProducts.length === 0) {
      return NextResponse.json(
        { bundleProducts: [] },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          },
        }
      );
    }

    // 5. Transform to response format with normalized image types
    const bundleProductsResponse = bundleProducts.map((p) => ({
      product: {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        images: p.images.map((img) => ({
          url: img.url,
          alt: img.alt,
          type: normalizeImageType(img.type),
        })),
        rating: p.rating,
        reviewCount: p.reviewCount,
        stock: p.stock,
        badge: p.badge,
        featured: p.featured,
        onSale: p.onSale,
        description: p.description,
        category: p.category,
        tags: p.tags.map((pt) => pt.tag),
      },
      discount: PDP_CONFIG.bundleDiscount, // Use config value (5%)
    }));

    return NextResponse.json(
      { bundleProducts: bundleProductsResponse },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching bundle products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bundle products' },
      { status: 500 }
    );
  }
}

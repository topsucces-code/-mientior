/**
 * Product Ranking Service
 *
 * Provides functions for calculating product popularity scores and boost factors.
 * Popularity = views * viewsWeight + sales * salesWeight
 * Boosts = inStock (+10%), featured (+20%), rating (+rating*5%)
 */

import { prisma } from '@/lib/prisma';
import type {
  PopularityConfig,
  BoostFactors,
  RankingScore,
  BatchUpdateResult,
  ProductRankingData,
  BatchUpdateOptions,
} from '@/types/ranking';

/**
 * Get popularity configuration from environment variables
 * Falls back to sensible defaults if not configured
 */
export function getPopularityConfig(): PopularityConfig {
  return {
    viewsWeight: parseFloat(process.env.RANKING_POPULARITY_VIEWS_WEIGHT || '0.3'),
    salesWeight: parseFloat(process.env.RANKING_POPULARITY_SALES_WEIGHT || '0.7'),
    inStockBoost: parseFloat(process.env.RANKING_BOOST_IN_STOCK || '10'),
    featuredBoost: parseFloat(process.env.RANKING_BOOST_FEATURED || '20'),
    ratingMultiplier: parseFloat(process.env.RANKING_BOOST_RATING_MULTIPLIER || '5'),
  };
}

/**
 * Calculate base popularity score from views and sales
 *
 * @param views - Number of product views
 * @param sales - Number of sales (order items)
 * @returns Weighted popularity score
 */
export function calculatePopularity(views: number, sales: number): number {
  const config = getPopularityConfig();
  const popularity = views * config.viewsWeight + sales * config.salesWeight;
  return Math.round(popularity);
}

/**
 * Calculate boost factors for a product
 *
 * @param product - Product ranking data
 * @returns Boost factors breakdown
 */
export function calculateBoostFactors(product: {
  inStock: boolean;
  featured: boolean;
  rating: number;
}): BoostFactors {
  const config = getPopularityConfig();

  const inStockBoost = product.inStock ? config.inStockBoost : 0;
  const featuredBoost = product.featured ? config.featuredBoost : 0;
  const ratingBoost = product.rating * config.ratingMultiplier;

  return {
    inStock: inStockBoost,
    featured: featuredBoost,
    rating: ratingBoost,
    total: inStockBoost + featuredBoost + ratingBoost,
  };
}

/**
 * Calculate complete ranking score with boosts
 *
 * @param product - Product ranking data
 * @returns Complete ranking score breakdown
 */
export function calculateBoostScore(product: ProductRankingData): RankingScore {
  const popularity = calculatePopularity(product.views, product.sales);
  const boostFactors = calculateBoostFactors({
    inStock: product.inStock,
    featured: product.featured,
    rating: product.rating,
  });

  const finalScore = Math.round(popularity * (1 + boostFactors.total / 100));

  return {
    popularity,
    boostScore: boostFactors.total,
    finalScore,
    boostFactors,
  };
}

/**
 * Get product analytics data (views and sales)
 *
 * @param productId - Product ID
 * @returns Analytics data with views and sales counts
 */
async function getProductAnalytics(productId: string): Promise<{ views: number; sales: number }> {
  // Get sales count from order items
  const salesCount = await prisma.orderItem.count({
    where: { productId },
  });

  // Get views from analytics (if available)
  // For now, we'll use a simplified approach - in production, you'd query an analytics table
  const analyticsRecord = await prisma.analytics.findFirst({
    where: {
      page: `/products/${productId}`,
    },
  });

  const views = analyticsRecord?.views || 0;

  return { views, sales: salesCount };
}

/**
 * Update popularity score for a single product
 *
 * @param productId - Product ID to update
 * @returns Updated product with new popularity score
 */
export async function updateProductPopularity(productId: string): Promise<void> {
  try {
    // Fetch product data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        rating: true,
        featured: true,
        stock: true,
      },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    // Get analytics data
    const { views, sales } = await getProductAnalytics(productId);

    // Calculate popularity
    const popularity = calculatePopularity(views, sales);

    // Update product
    await prisma.product.update({
      where: { id: productId },
      data: { popularity },
    });
  } catch (error) {
    console.error(`Failed to update popularity for product ${productId}:`, error);
    throw error;
  }
}

/**
 * Batch update popularity scores for multiple products
 *
 * @param options - Batch update options (filters, batch size, progress callback)
 * @returns Batch update result with statistics
 */
export async function batchUpdatePopularity(
  options: BatchUpdateOptions = {}
): Promise<BatchUpdateResult> {
  const {
    batchSize = 100,
    categoryId,
    vendorId,
    status = 'ACTIVE',
    onlyUninitialized = false,
    onProgress,
  } = options;

  const startTime = Date.now();
  const result: BatchUpdateResult = {
    total: 0,
    updated: 0,
    failed: 0,
    errors: [],
    duration: 0,
  };

  try {
    // Build where clause for filters
    const where: any = { status };
    if (categoryId) where.categoryId = categoryId;
    if (vendorId) where.vendorId = vendorId;
    if (onlyUninitialized) where.popularity = 0;

    // Get total count
    result.total = await prisma.product.count({ where });

    if (result.total === 0) {
      console.log('No products found matching filters');
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`Processing ${result.total} products in batches of ${batchSize}...`);

    // Track popularity stats
    const popularityScores: number[] = [];

    // Process in batches
    let skip = 0;
    while (skip < result.total) {
      const products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          rating: true,
          featured: true,
          stock: true,
        },
        skip,
        take: batchSize,
      });

      // Extract product IDs for bulk analytics query
      const productIds = products.map(p => p.id);

      // Fetch sales counts for all products in batch with a single query
      const salesByProduct = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          productId: { in: productIds },
        },
        _count: {
          productId: true,
        },
      });

      // Create a map of productId -> sales count
      const salesMap = new Map<string, number>();
      salesByProduct.forEach(item => {
        salesMap.set(item.productId, item._count.productId);
      });

      // Fetch views for all products in batch with a single query
      // Build an array of page paths for this batch
      const pagePaths = productIds.map(id => `/products/${id}`);
      const analyticsRecords = await prisma.analytics.findMany({
        where: {
          page: { in: pagePaths },
        },
        select: {
          page: true,
          views: true,
        },
      });

      // Create a map of productId -> views count
      const viewsMap = new Map<string, number>();
      analyticsRecords.forEach(record => {
        // Extract product ID from page path (/products/{id})
        const productId = record.page.split('/').pop();
        if (productId) {
          viewsMap.set(productId, record.views);
        }
      });

      // Process each product with pre-fetched analytics data
      for (const product of products) {
        try {
          // Get analytics from pre-fetched maps
          const views = viewsMap.get(product.id) || 0;
          const sales = salesMap.get(product.id) || 0;

          // Calculate popularity
          const popularity = calculatePopularity(views, sales);
          popularityScores.push(popularity);

          // Update product
          await prisma.product.update({
            where: { id: product.id },
            data: { popularity },
          });

          result.updated++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            productId: product.id,
            productName: product.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      skip += batchSize;
      onProgress?.(skip, result.total);
    }

    // Calculate stats
    if (popularityScores.length > 0) {
      result.averagePopularity = Math.round(
        popularityScores.reduce((a, b) => a + b, 0) / popularityScores.length
      );
      result.maxPopularity = Math.max(...popularityScores);
      result.minPopularity = Math.min(...popularityScores);
    }

    result.duration = Date.now() - startTime;

    console.log(`Batch update completed: ${result.updated} updated, ${result.failed} failed in ${result.duration}ms`);

    return result;
  } catch (error) {
    console.error('Batch update failed:', error);
    result.duration = Date.now() - startTime;
    throw error;
  }
}

/**
 * Get ranking statistics for products
 *
 * @returns Statistics about product popularity distribution
 */
export async function getRankingStatistics() {
  const stats = await prisma.product.aggregate({
    _avg: { popularity: true, rating: true },
    _max: { popularity: true, rating: true },
    _min: { popularity: true },
    _count: true,
  });

  const featuredCount = await prisma.product.count({
    where: { featured: true },
  });

  const inStockCount = await prisma.product.count({
    where: { stock: { gt: 0 } },
  });

  return {
    totalProducts: stats._count,
    averagePopularity: Math.round(stats._avg.popularity || 0),
    maxPopularity: stats._max.popularity || 0,
    minPopularity: stats._min.popularity || 0,
    averageRating: stats._avg.rating || 0,
    maxRating: stats._max.rating || 0,
    featuredCount,
    inStockCount,
    featuredPercentage: stats._count > 0 ? Math.round((featuredCount / stats._count) * 100) : 0,
    inStockPercentage: stats._count > 0 ? Math.round((inStockCount / stats._count) * 100) : 0,
  };
}

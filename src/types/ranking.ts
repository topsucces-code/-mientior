/**
 * Product Ranking System Types
 *
 * Defines types for popularity calculation, boost factors, and ranking scores.
 * Used by the ranking service to compute product relevance scores.
 */

/**
 * Configuration for popularity calculation weights
 */
export interface PopularityConfig {
  /** Weight for product views in popularity calculation (0.0-1.0) */
  viewsWeight: number;
  /** Weight for sales in popularity calculation (0.0-1.0) */
  salesWeight: number;
  /** Percentage boost for in-stock products (e.g., 10 = +10%) */
  inStockBoost: number;
  /** Percentage boost for featured products (e.g., 20 = +20%) */
  featuredBoost: number;
  /** Multiplier for rating-based boost (e.g., 5 = rating * 5%) */
  ratingMultiplier: number;
}

/**
 * Individual boost factors for a product
 */
export interface BoostFactors {
  /** Boost from being in stock */
  inStock: number;
  /** Boost from being featured */
  featured: number;
  /** Boost from product rating */
  rating: number;
  /** Total combined boost percentage */
  total: number;
}

/**
 * Complete ranking score breakdown for a product
 */
export interface RankingScore {
  /** Base popularity score (views * weight + sales * weight) */
  popularity: number;
  /** Total boost percentage from all factors */
  boostScore: number;
  /** Final score (popularity * (1 + boostScore/100)) */
  finalScore: number;
  /** Breakdown of individual boost factors */
  boostFactors: BoostFactors;
}

/**
 * Result of batch popularity update operation
 */
export interface BatchUpdateResult {
  /** Total number of products processed */
  total: number;
  /** Number of products successfully updated */
  updated: number;
  /** Number of products that failed to update */
  failed: number;
  /** Array of error messages for failed updates */
  errors: Array<{
    productId: string;
    productName?: string;
    error: string;
  }>;
  /** Duration of the batch operation in milliseconds */
  duration: number;
  /** Average popularity score across all updated products */
  averagePopularity?: number;
  /** Highest popularity score found */
  maxPopularity?: number;
  /** Lowest popularity score found */
  minPopularity?: number;
}

/**
 * Product data required for ranking calculations
 */
export interface ProductRankingData {
  /** Product ID */
  productId: string;
  /** Product name (for logging/debugging) */
  productName?: string;
  /** Number of product views */
  views: number;
  /** Number of sales (order items) */
  sales: number;
  /** Product rating (0-5) */
  rating: number;
  /** Whether product is featured */
  featured: boolean;
  /** Whether product is in stock (stock > 0) */
  inStock: boolean;
  /** Current popularity score (for comparison) */
  currentPopularity?: number;
}

/**
 * Options for batch update operations
 */
export interface BatchUpdateOptions {
  /** Number of products to process per batch (default: 100) */
  batchSize?: number;
  /** Filter by category ID */
  categoryId?: string;
  /** Filter by vendor ID */
  vendorId?: string;
  /** Filter by product status */
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  /** Only update products with popularity = 0 */
  onlyUninitialized?: boolean;
  /** Progress callback for monitoring */
  onProgress?: (processed: number, total: number) => void;
}

/**
 * Analytics data for popularity calculation
 */
export interface ProductAnalytics {
  /** Product ID */
  productId: string;
  /** Total views (from analytics or tracking) */
  views: number;
  /** Total sales (count of order items) */
  sales: number;
  /** Last updated timestamp */
  lastUpdated: Date;
}

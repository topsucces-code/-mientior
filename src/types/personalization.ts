/**
 * User Personalization System Types
 *
 * Defines types for user preference calculation, personalized search boosts,
 * and batch processing operations. Used by the personalization service to
 * compute and apply user-specific relevance boosts.
 *
 * @module types/personalization
 */

import type { SupportedLocale } from './index'

/**
 * Individual preference score for a category or brand
 * Represents a user's affinity towards a specific category/brand
 */
export interface PreferenceScore {
  /** Category or Brand ID */
  id: string
  /** Display name for the category/brand */
  name: string
  /** Normalized score (0-100) representing user affinity */
  score: number
  /** Boost percentage to apply in search (e.g., 15 = +15%) */
  boost: number
  /** Metadata about how the score was calculated */
  metadata: {
    /** Number of product views in this category/brand */
    views: number
    /** Number of searches related to this category/brand */
    searches: number
    /** Number of purchases in this category/brand */
    purchases: number
    /** Total revenue from purchases (for weighted scoring) */
    revenue?: number
  }
}

/**
 * Search pattern data for a user
 * Tracks search behavior for preference calculation
 */
export interface SearchPattern {
  /** Most frequently searched queries */
  topQueries: Array<{
    query: string
    count: number
    lastSearched: Date | string
  }>
  /** Preferred locale based on search history */
  preferredLocale: SupportedLocale
  /** Average searches per day */
  avgSearchesPerDay?: number
}

/**
 * Complete user preferences structure
 * Stored in User.preferences JSON field
 */
export interface UserPreferences {
  /** Top favorite categories with scores and boosts */
  favoriteCategories: PreferenceScore[]
  /** Top favorite brands with scores and boosts */
  favoriteBrands: PreferenceScore[]
  /** Search behavior patterns */
  searchPatterns: SearchPattern
  /** Timestamp of last preference calculation */
  lastCalculated: Date | string
  /** Version of the calculation algorithm used */
  algorithmVersion?: string
}

/**
 * Configuration for personalization calculation
 * Read from environment variables with defaults
 */
export interface PersonalizationConfig {
  /** Weight for purchase history in preference calculation (0.0-1.0) */
  purchasesWeight: number
  /** Weight for search history in preference calculation (0.0-1.0) */
  searchesWeight: number
  /** Weight for product views in preference calculation (0.0-1.0) */
  viewsWeight: number
  /** Percentage boost for favorite categories (e.g., 15 = +15%) */
  categoryBoost: number
  /** Percentage boost for favorite brands (e.g., 10 = +10%) */
  brandBoost: number
  /** Minimum interactions required to consider a category/brand as favorite */
  minInteractions: number
  /** Maximum number of favorite categories to track */
  maxCategories: number
  /** Maximum number of favorite brands to track */
  maxBrands: number
}

/**
 * Aggregated user behavior data from various sources
 * Used as input for preference calculation
 */
export interface UserBehaviorData {
  /** User ID */
  userId: string
  /** Category interaction data */
  categories: Array<{
    categoryId: string
    categoryName: string
    views: number
    searches: number
    purchases: number
    revenue: number
  }>
  /** Brand/vendor interaction data */
  brands: Array<{
    brandId: string
    brandName: string
    views: number
    searches: number
    purchases: number
    revenue: number
  }>
  /** Search history data */
  searches: Array<{
    query: string
    count: number
    lastSearched: Date
  }>
  /** Total interaction counts */
  totals: {
    totalViews: number
    totalSearches: number
    totalPurchases: number
    totalRevenue: number
  }
}

/**
 * Options for batch preference calculation
 */
export interface BatchCalculateOptions {
  /** Number of users to process per batch (default: 50) */
  batchSize?: number
  /** Calculate for a specific user only */
  userId?: string
  /** Only calculate for users with null preferences */
  onlyUninitialized?: boolean
  /** Minimum interactions required (overrides config) */
  minInteractions?: number
  /** Progress callback for monitoring */
  onProgress?: (processed: number, total: number) => void
  /** Dry run mode - calculate but don't save */
  dryRun?: boolean
}

/**
 * Result of batch preference calculation
 */
export interface BatchCalculateResult {
  /** Total number of users processed */
  total: number
  /** Number of users successfully updated */
  updated: number
  /** Number of users that failed to update */
  failed: number
  /** Number of users skipped (insufficient data) */
  skipped: number
  /** Array of error messages for failed updates */
  errors: Array<{
    userId: string
    error: string
  }>
  /** Duration of the batch operation in milliseconds */
  duration: number
  /** Statistics about the calculation */
  statistics: {
    /** Average number of favorite categories per user */
    avgCategoriesPerUser: number
    /** Average number of favorite brands per user */
    avgBrandsPerUser: number
    /** Average preference score */
    avgScore: number
    /** Users with sufficient data for personalization */
    usersWithPreferences: number
  }
}

/**
 * Personalization statistics for monitoring
 */
export interface PersonalizationStatistics {
  /** Total users in the system */
  totalUsers: number
  /** Users with calculated preferences */
  usersWithPreferences: number
  /** Percentage of users with preferences */
  coveragePercentage: number
  /** Average categories per user */
  avgCategoriesPerUser: number
  /** Average brands per user */
  avgBrandsPerUser: number
  /** Most recent calculation timestamp */
  lastCalculation: Date | string | null
  /** Oldest calculation timestamp */
  oldestCalculation: Date | string | null
  /** Users needing recalculation (>7 days old) */
  usersNeedingRecalculation: number
  /** Top categories across all users */
  topCategories: Array<{ id: string; name: string; userCount: number }>
  /** Top brands across all users */
  topBrands: Array<{ id: string; name: string; userCount: number }>
}

/**
 * Personalization boost result for search
 * Applied to search relevance scoring
 */
export interface PersonalizationBoost {
  /** Whether personalization was applied */
  applied: boolean
  /** User ID if personalization was applied */
  userId?: string
  /** Category boost applied (decimal, e.g., 0.15 for 15%) */
  categoryBoost: number
  /** Brand boost applied (decimal, e.g., 0.10 for 10%) */
  brandBoost: number
  /** Total boost applied */
  totalBoost: number
  /** IDs of matched favorite categories */
  matchedCategories: string[]
  /** IDs of matched favorite brands */
  matchedBrands: string[]
}

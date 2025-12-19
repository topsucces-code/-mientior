/**
 * User Personalization Service
 *
 * Provides functions for calculating user preferences based on behavior data
 * (searches, views, purchases) and applying personalization boosts to search.
 *
 * Preference calculation uses weighted scoring:
 * - Purchases: 50% weight (highest intent signal)
 * - Searches: 30% weight (interest signal)
 * - Views: 20% weight (awareness signal)
 *
 * @module personalization-service
 */

import { prisma } from '@/lib/prisma'
import { invalidateUserPreferencesCache } from '@/lib/redis'
import type {
  PersonalizationConfig,
  UserBehaviorData,
  UserPreferences,
  PreferenceScore,
  BatchCalculateOptions,
  BatchCalculateResult,
  PersonalizationStatistics,
} from '@/types/personalization'

// Algorithm version for tracking preference calculation changes
const ALGORITHM_VERSION = '1.0.0'

/**
 * Get personalization configuration from environment variables
 * Falls back to sensible defaults if not configured
 */
export function getPersonalizationConfig(): PersonalizationConfig {
  return {
    purchasesWeight: parseFloat(process.env.PERSONALIZATION_PURCHASES_WEIGHT || '0.5'),
    searchesWeight: parseFloat(process.env.PERSONALIZATION_SEARCHES_WEIGHT || '0.3'),
    viewsWeight: parseFloat(process.env.PERSONALIZATION_VIEWS_WEIGHT || '0.2'),
    categoryBoost: parseFloat(process.env.PERSONALIZATION_CATEGORY_BOOST || '15'),
    brandBoost: parseFloat(process.env.PERSONALIZATION_BRAND_BOOST || '10'),
    minInteractions: parseInt(process.env.PERSONALIZATION_MIN_INTERACTIONS || '3', 10),
    maxCategories: 5,
    maxBrands: 3,
  }
}

/**
 * Get user behavior data aggregated from various sources
 *
 * @param userId - User ID to fetch behavior data for
 * @returns Aggregated behavior data from searches, views, and purchases
 */
export async function getUserBehaviorData(userId: string): Promise<UserBehaviorData> {
  // Fetch search history grouped by query
  const searchData = await prisma.searchLog.groupBy({
    by: ['query'],
    where: { userId },
    _count: { query: true },
    _max: { timestamp: true },
    orderBy: { _count: { query: 'desc' } },
    take: 50,
  })

  // Fetch product views with category/vendor info
  // Using SearchLog.clickedProductId to track product interactions (views via search clicks)
  const viewsData = await prisma.$queryRaw<Array<{
    category_id: string
    category_name: string
    vendor_id: string
    vendor_name: string
    view_count: bigint
  }>>`
    SELECT 
      p.category_id,
      c.name as category_name,
      p.vendor_id,
      v.business_name as vendor_name,
      COUNT(*) as view_count
    FROM search_logs sl
    JOIN products p ON sl.clicked_product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    WHERE sl.user_id = ${userId}
      AND sl.clicked_product_id IS NOT NULL
    GROUP BY p.category_id, c.name, p.vendor_id, v.business_name
  `.catch(() => []) // Return empty if query fails

  // Fetch search-to-click data to aggregate searches by category/brand
  // This links searches to the products users clicked, giving us category/brand search affinity
  const searchClickData = await prisma.$queryRaw<Array<{
    category_id: string
    category_name: string
    vendor_id: string
    vendor_name: string
    search_count: bigint
  }>>`
    SELECT 
      p.category_id,
      c.name as category_name,
      p.vendor_id,
      v.business_name as vendor_name,
      COUNT(DISTINCT sl.query) as search_count
    FROM search_logs sl
    JOIN products p ON sl.clicked_product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    WHERE sl.user_id = ${userId}
      AND sl.clicked_product_id IS NOT NULL
    GROUP BY p.category_id, c.name, p.vendor_id, v.business_name
  `.catch(() => [])

  // Fetch purchase history with category/vendor info
  const purchaseData = await prisma.$queryRaw<Array<{
    category_id: string
    category_name: string
    vendor_id: string
    vendor_name: string
    purchase_count: bigint
    total_revenue: number
  }>>`
    SELECT 
      p.category_id,
      c.name as category_name,
      p.vendor_id,
      v.business_name as vendor_name,
      SUM(oi.quantity) as purchase_count,
      SUM(oi.quantity * oi.price) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    JOIN products p ON oi.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN vendors v ON p.vendor_id = v.id
    WHERE o.user_id = ${userId}
      AND o.status <> 'CANCELLED'
    GROUP BY p.category_id, c.name, p.vendor_id, v.business_name
  `.catch(() => [])

  // Aggregate category data
  const categoryMap = new Map<string, {
    categoryId: string
    categoryName: string
    views: number
    searches: number
    purchases: number
    revenue: number
  }>()

  // Add views data
  for (const view of viewsData) {
    if (!view.category_id) continue
    const existing = categoryMap.get(view.category_id) || {
      categoryId: view.category_id,
      categoryName: view.category_name || 'Unknown',
      views: 0,
      searches: 0,
      purchases: 0,
      revenue: 0,
    }
    existing.views += Number(view.view_count)
    categoryMap.set(view.category_id, existing)
  }

  // Add purchase data
  for (const purchase of purchaseData) {
    if (!purchase.category_id) continue
    const existing = categoryMap.get(purchase.category_id) || {
      categoryId: purchase.category_id,
      categoryName: purchase.category_name || 'Unknown',
      views: 0,
      searches: 0,
      purchases: 0,
      revenue: 0,
    }
    existing.purchases += Number(purchase.purchase_count)
    existing.revenue += Number(purchase.total_revenue) || 0
    categoryMap.set(purchase.category_id, existing)
  }

  // Add search click data to categories (Comment 3: aggregate searches by category)
  for (const searchClick of searchClickData) {
    if (!searchClick.category_id) continue
    const existing = categoryMap.get(searchClick.category_id) || {
      categoryId: searchClick.category_id,
      categoryName: searchClick.category_name || 'Unknown',
      views: 0,
      searches: 0,
      purchases: 0,
      revenue: 0,
    }
    existing.searches += Number(searchClick.search_count)
    categoryMap.set(searchClick.category_id, existing)
  }

  // Aggregate brand data
  const brandMap = new Map<string, {
    brandId: string
    brandName: string
    views: number
    searches: number
    purchases: number
    revenue: number
  }>()

  // Add views data
  for (const view of viewsData) {
    if (!view.vendor_id) continue
    const existing = brandMap.get(view.vendor_id) || {
      brandId: view.vendor_id,
      brandName: view.vendor_name || 'Unknown',
      views: 0,
      searches: 0,
      purchases: 0,
      revenue: 0,
    }
    existing.views += Number(view.view_count)
    brandMap.set(view.vendor_id, existing)
  }

  // Add purchase data
  for (const purchase of purchaseData) {
    if (!purchase.vendor_id) continue
    const existing = brandMap.get(purchase.vendor_id) || {
      brandId: purchase.vendor_id,
      brandName: purchase.vendor_name || 'Unknown',
      views: 0,
      searches: 0,
      purchases: 0,
      revenue: 0,
    }
    existing.purchases += Number(purchase.purchase_count)
    existing.revenue += Number(purchase.total_revenue) || 0
    brandMap.set(purchase.vendor_id, existing)
  }

  // Add search click data to brands (Comment 3: aggregate searches by brand)
  for (const searchClick of searchClickData) {
    if (!searchClick.vendor_id) continue
    const existing = brandMap.get(searchClick.vendor_id) || {
      brandId: searchClick.vendor_id,
      brandName: searchClick.vendor_name || 'Unknown',
      views: 0,
      searches: 0,
      purchases: 0,
      revenue: 0,
    }
    existing.searches += Number(searchClick.search_count)
    brandMap.set(searchClick.vendor_id, existing)
  }

  // Calculate totals
  const categories = Array.from(categoryMap.values())
  const brands = Array.from(brandMap.values())

  const totals = {
    totalViews: categories.reduce((sum, c) => sum + c.views, 0),
    // Use actual searches aggregated by category/brand, not just raw search count
    totalSearches: categories.reduce((sum, c) => sum + c.searches, 0),
    totalPurchases: categories.reduce((sum, c) => sum + c.purchases, 0),
    totalRevenue: categories.reduce((sum, c) => sum + c.revenue, 0),
  }

  return {
    userId,
    categories,
    brands,
    searches: searchData.map(s => ({
      query: s.query,
      count: s._count.query,
      lastSearched: s._max.timestamp || new Date(),
    })),
    totals,
  }
}

/**
 * Calculate preference scores from behavior data
 *
 * @param behaviorData - Aggregated user behavior data
 * @param minInteractionsOverride - Optional override for minimum interactions threshold
 * @returns Calculated preference scores for categories and brands
 */
export function calculatePreferenceScores(
  behaviorData: UserBehaviorData,
  minInteractionsOverride?: number
): {
  categories: PreferenceScore[]
  brands: PreferenceScore[]
} {
  const config = getPersonalizationConfig()
  // Use override if provided, otherwise use config value (Comment 4)
  const minInteractions = minInteractionsOverride ?? config.minInteractions

  // Calculate weighted scores for categories
  const categoryScores = behaviorData.categories.map(cat => {
    const totalInteractions = cat.views + cat.searches + cat.purchases
    if (totalInteractions < minInteractions) {
      return null
    }

    // Weighted score calculation
    const rawScore =
      cat.purchases * config.purchasesWeight +
      cat.searches * config.searchesWeight +
      cat.views * config.viewsWeight

    return {
      id: cat.categoryId,
      name: cat.categoryName,
      rawScore,
      metadata: {
        views: cat.views,
        searches: cat.searches,
        purchases: cat.purchases,
        revenue: cat.revenue,
      },
    }
  }).filter((s): s is NonNullable<typeof s> => s !== null)

  // Calculate weighted scores for brands
  const brandScores = behaviorData.brands.map(brand => {
    const totalInteractions = brand.views + brand.searches + brand.purchases
    if (totalInteractions < minInteractions) {
      return null
    }

    const rawScore =
      brand.purchases * config.purchasesWeight +
      brand.searches * config.searchesWeight +
      brand.views * config.viewsWeight

    return {
      id: brand.brandId,
      name: brand.brandName,
      rawScore,
      metadata: {
        views: brand.views,
        searches: brand.searches,
        purchases: brand.purchases,
        revenue: brand.revenue,
      },
    }
  }).filter((s): s is NonNullable<typeof s> => s !== null)

  // Normalize scores to 0-100 range
  const maxCategoryScore = Math.max(...categoryScores.map(s => s.rawScore), 1)
  const maxBrandScore = Math.max(...brandScores.map(s => s.rawScore), 1)

  const normalizedCategories: PreferenceScore[] = categoryScores
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, config.maxCategories)
    .map(s => ({
      id: s.id,
      name: s.name,
      score: Math.round((s.rawScore / maxCategoryScore) * 100),
      boost: config.categoryBoost,
      metadata: s.metadata,
    }))

  const normalizedBrands: PreferenceScore[] = brandScores
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, config.maxBrands)
    .map(s => ({
      id: s.id,
      name: s.name,
      score: Math.round((s.rawScore / maxBrandScore) * 100),
      boost: config.brandBoost,
      metadata: s.metadata,
    }))

  return {
    categories: normalizedCategories,
    brands: normalizedBrands,
  }
}

/**
 * Calculate and save user preferences
 *
 * @param userId - User ID to calculate preferences for
 * @param minInteractionsOverride - Optional override for minimum interactions threshold
 * @returns Calculated preferences or null if insufficient data
 */
export async function calculateUserPreferences(
  userId: string,
  minInteractionsOverride?: number
): Promise<UserPreferences | null> {
  try {
    console.log(`[personalization-service] Calculating preferences for user ${userId}`)

    // Get behavior data
    const behaviorData = await getUserBehaviorData(userId)

    // Check if user has enough data
    const totalInteractions =
      behaviorData.totals.totalViews +
      behaviorData.totals.totalSearches +
      behaviorData.totals.totalPurchases

    const config = getPersonalizationConfig()
    // Use override if provided (Comment 4)
    const minInteractions = minInteractionsOverride ?? config.minInteractions
    if (totalInteractions < minInteractions) {
      console.log(`[personalization-service] User ${userId} has insufficient data (${totalInteractions} interactions, min: ${minInteractions})`)
      return null
    }

    // Calculate scores with minInteractions override
    const { categories, brands } = calculatePreferenceScores(behaviorData, minInteractionsOverride)

    // Build preferences object
    const preferences: UserPreferences = {
      favoriteCategories: categories,
      favoriteBrands: brands,
      searchPatterns: {
        topQueries: behaviorData.searches.slice(0, 10).map(s => ({
          query: s.query,
          count: s.count,
          lastSearched: s.lastSearched,
        })),
        preferredLocale: 'fr', // Default, could be calculated from search history
      },
      lastCalculated: new Date(),
      algorithmVersion: ALGORITHM_VERSION,
    }

    // Save to database
    await prisma.users.update({
      where: { id: userId },
      data: { preferences: preferences as any },
    })

    console.log(`[personalization-service] Saved preferences for user ${userId}: ${categories.length} categories, ${brands.length} brands`)

    return preferences
  } catch (error) {
    console.error(`[personalization-service] Error calculating preferences for user ${userId}:`, error)
    throw error
  }
}

/**
 * Batch calculate preferences for multiple users
 *
 * @param options - Batch calculation options
 * @returns Batch calculation result with statistics
 */
export async function batchCalculatePreferences(
  options: BatchCalculateOptions = {}
): Promise<BatchCalculateResult> {
  const {
    batchSize = 50,
    userId,
    onlyUninitialized = false,
    minInteractions: minInteractionsOverride,
    onProgress,
    dryRun = false,
  } = options

  const startTime = Date.now()
  const errors: Array<{ userId: string; error: string }> = []
  let updated = 0
  let failed = 0
  let skipped = 0
  let totalCategories = 0
  let totalBrands = 0
  let totalScore = 0

  try {
    // Build where clause
    const whereClause: any = {}
    if (userId) {
      whereClause.id = userId
    }
    if (onlyUninitialized) {
      whereClause.preferences = null
    }

    // Get total count
    const total = await prisma.users.count({ where: whereClause })

    if (total === 0) {
      return {
        total: 0,
        updated: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        duration: Date.now() - startTime,
        statistics: {
          avgCategoriesPerUser: 0,
          avgBrandsPerUser: 0,
          avgScore: 0,
          usersWithPreferences: 0,
        },
      }
    }

    console.log(`[personalization-service] Starting batch calculation for ${total} users (batch size: ${batchSize})`)

    // Process in batches
    let processed = 0
    let cursor: string | undefined

    while (processed < total) {
      const users = await prisma.users.findMany({
        where: whereClause,
        select: { id: true },
        take: batchSize,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'asc' },
      })

      if (users.length === 0) break

      for (const user of users) {
        try {
          if (dryRun) {
            // In dry run, just calculate without saving
            const behaviorData = await getUserBehaviorData(user.id)
            // Pass minInteractionsOverride to calculatePreferenceScores (Comment 4)
            const { categories, brands } = calculatePreferenceScores(behaviorData, minInteractionsOverride)
            
            if (categories.length > 0 || brands.length > 0) {
              updated++
              totalCategories += categories.length
              totalBrands += brands.length
              totalScore += categories.reduce((sum, c) => sum + c.score, 0) / (categories.length || 1)
            } else {
              skipped++
            }
          } else {
            // Pass minInteractionsOverride to calculateUserPreferences (Comment 4)
            const preferences = await calculateUserPreferences(user.id, minInteractionsOverride)
            
            if (preferences) {
              updated++
              totalCategories += preferences.favoriteCategories.length
              totalBrands += preferences.favoriteBrands.length
              totalScore += preferences.favoriteCategories.reduce((sum, c) => sum + c.score, 0) / (preferences.favoriteCategories.length || 1)
            } else {
              skipped++
            }
          }
        } catch (error) {
          failed++
          errors.push({
            userId: user.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }

        processed++
        if (onProgress) {
          onProgress(processed, total)
        }
      }

      cursor = users[users.length - 1]?.id
    }

    const duration = Date.now() - startTime
    console.log(`[personalization-service] Batch calculation completed in ${duration}ms: ${updated} updated, ${skipped} skipped, ${failed} failed`)

    return {
      total,
      updated,
      failed,
      skipped,
      errors,
      duration,
      statistics: {
        avgCategoriesPerUser: updated > 0 ? totalCategories / updated : 0,
        avgBrandsPerUser: updated > 0 ? totalBrands / updated : 0,
        avgScore: updated > 0 ? totalScore / updated : 0,
        usersWithPreferences: updated,
      },
    }
  } catch (error) {
    console.error('[personalization-service] Batch calculation failed:', error)
    throw error
  }
}

/**
 * Get personalization statistics
 *
 * @returns Current personalization statistics
 */
export async function getPreferenceStatistics(): Promise<PersonalizationStatistics> {
  try {
    // Get total users
    const totalUsers = await prisma.users.count()

    // Get users with preferences
    const usersWithPreferences = await prisma.users.count({
      where: { preferences: { not: null } },
    })

    // Get preference metadata using raw query
    const preferenceStats = await prisma.$queryRaw<Array<{
      avg_categories: number
      avg_brands: number
      min_calculated: Date | null
      max_calculated: Date | null
    }>>`
      SELECT 
        AVG(jsonb_array_length(preferences->'favoriteCategories')) as avg_categories,
        AVG(jsonb_array_length(preferences->'favoriteBrands')) as avg_brands,
        MIN((preferences->>'lastCalculated')::timestamp) as min_calculated,
        MAX((preferences->>'lastCalculated')::timestamp) as max_calculated
      FROM users
      WHERE preferences IS NOT NULL
    `.catch(() => [{
      avg_categories: 0,
      avg_brands: 0,
      min_calculated: null,
      max_calculated: null,
    }])

    // Get users needing recalculation (>7 days old)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const usersNeedingRecalculation = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM users
      WHERE preferences IS NOT NULL
        AND (preferences->>'lastCalculated')::timestamp < ${sevenDaysAgo}
    `.catch(() => [{ count: BigInt(0) }])

    // Get top categories across users
    const topCategories = await prisma.$queryRaw<Array<{
      id: string
      name: string
      user_count: bigint
    }>>`
      SELECT 
        cat->>'id' as id,
        cat->>'name' as name,
        COUNT(DISTINCT u.id) as user_count
      FROM users u,
        jsonb_array_elements(u.preferences->'favoriteCategories') as cat
      WHERE u.preferences IS NOT NULL
      GROUP BY cat->>'id', cat->>'name'
      ORDER BY user_count DESC
      LIMIT 5
    `.catch(() => [])

    // Get top brands across users
    const topBrands = await prisma.$queryRaw<Array<{
      id: string
      name: string
      user_count: bigint
    }>>`
      SELECT 
        brand->>'id' as id,
        brand->>'name' as name,
        COUNT(DISTINCT u.id) as user_count
      FROM users u,
        jsonb_array_elements(u.preferences->'favoriteBrands') as brand
      WHERE u.preferences IS NOT NULL
      GROUP BY brand->>'id', brand->>'name'
      ORDER BY user_count DESC
      LIMIT 5
    `.catch(() => [])

    const stats = preferenceStats[0] || {
      avg_categories: 0,
      avg_brands: 0,
      min_calculated: null,
      max_calculated: null,
    }

    return {
      totalUsers,
      usersWithPreferences,
      coveragePercentage: totalUsers > 0 ? (usersWithPreferences / totalUsers) * 100 : 0,
      avgCategoriesPerUser: Number(stats.avg_categories) || 0,
      avgBrandsPerUser: Number(stats.avg_brands) || 0,
      lastCalculation: stats.max_calculated,
      oldestCalculation: stats.min_calculated,
      usersNeedingRecalculation: Number(usersNeedingRecalculation[0]?.count || 0),
      topCategories: topCategories.map(c => ({
        id: c.id,
        name: c.name,
        userCount: Number(c.user_count),
      })),
      topBrands: topBrands.map(b => ({
        id: b.id,
        name: b.name,
        userCount: Number(b.user_count),
      })),
    }
  } catch (error) {
    console.error('[personalization-service] Error getting statistics:', error)
    throw error
  }
}

/**
 * Get user preferences from database
 *
 * @param userId - User ID
 * @returns User preferences or null
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { preferences: true },
    })

    return user?.preferences as UserPreferences | null
  } catch (error) {
    console.error(`[personalization-service] Error getting preferences for user ${userId}:`, error)
    return null
  }
}

/**
 * Invalidate user preferences (force recalculation)
 * Also invalidates the Redis cache for this user (Comment 8)
 *
 * @param userId - User ID
 */
export async function invalidateUserPreferences(userId: string): Promise<void> {
  try {
    // Update database
    await prisma.users.update({
      where: { id: userId },
      data: { preferences: null },
    })
    
    // Also invalidate Redis cache (Comment 8)
    await invalidateUserPreferencesCache(userId)
    
    console.log(`[personalization-service] Invalidated preferences and cache for user ${userId}`)
  } catch (error) {
    console.error(`[personalization-service] Error invalidating preferences for user ${userId}:`, error)
    throw error
  }
}

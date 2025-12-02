/**
 * MeiliSearch Dynamic Facets Implementation
 *
 * Computes facets (filters) dynamically using MeiliSearch's facetDistribution feature.
 * Provides instant facet computation (< 10ms typical) with:
 * - Price range (min/max from facetStats)
 * - Categories (with counts)
 * - Brands/Vendors (with counts)
 * - Colors (with counts)
 * - Sizes (with counts, sorted logically)
 *
 * @module meilisearch-facets
 */

import { getIndex, isAvailable } from './meilisearch-client'
import { prisma } from './prisma'
import { redis, getCachedData } from './redis'
import type { AvailableFilters, SupportedLocale } from '@/types'
import type { FacetsComputeOptions } from './facets-service'

/**
 * Size order for logical sorting (smallest to largest)
 */
const SIZE_ORDER = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']

/**
 * Sort sizes by logical order
 */
function sortSizes(sizes: Array<{ value: string; count: number }>): Array<{ value: string; count: number }> {
  return sizes.sort((a, b) => {
    const aIndex = SIZE_ORDER.indexOf(a.value.toUpperCase())
    const bIndex = SIZE_ORDER.indexOf(b.value.toUpperCase())

    // Both in SIZE_ORDER
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }

    // Only a in SIZE_ORDER
    if (aIndex !== -1) return -1

    // Only b in SIZE_ORDER
    if (bIndex !== -1) return 1

    // Neither in SIZE_ORDER - sort alphabetically
    return a.value.localeCompare(b.value)
  })
}

/**
 * Compute facets using MeiliSearch
 *
 * Uses MeiliSearch's facetDistribution and facetStats features for instant facet computation.
 * Resolves category and brand names from IDs using Prisma (with Redis caching).
 *
 * @param options - Query and filters
 * @returns Available filters with counts
 */
export async function computeFacetsWithMeiliSearch(
  options: FacetsComputeOptions,
  locale?: SupportedLocale
): Promise<AvailableFilters> {
  const startTime = Date.now()

  try {
    // Check availability
    if (!await isAvailable()) {
      console.warn('[meilisearch-facets] MeiliSearch unavailable, returning empty facets')
      return getEmptyFacets()
    }

    const { query, filters = {} } = options
    const index = getIndex('products')

    // Build filter conditions (same as meilisearch-search.ts)
    const filterConditions = buildFilterConditions(filters)

    // Execute search with facets (limit: 0 since we only need facets, not results)
    const searchResults = await index.search(query || '', {
      filter: filterConditions.length > 0 ? filterConditions : undefined,
      limit: 0, // We don't need actual results, only facets
      facets: ['categoryId', 'vendorId', 'variants.color', 'variants.size'],
    })

    // Extract facet distribution
    const facetDistribution = searchResults.facetDistribution || {}
    const facetStats = searchResults.facetStats || {}

    // Get price range from facetStats
    const priceStats = facetStats.price || { min: 0, max: 100000 }
    const priceRange = {
      min: priceStats.min || 0,
      max: priceStats.max || 100000,
    }

    // Get category and brand IDs from facets
    const categoryIds = Object.keys(facetDistribution.categoryId || {})
    const brandIds = Object.keys(facetDistribution.vendorId || {})

    // Resolve category and brand names (with caching)
    const [categoryNames, brandNames] = await Promise.all([
      resolveCategoryNames(categoryIds, locale),
      resolveBrandNames(brandIds),
    ])

    // Build categories array with names and counts
    const categories = categoryIds.map(id => ({
      id,
      name: categoryNames[id] || 'Unknown',
      count: facetDistribution.categoryId?.[id] || 0,
    })).sort((a, b) => b.count - a.count) // Sort by count desc

    // Build brands array with names and counts
    const brands = brandIds.map(id => ({
      id,
      name: brandNames[id] || 'Unknown',
      count: facetDistribution.vendorId?.[id] || 0,
    })).sort((a, b) => b.count - a.count) // Sort by count desc

    // Build colors array (values are already strings, no need to resolve)
    const colors = Object.entries(facetDistribution['variants.color'] || {}).map(([color, count]) => ({
      value: color,
      name: color, // TODO: Add color name translation in future
      count: count as number,
    })).sort((a, b) => b.count - a.count) // Sort by count desc

    // Build and sort sizes array
    const sizes = sortSizes(
      Object.entries(facetDistribution['variants.size'] || {}).map(([size, count]) => ({
        value: size,
        count: count as number,
      }))
    )

    const executionTime = Date.now() - startTime
    console.log(`[meilisearch-facets] Computed facets in ${executionTime}ms`)

    return {
      priceRange,
      categories,
      brands,
      colors,
      sizes,
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[meilisearch-facets] Facets computation failed after ${executionTime}ms:`, error)
    return getEmptyFacets()
  }
}

/**
 * Build filter conditions for MeiliSearch facets query
 *
 * Same logic as meilisearch-search.ts but without color/size filters
 * (since we want to see all available colors/sizes in facets)
 */
function buildFilterConditions(filters: any): string[] {
  const conditions: string[] = []

  // Base filters
  conditions.push(`status = "ACTIVE"`)
  conditions.push(`approvalStatus = "APPROVED"`)

  // Category filter
  if (filters.categoryId) {
    conditions.push(`categoryId = "${filters.categoryId}"`)
  } else if (filters.categories && filters.categories.length > 0) {
    const categoryFilter = filters.categories.map((id: string) => `categoryId = "${id}"`).join(' OR ')
    conditions.push(`(${categoryFilter})`)
  }

  // Brand filter
  if (filters.brands && filters.brands.length > 0) {
    const brandFilter = filters.brands.map((id: string) => `vendorId = "${id}"`).join(' OR ')
    conditions.push(`(${brandFilter})`)
  }

  // Price range
  if (filters.minPrice !== undefined) {
    conditions.push(`price >= ${filters.minPrice}`)
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`price <= ${filters.maxPrice}`)
  }

  // On sale
  if (filters.onSale) {
    conditions.push(`onSale = true`)
  }

  // Featured
  if (filters.featured) {
    conditions.push(`featured = true`)
  }

  // In stock
  if (filters.inStock) {
    conditions.push(`stock > 0`)
  }

  // Rating
  if (filters.rating !== undefined) {
    conditions.push(`rating >= ${filters.rating}`)
  }

  // Note: We don't include color/size filters here because we want to show
  // all available colors/sizes in the facets, even if some are filtered out

  return conditions
}

/**
 * Resolve category names from IDs with Redis caching
 *
 * Caches results for 1 hour to avoid repeated DB queries
 */
async function resolveCategoryNames(categoryIds: string[], locale?: SupportedLocale): Promise<Record<string, string>> {
  if (categoryIds.length === 0) return {}

  const effectiveLocale = locale || 'fr'
  const cacheKey = `facet:names:categories:${effectiveLocale}:${categoryIds.sort().join(',')}`

  try {
    return await getCachedData(
      cacheKey,
      async () => {
        const categories = await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true, nameEn: true },
        })
        const nameMap: Record<string, string> = {}
        categories.forEach(cat => {
          nameMap[cat.id] = (effectiveLocale === 'en' && cat.nameEn) ? cat.nameEn : cat.name
        })
        return nameMap
      },
      3600
    )
  } catch (error) {
    console.error('[meilisearch-facets] Error resolving category names:', error)
    return {}
  }
}

/**
 * Resolve brand/vendor names from IDs with Redis caching
 *
 * Caches results for 1 hour to avoid repeated DB queries
 */
async function resolveBrandNames(brandIds: string[]): Promise<Record<string, string>> {
  if (brandIds.length === 0) return {}

  const cacheKey = `facet:names:brands:${brandIds.sort().join(',')}`

  try {
    // Try to get from cache
    const cached = await getCachedData(
      cacheKey,
      async () => {
        // Fetch from database
        const vendors = await prisma.vendor.findMany({
          where: { id: { in: brandIds } },
          select: { id: true, businessName: true },
        })

        // Convert to map
        const nameMap: Record<string, string> = {}
        vendors.forEach(vendor => {
          nameMap[vendor.id] = vendor.businessName
        })

        return nameMap
      },
      3600 // 1 hour TTL
    )

    return cached
  } catch (error) {
    console.error('[meilisearch-facets] Error resolving brand names:', error)
    return {}
  }
}

/**
 * Get empty facets (fallback)
 */
function getEmptyFacets(): AvailableFilters {
  return {
    priceRange: { min: 0, max: 100000 },
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
  }
}

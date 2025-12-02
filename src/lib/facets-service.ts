/**
 * Dynamic Facets Service
 *
 * Computes facets (filters) dynamically based on search results using SQL aggregations.
 * Uses a single CTE-based query for optimal performance (~50-100ms).
 *
 * Features:
 * - Price range (min/max)
 * - Categories (with counts)
 * - Brands/Vendors (with counts)
 * - Colors (with counts)
 * - Sizes (with counts)
 *
 * Performance:
 * - Single database query with CTEs
 * - Leverages indexes on price, color, size
 * - Redis caching with 5-minute TTL
 */

import { prisma } from '@/lib/prisma'
import { getCachedFacets } from '@/lib/redis'
import { AvailableFilters, SupportedLocale } from '@/types'
import { createHash } from 'crypto'
import { getSearchableFields, getTextSearchConfig } from './i18n-search'

export interface FacetsComputeOptions {
  query?: string
  filters?: {
    categoryId?: string
    categories?: string[]
    brands?: string[]
    colors?: string[]
    sizes?: string[]
    minPrice?: number
    maxPrice?: number
    onSale?: boolean
    featured?: boolean
    inStock?: boolean
    rating?: number
  }
  locale?: SupportedLocale
}

interface PriceStats {
  min_price: number | null
  max_price: number | null
}

interface CategoryCount {
  id: string
  name: string
  count: bigint
}

interface BrandCount {
  id: string
  business_name: string
  count: bigint
}

interface ColorCount {
  color: string
  count: bigint
}

interface SizeCount {
  size: string
  count: bigint
}

/**
 * Size order for sorting (smallest to largest)
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
 * Build WHERE clause conditions matching product-search-service.ts
 * Returns both the conditions array and the params array for parameterized queries
 */
function buildWhereConditions(
  options: FacetsComputeOptions,
  locale?: SupportedLocale
): { conditions: string[]; params: (string | number | string[])[]; } {
  const { query, filters = {} } = options
  const conditions: string[] = []
  const params: (string | number | string[])[] = []
  let paramIndex = 1

  // Base conditions - always active and approved
  conditions.push("p.status = 'ACTIVE'")
  conditions.push("p.approval_status = 'APPROVED'")

  // Full-text search - locale-aware
  if (query && query.trim()) {
    const effectiveLocale = locale || 'fr'
    const fields = getSearchableFields(effectiveLocale)
    const textSearchConfig = getTextSearchConfig(effectiveLocale)

    if (effectiveLocale === 'en') {
      // English: use COALESCE with English fields
      conditions.push(`to_tsvector('english', ${fields.nameCoalesce} || ' ' || ${fields.descriptionCoalesce}) @@ plainto_tsquery('english', $${paramIndex})`)
    } else {
      // French: use existing search_vector
      conditions.push(`p.search_vector @@ plainto_tsquery('french', $${paramIndex})`)
    }
    params.push(query.trim())
    paramIndex++
  }

  // Category filter
  if (filters.categoryId) {
    conditions.push(`p.category_id = $${paramIndex}`)
    params.push(filters.categoryId)
    paramIndex++
  } else if (filters.categories && filters.categories.length > 0) {
    conditions.push(`p.category_id = ANY($${paramIndex}::text[])`)
    params.push(filters.categories)
    paramIndex++
  }

  // Brand filter - use ANY pattern like product-search-service.ts
  if (filters.brands && filters.brands.length > 0) {
    conditions.push(`p.vendor_id = ANY($${paramIndex}::text[])`)
    params.push(filters.brands)
    paramIndex++
  }

  // Price range - parameterized
  if (filters.minPrice !== undefined) {
    conditions.push(`p.price >= $${paramIndex}`)
    params.push(filters.minPrice)
    paramIndex++
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(`p.price <= $${paramIndex}`)
    params.push(filters.maxPrice)
    paramIndex++
  }

  // On sale - use on_sale column like product-search-service.ts
  if (filters.onSale) {
    conditions.push("p.on_sale = true")
  }

  // Featured
  if (filters.featured) {
    conditions.push("p.featured = true")
  }

  // In stock
  if (filters.inStock) {
    conditions.push("p.stock > 0")
  }

  // Rating - parameterized
  if (filters.rating) {
    conditions.push(`p.rating >= $${paramIndex}`)
    params.push(filters.rating)
    paramIndex++
  }

  // Color filter (via variants) - use ANY pattern
  if (filters.colors && filters.colors.length > 0) {
    conditions.push(`
      EXISTS (
        SELECT 1 FROM product_variants pv
        WHERE pv.product_id = p.id
        AND pv.color = ANY($${paramIndex}::text[])
      )
    `)
    params.push(filters.colors)
    paramIndex++
  }

  // Size filter (via variants) - use ANY pattern
  if (filters.sizes && filters.sizes.length > 0) {
    conditions.push(`
      EXISTS (
        SELECT 1 FROM product_variants pv
        WHERE pv.product_id = p.id
        AND pv.size = ANY($${paramIndex}::text[])
      )
    `)
    params.push(filters.sizes)
    paramIndex++
  }

  return { conditions, params }
}

/**
 * Compute facets from database using CTE-based SQL aggregations
 */
async function computeFacetsFromDB(
  options: FacetsComputeOptions,
  locale?: SupportedLocale
): Promise<AvailableFilters> {
  const { conditions, params } = buildWhereConditions(options, locale)
  const whereClause = conditions.join(' AND ')

  // Build CTE query with multiple aggregations
  const query = `
    WITH filtered_products AS (
      SELECT p.id, p.price, p.category_id, p.vendor_id
      FROM products p
      WHERE ${whereClause}
    ),
    price_stats AS (
      SELECT
        COALESCE(MIN(price), 0) as min_price,
        COALESCE(MAX(price), 100000) as max_price
      FROM filtered_products
    ),
    category_counts AS (
      SELECT c.id, c.name, COUNT(*) as count
      FROM filtered_products fp
      JOIN categories c ON c.id = fp.category_id
      WHERE c.is_active = true
      GROUP BY c.id, c.name
      HAVING COUNT(*) > 0
    ),
    brand_counts AS (
      SELECT v.id, v.business_name, COUNT(*) as count
      FROM filtered_products fp
      JOIN vendors v ON v.id = fp.vendor_id
      WHERE v.status = 'ACTIVE'
      GROUP BY v.id, v.business_name
      HAVING COUNT(*) > 0
    ),
    color_counts AS (
      SELECT pv.color, COUNT(DISTINCT fp.id) as count
      FROM filtered_products fp
      JOIN product_variants pv ON pv.product_id = fp.id
      WHERE pv.color IS NOT NULL
      GROUP BY pv.color
      HAVING COUNT(DISTINCT fp.id) > 0
    ),
    size_counts AS (
      SELECT pv.size, COUNT(DISTINCT fp.id) as count
      FROM filtered_products fp
      JOIN product_variants pv ON pv.product_id = fp.id
      WHERE pv.size IS NOT NULL
      GROUP BY pv.size
      HAVING COUNT(DISTINCT fp.id) > 0
    )
    SELECT
      (SELECT json_build_object('min_price', min_price, 'max_price', max_price) FROM price_stats) as price_stats,
      (SELECT json_agg(json_build_object('id', id, 'name', name, 'count', count) ORDER BY count DESC) FROM category_counts) as categories,
      (SELECT json_agg(json_build_object('id', id, 'business_name', business_name, 'count', count) ORDER BY count DESC) FROM brand_counts) as brands,
      (SELECT json_agg(json_build_object('color', color, 'count', count) ORDER BY count DESC) FROM color_counts) as colors,
      (SELECT json_agg(json_build_object('size', size, 'count', count)) FROM size_counts) as sizes
  `

  try {
    // Use parameterized query with bound parameters
    const result = await prisma.$queryRawUnsafe<any[]>(query, ...params)

    if (!result || result.length === 0) {
      return getEmptyFacets()
    }

    const row = result[0]

    // Parse price stats
    const priceStats = row.price_stats as PriceStats | null
    const priceRange = {
      min: priceStats?.min_price ?? 0,
      max: priceStats?.max_price ?? 100000,
    }

    // Parse categories
    const categories = (row.categories as any[] || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      count: Number(c.count),
    }))

    // Parse brands
    const brands = (row.brands as any[] || []).map((b: any) => ({
      id: b.id,
      name: b.business_name,
      count: Number(b.count),
    }))

    // Parse colors
    const colors = (row.colors as any[] || []).map((c: any) => ({
      value: c.color,
      name: c.color, // TODO: Add color name translation
      count: Number(c.count),
    }))

    // Parse and sort sizes
    const sizes = sortSizes(
      (row.sizes as any[] || []).map((s: any) => ({
        value: s.size,
        count: Number(s.count),
      }))
    )

    return {
      priceRange,
      categories,
      brands,
      colors,
      sizes,
    }
  } catch (error) {
    console.error('Facets computation error:', error)
    return getEmptyFacets()
  }
}

/**
 * Get empty facets (fallback)
 */
export function getEmptyFacets(): AvailableFilters {
  return {
    priceRange: { min: 0, max: 100000 },
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
  }
}

/**
 * Compute facets with Redis caching
 *
 * @param options - Query and filters
 * @returns Available filters/facets
 */
export async function computeFacets(
  options: FacetsComputeOptions,
  locale?: SupportedLocale
): Promise<AvailableFilters> {
  const ENABLE_CACHE = process.env.ENABLE_FACETS_CACHE !== 'false'

  if (!ENABLE_CACHE) {
    return computeFacetsFromDB(options, locale)
  }

  // Generate cache key based on query + filters + locale
  const effectiveLocale = locale || 'fr'
  const cacheKey = `facets:${effectiveLocale}:${createHash('md5')
    .update(JSON.stringify({ query: options.query, filters: options.filters }))
    .digest('hex')}`

  try {
    return await getCachedFacets(cacheKey, () => computeFacetsFromDB(options, locale))
  } catch (error) {
    console.warn('Facets cache error, falling back to direct computation:', error)
    return computeFacetsFromDB(options, locale)
  }
}

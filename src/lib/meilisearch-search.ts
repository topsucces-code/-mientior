/**
 * MeiliSearch Product Search Implementation
 *
 * Provides product search functionality using MeiliSearch with:
 * - Ultra-fast search (< 50ms typical)
 * - Built-in typo tolerance
 * - Advanced filtering (price, categories, brands, colors, sizes, rating, stock)
 * - Customizable ranking and sorting
 * - Graceful error handling with fallback
 *
 * @module meilisearch-search
 */

import { getIndex, isAvailable } from './meilisearch-client'
import { getSearchableFields } from './i18n-search'
import { getCachedUserPreferences } from './redis'
import { getUserPreferences, getPersonalizationConfig } from './personalization-service'
import type { Product, SortOption, SupportedLocale } from '@/types'
import type { UserPreferences } from '@/types/personalization'
import type { ProductSearchOptions, ProductSearchResult, ProductSearchFilters } from './product-search-service'

/**
 * Search products using MeiliSearch
 *
 * Maps ProductSearchOptions to MeiliSearch search parameters and transforms
 * results to match the Product type interface.
 *
 * @param options - Search options (query, filters, sort, page, limit)
 * @returns Promise with products array and total count
 */
export async function searchProductsWithMeiliSearch(
  options: ProductSearchOptions,
  locale: SupportedLocale = 'fr'
): Promise<ProductSearchResult> {
  const {
    query,
    filters = {},
    sort = 'relevance',
    page = 1,
    limit = 24,
    userId,
  } = options

  try {
    if (!await isAvailable()) {
      console.warn('[meilisearch-search] MeiliSearch unavailable, returning empty results')
      return { products: [], totalCount: 0 }
    }

    const index = getIndex('products')

    const searchableFields = getSearchableFields(locale)
    const attributesToSearchOn = [
      searchableFields.name,
      searchableFields.description,
      'category.name',
      'vendor.businessName',
      'tags.name',
      locale === 'en' ? 'name' : 'nameEn',
      locale === 'en' ? 'description' : 'descriptionEn',
    ].filter(Boolean) as string[]

    const filterConditions = buildFilterConditions(filters)
    const sortArray = buildSortArray(sort)
    const offset = (page - 1) * limit

    const searchParams = {
      offset,
      limit,
      filter: filterConditions.length > 0 ? filterConditions : undefined,
      sort: sortArray.length > 0 ? sortArray : undefined,
      attributesToSearchOn,
    }

    const searchResult = await index.search(query, searchParams)

    let products = transformHitsToProducts(searchResult.hits)

    // Apply personalization reranking if userId is provided (Comment 5)
    if (userId && sort === 'relevance') {
      products = await applyPersonalizationReranking(products, userId)
    }

    return {
      products,
      totalCount: searchResult.estimatedTotalHits || searchResult.hits.length,
    }
  } catch (error) {
    console.error('[meilisearch-search] Search error:', error)
    return { products: [], totalCount: 0 }
  }
}

/**
 * Apply personalization reranking to MeiliSearch results (Comment 5)
 * 
 * Boosts products from user's favorite categories and brands by adjusting
 * their position in the results. This is done post-search since MeiliSearch
 * doesn't support per-user ranking rules.
 */
async function applyPersonalizationReranking(
  products: Product[],
  userId: string
): Promise<Product[]> {
  try {
    // Try cache first, then database
    let userPreferences: UserPreferences | null = await getCachedUserPreferences(userId)
    
    if (!userPreferences) {
      userPreferences = await getUserPreferences(userId)
    }

    if (!userPreferences || 
        (userPreferences.favoriteCategories.length === 0 && userPreferences.favoriteBrands.length === 0)) {
      // No preferences, return original order
      return products
    }

    const config = getPersonalizationConfig()
    const categoryBoost = config.categoryBoost / 100 // Convert percentage to decimal
    const brandBoost = config.brandBoost / 100

    // Build lookup sets for fast matching
    const favoriteCategoryIds = new Set(userPreferences.favoriteCategories.map(c => c.id))
    const favoriteBrandIds = new Set(userPreferences.favoriteBrands.map(b => b.id))

    // Calculate personalization score for each product
    const scoredProducts = products.map((product, index) => {
      let boost = 0
      
      // Check category match
      if (product.category?.id && favoriteCategoryIds.has(product.category.id)) {
        boost += categoryBoost
      }
      
      // Check brand/vendor match
      if (product.vendor?.id && favoriteBrandIds.has(product.vendor.id)) {
        boost += brandBoost
      }

      // Base score is inverse of position (higher position = higher base score)
      const baseScore = 1 - (index / products.length)
      const personalizedScore = baseScore * (1 + boost)

      return { product, personalizedScore, originalIndex: index }
    })

    // Sort by personalized score (descending)
    scoredProducts.sort((a, b) => b.personalizedScore - a.personalizedScore)

    console.log(`[meilisearch-search] Applied personalization for user ${userId}: ` +
      `${userPreferences.favoriteCategories.length} categories, ${userPreferences.favoriteBrands.length} brands`)

    return scoredProducts.map(sp => sp.product)
  } catch (error) {
    console.warn(`[meilisearch-search] Error applying personalization for user ${userId}:`, error)
    // Return original order on error
    return products
  }
}

/**
 * Build MeiliSearch filter array from ProductSearchFilters
 *
 * Filters use MeiliSearch syntax: "field = value" or "field >= value"
 * Multiple conditions are combined with AND
 */
function buildFilterConditions(filters: ProductSearchFilters): string[] {
  const conditions: string[] = []

  // Base filters - always active and approved
  conditions.push(`status = "ACTIVE"`)
  conditions.push(`approvalStatus = "APPROVED"`)

  // Price range
  if (filters.priceMin !== undefined) {
    conditions.push(`price >= ${filters.priceMin}`)
  }
  if (filters.priceMax !== undefined) {
    conditions.push(`price <= ${filters.priceMax}`)
  }

  // Categories (array of IDs)
  if (filters.categories && filters.categories.length > 0) {
    const categoryFilter = filters.categories.map(id => `categoryId = "${id}"`).join(' OR ')
    conditions.push(`(${categoryFilter})`)
  }

  // Brands/Vendors (array of IDs)
  if (filters.brands && filters.brands.length > 0) {
    const brandFilter = filters.brands.map(id => `vendorId = "${id}"`).join(' OR ')
    conditions.push(`(${brandFilter})`)
  }

  // Colors (from variants)
  // Note: MeiliSearch requires variants to be indexed as filterable attributes
  if (filters.colors && filters.colors.length > 0) {
    const colorFilter = filters.colors.map(color => `variants.color = "${color}"`).join(' OR ')
    conditions.push(`(${colorFilter})`)
  }

  // Sizes (from variants)
  if (filters.sizes && filters.sizes.length > 0) {
    const sizeFilter = filters.sizes.map(size => `variants.size = "${size}"`).join(' OR ')
    conditions.push(`(${sizeFilter})`)
  }

  // Rating
  if (filters.rating !== undefined) {
    conditions.push(`rating >= ${filters.rating}`)
  }

  // In stock
  if (filters.inStock) {
    conditions.push(`stock > 0`)
  }

  // On sale
  if (filters.onSale) {
    conditions.push(`onSale = true`)
  }

  return conditions
}

/**
 * Build MeiliSearch sort array from SortOption
 *
 * Sort rules use MeiliSearch syntax: "field:asc" or "field:desc"
 * Multiple rules are applied in order
 */
function buildSortArray(sort: SortOption): string[] {
  switch (sort) {
    case 'relevance':
      // Use default MeiliSearch ranking (no explicit sort)
      // MeiliSearch's built-in ranking considers typo tolerance, proximity, exactness, etc.
      return []

    case 'price-asc':
      return ['price:asc', 'createdAt:desc']

    case 'price-desc':
      return ['price:desc', 'createdAt:desc']

    case 'rating':
      return ['rating:desc', 'reviewCount:desc', 'createdAt:desc']

    case 'newest':
      return ['createdAt:desc']

    case 'bestseller':
      return ['reviewCount:desc', 'rating:desc', 'createdAt:desc']

    case 'popularity':
      // Sort by calculated engagement score (views + sales with configurable weights)
      // Most effective when combined with MeiliSearch's ranking rules
      return ['popularity:desc', 'rating:desc', 'createdAt:desc']

    default:
      return ['createdAt:desc']
  }
}

/**
 * Transform MeiliSearch hits to Product[] format
 *
 * Ensures all required Product fields are present and properly typed
 * Note: Using 'unknown' with type assertions for MeiliSearch dynamic data
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformHitsToProducts(hits: any[]): Product[] {
  return hits.map((hit) => ({
    id: hit.id,
    name: hit.name,
    slug: hit.slug,
    description: hit.description || undefined,
    price: hit.price,
    compareAtPrice: hit.compareAtPrice || undefined,
    stock: hit.stock,
    rating: hit.rating,
    reviewCount: hit.reviewCount,
    badge: hit.badge || undefined,
    featured: hit.featured || false,
    onSale: hit.onSale || false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    images: (hit.images || []).map((img: any) => ({
      url: img.url,
      alt: img.alt,
      type: img.type as 'image' | 'video' | '360',
      thumbnail: img.thumbnail || undefined,
      videoUrl: img.videoUrl || undefined,
      frames: img.frames || undefined,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variants: (hit.variants || []).map((v: any) => ({
      id: v.id,
      size: v.size || undefined,
      color: v.color || undefined,
      sku: v.sku,
      stock: v.stock,
      priceModifier: v.priceModifier || undefined,
    })),
    category: {
      id: hit.category?.id || hit.categoryId || '',
      name: hit.category?.name || '',
      slug: hit.category?.slug || '',
      description: hit.category?.description || undefined,
      image: hit.category?.image || undefined,
      isActive: hit.category?.isActive !== false,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tags: (hit.tags || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
    })),
    vendor: hit.vendor ? {
      id: hit.vendor.id,
      name: hit.vendor.name || hit.vendor.businessName || undefined,
      businessName: hit.vendor.businessName || hit.vendor.name || undefined,
      slug: hit.vendor.slug || undefined,
    } : undefined,
    specifications: hit.specifications || undefined,
    seo: hit.seo || undefined,
    arModelUrl: hit.arModelUrl || undefined,
  }))
}

/**
 * MeiliSearch Search Suggestions Implementation
 *
 * Provides autocomplete suggestions using MeiliSearch with:
 * - Built-in typo tolerance (no manual similarity threshold needed)
 * - Parallel search across products, categories, and brands
 * - Weighted distribution (5 products, 3 categories, 2 brands)
 * - Trending keywords for short queries
 * - Graceful error handling
 *
 * @module meilisearch-suggestions
 */

import { getIndex, isAvailable } from './meilisearch-client'
import { getSearchableFields } from './i18n-search'
import type { SuggestionOptions, SuggestionResult, Suggestion } from './search-suggestions-service'
import type { SupportedLocale } from '@/types'

/**
 * Get search suggestions using MeiliSearch
 *
 * Performs parallel searches across products, categories, and brands indexes.
 * MeiliSearch has built-in typo tolerance, so no manual similarity calculation needed.
 *
 * @param options - Query and limit options
 * @returns Promise with suggestions array and metadata
 */
export async function getSuggestionsWithMeiliSearch(
  options: SuggestionOptions,
  locale?: SupportedLocale
): Promise<SuggestionResult> {
  const startTime = Date.now()
  const { query, limit = 10 } = options

  try {
    if (!await isAvailable()) {
      console.warn('[meilisearch-suggestions] MeiliSearch unavailable, returning empty suggestions')
      return { suggestions: [], metadata: { usedFuzzy: false, executionTime: Date.now() - startTime, cacheHit: false } }
    }

    if (!query || query.trim().length < 2) {
      return { suggestions: [], metadata: { usedFuzzy: false, executionTime: Date.now() - startTime, cacheHit: false } }
    }

    const productsIndex = getIndex('products')
    const categoriesIndex = getIndex('categories')
    const brandsIndex = getIndex('brands')

    const PRODUCT_LIMIT = 5
    const CATEGORY_LIMIT = 3
    const BRAND_LIMIT = 2

    const effectiveLocale = locale || 'fr'
    const searchableProductFields = getSearchableFields(effectiveLocale)
    const productAttributesToSearchOn = [
      searchableProductFields.name,
      searchableProductFields.description,
      effectiveLocale === 'en' ? 'name' : 'nameEn',
      effectiveLocale === 'en' ? 'description' : 'descriptionEn',
    ].filter(Boolean) as string[]

    const [productResults, categoryResults, brandResults] = await Promise.all([
      productsIndex.search(query, {
        limit: PRODUCT_LIMIT,
        attributesToRetrieve: ['id', 'name', 'images'],
        attributesToSearchOn: productAttributesToSearchOn,
      }),
      categoriesIndex.search(query, { limit: CATEGORY_LIMIT, attributesToRetrieve: ['id', 'name', 'image'] }),
      brandsIndex.search(query, { limit: BRAND_LIMIT, attributesToRetrieve: ['id', 'name', 'logo'] }),
    ])

    const productSuggestions: Suggestion[] = productResults.hits.map((hit: any) => ({ type: 'product', id: hit.id, text: hit.name, image: hit.images?.[0]?.url, score: hit._rankingScore || 1 }))
    const categorySuggestions: Suggestion[] = categoryResults.hits.map((hit: any) => ({ type: 'category', id: hit.id, text: hit.name, image: hit.image, score: hit._rankingScore || 1 }))
    const brandSuggestions: Suggestion[] = brandResults.hits.map((hit: any) => ({ type: 'tag', id: hit.id, text: hit.name, score: hit._rankingScore || 1 }))

    const allSuggestions = [...productSuggestions, ...categorySuggestions, ...brandSuggestions].sort((a, b) => (b.score || 0) - (a.score || 0))
    const keywords = getTrendingKeywords(query)
    const finalSuggestions = [...allSuggestions, ...keywords].slice(0, limit)

    const executionTime = Date.now() - startTime
    console.log(`[meilisearch-suggestions] Found ${finalSuggestions.length} suggestions in ${executionTime}ms`)

    return {
      suggestions: finalSuggestions,
      metadata: { usedFuzzy: true, executionTime, cacheHit: false },
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[meilisearch-suggestions] Search failed after ${executionTime}ms:`, error)
    return { suggestions: [], metadata: { usedFuzzy: false, executionTime, cacheHit: false } }
  }
}

/**
 * Get trending keywords matching the query
 *
 * Only returns keywords if query is short (< 4 chars)
 * In production, this should fetch from analytics/search history
 */
function getTrendingKeywords(query: string): Suggestion[] {
  // Only suggest keywords for short queries
  if (query.length >= 4) {
    return []
  }

  // Hardcoded trending keywords (should be fetched from analytics in production)
  const trendingKeywords = [
    'smartphone',
    'laptop',
    'headphones',
    'smartwatch',
    'camera',
    'tablet',
    'gaming',
    'wireless',
    'portable',
    'bluetooth',
  ]

  // Filter keywords that match the query
  const matchingKeywords = trendingKeywords
    .filter((keyword) => keyword.toLowerCase().startsWith(query.toLowerCase()))
    .slice(0, 2) // Limit to 2 keyword suggestions
    .map((keyword) => ({
      type: 'keyword' as const,
      id: `keyword-${keyword}`,
      text: keyword,
    }))

  return matchingKeywords
}

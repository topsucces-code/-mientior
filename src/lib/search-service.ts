/**
 * Unified Search Service
 *
 * Provides a single interface for product search, suggestions, and facets that
 * automatically routes to PostgreSQL FTS or MeiliSearch based on configuration.
 *
 * Features:
 * - Automatic engine selection (A/B test → feature flag → availability check)
 * - Transparent fallback to PostgreSQL on MeiliSearch errors
 * - Performance tracking and logging
 * - Metadata in responses indicating which engine was used
 * - Session-based A/B testing support
 *
 * @module search-service
 */

import { searchProducts } from './product-search-service'
import { searchProductsWithMeiliSearch } from './meilisearch-search'
import { getSuggestions } from './search-suggestions-service'
import { getSuggestionsWithMeiliSearch } from './meilisearch-suggestions'
import { computeFacets, getEmptyFacets as getEmptyFacetsPostgres } from './facets-service'
import { computeFacetsWithMeiliSearch } from './meilisearch-facets'
import { isAvailable, ENABLE_MEILISEARCH } from './meilisearch-client'
import { getSearchVariant, isABTestEnabled, trackSearchPerformance } from './search-ab-testing'
import type { ProductSearchOptions, ProductSearchResult } from './product-search-service'
import type { SuggestionOptions, SuggestionResult } from './search-suggestions-service'
import type { FacetsComputeOptions } from './facets-service'
import type { AvailableFilters, SearchEngineType, SearchVariant, SupportedLocale } from '@/types'

/**
 * Extended search result with metadata
 */
export interface SearchResultWithMetadata extends ProductSearchResult {
  searchEngine: SearchEngineType
  executionTime: number
  abTestVariant?: SearchVariant
  searchLocale?: SupportedLocale
}

/**
 * Extended suggestion result with metadata
 */
export interface SuggestionResultWithMetadata extends SuggestionResult {
  searchEngine: SearchEngineType
  executionTime?: number
  abTestVariant?: SearchVariant
  searchLocale?: SupportedLocale
}

// Availability cache
let availabilityCache: { value: boolean; timestamp: number } | null = null
const AVAILABILITY_CACHE_TTL = 30000 // 30 seconds

/**
 * Get the search engine to use for the current request
 *
 * Decision tree:
 * 1. If A/B testing enabled → use variant from session
 * 2. Else if ENABLE_MEILISEARCH flag → use MeiliSearch (if available)
 * 3. Else → use PostgreSQL
 *
 * @param sessionId - Optional session ID for A/B testing
 * @returns 'postgresql' or 'meilisearch'
 */
async function getSearchEngine(sessionId?: string): Promise<SearchEngineType> {
  try {
    // A/B testing takes precedence
    if (isABTestEnabled() && sessionId) {
      const variant = await getSearchVariant(sessionId)
      console.log(`[search-service] Using A/B test variant: ${variant}`)
      return variant
    }

    // Otherwise use feature flag
    if (!ENABLE_MEILISEARCH) {
      return 'postgresql'
    }

    // Check MeiliSearch availability (with caching)
    const now = Date.now()
    if (!availabilityCache || now - availabilityCache.timestamp > AVAILABILITY_CACHE_TTL) {
      const available = await isAvailable()
      availabilityCache = { value: available, timestamp: now }
    }

    if (!availabilityCache.value) {
      console.warn('[search-service] MeiliSearch unavailable, falling back to PostgreSQL')
      return 'postgresql'
    }

    return 'meilisearch'
  } catch (error) {
    console.error('[search-service] Error determining search engine:', error)
    return 'postgresql'
  }
}

/**
 * Search products using the unified search service
 *
 * Automatically routes to PostgreSQL or MeiliSearch based on configuration.
 * Falls back to PostgreSQL on MeiliSearch errors.
 *
 * @param options - Search options (query, filters, sort, page, limit)
 * @param sessionId - Optional session ID for A/B testing
 * @param locale - Optional locale for language-specific search
 * @param userId - Optional user ID for personalized search results
 * @returns Search results with metadata
 */
export async function search(
  options: ProductSearchOptions,
  sessionId?: string,
  locale?: SupportedLocale,
  userId?: string
): Promise<SearchResultWithMetadata> {
  const startTime = Date.now()
  const engine = await getSearchEngine(sessionId)
  
  // Add userId to options for personalization (moved outside try for catch access - Comment 6)
  const optionsWithUser = userId ? { ...options, userId } : options

  try {
    let result: ProductSearchResult

    if (engine === 'meilisearch') {
      console.log(`[search-service] Using MeiliSearch for search (locale: ${locale || 'fr'})${userId ? `, personalization enabled for user ${userId}` : ''}`)
      result = await searchProductsWithMeiliSearch(optionsWithUser, locale)

      // If MeiliSearch returns no results and it's not expected, try PostgreSQL
      if (result.totalCount === 0 && result.products.length === 0) {
        console.log('[search-service] MeiliSearch returned empty results, trying PostgreSQL fallback')
        result = await searchProducts(optionsWithUser, locale)
      }
    } else {
      console.log(`[search-service] Using PostgreSQL for search (locale: ${locale || 'fr'})${userId ? `, personalization enabled for user ${userId}` : ''}`)
      result = await searchProducts(optionsWithUser, locale)
    }

    const executionTime = Date.now() - startTime

    // Track performance for A/B testing
    if (isABTestEnabled() && sessionId) {
      trackSearchPerformance({
        sessionId,
        variant: engine,
        query: options.query,
        executionTime,
        resultCount: result.totalCount,
        timestamp: new Date(),
      }).catch(err => console.error('[search-service] Error tracking performance:', err))
    }

    console.log(`[search-service] Search completed in ${executionTime}ms using ${engine}`)

    return {
      ...result,
      searchEngine: engine,
      executionTime,
      abTestVariant: isABTestEnabled() && sessionId ? engine : undefined,
      searchLocale: locale,
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[search-service] Search failed with ${engine} after ${executionTime}ms:`, error)

    // Fallback to PostgreSQL if MeiliSearch fails
    if (engine === 'meilisearch') {
      console.log('[search-service] Falling back to PostgreSQL after MeiliSearch error')
      try {
        // Use optionsWithUser to preserve userId for personalization (Comment 6)
        const result = await searchProducts(optionsWithUser, locale)
        return {
          ...result,
          searchEngine: 'postgresql',
          executionTime: Date.now() - startTime,
        }
      } catch (fallbackError) {
        console.error('[search-service] PostgreSQL fallback also failed:', fallbackError)
        return {
          products: [],
          totalCount: 0,
          searchEngine: 'postgresql',
          executionTime: Date.now() - startTime,
        }
      }
    }

    // If PostgreSQL failed, return empty results
    return {
      products: [],
      totalCount: 0,
      searchEngine: 'postgresql',
      executionTime,
    }
  }
}

/**
 * Get search suggestions using the unified search service
 *
 * Automatically routes to PostgreSQL or MeiliSearch based on configuration.
 * Falls back to PostgreSQL on MeiliSearch errors.
 *
 * @param options - Suggestion options (query, limit)
 * @param sessionId - Optional session ID for A/B testing
 * @returns Suggestions with metadata
 */
export async function suggest(
  options: SuggestionOptions,
  sessionId?: string,
  locale?: SupportedLocale
): Promise<SuggestionResultWithMetadata> {
  const startTime = Date.now()
  const engine = await getSearchEngine(sessionId)

  try {
    let result: SuggestionResult
    let actualEngine: SearchEngineType = engine

    if (engine === 'meilisearch') {
      console.log(`[search-service] Using MeiliSearch for suggestions (locale: ${locale || 'fr'})`)
      result = await getSuggestionsWithMeiliSearch(options, locale)

      // Check if MeiliSearch is unavailable or returned empty results for non-empty query
      const meiliUnavailable = !(await isAvailable())
      const hasEmptyResultsForValidQuery = result.suggestions.length === 0 && options.query && options.query.trim().length >= 2

      if (meiliUnavailable || hasEmptyResultsForValidQuery) {
        console.log('[search-service] MeiliSearch unavailable or empty results, falling back to PostgreSQL for suggestions')
        result = await getSuggestions(options, locale)
        actualEngine = 'postgresql'
      }
    } else {
      console.log(`[search-service] Using PostgreSQL for suggestions (locale: ${locale || 'fr'})`)
      result = await getSuggestions(options, locale)
    }

    const executionTime = Date.now() - startTime
    console.log(`[search-service] Suggestions completed in ${executionTime}ms using ${actualEngine}`)

    // Track performance for A/B testing
    if (isABTestEnabled() && sessionId) {
      trackSearchPerformance({
        sessionId,
        variant: engine,
        query: `[suggestions] ${options.query}`,
        executionTime,
        resultCount: result.suggestions.length,
        timestamp: new Date(),
      }).catch(err => console.error('[search-service] Error tracking suggestions performance:', err))
    }

    return {
      ...result,
      searchEngine: actualEngine,
      executionTime,
      abTestVariant: isABTestEnabled() && sessionId ? engine : undefined,
      searchLocale: locale,
    }
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[search-service] Suggestions failed with ${engine} after ${executionTime}ms:`, error)

    // Fallback to PostgreSQL if MeiliSearch fails
    if (engine === 'meilisearch') {
      console.log('[search-service] Falling back to PostgreSQL for suggestions after error')
      try {
        const result = await getSuggestions(options, locale)
        return {
          ...result,
          searchEngine: 'postgresql',
          executionTime: Date.now() - startTime,
        }
      } catch (fallbackError) {
        console.error('[search-service] PostgreSQL fallback also failed:', fallbackError)
        return {
          suggestions: [],
          metadata: {
            usedFuzzy: false,
            executionTime: Date.now() - startTime,
            cacheHit: false,
          },
          searchEngine: 'postgresql',
          executionTime: Date.now() - startTime,
        }
      }
    }

    // If PostgreSQL failed, return empty suggestions
    return {
      suggestions: [],
      metadata: {
        usedFuzzy: false,
        executionTime,
        cacheHit: false,
      },
      searchEngine: 'postgresql',
      executionTime,
    }
  }
}

/**
 * Compute facets using the unified search service
 *
 * Automatically routes to PostgreSQL or MeiliSearch based on configuration.
 * Falls back to PostgreSQL on MeiliSearch errors or empty results.
 *
 * @param options - Facets options (query, filters)
 * @param sessionId - Optional session ID for A/B testing
 * @returns Available filters
 */
export async function facets(
  options: FacetsComputeOptions,
  sessionId?: string,
  locale?: SupportedLocale
): Promise<AvailableFilters> {
  const startTime = Date.now()
  const engine = await getSearchEngine(sessionId)

  try {
    let result: AvailableFilters
    let actualEngine: SearchEngineType = engine

    if (engine === 'meilisearch') {
      console.log(`[search-service] Using MeiliSearch for facets (locale: ${locale || 'fr'})`)
      result = await computeFacetsWithMeiliSearch(options, locale)

      // Check if MeiliSearch is unavailable or returned empty facets when we expect some
      const meiliUnavailable = !(await isAvailable())
      const emptyFacets = getEmptyFacetsPostgres()
      const hasEmptyFacets = JSON.stringify(result) === JSON.stringify(emptyFacets)
      const shouldHaveFacets = options.query || Object.keys(options.filters || {}).length > 0

      if (meiliUnavailable || (hasEmptyFacets && shouldHaveFacets)) {
        console.log('[search-service] MeiliSearch unavailable or empty facets, falling back to PostgreSQL')
        result = await computeFacets(options, locale)
        actualEngine = 'postgresql'
      }
    } else {
      console.log(`[search-service] Using PostgreSQL for facets (locale: ${locale || 'fr'})`)
      result = await computeFacets(options, locale)
    }

    const executionTime = Date.now() - startTime
    console.log(`[search-service] Facets computed in ${executionTime}ms using ${actualEngine}`)

    // Track performance for A/B testing
    if (isABTestEnabled() && sessionId) {
      // Count total facet items as result count
      const totalFacetItems =
        result.categories.length +
        result.brands.length +
        result.colors.length +
        result.sizes.length

      trackSearchPerformance({
        sessionId,
        variant: engine,
        query: `[facets] ${options.query || 'all'}`,
        executionTime,
        resultCount: totalFacetItems,
        timestamp: new Date(),
      }).catch(err => console.error('[search-service] Error tracking facets performance:', err))
    }

    return result
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error(`[search-service] Facets failed with ${engine} after ${executionTime}ms:`, error)

    // Fallback to PostgreSQL if MeiliSearch fails
    if (engine === 'meilisearch') {
      console.log('[search-service] Falling back to PostgreSQL for facets after error')
      try {
        return await computeFacets(options, locale)
      } catch (fallbackError) {
        console.error('[search-service] PostgreSQL fallback also failed:', fallbackError)
        return getEmptyFacetsPostgres()
      }
    }

    // If PostgreSQL failed, return empty facets
    return getEmptyFacetsPostgres()
  }
}

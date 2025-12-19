import { 
  getCachedData, 
  invalidateCache,
  getCacheMetrics,
  getCachedFacets
} from './redis'
import {
  getSearchCacheTTL, 
  getSuggestionsCacheTTL,
  getFacetsCacheTTL
} from './cache-config'
import crypto from 'crypto'
import type { SearchResults, SearchSuggestion, CacheMetrics } from '@/types'
import { prisma } from '@/lib/prisma-client'
import { search, suggest, facets } from '@/lib/search-service'

/**
 * Options for cache warming operations
 */
export interface WarmCacheOptions {
  topQueries?: number // default: 50
  periodDays?: number // default: 7
  onProgress?: (current: number, total: number) => void
  sessionId?: string // for A/B testing consistency
}

/**
 * Result of a cache warming operation
 */
export interface WarmCacheResult {
  total: number
  warmed: number
  failed: number
  duration: number
  errors: Array<{
    query: string
    error: string
  }>
}

export interface CacheTierMetrics {
  search: CacheMetrics
  suggestions: CacheMetrics
  facets: CacheMetrics
}

export class SearchCache {
  /**
   * Generate cache key for search results
   * Uses MD5 hash of query options for consistency
   */
  static buildSearchKey(options: any): string {
    const hash = crypto.createHash('md5').update(JSON.stringify(options)).digest('hex')
    return `search:products:${hash}`
  }

  /**
   * Generate cache key for global search (legacy/broad)
   */
  static buildGlobalKey(options: any): string {
    const hash = crypto.createHash('md5').update(JSON.stringify(options)).digest('hex')
    return `search:global:${hash}`
  }

  /**
   * Generate cache key for suggestions
   */
  static buildSuggestionsKey(options: any): string {
    const hash = crypto.createHash('md5').update(JSON.stringify(options)).digest('hex')
    return `search:suggestions:${hash}`
  }

  /**
   * Generate cache key for facets
   */
  static buildFacetsKey(options: any): string {
    const hash = crypto.createHash('md5').update(JSON.stringify(options)).digest('hex')
    return `facets:${hash}`
  }

  /**
   * Get or set search results in cache
   */
  static async getOrSetSearchResults(
    params: { q: string; type?: string; page?: number; [key: string]: any },
    fetcher: () => Promise<SearchResults & { totalCount: number }>
  ): Promise<SearchResults & { totalCount: number }> {
    // Use buildSearchKey logic but we need to be careful about what 'params' contains
    // to match what buildSearchKey expects if we were using it directly.
    // For now, we'll use the logic from the previous implementation but wrapped here.
    const cacheKeyData = JSON.stringify(params)
    const cacheHash = crypto.createHash('md5').update(cacheKeyData).digest('hex')
    const cacheKey = `search:products:${cacheHash}` // Standardized prefix
    const ttl = getSearchCacheTTL()

    return getCachedData(cacheKey, fetcher, ttl, true, 'search:products')
  }

  /**
   * Get or set suggestions in cache
   */
  static async getOrSetSuggestions(
    query: string,
    fetcher: () => Promise<SearchSuggestion[]>
  ): Promise<SearchSuggestion[]> {
    const cacheHash = crypto.createHash('md5').update(query.toLowerCase()).digest('hex')
    const cacheKey = `search:suggestions:${cacheHash}`
    const ttl = getSuggestionsCacheTTL()

    return getCachedData(cacheKey, fetcher, ttl, true, 'search:suggestions')
  }

  /**
   * Get or set facets in cache
   */
  static async getOrSetFacets<T>(
    options: any,
    fetcher: () => Promise<T>
  ): Promise<T> {
    const cacheKey = this.buildFacetsKey(options)
    return getCachedFacets(cacheKey, fetcher)
  }

  /**
   * Invalidate search results cache
   */
  static async invalidateSearch(pattern = '*'): Promise<void> {
    if (pattern === '*') {
      await Promise.all([
        invalidateCache('search:products:*'),
        invalidateCache('search:global:*')
      ])
    } else {
      await invalidateCache(`search:products:${pattern}`)
    }
  }

  /**
   * Invalidate suggestions cache
   */
  static async invalidateSuggestions(pattern = '*'): Promise<void> {
    await invalidateCache(`search:suggestions:${pattern}`)
  }

  /**
   * Invalidate facets cache
   */
  static async invalidateFacets(pattern = '*'): Promise<void> {
    await invalidateCache(`facets:${pattern}`)
  }

  /**
   * Invalidate all search-related caches
   */
  static async invalidateAll(pattern = '*'): Promise<void> {
    await Promise.all([
      this.invalidateSearch(pattern),
      this.invalidateSuggestions(pattern),
      this.invalidateFacets(pattern)
    ])
  }

  /**
   * Get metrics for all search cache tiers
   */
  static async getTierMetrics(): Promise<CacheTierMetrics> {
    const [search, suggestions, facets] = await Promise.all([
      getCacheMetrics('search:products'),
      getCacheMetrics('search:suggestions'),
      getCacheMetrics('facets')
    ])

    return { search, suggestions, facets }
  }

  /**
   * Get popular queries from SearchLog analytics
   */
  static async getPopularQueries(options: {
    limit: number
    periodDays: number
  }): Promise<Array<{ query: string; count: number }>> {
    const { limit, periodDays } = options
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

    try {
      const results = await prisma.searchLog.groupBy({
        by: ['query'],
        where: {
          timestamp: { gte: startDate },
          resultCount: { gt: 0 },
        },
        _count: { query: true },
        orderBy: { _count: { query: 'desc' } },
        take: limit,
      })

      return results.map(r => ({
        query: r.query,
        count: r._count.query,
      }))
    } catch (error) {
      console.error('[SearchCache] Error fetching popular queries:', error)
      return []
    }
  }

  /**
   * Warm popular queries
   */
  static async warmPopularQueries(options: WarmCacheOptions = {}): Promise<WarmCacheResult> {
    const startTime = Date.now()
    const defaultTopQueries = parseInt(process.env.CACHE_WARMING_TOP_QUERIES || '50', 10)
    const defaultPeriodDays = parseInt(process.env.CACHE_WARMING_PERIOD_DAYS || '7', 10)

    const topQueries = Math.min(options.topQueries || defaultTopQueries, 200)
    const periodDays = options.periodDays || defaultPeriodDays
    const { onProgress, sessionId } = options

    const result: WarmCacheResult = {
      total: 0,
      warmed: 0,
      failed: 0,
      duration: 0,
      errors: [],
    }

    try {
      console.log(`[SearchCache] Starting cache warming for top ${topQueries} queries`)
      const popularQueries = await this.getPopularQueries({ limit: topQueries, periodDays })
      result.total = popularQueries.length

      if (result.total === 0) {
        result.duration = Date.now() - startTime
        return result
      }

      for (let i = 0; i < popularQueries.length; i++) {
        const item = popularQueries[i]
        if (!item) continue
        
        const { query } = item
        try {
          // Warm search
          const searchOptions = { 
            query, 
            limit: 20, 
            sort: 'relevance' as const, 
            filters: {} 
          }
          const searchRes = await search(searchOptions, sessionId)
          const searchKey = this.buildSearchKey(searchOptions)
          
          // Import redis dynamically to avoid circular dependency
          const { redis } = await import('./redis')

          await redis.setex(searchKey, getSearchCacheTTL(), JSON.stringify(searchRes))

          // Warm facets
          const facetsOptions = { query, filters: {} }
          const facetsRes = await facets(facetsOptions, sessionId)
          const facetsKey = this.buildFacetsKey(facetsOptions)
          await redis.setex(facetsKey, getFacetsCacheTTL(), JSON.stringify(facetsRes))

          // Warm suggestions
          const suggestionsOptions = { query, limit: 10 }
          const suggestionsRes = await suggest(suggestionsOptions, sessionId)
          const suggestionsKey = this.buildSuggestionsKey(suggestionsOptions)
          await redis.setex(suggestionsKey, getSuggestionsCacheTTL(), JSON.stringify(suggestionsRes))

          result.warmed++
        } catch (error) {
          result.failed++
          result.errors.push({
            query,
            error: error instanceof Error ? error.message : String(error),
          })
        }
        onProgress?.(i + 1, result.total)
      }

      result.duration = Date.now() - startTime
      console.log(`[SearchCache] Warming completed: ${result.warmed} warmed, ${result.failed} failed`)
      return result
    } catch (error) {
      console.error('[SearchCache] Warming failed:', error)
      result.duration = Date.now() - startTime
      throw error
    }
  }
}

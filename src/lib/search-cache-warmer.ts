/**
 * Search Cache Warmer Service (Legacy Wrapper)
 * 
 * Delegates to the centralized SearchCache service.
 * Kept for backward compatibility with scripts.
 */

import { SearchCache, WarmCacheOptions, WarmCacheResult } from './search-cache'

export { WarmCacheOptions, WarmCacheResult }

/**
 * Get popular queries from SearchLog analytics
 */
export async function getPopularQueries(options: {
  limit: number
  periodDays: number
}): Promise<Array<{ query: string; count: number }>> {
  return SearchCache.getPopularQueries(options)
}

/**
 * Warm all caches (search results, suggestions, facets) for popular queries
 */
export async function warmAllCaches(options: WarmCacheOptions = {}): Promise<WarmCacheResult> {
  return SearchCache.warmPopularQueries(options)
}
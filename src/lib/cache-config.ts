/**
 * Cache Configuration
 * Centralized cache TTL settings for consistency across the application
 */

/**
 * Get facets cache TTL from environment or use default
 * Default: 300 seconds (5 minutes)
 */
export function getFacetsCacheTTL(): number {
  return parseInt(process.env.FACETS_CACHE_TTL || '300', 10)
}

/**
 * Get search results cache TTL from environment or use facets TTL
 * This ensures search results and facets stay in sync
 */
export function getSearchCacheTTL(): number {
  return parseInt(process.env.SEARCH_CACHE_TTL || process.env.FACETS_CACHE_TTL || '300', 10)
}

/**
 * Get suggestions cache TTL from environment or use default
 * Default: 3600 seconds (1 hour)
 */
export function getSuggestionsCacheTTL(): number {
  return parseInt(process.env.SUGGESTIONS_CACHE_TTL || '3600', 10)
}

/**
 * API endpoint for search suggestions
 * Used by SearchBar component for autocomplete
 *
 * Features:
 * - Fuzzy search with pg_trgm extension or MeiliSearch typo tolerance
 * - Redis caching (1 hour TTL)
 * - HTTP caching (5 minutes)
 * - Automatic fallback to PostgreSQL
 * - A/B testing support
 */

import { NextRequest, NextResponse } from 'next/server'
import { suggest } from '@/lib/search-service'
import { detectLanguage, normalizeLocale } from '@/lib/i18n-search'
import { getCachedData } from '@/lib/redis'
import type { SupportedLocale } from '@/types'
import crypto from 'crypto'

// HTTP cache duration: 5 minutes (for CDN/browser cache)
const CACHE_DURATION = 5 * 60

// Redis cache TTL: 1 hour (for server-side cache)
const REDIS_CACHE_TTL = 3600

// Redis cache key prefix
const REDIS_CACHE_PREFIX = 'search:suggestions:'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    // Get or generate session ID for A/B testing
    let sessionId = request.cookies.get('search_session_id')?.value
    if (!sessionId) {
      sessionId = crypto.randomUUID()
    }

    // Resolve locale
    const rawLocale = searchParams.get('locale') as string | null
    const resolvedLocale: SupportedLocale = rawLocale
      ? normalizeLocale(rawLocale)
      : query && query.length >= 3
      ? await detectLanguage(query)
      : 'fr'

    // Validate query
    if (!query || query.length < 2) {
      return NextResponse.json(
        { suggestions: [] },
        {
          headers: {
            'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
            'X-Cache-Status': 'SKIP',
            'X-Search-Locale': resolvedLocale,
          },
        }
      )
    }

    // Create Redis cache key with locale
    const cacheKey = `${REDIS_CACHE_PREFIX}${resolvedLocale}:${query.toLowerCase()}`

    // Track if we actually fetched data (cache miss)
    let fetched = false

    // Try to get from Redis cache first
    const cachedResult = await getCachedData(
      cacheKey,
      async () => {
        // Cache miss - fetch using unified search service
        fetched = true
        const result = await suggest({
          query,
          limit: 10,
          useWordSimilarity: true // Enable word similarity for PostgreSQL
        }, sessionId, resolvedLocale)
        return result
      },
      REDIS_CACHE_TTL
    )

    // Determine if this was a cache hit based on whether fetcher was executed
    const cacheHit = !fetched
    const executionTime = Date.now() - startTime

    // Return suggestions with metadata (only in development)
    const isDev = process.env.NODE_ENV === 'development'
    const response = isDev
      ? {
          suggestions: cachedResult.suggestions,
          metadata: {
            ...cachedResult.metadata,
            cacheHit,
            executionTime,
            searchEngine: cachedResult.searchEngine,
            abTestVariant: cachedResult.abTestVariant,
          },
        }
      : { suggestions: cachedResult.suggestions }

    // Create response with headers
    const nextResponse = NextResponse.json(response, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        'X-Cache-Status': cacheHit ? 'HIT' : 'MISS',
        'X-Search-Locale': resolvedLocale,
      },
    })

    // Set session cookie if newly generated
    if (!request.cookies.get('search_session_id')) {
      nextResponse.cookies.set('search_session_id', sessionId, {
        maxAge: 86400, // 24 hours
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    }

    return nextResponse
  } catch (error) {
    console.error('[search-suggestions-api] Error:', error)

    // Return empty suggestions on error
    return NextResponse.json(
      {
        suggestions: [],
        error: 'Failed to fetch suggestions',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Cache-Status': 'ERROR',
        },
      }
    )
  }
}

/**
 * API endpoint for global search
 *
 * Supports search across:
 * - Products: Full-text search with semantic matching, filters, and ranking
 * - Brands: Tag-based search with fuzzy matching
 *
 * Note: Articles and videos are not currently implemented. The SearchResults
 * type includes these fields for future expansion, but they will always be empty arrays.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { search } from '@/lib/search-service'
import { logSearch } from '@/lib/search-analytics'
import { getCachedSpellCorrection } from '@/lib/redis'
import { SearchCache } from '@/lib/search-cache'
import { getSpellCorrection } from '@/lib/spell-correction'
import { getSearchCacheTTL } from '@/lib/cache-config'
import { detectLanguage, normalizeLocale } from '@/lib/i18n-search'
import { getSynonyms } from '@/lib/synonyms-manager'
import type { SearchResults, SupportedLocale } from '@/types'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    const page = parseInt(searchParams.get('page') || '1')

    // Get or generate session ID
    let sessionId = request.cookies.get('search_session_id')?.value
    if (!sessionId) {
      sessionId = crypto.randomUUID()
    }

    // Resolve locale: explicit param -> auto-detect -> fallback
    const rawLocale = searchParams.get('locale') as string | null
    const resolvedLocale: SupportedLocale = rawLocale
      ? normalizeLocale(rawLocale)
      : q && q.length >= 3
      ? await detectLanguage(q)
      : 'fr'

    // Get userId for personalization (from cookie or auth)
    const userId = request.cookies.get('user_id')?.value || undefined

    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Search-Locale': resolvedLocale,
    })

    if (userId) {
      console.log(`[search-api] Personalization enabled for user ${userId}`)
    }

    if (!q || q.length < 2) {
      return new NextResponse(JSON.stringify({ products: [], brands: [], articles: [], videos: [], totalCount: 0, searchLocale: resolvedLocale }), { headers })
    }

    const httpCacheTTL = Math.floor(getSearchCacheTTL() / 2)
    if (httpCacheTTL > 0) {
      headers.set('Cache-Control', `public, s-maxage=${httpCacheTTL}, stale-while-revalidate=${httpCacheTTL * 2}`)
    }

    // Define fetcher for SearchCache
    const fetcher = async () => {
      const results: SearchResults & { totalCount: number } = {
        products: [],
        brands: [],
        articles: [],
        videos: [],
        totalCount: 0,
      }

      // Main search logic - pass userId for personalization
      const { products, totalCount, searchEngine, executionTime, abTestVariant } = await search(
        { query: q, filters: {}, sort: 'relevance', page, limit: type === 'products' ? 24 : 8 },
        sessionId,
        resolvedLocale,
        userId
      )

      results.products = products
      results.totalCount = totalCount

      // Spell correction on no results
      if (totalCount === 0 && q.trim().length > 0) {
        try {
          const correctedQuery = await getCachedSpellCorrection(q, () => getSpellCorrection(q).then(c => c?.correctedQuery || null))
          if (correctedQuery) {
            const correctedResult = await search({ query: correctedQuery, filters: {}, sort: 'relevance', page, limit: type === 'products' ? 24 : 8 }, sessionId, resolvedLocale, userId)
            if (correctedResult.totalCount > 0) {
              results.products = correctedResult.products
              results.totalCount = correctedResult.totalCount
              results.correctedQuery = correctedQuery
              results.originalQuery = q
            }
          }
        } catch (e) {
          console.error('Spell correction error:', e)
        }
      }

      // Search brands with semantic capabilities
      if (type === 'all' || type === 'brands') {
        // Get synonyms for semantic brand search
        const synonyms = await getSynonyms(q)
        const searchTerms = [q, ...synonyms]

        // Search tags using normalized slugs and synonyms
        const tags = await prisma.tag.findMany({
          where: {
            OR: searchTerms.map(term => ({
              OR: [
                { name: { contains: term, mode: 'insensitive' } },
                { slug: { contains: term.toLowerCase().replace(/\s+/g, '-'), mode: 'insensitive' } }
              ]
            }))
          },
          take: 10,
          distinct: ['id']
        })

        results.brands = tags.map(tag => ({ id: tag.id, name: tag.name }))
        results.totalCount += tags.length
      }

      // Articles and videos are not implemented yet
      // These fields are kept in the response for API contract compatibility
      results.articles = []
      results.videos = []

      // Populate metadata
      results.searchMetadata = {
        searchEngine: searchEngine as any,
        executionTime: executionTime || 0,
        cacheHit: false, // Set by SearchCache wrapper
        searchLocale: resolvedLocale,
        abTestVariant: abTestVariant as any,
      }

      return results
    }

    // Use SearchCache service, passing locale in the key
    const cacheKeyParts = { q, type, page, locale: resolvedLocale }
    const results = await SearchCache.getOrSetSearchResults(cacheKeyParts, fetcher)

    // Log search analytics
    try {
      await logSearch({
        query: q,
        resultCount: results.totalCount,
        sessionId: sessionId!,
        userId: request.cookies.get('user_id')?.value,
        filters: { type },
        locale: resolvedLocale,
      })
    } catch (e) {
      console.warn('Search analytics error:', e)
    }

    const response = new NextResponse(JSON.stringify({ ...results, searchLocale: resolvedLocale }), { headers })

    // Set session cookie if newly generated
    if (!request.cookies.has('search_session_id')) {
      response.cookies.set('search_session_id', sessionId, { maxAge: 86400, httpOnly: true, sameSite: 'lax', path: '/' })
    }

    return response
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}


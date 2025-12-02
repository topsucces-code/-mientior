/**
 * API endpoint for product search with filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { search } from '@/lib/search-service'
import { facets } from '@/lib/search-service'
import { logSearch } from '@/lib/search-analytics'
import { redis } from '@/lib/redis'
import { getSearchCacheTTL } from '@/lib/cache-config'
import { detectLanguage, normalizeLocale } from '@/lib/i18n-search'
import type { Product, PaginatedResponse, SortOption, AvailableFilters, SearchMetadata, SupportedLocale } from '@/types'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const q = searchParams.get('q') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const sort = (searchParams.get('sort') || 'relevance') as SortOption

    // Get or generate session ID for A/B testing
    let sessionId = request.cookies.get('search_session_id')?.value
    if (!sessionId) {
      sessionId = crypto.randomUUID()
    }

    // Get userId for personalization (from cookie or auth)
    const userId = request.cookies.get('user_id')?.value || undefined

    // Resolve locale
    const rawLocale = searchParams.get('locale') as string | null
    const resolvedLocale: SupportedLocale = rawLocale
      ? normalizeLocale(rawLocale)
      : q && q.length >= 3
      ? await detectLanguage(q)
      : 'fr'

    // Parse filters
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')
    const categories = searchParams.getAll('categories[]')
    const brands = searchParams.getAll('brands[]')
    const colors = searchParams.getAll('colors[]')
    const sizes = searchParams.getAll('sizes[]')
    const rating = searchParams.get('rating')
    const inStock = searchParams.get('inStock')
    const onSale = searchParams.get('onSale')

    // Build filters object
    const filters = {
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      categories: categories.length > 0 ? categories : undefined,
      brands: brands.length > 0 ? brands : undefined,
      colors: colors.length > 0 ? colors : undefined,
      sizes: sizes.length > 0 ? sizes : undefined,
      rating: rating ? parseFloat(rating) : undefined,
      inStock: inStock === 'true',
      onSale: onSale === 'true',
    }

    // Create cache key based on all parameters, including locale
    const cacheKeyData = JSON.stringify({ q, filters, sort, page, limit, locale: resolvedLocale })
    const cacheHash = crypto.createHash('md5').update(cacheKeyData).digest('hex')
    const cacheKey = `search:products:${resolvedLocale}:${cacheHash}`

    // HTTP cache strategy: Use half of Redis TTL for browser/CDN cache with stale-while-revalidate
    // This complements Redis caching by allowing clients to serve stale data while revalidating in background
    const httpCacheTTL = Math.floor(getSearchCacheTTL() / 2)

    // Check cache
    try {
      const cached = await redis.get(cacheKey)
      if (cached) {
        const cachedResponse = JSON.parse(cached)
        return NextResponse.json({
          ...cachedResponse,
          searchMetadata: {
            ...cachedResponse.searchMetadata,
            cacheHit: true,
          },
        }, {
          headers: {
            'Cache-Control': `public, s-maxage=${httpCacheTTL}, stale-while-revalidate=${httpCacheTTL}`,
            'X-Cache-Status': 'HIT',
            'X-Search-Engine': cachedResponse.searchMetadata?.searchEngine || 'unknown',
            'X-Facets-Time': cachedResponse.searchMetadata?.facetsExecutionTime?.toString() || '0',
            'X-Search-Locale': resolvedLocale
          }
        })
      }
    } catch (cacheError) {
      console.warn('Redis cache read error:', cacheError)
      // Continue without cache
    }

    // Search products using unified service - pass userId for personalization
    const startTime = Date.now()
    const { products, totalCount, searchEngine, executionTime: searchExecutionTime, abTestVariant } = await search({
      query: q,
      filters,
      sort,
      page,
      limit,
      locale: resolvedLocale,
    }, sessionId, resolvedLocale, userId)
    const executionTime = Date.now() - startTime

    // Compute facets based on current search/filters
    let availableFilters: AvailableFilters | undefined
    let facetsExecutionTime = 0
    try {
      const facetsStartTime = Date.now()
      availableFilters = await facets({
        query: q,
        filters: {
          categoryId: undefined,
          categories: filters.categories,
          brands: filters.brands,
          colors: filters.colors,
          sizes: filters.sizes,
          minPrice: filters.priceMin,
          maxPrice: filters.priceMax,
          onSale: filters.onSale,
          featured: false,
          inStock: filters.inStock,
          rating: filters.rating,
        },
        locale: resolvedLocale,
      }, sessionId)
      facetsExecutionTime = Date.now() - facetsStartTime
    } catch (facetsError) {
      console.warn('Facets computation error:', facetsError)
      // Return default empty facets - don't fail the entire request
      availableFilters = {
        priceRange: { min: 0, max: 100000 },
        categories: [],
        brands: [],
        colors: [],
        sizes: [],
      }
    }

    // Log search analytics (non-blocking)
    try {
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      const userAgent = request.headers.get('user-agent') || undefined

      // Log asynchronously without blocking response
      logSearch({
        query: q,
        resultCount: totalCount,
        sessionId,
        filters: {
          priceMin: filters.priceMin,
          priceMax: filters.priceMax,
          categories: filters.categories,
          brands: filters.brands,
          colors: filters.colors,
          sizes: filters.sizes,
          rating: filters.rating,
          inStock: filters.inStock,
          onSale: filters.onSale,
        },
        sort,
        executionTime,
        ipAddress,
        userAgent,
        locale: resolvedLocale,
      }).catch(err => console.error('Failed to log search:', err))
    } catch (analyticsError) {
      console.warn('Search analytics error:', analyticsError)
      // Continue without analytics
    }

    const responseData: PaginatedResponse<Product> & {
      availableFilters?: AvailableFilters
      searchMetadata?: SearchMetadata
    } = {
      data: products,
      totalCount,
      page,
      pageSize: limit,
      hasMore: (page - 1) * limit + limit < totalCount,
      availableFilters,
      searchMetadata: {
        searchEngine,
        executionTime: searchExecutionTime,
        cacheHit: false,
        abTestVariant,
        facetsExecutionTime,
      },
    }

    // Cache results using shared TTL configuration (synced with facets TTL)
    try {
      const cacheTTL = getSearchCacheTTL()
      await redis.setex(cacheKey, cacheTTL, JSON.stringify(responseData))
    } catch (cacheError) {
      console.warn('Redis cache write error:', cacheError)
      // Continue without caching
    }

    // Create response
    const response = NextResponse.json(responseData, {
      headers: {
        'Cache-Control': `public, s-maxage=${httpCacheTTL}, stale-while-revalidate=${httpCacheTTL}`,
        'X-Cache-Status': 'MISS',
        'X-Search-Engine': searchEngine,
        'X-Facets-Time': facetsExecutionTime.toString(),
        'X-Search-Locale': resolvedLocale
      }
    })

    // Set session cookie if newly generated
    if (!request.cookies.get('search_session_id')) {
      response.cookies.set('search_session_id', sessionId, {
        maxAge: 86400, // 24 hours
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    }

    return response
  } catch (error) {
    console.error('Product search error:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}
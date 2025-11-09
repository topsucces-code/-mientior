/**
 * API endpoint for search suggestions
 * Used by SearchBar component for autocomplete
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60

// Custom suggestion type for the API response
interface Suggestion {
  type: 'product' | 'category' | 'brand' | 'keyword'
  id: string
  text: string
  image?: string
  category?: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json(
        { suggestions: [] },
        {
          headers: {
            'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
          },
        }
      )
    }

    const suggestions: Suggestion[] = []

    // Search in Products (name, description)
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        images: {
          orderBy: { order: 'asc' },
          take: 1,
          select: {
            url: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
      take: 5,
    })

    // Add product suggestions
    products.forEach((product) => {
      suggestions.push({
        type: 'product',
        id: product.id,
        text: product.name,
        image: product.images[0]?.url,
        category: product.category.name,
      })
    })

    // Search in Categories
    const categories = await prisma.category.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
      take: 3,
    })

    // Add category suggestions
    categories.forEach((category) => {
      suggestions.push({
        type: 'category',
        id: category.id,
        text: category.name,
        image: category.image || undefined,
      })
    })

    // Add trending searches if query is short (could be cached in Redis)
    if (query.length < 4) {
      const trendingSearches = ['smartphone', 'laptop', 'headphones', 'watch']
      const matchingTrending = trendingSearches.filter((term) =>
        term.toLowerCase().includes(query.toLowerCase())
      )

      matchingTrending.slice(0, 2).forEach((term) => {
        suggestions.push({
          type: 'keyword',
          id: term,
          text: term,
        })
      })
    }

    // Limit total suggestions to 10
    const limitedSuggestions = suggestions.slice(0, 10)

    return NextResponse.json(
      { suggestions: limitedSuggestions },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate`,
        },
      }
    )
  } catch (error) {
    console.error('Search suggestions error:', error)
    return NextResponse.json({ error: 'Failed to fetch suggestions', suggestions: [] }, { status: 500 })
  }
}

/**
 * Search Results Page
 * Displays search results for products, brands, and articles
 */

import { Metadata } from 'next'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { SearchPageClient } from './search-client'
import type { SearchProduct, SearchResultsData } from '@/components/search/search-results'

export const metadata: Metadata = {
  title: 'Search Results | Mientior',
  description: 'Search for products, brands, and articles',
}

async function searchProducts(query: string): Promise<SearchResultsData> {
  if (!query || query.trim() === '') {
    return {
      products: [],
      brands: [],
      articles: [],
    }
  }

  try {
    // Search products by name or description using Prisma
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 24,
        include: {
          category: true,
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
        },
      }),
      prisma.category.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        take: 10,
      }),
    ])

    // Transform products for search results
    const transformedProducts: SearchProduct[] = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice || undefined,
      image: product.images[0]?.url,
      rating: product.rating,
      reviewCount: product.reviewCount,
      stock: product.stock,
      badge: product.badge
        ? {
            text: product.badge,
            variant: product.onSale ? 'sale' : product.featured ? 'featured' : 'new',
          }
        : undefined,
      category: product.category.name,
    }))

    const brands = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      logo: cat.image || undefined,
      productCount: 0, // Placeholder
    }))

    return {
      products: transformedProducts,
      brands,
      articles: [], // Placeholder - would search articles collection if it exists
      totalProducts: products.length,
      totalBrands: categories.length,
      totalArticles: 0,
    }
  } catch (error) {
    console.error('Error searching:', error)
    return {
      products: [],
      brands: [],
      articles: [],
    }
  }
}

interface SearchPageProps {
  searchParams: {
    q?: string
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ''
  const results = await searchProducts(query)

  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            </div>
          }
        >
          <SearchPageClient initialQuery={query} initialResults={results} />
        </Suspense>
      </div>
    </div>
  )
}

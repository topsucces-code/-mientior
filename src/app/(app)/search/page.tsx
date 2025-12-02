/**
 * Search Results Page
 * Displays search results for products, brands, and articles
 */

import { Metadata } from 'next'
import { Suspense } from 'react'
import { SearchPageClient } from './search-client'
import { search } from '@/lib/search-service'
import type { SearchResultsData } from '@/components/search/search-results'

export const metadata: Metadata = {
  title: 'Search Results | Mientior',
  description: 'Search for products, brands, and articles',
}

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = q || ''
  
  // Use unified search service
  const searchResult = await search({
    query,
    page: 1,
    limit: 24
  })

  // Transform to component format
  const results: SearchResultsData = {
    products: searchResult.products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      image: p.images[0]?.url,
      rating: p.rating,
      reviewCount: p.reviewCount,
      stock: p.stock,
      category: p.category?.name,
      badge: p.tags && Array.isArray(p.tags) && p.tags.some(t => t.name === 'new') ? { text: 'New', variant: 'new' } : undefined
    })),
    brands: [], // TODO: Implement brand search in unified service
    articles: [], // TODO: Implement article search
    totalProducts: searchResult.totalCount,
    totalBrands: 0,
    totalArticles: 0
  }

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

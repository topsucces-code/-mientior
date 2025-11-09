'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchResults, type SearchResultsData } from '@/components/search/search-results'

interface SearchPageClientProps {
  initialQuery: string
  initialResults: SearchResultsData
}

export function SearchPageClient({ initialQuery, initialResults }: SearchPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [results, setResults] = React.useState<SearchResultsData>(initialResults)
  const [isSearching, setIsSearching] = React.useState(false)

  const handleQueryChange = React.useCallback(
    async (newQuery: string) => {
      // Update URL
      const params = new URLSearchParams(searchParams.toString())
      params.set('q', newQuery)
      router.push(`/search?${params.toString()}`)

      setIsSearching(true)

      try {
        // In a real app, you'd fetch new results here
        // For now, we'll just use the initial results
        // const response = await fetch(`/api/search?q=${encodeURIComponent(newQuery)}`)
        // const data = await response.json()
        // setResults(data)
      } catch (error) {
        console.error('Error searching:', error)
      } finally {
        setIsSearching(false)
      }
    },
    [router, searchParams]
  )

  const handleClearQuery = React.useCallback(() => {
    router.push('/search')
    setResults({
      products: [],
      brands: [],
      articles: [],
    })
  }, [router])

  return (
    <SearchResults
      query={initialQuery}
      results={results}
      onQueryChange={handleQueryChange}
      onClearQuery={handleClearQuery}
    />
  )
}

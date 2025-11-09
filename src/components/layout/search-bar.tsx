'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, TrendingUp, Clock, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation'

interface SearchSuggestion {
  type: 'product' | 'category' | 'recent' | 'trending'
  id: string
  text: string
  image?: string
  category?: string
}

interface SearchBarProps {
  className?: string
  onClose?: () => void
  autoFocus?: boolean
}

export function SearchBar({ className, onClose, autoFocus = false }: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 300)

  // Recent searches from localStorage
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])

  React.useEffect(() => {
    const stored = localStorage.getItem('recent-searches')
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored))
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  const saveRecentSearch = React.useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recent-searches', JSON.stringify(updated))
  }, [recentSearches])

  // Fetch suggestions when debounced query changes
  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    const fetchSuggestions = async () => {
      setIsLoading(true)
      try {
        // TODO: Replace with actual API endpoint
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data.suggestions || [])
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSuggestions()
  }, [debouncedQuery])

  const handleSearch = React.useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) return

      saveRecentSearch(searchQuery)
      setIsOpen(false)
      setQuery('')
      onClose?.()
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    },
    [router, saveRecentSearch, onClose]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSearch(suggestions[selectedIndex].text)
    } else {
      handleSearch(query)
    }
  }

  const handleClear = () => {
    setQuery('')
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'product') {
      router.push(`/products/${suggestion.id}`)
      onClose?.()
    } else {
      handleSearch(suggestion.text)
    }
  }

  const { getFocusableElements } = useKeyboardNavigation({
    elementRef: containerRef,
    onEscape: () => {
      setIsOpen(false)
      onClose?.()
    },
    onArrowDown: () => {
      setSelectedIndex((prev) => {
        const max = suggestions.length - 1
        return prev < max ? prev + 1 : prev
      })
    },
    onArrowUp: () => {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    },
    onEnter: () => {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSuggestionClick(suggestions[selectedIndex])
      }
    },
  })

  // Auto-focus when component mounts
  React.useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const showSuggestions = isOpen && (suggestions.length > 0 || recentSearches.length > 0)

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-5 w-5 text-nuanced-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder="Search products, categories..."
            className={cn(
              'h-11 w-full rounded-lg border border-platinum-300 bg-white pl-10 pr-10 text-sm',
              'transition-all duration-200',
              'placeholder:text-nuanced-500',
              'focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20',
              'hover:border-platinum-400'
            )}
            aria-label="Search"
            aria-autocomplete="list"
            aria-controls="search-suggestions"
            aria-expanded={showSuggestions}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full hover:bg-platinum-200 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-nuanced-500" />
            </button>
          )}
          {isLoading && (
            <div className="absolute right-3">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            </div>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div
          id="search-suggestions"
          className={cn(
            'absolute left-0 right-0 top-full z-50 mt-2',
            'max-h-96 overflow-y-auto rounded-lg border border-platinum-300 bg-white shadow-elevation-3',
            'animate-fade-in'
          )}
          role="listbox"
        >
          {/* Recent Searches */}
          {!debouncedQuery && recentSearches.length > 0 && (
            <div className="border-b border-platinum-200 p-2">
              <div className="mb-2 flex items-center justify-between px-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-nuanced-600">
                  Recent Searches
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRecentSearches([])
                    localStorage.removeItem('recent-searches')
                  }}
                  className="text-xs text-nuanced-500 hover:text-orange-500 transition-colors"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={`recent-${index}`}
                  type="button"
                  onClick={() => handleSearch(search)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-platinum-100 transition-colors"
                >
                  <Clock className="h-4 w-4 flex-shrink-0 text-nuanced-500" />
                  <span className="flex-1 truncate text-anthracite-700">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors',
                    selectedIndex === index
                      ? 'bg-orange-50 text-orange-700'
                      : 'hover:bg-platinum-100 text-anthracite-700'
                  )}
                  role="option"
                  aria-selected={selectedIndex === index}
                >
                  {suggestion.type === 'trending' && (
                    <TrendingUp className="h-4 w-4 flex-shrink-0 text-orange-500" />
                  )}
                  {suggestion.type === 'recent' && (
                    <Clock className="h-4 w-4 flex-shrink-0 text-nuanced-500" />
                  )}
                  {suggestion.image && (
                    <img
                      src={suggestion.image}
                      alt=""
                      className="h-10 w-10 flex-shrink-0 rounded-md object-cover"
                    />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium">{suggestion.text}</p>
                    {suggestion.category && (
                      <p className="truncate text-xs text-nuanced-500">in {suggestion.category}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Results */}
          {debouncedQuery && !isLoading && suggestions.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-nuanced-600">No results found for &ldquo;{debouncedQuery}&rdquo;</p>
              <p className="mt-1 text-xs text-nuanced-500">Try searching with different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

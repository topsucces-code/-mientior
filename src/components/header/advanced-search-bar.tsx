'use client'

import { Search, Mic, Camera, X, Clock } from 'lucide-react'
import { useHeader } from '@/contexts/header-context'
import React, { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import type { SearchSuggestion } from '@/types'
import { useSearchHistory } from '@/hooks/use-search-history'

// Type declarations for Speech Recognition API
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
  length: number
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null
  start: () => void
  stop: () => void
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition
}

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor
    SpeechRecognition?: SpeechRecognitionConstructor
  }
}

export function AdvancedSearchBar() {
  const { searchQuery, setSearchQuery } = useHeader()
  const t = useTranslations('header')
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isListening, setIsListening] = useState(false)
  const [, setIsLoadingSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    // Get query from input ref as most reliable source
    const inputValue = inputRef.current?.value || ''

    // Get query from form data as fallback
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const formQuery = formData.get('search') as string

    // Use multiple sources with priority: input ref > context > form data
    const query = inputValue.trim() || searchQuery.trim() || formQuery?.trim() || ''

    // Debug logging (remove in production)
    console.log('[Search Debug]', {
      inputValue,
      searchQuery,
      formQuery,
      finalQuery: query,
    })

    if (query) {
      // Add to history (fire-and-forget)
      addToHistory(query)
      // Update context if it was empty
      if (!searchQuery.trim()) {
        setSearchQuery(query)
      }
      window.location.href = `/search?q=${encodeURIComponent(query)}`
    }
  }

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      if (!SpeechRecognition) return

      const recognition = new SpeechRecognition()

      recognition.lang = 'fr-FR'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => setIsListening(true)
      recognition.onend = () => setIsListening(false)

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const result = event.results[0]?.[0]
        if (result) {
          setSearchQuery(result.transcript)
          inputRef.current?.focus()
        }
      }

      recognition.start()
    } else {
      alert("La recherche vocale n'est pas supportée par votre navigateur")
    }
  }

  const handleVisualSearch = () => {
    // Open visual search modal/page
    window.location.href = '/search/visual'
  }

  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsLoadingSuggestions(true)
    const startTime = performance.now()

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)

      if (!response.ok) {
        console.error('Failed to fetch suggestions:', response.status)
        setSuggestions([])
        setIsLoadingSuggestions(false)
        return
      }

      const data = await response.json()
      const duration = performance.now() - startTime

      // Log performance in dev mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Autocomplete] ${duration.toFixed(0)}ms for "${query}"`, data.metadata)
      }

      // Transform API suggestions to component format
      const transformedSuggestions: SearchSuggestion[] = (data.suggestions || []).map(
        (s: { type?: string; text?: string; title?: string; query?: string }) => ({
          type: s.type || 'product',
          title: s.text || s.title || s.query || '',
          link: `/search?q=${encodeURIComponent(s.text || s.query || s.title || '')}`,
        })
      )

      setSuggestions(transformedSuggestions)
      setShowSuggestions(true)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const handleInputChange = (value: string) => {
    setSearchQuery(value)
    setActiveIndex(-1)

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Show history or suggestions based on input length
    if (value.length < 2) {
      // Show history when input is empty or short
      setShowSuggestions(false)
      setShowHistory(true)
      setSuggestions([])
    } else {
      // Debounce suggestions fetch to avoid flooding the server
      setShowHistory(false)
      debounceTimerRef.current = setTimeout(() => {
        fetchSuggestions(value)
      }, 150) // 150ms debounce for responsive feel while limiting requests
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isHistoryVisible = showHistory && history.length > 0
    const isSuggestionsVisible = showSuggestions && suggestions.length > 0

    if (!isHistoryVisible && !isSuggestionsVisible) return

    const itemsLength = isHistoryVisible ? history.length : suggestions.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev < itemsLength - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev > -1 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault()
        if (isHistoryVisible) {
          const query = history[activeIndex]
          setSearchQuery(query)
          setShowHistory(false)
          addToHistory(query)
          window.location.href = `/search?q=${encodeURIComponent(query)}`
        } else {
          const suggestion = suggestions[activeIndex]
          setSearchQuery(suggestion.title)
          setShowSuggestions(false)
          window.location.href = suggestion.link
        }
      }
    } else if (e.key === 'Escape') {
      setShowHistory(false)
      setShowSuggestions(false)
      setActiveIndex(-1)
    }
  }

  return (
    <form onSubmit={handleSearch} className="relative max-w-2xl flex-1">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />

        <input
          ref={inputRef}
          type="text"
          name="search"
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchQuery.length >= 2) {
              setShowSuggestions(true)
              setShowHistory(false)
            } else {
              setShowHistory(true)
              setShowSuggestions(false)
            }
          }}
          onBlur={() => {
            // Hide dropdowns after a delay to allow clicks
            setTimeout(() => {
              setShowSuggestions(false)
              setShowHistory(false)
              setActiveIndex(-1)
            }, 200)
          }}
          placeholder={t('search')}
          className="h-12 w-full rounded-full border-2 border-gray-200 pl-12 pr-32 transition-colors focus:border-turquoise-500 focus:outline-none"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions || (showHistory && history.length > 0)}
          aria-controls="search-suggestions-list"
          aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setShowSuggestions(false)
              if (history.length > 0) {
                setShowHistory(true)
              }
              inputRef.current?.focus()
            }}
            className="absolute right-24 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-gray-100"
            aria-label="Effacer"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}

        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          <button
            type="button"
            onClick={handleVoiceSearch}
            className={`rounded-full p-2 transition-colors ${
              isListening
                ? 'animate-pulse bg-red-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Recherche vocale"
            aria-label="Recherche vocale"
          >
            <Mic className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={handleVisualSearch}
            className="rounded-full p-2 text-gray-600 transition-colors hover:bg-gray-100"
            title="Recherche par image"
            aria-label="Recherche par image"
          >
            <Camera className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search History */}
      {showHistory && history.length > 0 && (
        <div
          id="search-suggestions-list"
          role="listbox"
          className="absolute top-full z-[110] mt-2 w-full animate-slide-down rounded-lg border border-gray-200 bg-white py-2 shadow-xl"
        >
          {history.map((query, index) => (
            <div
              key={`history-${index}`}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`group flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors ${
                index === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                setSearchQuery(query)
                setShowHistory(false)
                addToHistory(query)
                window.location.href = `/search?q=${encodeURIComponent(query)}`
              }}
            >
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="flex-1 text-left">{query}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFromHistory(query)
                }}
                className="rounded-full p-1 opacity-0 transition-opacity hover:bg-gray-200 group-hover:opacity-100"
                aria-label="Supprimer"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={clearHistory}
            className="mt-1 w-full border-t border-gray-100 px-4 py-2 text-left text-sm text-turquoise-600 transition-colors hover:bg-turquoise-50"
          >
            Effacer l&apos;historique
          </button>
        </div>
      )}

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          id="search-suggestions-list"
          role="listbox"
          className="absolute top-full z-[110] mt-2 w-full animate-slide-down rounded-lg border border-gray-200 bg-white py-2 shadow-xl"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.type}-${index}`}
              id={`suggestion-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              onClick={() => {
                setSearchQuery(suggestion.title)
                setShowSuggestions(false)
                window.location.href = suggestion.link
              }}
              className={`flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                index === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
            >
              <Search className="h-4 w-4 text-gray-400" />
              <span className="flex-1">{suggestion.title}</span>
              <span className="text-xs capitalize text-gray-500">{suggestion.type}</span>
            </div>
          ))}
        </div>
      )}
    </form>
  )
}

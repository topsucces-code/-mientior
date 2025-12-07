'use client'

import { Search, Mic, Camera, X, Clock } from 'lucide-react'
import { useHeader } from '@/contexts/header-context'
import { useState, useRef, useEffect } from 'react'
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
    new(): SpeechRecognition
}

declare global {
    interface Window {
        webkitSpeechRecognition?: SpeechRecognitionConstructor
        SpeechRecognition?: SpeechRecognitionConstructor
    }
}

export function AdvancedSearchBar() {
    const { searchQuery, setSearchQuery } = useHeader()
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
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
            finalQuery: query
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
            alert('La recherche vocale n\'est pas supportée par votre navigateur')
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
            const transformedSuggestions: SearchSuggestion[] = (data.suggestions || []).map((s: any) => ({
                type: s.type || 'product',
                title: s.text || s.title || s.query || '',
                link: `/search?q=${encodeURIComponent(s.text || s.query || s.title || '')}`
            }))

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

    return (
        <form onSubmit={handleSearch} className="relative flex-1 max-w-2xl">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                    ref={inputRef}
                    type="text"
                    name="search"
                    value={searchQuery}
                    onChange={(e) => handleInputChange(e.target.value)}
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
                        }, 200)
                    }}
                    placeholder="Rechercher des produits, marques ou catégories..."
                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:border-emerald-500 focus:outline-none transition-colors"
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
                        className="absolute right-24 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Effacer"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                        type="button"
                        onClick={handleVoiceSearch}
                        className={`p-2 rounded-full transition-colors ${isListening
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'hover:bg-gray-100 text-gray-600'
                            }`}
                        title="Recherche vocale"
                        aria-label="Recherche vocale"
                    >
                        <Mic className="w-5 h-5" />
                    </button>

                    <button
                        type="button"
                        onClick={handleVisualSearch}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                        title="Recherche par image"
                        aria-label="Recherche par image"
                    >
                        <Camera className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Search History */}
            {showHistory && history.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[110] animate-slide-down">
                    {history.map((query, index) => (
                        <div
                            key={`history-${index}`}
                            className="w-full px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 transition-colors group"
                        >
                            <Clock className="w-4 h-4 text-gray-400" />
                            <button
                                onClick={() => {
                                    setSearchQuery(query)
                                    setShowHistory(false)
                                    addToHistory(query)
                                    window.location.href = `/search?q=${encodeURIComponent(query)}`
                                }}
                                className="flex-1 text-left"
                            >
                                {query}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    removeFromHistory(query)
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded-full transition-opacity"
                                aria-label="Supprimer"
                            >
                                <X className="w-3 h-3 text-gray-500" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={clearHistory}
                        className="w-full px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 text-left transition-colors border-t border-gray-100 mt-1"
                    >
                        Effacer l&apos;historique
                    </button>
                </div>
            )}

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[110] animate-slide-down">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={`${suggestion.type}-${index}`}
                            onClick={() => {
                                setSearchQuery(suggestion.title)
                                setShowSuggestions(false)
                                window.location.href = suggestion.link
                            }}
                            className="w-full px-4 py-2.5 hover:bg-gray-50 text-left flex items-center gap-3 transition-colors"
                        >
                            <Search className="w-4 h-4 text-gray-400" />
                            <span className="flex-1">{suggestion.title}</span>
                            <span className="text-xs text-gray-500 capitalize">{suggestion.type}</span>
                        </button>
                    ))}
                </div>
            )}
        </form>
    )
}

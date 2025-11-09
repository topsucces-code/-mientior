'use client'

import { Search, Mic, Camera, X } from 'lucide-react'
import { useHeader } from '@/contexts/header-context'
import { useState, useRef } from 'react'
import type { SearchSuggestion } from '@/types'

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
    const [isListening, setIsListening] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
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

    const handleInputChange = (value: string) => {
        setSearchQuery(value)

        // Mock suggestions - replace with actual API call
        if (value.length >= 2) {
            setSuggestions([
                { type: 'product', title: `${value} iPhone`, link: `/search?q=${value}+iPhone` },
                { type: 'brand', title: `${value} Samsung`, link: `/search?q=${value}+Samsung` },
                { type: 'category', title: `${value} électronique`, link: `/search?q=${value}+électronique` }
            ])
            setShowSuggestions(true)
        } else {
            setShowSuggestions(false)
        }
    }

    return (
        <form onSubmit={handleSearch} className="relative flex-1 max-w-2xl">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                <input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                    placeholder="Rechercher des produits, marques ou catégories..."
                    className="w-full h-12 pl-12 pr-32 rounded-full border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                />

                {searchQuery && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchQuery('')
                            setShowSuggestions(false)
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

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 animate-slide-down">
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

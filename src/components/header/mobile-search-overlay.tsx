'use client'

import { Search, X, Mic, Camera, Clock, TrendingUp, ArrowLeft } from 'lucide-react'
import { useHeader } from '@/contexts/header-context'
import { useState, useRef, useEffect } from 'react'
import { useSearchHistory } from '@/hooks/use-search-history'

export function MobileSearchOverlay() {
    const { isMobileSearchOpen, setMobileSearchOpen, searchQuery, setSearchQuery } = useHeader()
    const [isListening, setIsListening] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory()

    // Focus input when overlay opens
    useEffect(() => {
        if (isMobileSearchOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [isMobileSearchOpen])

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMobileSearchOpen) {
                setMobileSearchOpen(false)
            }
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [isMobileSearchOpen, setMobileSearchOpen])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const query = searchQuery.trim()
        if (query) {
            addToHistory(query)
            setMobileSearchOpen(false)
            window.location.href = `/search?q=${encodeURIComponent(query)}`
        }
    }

    const handleHistoryClick = (query: string) => {
        setSearchQuery(query)
        addToHistory(query)
        setMobileSearchOpen(false)
        window.location.href = `/search?q=${encodeURIComponent(query)}`
    }

    const handleVoiceSearch = () => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
            if (!SpeechRecognition) return

            const recognition = new SpeechRecognition()
            recognition.lang = 'fr-FR'
            recognition.continuous = false
            recognition.interimResults = false

            recognition.onstart = () => setIsListening(true)
            recognition.onend = () => setIsListening(false)

            recognition.onresult = (event: any) => {
                const result = event.results[0]?.[0]
                if (result) {
                    setSearchQuery(result.transcript)
                }
            }

            recognition.start()
        }
    }

    if (!isMobileSearchOpen) return null

    // Popular searches (mock data)
    const popularSearches = [
        'iPhone 15',
        'Sneakers Nike',
        'Robe été',
        'Montre connectée',
        'Sac à main',
        'Écouteurs sans fil'
    ]

    return (
        <div 
            className="
                fixed inset-0 z-[10000] bg-white
                flex flex-col
                animate-slide-down
            "
        >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <button
                    onClick={() => setMobileSearchOpen(false)}
                    className="
                        flex items-center justify-center
                        w-10 h-10 rounded-full
                        hover:bg-gray-100
                        transition-colors
                    "
                    aria-label="Retour"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>

                {/* Search Input */}
                <form onSubmit={handleSearch} className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher..."
                            className="
                                w-full h-11 pl-10 pr-20
                                bg-gray-100 rounded-full
                                border-2 border-transparent
                                focus:border-turquoise-500 focus:bg-white
                                outline-none transition-all
                                text-[15px]
                            "
                        />
                        
                        {/* Clear button */}
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-16 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-full"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        )}

                        {/* Voice & Camera buttons */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <button
                                type="button"
                                onClick={handleVoiceSearch}
                                className={`
                                    p-2 rounded-full transition-colors
                                    ${isListening ? 'bg-red-500 text-white' : 'hover:bg-gray-200 text-gray-600'}
                                `}
                            >
                                <Mic className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => window.location.href = '/search/visual'}
                                className="p-2 hover:bg-gray-200 rounded-full text-gray-600"
                            >
                                <Camera className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Search History */}
                {history.length > 0 && (
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-500" />
                                Recherches récentes
                            </h3>
                            <button
                                onClick={clearHistory}
                                className="text-xs text-turquoise-600 font-medium hover:underline"
                            >
                                Effacer
                            </button>
                        </div>
                        <div className="space-y-1">
                            {history.slice(0, 5).map((query, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg hover:bg-gray-50 group"
                                >
                                    <button
                                        onClick={() => handleHistoryClick(query)}
                                        className="flex items-center gap-3 flex-1 text-left"
                                    >
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-[15px] text-gray-700">{query}</span>
                                    </button>
                                    <button
                                        onClick={() => removeFromHistory(query)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-200 rounded-full transition-opacity"
                                    >
                                        <X className="w-3.5 h-3.5 text-gray-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Popular Searches */}
                <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        Recherches populaires
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {popularSearches.map((term, index) => (
                            <button
                                key={index}
                                onClick={() => handleHistoryClick(term)}
                                className="
                                    px-4 py-2 rounded-full
                                    bg-gray-100 hover:bg-turquoise-50
                                    text-sm text-gray-700 hover:text-turquoise-600
                                    transition-colors
                                "
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Categories */}
                <div className="p-4 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Catégories populaires
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: '👔', name: 'Mode', slug: 'mode' },
                            { icon: '💻', name: 'Électronique', slug: 'electronique' },
                            { icon: '👟', name: 'Chaussures', slug: 'chaussures' },
                            { icon: '💄', name: 'Beauté', slug: 'beaute' },
                        ].map((cat) => (
                            <a
                                key={cat.slug}
                                href={`/categories/${cat.slug}`}
                                onClick={() => setMobileSearchOpen(false)}
                                className="
                                    flex items-center gap-3 p-3
                                    bg-gray-50 hover:bg-turquoise-50
                                    rounded-xl transition-colors
                                "
                            >
                                <span className="text-2xl">{cat.icon}</span>
                                <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

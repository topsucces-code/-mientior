'use client'

import { MapPin, ChevronDown, Search, Loader2, Clock } from 'lucide-react'
import { useGeolocation } from '@/hooks/use-geolocation'
import { usePreferencesStore } from '@/stores/preferences.store'
import { FRENCH_CITIES } from '@/lib/constants'
import { useState, useRef, useEffect } from 'react'

export function GeolocationSelector() {
    const { data, loading } = useGeolocation()
    const { location, setLocation } = usePreferencesStore()
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [detecting, setDetecting] = useState(false)
    const [recentLocations, setRecentLocations] = useState<string[]>([])
    const dropdownRef = useRef<HTMLDivElement>(null)

    const displayLocation = location || data?.city || data?.country || 'Bouaké'

    // Load recent locations from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentLocations')
        if (saved) {
            setRecentLocations(JSON.parse(saved))
        }
    }, [])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Filter cities based on search query
    const filteredCities = FRENCH_CITIES.filter(
        (city) =>
            city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            city.region.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleCitySelect = (cityName: string) => {
        setLocation(cityName)
        // Add to recent locations
        const updated = [cityName, ...recentLocations.filter(l => l !== cityName)].slice(0, 3)
        setRecentLocations(updated)
        localStorage.setItem('recentLocations', JSON.stringify(updated))
        setIsOpen(false)
        setSearchQuery('')
    }

    const handleAutoDetect = () => {
        setDetecting(true)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (_position) => {
                    if (data?.city) {
                        handleCitySelect(data.city)
                    }
                    setDetecting(false)
                },
                () => {
                    setDetecting(false)
                }
            )
        } else {
            setDetecting(false)
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 text-[13px] font-medium tracking-[0.02em] group"
                aria-label={`Localisation actuelle: ${displayLocation}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <MapPin className="w-4 h-4 text-turquoise-600 group-hover:animate-bounce-subtle transition-transform" />
                <span className="text-gray-500">Livraison :</span>
                <span className="text-turquoise-600 font-semibold">
                    {loading ? 'Détection...' : displayLocation}
                </span>
                <ChevronDown
                    className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="
                    absolute left-0 top-[calc(100%+8px)] 
                    w-[340px] bg-white rounded-xl 
                    shadow-[0_12px_48px_rgba(8,145,178,0.15)] 
                    p-5 z-[9999] animate-slide-down
                ">
                    {/* Arrow indicator */}
                    <div className="
                        absolute -top-1.5 left-6 w-3 h-3 
                        bg-white rotate-45 
                        shadow-[-2px_-2px_4px_rgba(0,0,0,0.03)]
                    " />
                    
                    {/* Auto-detect Button */}
                    <button
                        onClick={handleAutoDetect}
                        disabled={detecting}
                        className="
                            w-full flex items-center justify-center gap-2 
                            px-4 py-3 mb-4 rounded-lg
                            bg-turquoise-50 border border-turquoise-600
                            text-turquoise-600 text-sm font-semibold
                            hover:scale-[1.02] transition-transform duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed
                        "
                    >
                        {detecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <MapPin className="w-4 h-4" />
                        )}
                        <span>{detecting ? 'Détection en cours...' : '📍 Utiliser ma position'}</span>
                    </button>

                    {/* Search Input */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher une ville..."
                            className="
                                w-full pl-10 pr-4 py-2.5 
                                border border-gray-200 rounded-lg
                                text-sm text-gray-800
                                focus:border-turquoise-600 focus:ring-0 
                                focus:shadow-[0_0_0_3px_rgba(8,145,178,0.1)]
                                transition-all duration-200
                            "
                        />
                    </div>

                    {/* Recent Locations */}
                    {recentLocations.length > 0 && !searchQuery && (
                        <div className="mb-4">
                            <h4 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 mb-2">
                                Récent
                            </h4>
                            <div className="space-y-1">
                                {recentLocations.map((loc) => (
                                    <button
                                        key={loc}
                                        onClick={() => handleCitySelect(loc)}
                                        className={`
                                            w-full flex items-center gap-3 px-3 py-2 rounded-lg
                                            text-left transition-all duration-200
                                            ${location === loc 
                                                ? 'bg-turquoise-50 text-turquoise-600' 
                                                : 'hover:bg-turquoise-50 text-gray-800'
                                            }
                                        `}
                                    >
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="font-medium text-sm">{loc}</span>
                                        {location === loc && (
                                            <span className="ml-auto text-turquoise-600">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cities List */}
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {filteredCities.length > 0 ? (
                            <div className="space-y-1">
                                {filteredCities.slice(0, 8).map((city) => (
                                    <button
                                        key={city.code}
                                        onClick={() => handleCitySelect(city.name)}
                                        className={`
                                            w-full flex items-start gap-3 px-3 py-2.5 rounded-lg
                                            text-left transition-all duration-200
                                            ${location === city.name
                                                ? 'bg-turquoise-50 text-turquoise-600'
                                                : 'hover:bg-turquoise-50'
                                            }
                                        `}
                                    >
                                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-turquoise-500" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-800">{city.name}</div>
                                            <div className="text-xs text-gray-500">{city.region}</div>
                                        </div>
                                        {location === city.name && (
                                            <span className="text-turquoise-600 flex-shrink-0">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-500 text-sm">
                                Aucune ville trouvée
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 text-center">
                            📦 Votre localisation nous aide à calculer les frais de livraison
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

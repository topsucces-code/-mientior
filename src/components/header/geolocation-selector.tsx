'use client'

import { MapPin, ChevronDown, Search, Loader2, Navigation } from 'lucide-react'
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
    const dropdownRef = useRef<HTMLDivElement>(null)

    const displayLocation = location || data?.city || data?.country || 'France'

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
        setIsOpen(false)
        setSearchQuery('')
    }

    const handleAutoDetect = () => {
        setDetecting(true)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (_position) => {
                    // In a real app, you would reverse geocode these coordinates
                    // For now, we'll use the IP-based detection
                    if (data?.city) {
                        setLocation(data.city)
                    }
                    setDetecting(false)
                    setIsOpen(false)
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
                className="flex items-center gap-1.5 text-sm hover:text-emerald-600 transition-colors group"
                aria-label={`Localisation actuelle: ${displayLocation}`}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">
                    {loading ? 'Détection...' : displayLocation}
                </span>
                <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 w-80 z-50 animate-slide-down">
                    {/* Search Input */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher une ville..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                            />
                        </div>
                    </div>

                    {/* Auto-detect Button */}
                    <div className="p-3 border-b border-gray-200">
                        <button
                            onClick={handleAutoDetect}
                            disabled={detecting}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-emerald-50 transition-colors text-sm font-medium text-emerald-600 disabled:opacity-50"
                        >
                            {detecting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Navigation className="w-4 h-4" />
                            )}
                            <span>{detecting ? 'Détection en cours...' : 'Détecter ma position'}</span>
                        </button>
                    </div>

                    {/* Cities List */}
                    <div className="max-h-80 overflow-y-auto">
                        {filteredCities.length > 0 ? (
                            <div className="p-2">
                                {filteredCities.map((city) => (
                                    <button
                                        key={city.code}
                                        onClick={() => handleCitySelect(city.name)}
                                        className={`w-full flex items-start gap-3 px-3 py-2 rounded-md transition-colors text-left ${
                                            location === city.name
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm">{city.name}</div>
                                            <div className="text-xs text-gray-500">{city.region}</div>
                                        </div>
                                        {location === city.name && (
                                            <span className="text-emerald-600 flex-shrink-0">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                Aucune ville trouvée
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                        <p className="text-xs text-gray-600">
                            Votre localisation nous aide à vous proposer les meilleures options de livraison
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

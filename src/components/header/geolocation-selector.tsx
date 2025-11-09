'use client'

import { MapPin } from 'lucide-react'
import { useGeolocation } from '@/hooks/use-geolocation'
import { usePreferencesStore } from '@/stores/preferences.store'

export function GeolocationSelector() {
    const { data, loading } = useGeolocation()
    const { location } = usePreferencesStore()

    const displayLocation = location || data?.city || data?.country || 'France'

    return (
        <button
            className="flex items-center gap-1.5 text-sm hover:text-blue-600 transition-colors group"
            aria-label={`Localisation actuelle: ${displayLocation}`}
        >
            <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="font-medium">
                {loading ? 'Détection...' : displayLocation}
            </span>
        </button>
    )
}

import { useState, useEffect } from 'react'
import type { GeolocationData } from '@/types'
import { GEOLOCATION_CONFIG } from '@/lib/constants'

interface UseGeolocationReturn {
    data: GeolocationData | null
    loading: boolean
    error: string | null
    refetch: () => void
}

export function useGeolocation(): UseGeolocationReturn {
    const [data, setData] = useState<GeolocationData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchGeolocation = async () => {
        setLoading(true)
        setError(null)

        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), GEOLOCATION_CONFIG.timeout)

            const response = await fetch(GEOLOCATION_CONFIG.apiUrl, {
                signal: controller.signal
            })

            clearTimeout(timeoutId)

            if (!response.ok) {
                throw new Error('Failed to fetch geolocation data')
            }

            const result = await response.json()

            const geolocationData: GeolocationData = {
                country: result.country || GEOLOCATION_CONFIG.defaultCountry,
                city: result.city || null,
                region: result.region || null,
                countryCode: result.country_code || 'SN',
                currency: result.currency || 'XOF',
                timezone: result.timezone || 'Africa/Dakar'
            }

            setData(geolocationData)
        } catch (err) {
            if (err instanceof Error) {
                if (err.name === 'AbortError') {
                    setError('Request timeout - using default location')
                } else {
                    setError(err.message)
                }
            } else {
                setError('An unknown error occurred')
            }

            // Set default data on error
            setData({
                country: GEOLOCATION_CONFIG.defaultCountry,
                city: null,
                region: null,
                countryCode: 'SN',
                currency: 'XOF',
                timezone: 'Africa/Dakar'
            })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGeolocation()
    }, [])

    return {
        data,
        loading,
        error,
        refetch: fetchGeolocation
    }
}

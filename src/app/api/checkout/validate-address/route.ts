/**
 * API endpoint for address validation and postal code autocomplete
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Address } from '@/types'
import { getCachedData } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const address: Address = await request.json()

    // Basic field validation
    const errors: string[] = []

    if (!address.firstName || address.firstName.trim().length < 2) {
      errors.push('Le prénom doit contenir au moins 2 caractères')
    }

    if (!address.lastName || address.lastName.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères')
    }

    if (!address.line1 || address.line1.trim().length < 5) {
      errors.push('L\'adresse doit contenir au moins 5 caractères')
    }

    if (!address.city || address.city.trim().length < 2) {
      errors.push('La ville doit contenir au moins 2 caractères')
    }

    if (!address.postalCode || !/^\d{5}$/.test(address.postalCode)) {
      errors.push('Le code postal doit contenir 5 chiffres')
    }

    if (!address.country || address.country.trim().length < 2) {
      errors.push('Le pays est requis')
    }

    if (!address.phone || !/^[\d\s+()-]{10,}$/.test(address.phone)) {
      errors.push('Le numéro de téléphone est invalide')
    }

    if (errors.length > 0) {
      return NextResponse.json({
        valid: false,
        errors,
      })
    }

    // In production, integrate with external address validation API
    // e.g., Google Maps API, La Poste API for France, etc.
    // For now, return valid if basic validation passes

    // Example: Check if external API is configured
    const externalApiKey = process.env.ADDRESS_VALIDATION_API_KEY

    if (externalApiKey) {
      // TODO: Call external API for address validation
      // const suggestions = await validateWithExternalAPI(address, externalApiKey)
      // if (suggestions.length > 0) {
      //   return NextResponse.json({
      //     valid: true,
      //     suggestions,
      //   })
      // }
    }

    return NextResponse.json({
      valid: true,
    })
  } catch (error) {
    console.error('Address validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate address', valid: false },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint for postal code auto-complete
 * Fetches city information based on French postal code
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const postalCode = searchParams.get('postalCode')

    if (!postalCode) {
      return NextResponse.json(
        { success: false, error: 'Code postal requis' },
        { status: 400 }
      )
    }

    // Validate French postal code format (5 digits)
    if (!/^\d{5}$/.test(postalCode)) {
      return NextResponse.json(
        { success: false, error: 'Code postal invalide (5 chiffres requis)' },
        { status: 400 }
      )
    }

    // Try to get from cache first
    const cacheKey = `address:postal:${postalCode}`
    const data = await getCachedData(
      cacheKey,
      async () => {
        // Fetch from French government API
        const apiUrl = `https://api-adresse.data.gouv.fr/search/?q=${postalCode}&type=municipality&limit=10`
        const response = await fetch(apiUrl)

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données')
        }

        return await response.json()
      },
      3600 // Cache for 1 hour
    )

    // Extract relevant information
    const features = data.features || []

    if (features.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          cities: [],
          message: 'Aucune ville trouvée pour ce code postal',
        },
      })
    }

    // Extract cities with their departments
    const cities = features.map((feature: any) => ({
      city: feature.properties.city,
      postalCode: feature.properties.postcode,
      department: feature.properties.context?.split(',')[0]?.trim() || '',
      region: feature.properties.context?.split(',')[1]?.trim() || '',
      label: feature.properties.label,
    }))

    // Remove duplicates based on city name
    const uniqueCities = cities.filter(
      (city, index, self) =>
        index === self.findIndex((c) => c.city === city.city)
    )

    return NextResponse.json({
      success: true,
      data: {
        postalCode,
        cities: uniqueCities,
      },
    })
  } catch (error) {
    console.error('Postal code lookup error:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erreur lors de la récupération des données',
      },
      { status: 500 }
    )
  }
}


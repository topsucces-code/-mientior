import { NextRequest, NextResponse } from 'next/server'

interface City {
  nom: string
  code: string
  codeDepartement: string
  codeRegion: string
  codesPostaux: string[]
  population: number
}

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

    // Validate postal code format (5 digits for France)
    if (!/^\d{5}$/.test(postalCode)) {
      return NextResponse.json(
        { success: false, error: 'Format de code postal invalide' },
        { status: 400 }
      )
    }

    // Call French government API
    const response = await fetch(
      `https://geo.api.gouv.fr/communes?codePostal=${postalCode}&fields=nom,code,codesPostaux,codeDepartement,codeRegion,population&format=json&geometry=centre`,
      {
        headers: {
          'User-Agent': 'MientiorMarketplace/1.0',
        },
      }
    )

    if (!response.ok) {
      throw new Error('API externe non disponible')
    }

    const cities: City[] = await response.json()

    if (!cities || cities.length === 0) {
      return NextResponse.json({
        success: true,
        cities: [],
        message: 'Aucune ville trouvée pour ce code postal',
      })
    }

    // Format response
    const formattedCities = cities.map((city) => ({
      name: city.nom,
      postalCode: postalCode,
      code: city.code,
      department: city.codeDepartement,
      region: city.codeRegion,
      population: city.population,
    }))

    return NextResponse.json({
      success: true,
      cities: formattedCities,
    })
  } catch (error) {
    console.error('Cities lookup error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la recherche des villes',
      },
      { status: 500 }
    )
  }
}

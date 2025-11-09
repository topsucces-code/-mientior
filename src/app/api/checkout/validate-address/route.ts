/**
 * API endpoint for address validation
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Address } from '@/types'

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


/**
 * API endpoint for retrieving shipping options with dynamic pricing
 * Uses shipping-calculation service for zone-based and weight-based pricing
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAvailableShippingOptions } from '@/lib/shipping-calculation'
import { getCachedData } from '@/lib/redis'
import { detectDeliveryZone } from '@/lib/tax-calculation'
import type { Address, CartItem } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, items }: { address: Address; items: Array<{ productId: string; quantity: number }> } = body

    if (!address || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate address has minimum required fields (postal code is optional for some countries)
    if (!address.country) {
      return NextResponse.json(
        { error: 'Address must include country' },
        { status: 400 }
      )
    }

    // Fetch products and calculate real subtotal
    let subtotal = 0 // in cents
    const cartItems: CartItem[] = []

    for (const item of items) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: {
              take: 1,
              select: { url: true }
            }
          },
        })

        if (!product) {
          console.warn(`Product ${item.productId} not found`)
          continue
        }

        // Price is stored in euros, convert to cents
        const priceInCents = Math.round(product.price * 100)
        subtotal += priceInCents * item.quantity

        // Build cart item for shipping calculation
        cartItems.push({
          id: product.id,
          productId: product.id,
          productSlug: product.slug,
          productImage: product.images[0]?.url || '',
          name: product.name,
          price: priceInCents,
          quantity: item.quantity,
          stock: 999, // Not needed for shipping calculation
        })
      } catch (error) {
        console.error(`Error fetching product ${item.productId}:`, error)
        return NextResponse.json(
          { error: `Invalid product: ${item.productId}` },
          { status: 400 }
        )
      }
    }

    // Check if this is an African country
    const africanCountries = ['CI', 'SN', 'ML', 'BF', 'BJ', 'TG', 'NE', 'GN', 'GH', 'NG', 'CM', 'GA', 'CG', 'CD', 'TD', 'CF', 'MA', 'TN', 'DZ', 'RW', 'BI', 'MG', 'MU']
    const isAfricanCountry = africanCountries.includes(address.country)

    // Define default shipping options for African countries
    const africanShippingOptions = [
      {
        id: 'standard-africa',
        name: 'Livraison Standard',
        price: subtotal >= 5000 ? 0 : 1500, // Free above 50€, else 15€
        estimatedDays: 5,
        description: subtotal >= 5000 ? 'Gratuit pour les commandes de plus de 50€' : 'Livraison en 5-7 jours ouvrés',
        carrier: 'DHL Express',
      },
      {
        id: 'express-africa',
        name: 'Livraison Express',
        price: 3000, // 30€
        estimatedDays: 3,
        description: 'Livraison rapide en 2-3 jours ouvrés',
        carrier: 'DHL Express',
      },
      {
        id: 'economy-africa',
        name: 'Livraison Économique',
        price: 800, // 8€
        estimatedDays: 10,
        description: 'Livraison économique en 7-10 jours ouvrés',
        carrier: 'La Poste',
      },
    ]

    let options

    if (isAfricanCountry) {
      // Use predefined options for African countries
      console.log(`[Shipping Options] African country: ${address.country}, using predefined options`)
      options = africanShippingOptions
    } else {
      // Generate cache key based on address and subtotal
      const zone = detectDeliveryZone(address)
      const postalCode = address.postalCode || 'unknown'
      const cacheKey = `shipping:options:${zone}:${postalCode.replace(/\s/g, '')}:${subtotal}`

      // Get shipping options with caching
      options = await getCachedData(
        cacheKey,
        async () => {
          console.log(`[Shipping Options] Cache miss - calculating for zone: ${zone}`)
          return getAvailableShippingOptions(address, cartItems, subtotal)
        },
        3600 // 1 hour TTL
      )

      console.log(`[Shipping Options] Zone: ${zone}, Options: ${options.length}`)
    }

    // Add store pickup option if enabled
    const hasNearbyStores = process.env.ENABLE_STORE_PICKUP === 'true'
    if (hasNearbyStores) {
      options.push({
        id: 'pickup',
        name: 'Retrait en Magasin',
        price: 0,
        estimatedDays: 1,
        description: 'Gratuit - Disponible dès demain',
      })
    }

    return NextResponse.json({
      data: options,
      success: true,
    })
  } catch (error) {
    console.error('Shipping options error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shipping options', success: false },
      { status: 500 }
    )
  }
}

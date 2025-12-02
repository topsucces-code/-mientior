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

    // Validate address has minimum required fields
    if (!address.country || !address.postalCode) {
      return NextResponse.json(
        { error: 'Address must include country and postal code' },
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

    // Generate cache key based on address and subtotal
    const zone = detectDeliveryZone(address)
    const cacheKey = `shipping:options:${zone}:${address.postalCode.replace(/\s/g, '')}:${subtotal}`

    // Get shipping options with caching
    const options = await getCachedData(
      cacheKey,
      async () => {
        console.log(`[Shipping Options] Cache miss - calculating for zone: ${zone}`)
        return getAvailableShippingOptions(address, cartItems, subtotal)
      },
      3600 // 1 hour TTL
    )

    console.log(`[Shipping Options] Zone: ${zone}, Options: ${options.length}`)

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

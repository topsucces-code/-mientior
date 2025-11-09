/**
 * API endpoint for retrieving shipping options
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Address, ShippingOption } from '@/types'

// Free shipping threshold in cents
const FREE_SHIPPING_THRESHOLD = 2500 // 25€ in cents

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { address, items }: { address: Address; items: Array<{ productId: string; quantity: number }> } = body

    if (!address || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch products and calculate real subtotal
    let subtotal = 0 // in cents
    let totalWeight = 0 // in grams (if available)

    for (const item of items) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
          },
        })

        if (!product) {
          console.warn(`Product ${item.productId} not found`)
          continue
        }

        // Price is stored in euros, convert to cents
        const priceInCents = Math.round(product.price * 100)
        subtotal += priceInCents * item.quantity

        // Add weight if available (for future use)
        // totalWeight += (product.weight || 0) * item.quantity
      } catch (error) {
        console.error(`Error fetching product ${item.productId}:`, error)
        return NextResponse.json(
          { error: `Invalid product: ${item.productId}` },
          { status: 400 }
        )
      }
    }

    // Calculate estimated delivery dates (skip weekends)
    const getEstimatedDays = (baseDays: number): number => {
      let days = baseDays
      const today = new Date()
      let checkDate = new Date(today)
      let businessDays = 0

      while (businessDays < baseDays) {
        checkDate.setDate(checkDate.getDate() + 1)
        // Skip weekends
        if (checkDate.getDay() !== 0 && checkDate.getDay() !== 6) {
          businessDays++
        }
        days++
      }

      return days
    }

    const options: ShippingOption[] = []

    // Standard Shipping (4-6 business days)
    const standardPrice = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 490 // 4.90€ in cents
    options.push({
      id: 'standard',
      name: 'Livraison Standard',
      price: standardPrice,
      estimatedDays: getEstimatedDays(5),
      carrier: 'Colissimo',
      description: subtotal >= FREE_SHIPPING_THRESHOLD ? 'Gratuite - 4-6 jours ouvrés' : '4-6 jours ouvrés',
    })

    // Express Shipping (2-3 business days)
    options.push({
      id: 'express',
      name: 'Livraison Express',
      price: 990, // 9.90€ in cents
      estimatedDays: getEstimatedDays(2),
      carrier: 'Chronopost',
      description: '2-3 jours ouvrés',
    })

    // Relay Point (3-5 business days)
    options.push({
      id: 'relay',
      name: 'Point Relais',
      price: 390, // 3.90€ in cents
      estimatedDays: getEstimatedDays(4),
      carrier: 'Mondial Relay',
      description: '3-5 jours - Retrait en point relais',
    })

    // Store Pickup (if available)
    // In production, query a Stores collection based on address proximity
    // For now, disable pickup unless explicitly configured
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
    return NextResponse.json({ error: 'Failed to fetch shipping options', success: false }, { status: 500 })
  }
}

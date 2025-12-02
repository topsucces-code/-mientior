/**
 * API endpoint for real-time totals calculation
 * Calculates subtotal, shipping, tax, discount, and total based on address and cart items
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateShippingCost, FREE_SHIPPING_THRESHOLD } from '@/lib/shipping-calculation'
import { calculateTax } from '@/lib/tax-calculation'
import { getCachedData } from '@/lib/redis'
import type { CalculateTotalsPayload, CartItem, TotalsCalculationResult } from '@/types'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body: CalculateTotalsPayload = await request.json()
    const { items, address, shippingOptionId, couponCode } = body

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      )
    }

    if (!address || !address.country || !address.postalCode) {
      return NextResponse.json(
        { error: 'Valid shipping address is required (country and postalCode minimum)' },
        { status: 400 }
      )
    }

    if (!shippingOptionId) {
      return NextResponse.json(
        { error: 'Shipping option is required' },
        { status: 400 }
      )
    }

    // Generate cache key based on all inputs
    const cacheKey = generateCacheKey(items, address, shippingOptionId, couponCode)

    // Get cached result or calculate fresh
    const result = await getCachedData<TotalsCalculationResult>(
      cacheKey,
      async () => {
        console.log('[Calculate Totals] Cache miss - calculating totals')

        // Step 1: Fetch products and calculate subtotal
        let subtotal = 0 // in cents
        const cartItems: CartItem[] = []

        for (const item of items) {
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
            throw new Error(`Product not found: ${item.productId}`)
          }

          // Price is stored in euros, convert to cents
          const priceInCents = Math.round(product.price * 100)
          subtotal += priceInCents * item.quantity

          // Build cart item for calculations
          cartItems.push({
            id: product.id,
            productId: product.id,
            productSlug: product.slug,
            productImage: product.images[0]?.url || '',
            name: product.name,
            price: priceInCents,
            quantity: item.quantity,
            stock: 999, // Not needed for calculations
          })
        }

        // Step 2: Calculate discount (if coupon provided)
        let discount = 0 // in cents
        if (couponCode) {
          try {
            // Fetch coupon from database
            const coupon = await prisma.promoCode.findUnique({
              where: { code: couponCode },
            })

            if (coupon && coupon.isActive) {
              // Check if coupon is expired
              if (coupon.validTo && new Date(coupon.validTo) < new Date()) {
                console.warn(`[Calculate Totals] Coupon ${couponCode} has expired`)
              } else if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
                console.warn(`[Calculate Totals] Coupon ${couponCode} has reached max uses`)
              } else {
                // Apply discount
                if (coupon.type === 'PERCENTAGE') {
                  discount = Math.round(subtotal * (coupon.value / 100))
                } else if (coupon.type === 'FIXED_AMOUNT') {
                  // Discount is stored in euros, convert to cents
                  discount = Math.round(coupon.value * 100)
                }

                // Ensure discount doesn't exceed subtotal
                if (discount > subtotal) {
                  discount = subtotal
                }

                console.log(`[Calculate Totals] Applied coupon ${couponCode}: -${discount} cents`)
              }
            } else {
              console.warn(`[Calculate Totals] Invalid or inactive coupon: ${couponCode}`)
            }
          } catch (error) {
            console.error(`[Calculate Totals] Error fetching coupon:`, error)
            // Continue without discount
          }
        }

        // Step 3: Calculate shipping cost
        const netSubtotalForShipping = Math.max(0, subtotal - discount)
        const shippingType = shippingOptionId as 'standard' | 'express'

        const shipping = calculateShippingCost(
          cartItems,
          address,
          shippingType,
          netSubtotalForShipping
        )

        // Step 4: Calculate tax
        const tax = calculateTax(netSubtotalForShipping, address)

        // Step 5: Calculate total
        const total = netSubtotalForShipping + shipping.cost + tax.taxAmount

        // Step 6: Calculate free shipping info
        const freeShippingThreshold = FREE_SHIPPING_THRESHOLD
        const amountToFreeShipping = Math.max(0, freeShippingThreshold - netSubtotalForShipping)

        return {
          subtotal,
          shipping,
          tax,
          discount,
          total,
          freeShippingThreshold,
          amountToFreeShipping: amountToFreeShipping > 0 ? amountToFreeShipping : undefined
        }
      },
      3600 // 1 hour TTL
    )

    console.log(`[Calculate Totals] Total: ${result.total} cents, Tax: ${result.tax.taxAmount} cents, Shipping: ${result.shipping.cost} cents`)

    return NextResponse.json({
      data: result,
      success: true,
    })
  } catch (error) {
    console.error('[Calculate Totals] Error:', error)

    // Provide specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Product not found')) {
        return NextResponse.json(
          { error: error.message, success: false },
          { status: 400 }
        )
      }
      if (error.message.includes('Shipping type')) {
        return NextResponse.json(
          { error: 'Invalid shipping option for delivery zone', success: false },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to calculate totals', success: false },
      { status: 500 }
    )
  }
}

/**
 * Generates a cache key for totals calculation
 */
function generateCacheKey(
  items: CalculateTotalsPayload['items'],
  address: CalculateTotalsPayload['address'],
  shippingOptionId: string,
  couponCode?: string
): string {
  // Create a hash of all inputs to ensure unique cache key
  const hash = crypto.createHash('md5')
    .update(JSON.stringify({
      items: items.map(i => ({ id: i.productId, qty: i.quantity, vid: i.variantId })),
      country: address.country,
      postalCode: address.postalCode,
      shipping: shippingOptionId,
      coupon: couponCode || ''
    }))
    .digest('hex')

  return `totals:calc:${hash}`
}

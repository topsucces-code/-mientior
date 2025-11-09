/**
 * API endpoint for creating Stripe Payment Intent
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

// Free shipping threshold in cents
const FREE_SHIPPING_THRESHOLD = 2500 // 25€

// Shipping costs in cents
const SHIPPING_COSTS: Record<string, number> = {
  standard: 490,
  express: 990,
  relay: 390,
  pickup: 0,
}

// VAT rate (20% for France)
const VAT_RATE = 0.2

export async function POST(request: NextRequest) {
  try {
    // Optional authentication - support guest checkout
    const session = await getSession()
    const allowGuestCheckout = process.env.ALLOW_GUEST_CHECKOUT !== 'false' // Default to true

    const body = await request.json()
    const {
      items,
      shippingOption = 'standard',
      promoCode,
      email,
      orderId,
      metadata = {},
    }: {
      items: Array<{ productId: string; variantId?: string; quantity: number }>
      shippingOption?: string
      promoCode?: string
      email?: string
      orderId?: string
      metadata?: Record<string, any>
    } = body

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 })
    }

    // Require email for guest checkout
    if (!session && !email) {
      return NextResponse.json({ error: 'Email is required for guest checkout' }, { status: 400 })
    }

    // Check if guest checkout is allowed
    if (!session && !allowGuestCheckout) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // SERVER-SIDE TOTAL RECOMPUTATION
    let subtotal = 0 // in cents

    for (const item of items) {
      try {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            variants: {
              where: item.variantId ? { id: item.variantId } : undefined,
              select: {
                id: true,
                priceModifier: true,
              },
            },
          },
        })

        if (!product) {
          return NextResponse.json(
            { error: `Product ${item.productId} not found` },
            { status: 404 }
          )
        }

        // Check stock
        if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for product ${product.name}` },
            { status: 400 }
          )
        }

        // Calculate price (convert from euros to cents)
        let itemPrice = Math.round(product.price * 100)

        // Apply variant price modifier if applicable
        if (item.variantId && product.variants.length > 0) {
          const variant = product.variants[0]
          if (variant.priceModifier) {
            itemPrice += Math.round(variant.priceModifier * 100)
          }
        }

        subtotal += itemPrice * item.quantity
      } catch (error) {
        console.error(`Error fetching product ${item.productId}:`, error)
        return NextResponse.json(
          { error: `Invalid product: ${item.productId}` },
          { status: 400 }
        )
      }
    }

    // Calculate shipping cost
    let shippingCost = SHIPPING_COSTS[shippingOption] || SHIPPING_COSTS.standard
    if (shippingOption === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD) {
      shippingCost = 0
    }

    // Calculate tax (VAT)
    const tax = Math.round((subtotal + shippingCost) * VAT_RATE)

    // Calculate discount (if promo code provided)
    let discount = 0
    if (promoCode) {
      // In production, validate promo code via API
      // For now, skip to avoid circular dependency
      // discount = await validatePromoCode(promoCode, subtotal)
    }

    // Calculate total
    const total = subtotal + shippingCost + tax - discount

    // Validate against client-provided amount (if any)
    // Allow 1 cent tolerance for rounding
    const clientAmount = body.amount
    if (clientAmount && Math.abs(clientAmount - total) > 1) {
      console.error(`Amount mismatch: client=${clientAmount}, server=${total}`)
      return NextResponse.json(
        {
          error: 'Amount mismatch. Please refresh and try again.',
          expected: total,
          received: clientAmount,
        },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    let stripeCustomerId: string | undefined
    // In production, fetch or create Stripe customer based on user/email

    // Create the Payment Intent with server-computed amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total, // Already in cents
      currency: 'eur',
      customer: stripeCustomerId,
      receipt_email: email || session?.user?.email,
      metadata: {
        orderId: orderId || '',
        userId: session?.user?.id || '',
        guestEmail: !session ? email : '',
        items: JSON.stringify(items.map(i => ({ productId: i.productId, quantity: i.quantity }))),
        subtotal: subtotal.toString(),
        shippingCost: shippingCost.toString(),
        tax: tax.toString(),
        discount: discount.toString(),
        total: total.toString(),
        ...metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Log for audit
    const identifier = session?.user?.id || email || 'unknown'
    console.log(`Payment Intent created: ${paymentIntent.id} for ${identifier}, amount: ${total} cents`)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      success: true,
    })
  } catch (error: any) {
    console.error('Payment Intent creation error:', error)

    return NextResponse.json(
      {
        error: 'Failed to create payment intent',
        details: error.message,
        success: false,
      },
      { status: 500 }
    )
  }
}

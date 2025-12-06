/**
 * API endpoint for creating orders after successful payment
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'
import { verifyPaystackTransaction } from '@/lib/paystack'
import { verifyFlutterwaveTransaction } from '@/lib/flutterwave'
import { sendOrderConfirmationEmail } from '@/lib/email'
import { triggerNewOrder } from '@/lib/pusher'
import { triggerCustomerLoyaltyUpdate } from '@/lib/real-time-updates'
import {
  acquireMultipleStockLocks,
  releaseMultipleStockLocks,
  decrementStockAtomic,
  isOrderProcessed,
  markOrderProcessed,
} from '@/lib/stock-lock'
import { generateOrderNumber, calculateEstimatedDelivery } from '@/lib/checkout-utils'
import { addBusinessDays } from 'date-fns'
import type { Address } from '@/types'
import { validatePromoCode, recordPromoCodeUsage } from '@/lib/promo-code-validator'
import { redeemLoyaltyPoints, awardOrderPoints } from '@/lib/loyalty-points'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await requireAuth()
    const userId = session.user.id

    const body = await request.json()
    const {
      items,
      shippingAddress,
      billingAddress,
      shippingOption,
      paymentReference,
      paymentGateway,
      promoCode,
      orderNotes,
    }: {
      items: Array<{ productId: string; variantId?: string; quantity: number }>
      shippingAddress: Address
      billingAddress?: Address
      shippingOption: string
      paymentReference?: string
      paymentGateway?: 'PAYSTACK' | 'FLUTTERWAVE'
      promoCode?: string
      loyaltyPointsToRedeem?: number
      orderNotes?: string
    } = body

    // Validate required fields
    if (!items || items.length === 0 || !shippingAddress || !paymentReference) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Idempotency check - prevent duplicate order creation on retries
    const alreadyProcessed = await isOrderProcessed(paymentReference)
    if (alreadyProcessed) {
      return NextResponse.json(
        { error: 'Order already created for this payment', success: false },
        { status: 409 }
      )
    }

    // Verify payment based on gateway
    if (paymentGateway === 'PAYSTACK') {
      try {
        const verification = await verifyPaystackTransaction(paymentReference)
        if (verification.status !== 'success') {
          return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 })
        }
      } catch (error) {
        console.error('Paystack verification error:', error)
        return NextResponse.json({ error: 'Invalid payment reference' }, { status: 400 })
      }
    } else if (paymentGateway === 'FLUTTERWAVE') {
      try {
        const verification = await verifyFlutterwaveTransaction(paymentReference) as any
        if (verification.status !== 'successful') {
          return NextResponse.json({ error: 'Payment not confirmed' }, { status: 400 })
        }
      } catch (error) {
        console.error('Flutterwave verification error:', error)
        return NextResponse.json({ error: 'Invalid payment reference' }, { status: 400 })
      }
    }

    // TRANSACTIONAL STOCK MANAGEMENT
    // Using Redis-based distributed locks to prevent race conditions
    // This ensures atomic stock decrements even under high concurrency

    let subtotal = 0 // in cents
    const orderItems: any[] = []
    const productIds = items.map(item => item.productId)

    // Step 1: Acquire distributed locks for all products in the order
    console.log(`Acquiring locks for products: ${productIds.join(', ')}`)
    const { success: locksAcquired, lockedIds } = await acquireMultipleStockLocks(productIds)

    if (!locksAcquired) {
      console.error('Failed to acquire locks for all products')
      return NextResponse.json(
        { error: 'Unable to process order due to high demand. Please try again.', success: false },
        { status: 503 }
      )
    }

    try {
      // Step 2: Fetch products and validate stock (with locks held)
      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            images: {
              orderBy: { order: 'asc' },
              take: 1
            }
          }
        })

        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }

        // Calculate item price (convert from euros to cents)
        const itemPrice = Math.round(product.price * 100)
        const itemSubtotal = itemPrice * item.quantity

        subtotal += itemSubtotal

        orderItems.push({
          productId: product.id,
          productName: product.name,
          productImage: product.images[0]?.url || '',
          variantId: item.variantId,
          quantity: item.quantity,
          price: itemPrice,
          subtotal: itemSubtotal
        })
      }

      // Step 3: Atomically decrement stock for all items
      // If any item fails, all locks will be released and no stock is decremented
      for (const item of items) {
        const result = await decrementStockAtomic(item.productId, item.quantity)

        if (!result.success) {
          // Stock validation failed - release locks and abort
          await releaseMultipleStockLocks(lockedIds)
          return NextResponse.json(
            { error: result.error || 'Insufficient stock', success: false },
            { status: 409 }
          )
        }

        console.log(`Stock decremented for product ${item.productId}: ${result.currentStock} remaining`)
      }

      // Step 4: Release locks after successful stock updates
      await releaseMultipleStockLocks(lockedIds)
      console.log('All locks released successfully')
    } catch (error: any) {
      // Error occurred - release all locks
      await releaseMultipleStockLocks(lockedIds)
      console.error('Error during stock decrement:', error)

      if (error.message?.includes('not found')) {
        return NextResponse.json({ error: error.message, success: false }, { status: 404 })
      }

      return NextResponse.json(
        { error: 'Failed to process order', success: false },
        { status: 500 }
      )
    }

    // Calculate shipping cost (in cents)
    const FREE_SHIPPING_THRESHOLD = 2500 // 25€ in cents
    const shippingCosts: Record<string, number> = {
      standard: subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 490,
      express: 990,
      relay: 390,
      pickup: 0,
    }
    const shippingCost = shippingCosts[shippingOption] || 0

    // Calculate tax (20% VAT for France) - in cents
    const tax = Math.round((subtotal + shippingCost) * 0.2)

    // Calculate discount (in cents)
    let discount = 0
    let promoCodeId: string | null = null
    let loyaltyPointsUsed = 0
    let loyaltyDiscount = 0

    // Check if this is user's first order
    const previousOrderCount = await prisma.order.count({
      where: {
        userId,
        status: { notIn: ['CANCELLED'] },
      },
    })
    const isFirstOrder = previousOrderCount === 0

    // Validate and apply promo code
    if (promoCode) {
      const cartItems = orderItems.map((item) => ({
        productId: item.productId,
        categoryId: item.categoryId,
        price: item.price / 100, // Convert cents to euros
        quantity: item.quantity,
        name: item.productName,
      }))

      const promoValidation = await validatePromoCode({
        code: promoCode,
        userId,
        cartItems,
        subtotal: subtotal / 100, // Convert cents to euros
        shippingCost: shippingCost / 100,
        isFirstOrder,
      })

      if (!promoValidation.valid) {
        return NextResponse.json(
          { error: promoValidation.error, errorCode: promoValidation.errorCode, success: false },
          { status: 400 }
        )
      }

      // Apply promo code discount (convert to cents)
      discount = Math.round(promoValidation.discount * 100)
      promoCodeId = promoValidation.promoCode?.id || null
      console.log(`Promo code ${promoCode} applied: -$${promoValidation.discount}`)
    }

    // Apply loyalty points redemption
    if (body.loyaltyPointsToRedeem && body.loyaltyPointsToRedeem > 0) {
      const subtotalAfterPromo = subtotal - discount
      const loyaltyResult = await redeemLoyaltyPoints(
        userId,
        body.loyaltyPointsToRedeem,
        subtotalAfterPromo / 100 // Convert cents to euros
      )

      if (!loyaltyResult.success) {
        return NextResponse.json(
          { error: loyaltyResult.error, success: false },
          { status: 400 }
        )
      }

      loyaltyPointsUsed = loyaltyResult.pointsUsed || 0
      loyaltyDiscount = Math.round((loyaltyResult.discountAmount || 0) * 100) // Convert to cents
      console.log(`Loyalty points redeemed: ${loyaltyPointsUsed} points = -$${loyaltyResult.discountAmount}`)
    }

    // Calculate total (in cents)
    const totalDiscount = discount + loyaltyDiscount
    const total = subtotal + shippingCost + tax - totalDiscount

    // Generate order number
    const orderNumber = generateOrderNumber()

    // Calculate estimated delivery
    const estimatedDeliveryDate = calculateEstimatedDelivery(shippingOption)
    const estimatedDelivery = {
      min: estimatedDeliveryDate,
      max: addBusinessDays(estimatedDeliveryDate, 2),
    }

    // Create order in Prisma with nested order items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        subtotal: subtotal / 100, // Convert cents to euros for storage
        shippingCost: shippingCost / 100,
        tax: tax / 100,
        discount: totalDiscount / 100,
        total: total / 100,
        promoCodeId,
        // loyaltyPointsUsed stored in metadata if needed
        shippingAddress: shippingAddress as any,
        billingAddress: (billingAddress || shippingAddress) as any,
        estimatedDeliveryMin: estimatedDelivery.min,
        estimatedDeliveryMax: estimatedDelivery.max,
        notes: orderNotes || null,
        paymentReference,
        paymentGateway,
        items: {
          create: orderItems
        }
      },
      include: {
        items: true
      }
    })

    // Mark order as processed for idempotency (prevents duplicate orders on retries)
    await markOrderProcessed(paymentReference, order.id)
    console.log(`Order ${orderNumber} marked as processed for payment reference ${paymentReference}`)

    // Record promo code usage
    if (promoCodeId && discount > 0) {
      await recordPromoCodeUsage(promoCodeId, order.id, userId, discount / 100)
      console.log(`Promo code usage recorded for order ${orderNumber}`)
    }

    // Trigger real-time notification via Pusher to notify admins of new order
    await triggerNewOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      customerEmail: session.user.email || shippingAddress.email || ''
    })

    // Update user stats and award loyalty points
    try {
      // Award loyalty points for the order
      const pointsResult = await awardOrderPoints(userId, total / 100, isFirstOrder)
      
      // Update order count and total spent
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalOrders: { increment: 1 },
          totalSpent: { increment: total / 100 }, // Convert cents to euros
        },
      })

      // Trigger Customer 360 real-time update for loyalty points
      if (pointsResult.success && pointsResult.pointsEarned > 0) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { loyaltyPoints: true },
        })

        await triggerCustomerLoyaltyUpdate(userId, {
          pointsChange: pointsResult.pointsEarned + pointsResult.bonusPoints,
          newBalance: user?.loyaltyPoints || pointsResult.totalPoints,
          reason: isFirstOrder ? 'First order bonus + purchase reward' : 'Order purchase reward',
          timestamp: new Date(),
        })

        // Log level up if applicable
        if (pointsResult.newLevel) {
          console.log(`User ${userId} leveled up to ${pointsResult.newLevel}!`)
        }
      }
    } catch (error) {
      console.error('Error updating user stats:', error)
    }

    // Send order confirmation email with new template
    try {
      // Order doesn't have email directly - get from shippingAddress or session
      const shippingAddr = typeof order.shippingAddress === 'string'
        ? JSON.parse(order.shippingAddress)
        : order.shippingAddress
      const customerEmail = session.user.email || shippingAddr?.email || shippingAddress.email || ''


      await sendOrderConfirmationEmail({
        orderNumber: order.orderNumber,
        customerName: `${shippingAddr.firstName} ${shippingAddr.lastName}`,
        email: customerEmail,
        items: order.items.map((item: any) => ({
          name: item.name || item.productName || '',
          quantity: item.quantity,
          price: Math.round(item.price * 100), // Convert to cents
          image: item.productImage || '',
        })),
        subtotal: Math.round(order.subtotal * 100), // Convert to cents
        shippingCost: Math.round(order.shippingCost * 100),
        tax: Math.round(order.tax * 100),
        discount: Math.round(order.discount * 100),
        total: Math.round(order.total * 100),
        shippingAddress: {
          firstName: shippingAddr.firstName,
          lastName: shippingAddr.lastName,
          line1: shippingAddr.line1,
          line2: shippingAddr.line2,
          city: shippingAddr.city,
          postalCode: shippingAddr.postalCode,
          country: shippingAddr.country,
          phone: shippingAddr.phone,
        },
        orderNotes: order.notes || undefined,
        orderDate: new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        estimatedDelivery: estimatedDelivery.min.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      })
    } catch (emailError) {
      console.error('Failed to send order confirmation email:', emailError)
      // Don't fail the request if email fails
    }

    // Fix Date serialization (Comment 7): Return ISO strings instead of Date objects
    return NextResponse.json({
      orderId: order.id,
      orderNumber,
      estimatedDelivery: {
        min: estimatedDelivery.min.toISOString(),
        max: estimatedDelivery.max.toISOString(),
      },
      success: true,
    })
  } catch (error: any) {
    console.error('Order creation error:', error)

    // Handle authentication errors
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: 'Failed to create order',
        details: error.message,
        success: false,
      },
      { status: 500 }
    )
  }
}

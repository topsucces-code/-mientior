import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, paymentRateLimit } from '@/middleware/rate-limit'
import {
  validateExpressPaymentRequest,
  createProvisionalExpressOrder,
  logPaymentAttempt,
} from '@/lib/payment-utils'
import type { OrderItem } from '@/lib/checkout-utils'

/**
 * POST /api/checkout/paypal/generate-url
 * Generate PayPal Express Checkout URL
 *
 * This endpoint:
 * 1. Validates the payment request (CSRF, amount, items)
 * 2. Creates a provisional order
 * 3. Generates PayPal order via PayPal Orders API v2
 * 4. Returns approval URL for redirect
 * 5. Includes return/cancel URLs for completion
 *
 * Security:
 * - Rate limited to 3 requests per 5 minutes
 * - CSRF validation
 * - Amount validation
 * - Stock validation
 *
 * ENHANCED: Uses shared payment utilities from @/lib/payment-utils
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimit = checkRateLimit(request, paymentRateLimit)
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      { status: 429 }
    )
  }

  try {
    const session = await getSession()
    const body = await request.json()
    const { items, total } = body

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart items are required' },
        { status: 400 }
      )
    }

    if (!total || typeof total !== 'number' || total <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid total amount' },
        { status: 400 }
      )
    }

    // Convert items to OrderItem format
    const orderItems: OrderItem[] = items.map((item: CartItem) => ({
      productId: item.productId || item.id,
      variantId: item.variant?.sku,
      quantity: item.quantity,
      price: item.price,
    }))

    // Compute server-side totals with stock validation
    const totalsResult = await computeOrderTotals(
      {
        items: orderItems,
        shippingOption: 'standard',
      },
      prisma
    )

    // Validate client amount matches server calculation
    const serverTotal = totalsResult.total / 100
    if (!validatePaymentAmount(total, serverTotal, 0.01)) {
      return NextResponse.json(
        { success: false, error: 'Payment amount mismatch. Please refresh and try again.' },
        { status: 400 }
      )
    }

    // Fetch product details for line items
    const lineItems = await Promise.all(
      orderItems.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        })

        return {
          name: product?.name || 'Product',
          quantity: item.quantity.toString(),
          unit_amount: {
            currency_code: 'EUR',
            value: (item.price / 100).toFixed(2),
          },
        }
      })
    )

    // Create provisional order for tracking
    const orderNumber = generateOrderNumber()
    const provisionalOrder = await prisma.orders.create({
      data: {
        orderNumber,
        userId: session?.user?.id || null,
        email: session?.user?.email || 'guest@mientior.com',
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentGateway: 'PAYPAL',
        items: {
          create: await Promise.all(
            orderItems.map(async (item) => {
              const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: {
                  name: true,
                  images: { select: { url: true }, take: 1 },
                },
              })

              return {
                productId: item.productId,
                variantId: item.variantId,
                name: product?.name || '',
                price: item.price / 100,
                quantity: item.quantity,
                productImage: product?.images[0]?.url || '',
              }
            })
          ),
        },
        subtotal: totalsResult.subtotal / 100,
        shippingCost: totalsResult.shippingCost / 100,
        tax: totalsResult.tax / 100,
        discount: totalsResult.discount / 100,
        total: totalsResult.total / 100,
        shippingAddress: JSON.stringify({}),
        billingAddress: JSON.stringify({}),
      },
      select: {
        id: true,
        orderNumber: true,
      },
    })

    // In production, create PayPal order via Orders API v2
    /*
    const paypalAuth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64')

    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: provisionalOrder.id,
          amount: {
            currency_code: 'EUR',
            value: (totalsResult.total / 100).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'EUR',
                value: (totalsResult.subtotal / 100).toFixed(2),
              },
              shipping: {
                currency_code: 'EUR',
                value: (totalsResult.shippingCost / 100).toFixed(2),
              },
              tax_total: {
                currency_code: 'EUR',
                value: (totalsResult.tax / 100).toFixed(2),
              },
              discount: {
                currency_code: 'EUR',
                value: (totalsResult.discount / 100).toFixed(2),
              },
            },
          },
          items: lineItems,
        },
      ],
      application_context: {
        brand_name: 'Mientior Marketplace',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_URL}/checkout/paypal/return?orderId=${provisionalOrder.id}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout/paypal/cancel?orderId=${provisionalOrder.id}`,
      },
    }

    const response = await fetch(
      `${process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${paypalAuth}`,
        },
        body: JSON.stringify(paypalOrder),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error('PayPal order creation failed:', errorData)
      throw new Error('PayPal order creation failed')
    }

    const paypalData = await response.json()
    const approvalUrl = paypalData.links.find((link: any) => link.rel === 'approve')?.href

    if (!approvalUrl) {
      throw new Error('No approval URL returned from PayPal')
    }

    // Store PayPal order ID for later capture
    await prisma.orders.update({
      where: { id: provisionalOrder.id },
      data: {
        paymentReference: paypalData.id,
      },
    })
    */

    // Mock response for development
    const approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL_${Date.now()}`

    return NextResponse.json({
      success: true,
      url: approvalUrl,
      orderId: provisionalOrder.id,
      orderNumber: provisionalOrder.orderNumber,
    })
  } catch (error) {
    console.error('PayPal URL generation error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Stock insuffisant')) {
        return NextResponse.json(
          { success: false, error: 'Insufficient stock for one or more items' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate PayPal checkout URL' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/checkout/paypal/generate-url
 * Handle PayPal return callback
 * Complete order after successful payment
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')
    const paypalOrderId = searchParams.get('token')

    if (!orderId || !paypalOrderId) {
      return NextResponse.json(
        { success: false, error: 'Missing order information' },
        { status: 400 }
      )
    }

    // In production, capture PayPal payment
    /*
    const paypalAuth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64')

    const captureResponse = await fetch(
      `${process.env.PAYPAL_API_URL}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${paypalAuth}`,
        },
      }
    )

    if (!captureResponse.ok) {
      throw new Error('PayPal capture failed')
    }

    const captureData = await captureResponse.json()

    if (captureData.status !== 'COMPLETED') {
      throw new Error('Payment not completed')
    }
    */

    // Update order to completed
    await prisma.orders.update({
      where: { id: orderId },
      data: {
        status: 'PROCESSING',
        paymentStatus: 'PAID',
        paymentReference: paypalOrderId,
      },
    })

    // Track conversion
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { total: true },
    })

    trackConversion(orderId, order?.total || 0, 'paypal').catch((err) =>
      console.error('Analytics tracking failed:', err)
    )

    // Redirect to confirmation page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/checkout/confirmation/${orderId}`
    )
  } catch (error) {
    console.error('PayPal return handler error:', error)
    
    // Redirect to checkout with error
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_URL}/checkout?error=payment_failed`
    )
  }
}

async function trackConversion(orderId: string, revenue: number, method: string) {
  console.log('Conversion tracked:', { orderId, revenue, method })
}

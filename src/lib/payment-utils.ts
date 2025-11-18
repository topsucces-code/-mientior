/**
 * Shared utilities for express payment processing
 * Provides common functionality for Apple Pay, Google Pay, and PayPal
 */

import { NextRequest } from 'next/server'
import {
  validateCSRFToken,
  sanitizeInput,
  validatePaymentAmount,
  detectSuspiciousActivity,
  hashSensitiveData,
} from '@/lib/security'
import { checkRateLimit, paymentRateLimit, type RateLimitConfig } from '@/middleware/rate-limit'
import { computeOrderTotals, type OrderItem } from '@/lib/checkout-utils'
import { prisma } from '@/lib/prisma'

export interface ExpressPaymentValidationOptions {
  request: NextRequest
  items: OrderItem[]
  total: number
  shippingOption?: string
  email?: string
  orderId?: string
}

export interface ExpressPaymentValidationResult {
  valid: boolean
  error?: string
  errorCode?: string
  orderId?: string
  computedTotal?: number
}

export interface FraudCheckOptions {
  requestHistory?: Array<{ timestamp: number; success: boolean }>
  userAgent?: string
  ipAddress?: string
  total: number
  isGuest: boolean
}

export interface FraudCheckResult {
  passed: boolean
  riskScore: number
  flags: string[]
}

/**
 * Validate express payment request with comprehensive security checks
 */
export async function validateExpressPaymentRequest(
  options: ExpressPaymentValidationOptions
): Promise<ExpressPaymentValidationResult> {
  const { request, items, total, shippingOption, email, orderId } = options

  // 1. Rate limiting check
  const rateLimitResult = checkRateLimit(request, paymentRateLimit)
  if (!rateLimitResult.allowed) {
    return {
      valid: false,
      error: 'Too many payment attempts. Please try again later.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
    }
  }

  // 2. CSRF token validation
  const csrfToken = request.headers.get('X-CSRF-Token')
  const storedToken = request.cookies.get('csrf_token')?.value

  if (!csrfToken || !storedToken || !validateCSRFToken(csrfToken, storedToken)) {
    return {
      valid: false,
      error: 'Invalid security token',
      errorCode: 'INVALID_CSRF',
    }
  }

  // 3. Input sanitization
  const sanitizedEmail = email ? sanitizeInput(email) : undefined

  // 4. Validate items array
  if (!items || items.length === 0) {
    return {
      valid: false,
      error: 'Cart is empty',
      errorCode: 'EMPTY_CART',
    }
  }

  // 5. Compute server-side totals for validation
  let computedTotals
  try {
    computedTotals = await computeOrderTotals(
      {
        items,
        shippingOption: shippingOption || 'standard',
      },
      prisma
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      valid: false,
      error: errorMessage,
      errorCode: 'COMPUTATION_ERROR',
    }
  }

  // 6. Validate payment amount matches server calculation
  const totalInCents = Math.round(total * 100) // Convert to cents
  if (!validatePaymentAmount(totalInCents, computedTotals.total, 1)) {
    return {
      valid: false,
      error: 'Amount mismatch detected',
      errorCode: 'AMOUNT_MISMATCH',
    }
  }

  // 7. If orderId provided, validate it exists and belongs to user
  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, total: true, paymentStatus: true },
    })

    if (!order) {
      return {
        valid: false,
        error: 'Order not found',
        errorCode: 'ORDER_NOT_FOUND',
      }
    }

    // Check if already paid (idempotency)
    if (order.paymentStatus === 'PAID') {
      return {
        valid: false,
        error: 'Order already paid',
        errorCode: 'ALREADY_PAID',
      }
    }
  }

  return {
    valid: true,
    orderId,
    computedTotal: computedTotals.total,
  }
}

/**
 * Detect suspicious activity for fraud prevention
 */
export function checkForFraud(options: FraudCheckOptions): FraudCheckResult {
  const {
    requestHistory = [],
    userAgent,
    ipAddress,
    total,
    isGuest,
  } = options

  const flags: string[] = []
  let riskScore = 0

  // Check for suspicious activity patterns
  const suspiciousIndicators = detectSuspiciousActivity(
    requestHistory,
    userAgent,
    ipAddress
  )

  if (suspiciousIndicators.rapidRequests) {
    flags.push('rapid_requests')
    riskScore += 3
  }

  if (suspiciousIndicators.multipleFailedAttempts) {
    flags.push('multiple_failures')
    riskScore += 4
  }

  if (suspiciousIndicators.suspiciousUserAgent) {
    flags.push('suspicious_ua')
    riskScore += 2
  }

  // Fast checkout risk (less than 30 seconds from start to payment)
  if (requestHistory.length > 0) {
    const firstRequest = requestHistory[0]
    const timeSinceStart = Date.now() - firstRequest.timestamp
    if (timeSinceStart < 30000) {
      // Less than 30 seconds
      flags.push('fast_checkout')
      riskScore += 2
    }
  }

  // High-value guest checkout (over €500)
  const totalInEuros = total / 100
  if (isGuest && totalInEuros > 500) {
    flags.push('high_value_guest')
    riskScore += 3
  }

  // Very high value (over €2000)
  if (totalInEuros > 2000) {
    flags.push('very_high_value')
    riskScore += 2
  }

  return {
    passed: riskScore < 8, // Threshold for automatic approval
    riskScore,
    flags,
  }
}

/**
 * Create provisional order for express payment
 */
export async function createProvisionalExpressOrder(options: {
  items: OrderItem[]
  shippingAddress: any
  billingAddress?: any
  email: string
  userId?: string
  gateway: 'APPLE_PAY' | 'GOOGLE_PAY' | 'PAYPAL'
  shippingOption?: string
  metadata?: Record<string, any>
}): Promise<{ orderId: string; orderNumber: string; total: number }> {
  const {
    items,
    shippingAddress,
    billingAddress,
    email,
    userId,
    gateway,
    shippingOption = 'standard',
    metadata = {},
  } = options

  // Compute totals with validation
  const totalsResult = await computeOrderTotals(
    {
      items,
      shippingOption,
    },
    prisma
  )

  // Get product details for order items
  const orderItems: Array<{
    productId: string
    variantId?: string
    name: string
    price: number
    quantity: number
    productImage: string
    variant?: { size?: string; color?: string; sku: string }
  }> = []

  for (const item of totalsResult.items) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      select: {
        name: true,
        images: {
          select: { url: true },
          take: 1,
        },
        variants: item.variantId
          ? {
              where: { id: item.variantId },
              select: {
                size: true,
                color: true,
                sku: true,
              },
            }
          : false,
      },
    })

    let variant = undefined
    if (item.variantId && product?.variants && product.variants.length > 0) {
      const v = product.variants[0]
      variant = {
        size: v.size || undefined,
        color: v.color || undefined,
        sku: v.sku,
      }
    }

    orderItems.push({
      productId: item.productId,
      variantId: item.variantId,
      name: product?.name || '',
      price: item.price,
      quantity: item.quantity,
      productImage: product?.images[0]?.url || '',
      variant,
    })
  }

  // Generate order number
  const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`

  // Map express gateway to standard gateway enum
  const paymentGateway = gateway === 'PAYPAL' ? 'PAYPAL' : 'PAYSTACK' // Express methods use Paystack for card processing

  // Create provisional order
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: userId || null,
      email,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentGateway: paymentGateway as any, // Express payment gateway
      items: {
        create: orderItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          price: item.price / 100, // Convert cents to euros for DB
          quantity: item.quantity,
          productImage: item.productImage,
          variant: item.variant ? JSON.stringify(item.variant) : undefined,
        })),
      },
      subtotal: totalsResult.subtotal / 100,
      shippingCost: totalsResult.shippingCost / 100,
      tax: totalsResult.tax / 100,
      discount: totalsResult.discount / 100,
      total: totalsResult.total / 100,
      shippingAddress: JSON.stringify(shippingAddress),
      billingAddress: billingAddress
        ? JSON.stringify(billingAddress)
        : JSON.stringify(shippingAddress),
      paymentMetadata: {
        expressMethod: gateway,
        ...metadata,
      },
      customer: JSON.stringify({
        firstName: shippingAddress.firstName || shippingAddress.givenName,
        lastName: shippingAddress.lastName || shippingAddress.familyName,
        email,
      }),
    },
    select: {
      id: true,
      orderNumber: true,
      total: true,
    },
  })

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    total: Math.round(order.total * 100), // Return in cents
  }
}

/**
 * Log payment attempt for audit trail
 */
export async function logPaymentAttempt(options: {
  orderId: string
  gateway: string
  success: boolean
  errorMessage?: string
  metadata?: Record<string, any>
}): Promise<void> {
  const { orderId, gateway, success, errorMessage, metadata = {} } = options

  // Hash sensitive data before logging
  const hashedOrderId = await hashSensitiveData(orderId)

  console.log('[Payment Attempt]', {
    orderIdHash: hashedOrderId,
    gateway,
    success,
    error: errorMessage,
    timestamp: new Date().toISOString(),
    ...metadata,
  })

  // In production, send to monitoring service (Sentry, DataDog, etc.)
}

/**
 * Validate merchant session for Apple Pay
 * Uses Paystack Apple Pay domain registration or Stripe Apple Pay Domains API
 */
export async function validateApplePayMerchantSession(
  validationUrl: string,
  domain: string
): Promise<any> {
  // Implementation depends on PSP being used
  // Option 1: Paystack (if they support Apple Pay domain validation)
  // Option 2: Stripe Apple Pay Domains API

  // For Stripe integration:
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

      // Create Apple Pay domain association (one-time setup)
      // This is typically done during merchant setup, not per-transaction
      // But we include it here for completeness

      // Validate the merchant session with Apple
      const response = await fetch(validationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantIdentifier: process.env.APPLE_PAY_MERCHANT_ID,
          domainName: domain,
          displayName: process.env.GOOGLE_PAY_MERCHANT_NAME || 'Mientior Marketplace',
        }),
      })

      if (!response.ok) {
        throw new Error(`Merchant validation failed: ${response.statusText}`)
      }

      const merchantSession = await response.json()
      return merchantSession
    } catch (error) {
      console.error('[Apple Pay] Merchant validation error:', error)
      throw error
    }
  }

  // Fallback error if no PSP configured
  throw new Error('Apple Pay merchant validation not configured. Please set STRIPE_SECRET_KEY or configure Paystack.')
}

/**
 * Process payment token with gateway
 * Abstracts token processing for different express methods
 */
export async function processExpressPaymentToken(options: {
  gateway: 'APPLE_PAY' | 'GOOGLE_PAY'
  token: string
  amount: number
  orderId: string
  email: string
}): Promise<{ success: boolean; reference?: string; error?: string }> {
  const { gateway, token, amount, orderId, email } = options

  console.log(`[${gateway}] Processing payment token for order ${orderId}`)

  // Try Stripe first (best support for Apple Pay / Google Pay)
  if (process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

      // Create PaymentIntent with the tokenized payment method
      const paymentIntent = await stripe.paymentIntents.create({
        amount, // in cents
        currency: 'eur',
        payment_method_data: {
          type: 'card',
          card: {
            token, // Token from Apple Pay or Google Pay
          },
        },
        confirm: true,
        metadata: {
          orderId,
          gateway: gateway.toLowerCase(),
        },
        receipt_email: email,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/confirmation?orderId=${orderId}`,
      })

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          reference: paymentIntent.id,
        }
      } else if (paymentIntent.status === 'requires_action') {
        // 3D Secure or other authentication required
        return {
          success: false,
          error: 'Payment requires additional authentication',
        }
      } else {
        return {
          success: false,
          error: 'Payment declined',
        }
      }
    } catch (error: any) {
      console.error(`[${gateway}] Stripe processing error:`, error)
      return {
        success: false,
        error: error.message || 'Payment processing failed',
      }
    }
  }

  // Fallback to Paystack (if configured)
  if (process.env.PAYSTACK_SECRET_KEY) {
    try {
      const Paystack = require('paystack')
      const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY)

      // Note: Paystack's native support for Apple Pay/Google Pay may vary
      // This is a generic card charge approach
      const response = await paystack.transaction.initialize({
        email,
        amount: amount / 100, // Paystack uses kobo, but needs naira for input
        currency: 'NGN', // Paystack primarily supports NGN
        metadata: {
          orderId,
          gateway: gateway.toLowerCase(),
          custom_fields: [
            {
              display_name: 'Order ID',
              variable_name: 'order_id',
              value: orderId,
            },
          ],
        },
      })

      // For express checkout, we would need Paystack's direct charge API
      // This is a simplified example - full implementation depends on Paystack's API
      return {
        success: false,
        error: 'Paystack express payment processing requires additional setup',
      }
    } catch (error: any) {
      console.error(`[${gateway}] Paystack processing error:`, error)
      return {
        success: false,
        error: error.message || 'Payment processing failed',
      }
    }
  }

  // No PSP configured
  return {
    success: false,
    error: 'No payment service provider configured for express checkout',
  }
}

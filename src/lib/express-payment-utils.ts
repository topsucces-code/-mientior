import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  validateCSRFToken,
  detectSuspiciousActivity,
  sanitizeInput,
  validatePaymentAmount,
  hashSensitiveData,
} from '@/lib/security'
import { checkRateLimit, paymentRateLimit, type RateLimitConfig } from '@/middleware/rate-limit'
import { computeOrderTotals, type OrderItem } from '@/lib/checkout-utils'
import type { Address } from '@/types'

/**
 * Express payment methods supported
 */
export type ExpressPaymentMethod = 'apple_pay' | 'google_pay' | 'paypal'

/**
 * Payment request history for fraud detection
 */
interface PaymentRequestHistory {
  timestamp: number
  success: boolean
  method: ExpressPaymentMethod
  amount: number
}

/**
 * Express payment processing result
 */
export interface ExpressPaymentResult {
  success: boolean
  orderId?: string
  orderNumber?: string
  error?: string
  errorCode?: string
}

/**
 * Express payment request validation
 */
export interface ExpressPaymentRequest {
  orderId?: string
  items?: OrderItem[]
  shippingAddress?: Address
  billingAddress?: Address
  total: number
  method: ExpressPaymentMethod
  csrfToken?: string
  email?: string
}

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Get or create payment request history from session
 * In production, use Redis for distributed rate limiting
 */
const paymentHistoryStore = new Map<string, PaymentRequestHistory[]>()

function getPaymentHistory(clientId: string): PaymentRequestHistory[] {
  return paymentHistoryStore.get(clientId) || []
}

function addPaymentHistory(
  clientId: string,
  entry: PaymentRequestHistory
): void {
  const history = getPaymentHistory(clientId)
  history.push(entry)

  // Keep only last 20 entries and last hour
  const oneHourAgo = Date.now() - 3600000
  const filtered = history
    .filter(h => h.timestamp > oneHourAgo)
    .slice(-20)

  paymentHistoryStore.set(clientId, filtered)
}

/**
 * Clean up expired history entries periodically
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const oneHourAgo = Date.now() - 3600000
    for (const [key, history] of paymentHistoryStore.entries()) {
      const filtered = history.filter(h => h.timestamp > oneHourAgo)
      if (filtered.length === 0) {
        paymentHistoryStore.delete(key)
      } else {
        paymentHistoryStore.set(key, filtered)
      }
    }
  }, 300000) // Every 5 minutes
}

/**
 * Comprehensive validation for express payment requests
 * Applies CSRF, rate limiting, fraud detection, and amount validation
 */
export async function validateExpressPaymentRequest(
  request: NextRequest,
  paymentData: ExpressPaymentRequest,
  rateLimitConfig: RateLimitConfig = paymentRateLimit
): Promise<{
  valid: boolean
  error?: string
  errorCode?: string
  clientId?: string
}> {
  const clientIP = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const clientId = `${clientIP}:${userAgent.substring(0, 50)}`

  // 1. Rate limiting
  const rateLimit = checkRateLimit(request, rateLimitConfig)
  if (!rateLimit.allowed) {
    return {
      valid: false,
      error: 'Trop de requêtes. Veuillez réessayer plus tard.',
      errorCode: 'RATE_LIMIT_EXCEEDED',
    }
  }

  // 2. CSRF validation (if token provided)
  if (paymentData.csrfToken) {
    const storedToken = request.cookies.get('csrf_token')?.value
    if (!storedToken || !validateCSRFToken(paymentData.csrfToken, storedToken)) {
      return {
        valid: false,
        error: 'Invalid CSRF token',
        errorCode: 'INVALID_CSRF',
      }
    }
  }

  // 3. Fraud detection
  const history = getPaymentHistory(clientId)
  const suspiciousActivity = detectSuspiciousActivity(
    history.map(h => ({ timestamp: h.timestamp, success: h.success })),
    userAgent,
    clientIP
  )

  // Calculate fraud score
  let fraudScore = 0
  if (suspiciousActivity.rapidRequests) fraudScore += 2
  if (suspiciousActivity.multipleFailedAttempts) fraudScore += 3
  if (suspiciousActivity.suspiciousUserAgent) fraudScore += 2

  // Check for fast checkout (< 30s from first request)
  if (history.length > 0 && history[0]) {
    const timeSinceFirst = Date.now() - history[0].timestamp
    if (timeSinceFirst < 30000) {
      fraudScore += 1 // Fast checkout indicator
    }
  }

  if (fraudScore >= 3) {
    // Log to Sentry if available
    if (typeof (global as any).Sentry !== 'undefined') {
      (global as any).Sentry.captureMessage('Suspicious payment activity detected', {
        level: 'warning',
        tags: {
          checkout_step: 'express',
          method: paymentData.method,
        },
        extra: {
          clientIP,
          userAgent,
          fraudScore,
          suspiciousActivity,
        },
      })
    }

    return {
      valid: false,
      error: 'Activité suspecte détectée. Veuillez contacter le support.',
      errorCode: 'FRAUD_DETECTED',
    }
  }

  // 4. Amount validation (if order exists)
  if (paymentData.orderId) {
    const order = await prisma.order.findUnique({
      where: { id: paymentData.orderId },
      select: { total: true },
    })

    if (!order) {
      return {
        valid: false,
        error: 'Order not found',
        errorCode: 'ORDER_NOT_FOUND',
      }
    }

    // Convert DB total (euros) to cents for comparison
    const serverTotal = Math.round(order.total * 100)
    if (!validatePaymentAmount(paymentData.total, serverTotal, 1)) {
      // Allow 1 cent tolerance
      return {
        valid: false,
        error: 'Amount mismatch',
        errorCode: 'AMOUNT_MISMATCH',
      }
    }
  }

  // 5. Sanitize inputs
  if (paymentData.email) {
    paymentData.email = sanitizeInput(paymentData.email)
  }

  return { valid: true, clientId }
}

/**
 * Create or update provisional order for express checkout
 * Returns orderId for payment processing
 */
export async function createOrUpdateProvisionalOrder(
  paymentData: ExpressPaymentRequest,
  userId?: string
): Promise<{ orderId: string; orderNumber: string; total: number }> {
  // If orderId provided, update existing order
  if (paymentData.orderId) {
    const existingOrder = await prisma.order.findUnique({
      where: { id: paymentData.orderId },
      select: { id: true, orderNumber: true, total: true },
    })

    if (!existingOrder) {
      throw new Error('Order not found')
    }

    return {
      orderId: existingOrder.id,
      orderNumber: existingOrder.orderNumber,
      total: Math.round(existingOrder.total * 100), // Convert to cents
    }
  }

  // Create new provisional order
  if (!paymentData.items || !paymentData.shippingAddress) {
    throw new Error('Items and shipping address are required for new orders')
  }

  // Call /api/orders/initialize endpoint
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/orders/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: paymentData.items,
      shippingAddress: paymentData.shippingAddress,
      billingAddress: paymentData.billingAddress || paymentData.shippingAddress,
      email: paymentData.email,
      gateway: 'PAYSTACK', // Default gateway for express checkout
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create provisional order')
  }

  const data = await response.json()
  return {
    orderId: data.orderId,
    orderNumber: data.orderNumber,
    total: data.totals.total,
  }
}

/**
 * Complete order after successful payment
 * Updates order status and creates audit trail
 */
export async function completeExpressPaymentOrder(
  orderId: string,
  paymentReference: string,
  method: ExpressPaymentMethod,
  metadata?: Record<string, any>
): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'PROCESSING',
      paymentStatus: 'PAID',
      paymentReference,
      paymentMetadata: JSON.stringify({
        ...metadata,
        expressMethod: method,
        completedAt: new Date().toISOString(),
      }),
      updatedAt: new Date(),
    },
  })

  // Create audit log
  await prisma.auditLog.create({
    data: {
      action: 'ORDER_PAID',
      resource: 'Order',
      resourceId: orderId,
      metadata: JSON.stringify({
        method,
        paymentReference,
        expressCheckout: true,
      }),
    },
  })
}

/**
 * Record payment attempt for fraud detection
 */
export function recordPaymentAttempt(
  clientId: string,
  method: ExpressPaymentMethod,
  amount: number,
  success: boolean
): void {
  addPaymentHistory(clientId, {
    timestamp: Date.now(),
    success,
    method,
    amount,
  })
}

/**
 * Log payment error to Sentry with context
 */
export function logPaymentError(
  error: Error,
  context: {
    method: ExpressPaymentMethod
    orderId?: string
    step: string
    clientIP?: string
  }
): void {
  console.error(`[Express Payment Error] ${context.method} - ${context.step}:`, error)

  // Log to Sentry if available
  if (typeof (global as any).Sentry !== 'undefined') {
    (global as any).Sentry.captureException(error, {
      tags: {
        checkout_step: 'express',
        method: context.method,
        payment_step: context.step,
      },
      extra: context,
    })
  }
}

/**
 * Create standardized error response
 */
export function createPaymentErrorResponse(
  error: string,
  statusCode: number = 500,
  errorCode?: string
): Response {
  const response: ExpressPaymentResult = {
    success: false,
    error,
    errorCode,
  }

  // Don't expose sensitive error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    response.error = 'Une erreur est survenue lors du paiement'
  }

  return new Response(JSON.stringify(response), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

/**
 * Hash payment token for audit logging (PCI compliance)
 */
export async function hashPaymentToken(token: string): Promise<string> {
  return hashSensitiveData(token)
}

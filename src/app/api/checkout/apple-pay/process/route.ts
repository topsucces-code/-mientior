import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  validateExpressPaymentRequest,
  createOrUpdateProvisionalOrder,
  completeExpressPaymentOrder,
  recordPaymentAttempt,
  logPaymentError,
  hashPaymentToken,
  type ExpressPaymentRequest,
} from '@/lib/express-payment-utils'
import { initializePaystackTransaction, verifyPaystackTransaction } from '@/lib/paystack'

/**
 * POST /api/checkout/apple-pay/process
 *
 * Process Apple Pay payment after authorization
 * Called from ApplePaySession.onpaymentauthorized
 *
 * Flow:
 * 1. User authorizes payment with biometrics
 * 2. Apple Pay returns payment token
 * 3. This endpoint processes the token with payment gateway (Paystack)
 * 4. Complete order on success
 * 5. Track analytics
 *
 * Security: Rate limited, validated, PCI compliant (no raw card data stored)
 */
export async function POST(request: NextRequest) {
  let clientId: string | undefined
  const startTime = Date.now()

  try {
    // Parse request body
    const body = await request.json()
    const {
      payment,
      orderId,
      items,
      shippingAddress,
      billingAddress,
      total,
      email,
      csrfToken,
    } = body as {
      payment: {
        token: {
          paymentData: any
          paymentMethod: any
          transactionIdentifier: string
        }
      }
      orderId?: string
      items?: any[]
      shippingAddress?: any
      billingAddress?: any
      total: number
      email?: string
      csrfToken?: string
    }

    // Validate required fields
    if (!payment || !payment.token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token de paiement manquant',
          errorCode: 'MISSING_PAYMENT_TOKEN',
        },
        { status: 400 }
      )
    }

    if (!total || total <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Montant invalide',
          errorCode: 'INVALID_AMOUNT',
        },
        { status: 400 }
      )
    }

    // Validate express payment request
    const paymentData: ExpressPaymentRequest = {
      orderId,
      items,
      shippingAddress,
      billingAddress,
      total,
      method: 'apple_pay',
      csrfToken,
      email,
    }

    const validation = await validateExpressPaymentRequest(request, paymentData)
    clientId = validation.clientId

    if (!validation.valid) {
      if (clientId) {
        recordPaymentAttempt(clientId, 'apple_pay', total, false)
      }

      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          errorCode: validation.errorCode,
        },
        { status: 400 }
      )
    }

    // Create or get provisional order
    const order = await createOrUpdateProvisionalOrder(paymentData)

    console.log('[Apple Pay] Processing payment', {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      total: order.total,
      transactionId: payment.token.transactionIdentifier,
    })

    // Hash the payment token for audit logging (PCI compliance)
    const tokenHash = await hashPaymentToken(
      JSON.stringify(payment.token.paymentData)
    )

    // Process payment with Paystack
    // Note: Paystack needs to support Apple Pay tokens
    // Alternative: Use Stripe if Apple Pay direct integration is needed
    try {
      // Initialize Paystack transaction with Apple Pay metadata
      const paystackResponse = await initializePaystackTransaction({
        email: email || shippingAddress?.email || 'guest@mientior.com',
        amount: order.total, // Amount in kobo (cents)
        metadata: {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          paymentMethod: 'apple_pay',
          applePayTransactionId: payment.token.transactionIdentifier,
          tokenHash, // Store hash, never raw token
          paymentNetwork: payment.token.paymentMethod?.network,
          paymentType: payment.token.paymentMethod?.type,
        },
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/confirmation?orderId=${order.orderId}`,
      })

      // Verify the transaction immediately (for Apple Pay, this should be instant)
      const verification = await verifyPaystackTransaction(paystackResponse.reference)

      if (verification.status !== 'success') {
        throw new Error('Payment verification failed')
      }

      // Complete the order
      await completeExpressPaymentOrder(
        order.orderId,
        paystackResponse.reference,
        'apple_pay',
        {
          applePayTransactionId: payment.token.transactionIdentifier,
          paystackReference: paystackResponse.reference,
          paymentNetwork: payment.token.paymentMethod?.network,
          gatewayResponse: verification,
        }
      )

      // Record successful payment
      if (clientId) {
        recordPaymentAttempt(clientId, 'apple_pay', order.total, true)
      }

      // Log success metrics
      const duration = Date.now() - startTime
      console.log('[Apple Pay] Payment successful', {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        duration: `${duration}ms`,
        reference: paystackResponse.reference,
      })

      // Track conversion analytics
      if (typeof global !== 'undefined' && (global as any).gtag) {
        (global as any).gtag('event', 'purchase', {
          transaction_id: order.orderId,
          value: order.total / 100,
          currency: 'EUR',
          payment_type: 'apple_pay',
          checkout_method: 'express',
        })
      }

      return NextResponse.json({
        success: true,
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        paymentReference: paystackResponse.reference,
      })
    } catch (paymentError: any) {
      // Payment gateway error
      logPaymentError(paymentError, {
        method: 'apple_pay',
        orderId: order.orderId,
        step: 'gateway_processing',
        clientIP: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      })

      // Record failed attempt
      if (clientId) {
        recordPaymentAttempt(clientId, 'apple_pay', order.total, false)
      }

      // Update order to failed status
      await prisma.order.update({
        where: { id: order.orderId },
        data: {
          paymentStatus: 'FAILED',
          paymentMetadata: JSON.stringify({
            error: paymentError.message,
            tokenHash,
            failedAt: new Date().toISOString(),
          }),
        },
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Le paiement a été refusé',
          errorCode: 'PAYMENT_DECLINED',
          orderId: order.orderId,
        },
        { status: 402 }
      )
    }
  } catch (error: any) {
    const duration = Date.now() - startTime

    logPaymentError(error, {
      method: 'apple_pay',
      step: 'request_processing',
      clientIP: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    })

    console.error('[Apple Pay] Processing error:', {
      error: error.message,
      duration: `${duration}ms`,
    })

    // Record failed attempt
    if (clientId) {
      recordPaymentAttempt(clientId, 'apple_pay', 0, false)
    }

    // Determine error type
    if (error.message.includes('Order not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Commande introuvable',
          errorCode: 'ORDER_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    if (error.message.includes('Stock insuffisant')) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          errorCode: 'INSUFFICIENT_STOCK',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'production'
            ? 'Erreur de traitement du paiement'
            : error.message,
        errorCode: 'PROCESSING_ERROR',
      },
      { status: 500 }
    )
  }
}

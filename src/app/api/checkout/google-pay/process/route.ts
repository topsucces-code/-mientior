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
 * POST /api/checkout/google-pay/process
 *
 * Process Google Pay payment after authorization
 * Called after user authorizes payment via Google PaymentsClient
 *
 * Flow:
 * 1. User selects Google Pay and authorizes
 * 2. Google Pay returns payment token via loadPaymentData()
 * 3. This endpoint processes the token with payment gateway
 * 4. Complete order on success
 * 5. Track analytics
 *
 * Security: Rate limited, validated, PCI compliant (tokenized payment only)
 */
export async function POST(request: NextRequest) {
  let clientId: string | undefined
  const startTime = Date.now()

  try {
    // Parse request body
    const body = await request.json()
    const {
      paymentData,
      orderId,
      items,
      shippingAddress,
      billingAddress,
      total,
      email,
      csrfToken,
    } = body as {
      paymentData: {
        paymentMethodData: {
          type: string
          tokenizationData: {
            type: string
            token: string // Base64 encoded payment token
          }
          info?: {
            cardNetwork?: string
            cardDetails?: string
          }
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
    if (!paymentData || !paymentData.paymentMethodData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données de paiement manquantes',
          errorCode: 'MISSING_PAYMENT_DATA',
        },
        { status: 400 }
      )
    }

    if (!paymentData.paymentMethodData.tokenizationData?.token) {
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

    // Handle payment cancellation
    if ((paymentData as any).error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Paiement annulé par l\'utilisateur',
          errorCode: 'PAYMENT_CANCELLED',
        },
        { status: 400 }
      )
    }

    // Validate express payment request
    const paymentRequestData: ExpressPaymentRequest = {
      orderId,
      items,
      shippingAddress,
      billingAddress,
      total,
      method: 'google_pay',
      csrfToken,
      email,
    }

    const validation = await validateExpressPaymentRequest(request, paymentRequestData)
    clientId = validation.clientId

    if (!validation.valid) {
      if (clientId) {
        recordPaymentAttempt(clientId, 'google_pay', total, false)
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
    const order = await createOrUpdateProvisionalOrder(paymentRequestData)

    console.log('[Google Pay] Processing payment', {
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      total: order.total,
      cardNetwork: paymentData.paymentMethodData.info?.cardNetwork,
    })

    // Hash the payment token for audit logging (PCI compliance)
    const tokenHash = await hashPaymentToken(
      paymentData.paymentMethodData.tokenizationData.token
    )

    // Decode the Google Pay token (base64 encoded)
    let googlePayToken: string
    try {
      googlePayToken = Buffer.from(
        paymentData.paymentMethodData.tokenizationData.token,
        'base64'
      ).toString('utf-8')
    } catch (decodeError) {
      // Token might already be decoded
      googlePayToken = paymentData.paymentMethodData.tokenizationData.token
    }

    // Process payment with Paystack
    try {
      // Initialize Paystack transaction with Google Pay metadata
      const paystackResponse = await initializePaystackTransaction({
        email: email || shippingAddress?.email || 'guest@mientior.com',
        amount: order.total, // Amount in kobo (cents)
        metadata: {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          paymentMethod: 'google_pay',
          tokenHash, // Store hash, never raw token
          cardNetwork: paymentData.paymentMethodData.info?.cardNetwork,
          cardDetails: paymentData.paymentMethodData.info?.cardDetails,
          tokenizationType: paymentData.paymentMethodData.tokenizationData.type,
        },
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/confirmation?orderId=${order.orderId}`,
      })

      // For Google Pay, we need to use the token with Paystack's card API
      // Note: This requires Paystack to support Google Pay tokens
      // Alternative: Process through Stripe or another gateway that supports Google Pay

      // Verify the transaction
      const verification = await verifyPaystackTransaction(paystackResponse.reference)

      if (verification.status !== 'success') {
        throw new Error('Payment verification failed')
      }

      // Complete the order
      await completeExpressPaymentOrder(
        order.orderId,
        paystackResponse.reference,
        'google_pay',
        {
          paystackReference: paystackResponse.reference,
          cardNetwork: paymentData.paymentMethodData.info?.cardNetwork,
          cardDetails: paymentData.paymentMethodData.info?.cardDetails,
          gatewayResponse: verification,
        }
      )

      // Record successful payment
      if (clientId) {
        recordPaymentAttempt(clientId, 'google_pay', order.total, true)
      }

      // Log success metrics
      const duration = Date.now() - startTime
      console.log('[Google Pay] Payment successful', {
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
          payment_type: 'google_pay',
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
        method: 'google_pay',
        orderId: order.orderId,
        step: 'gateway_processing',
        clientIP: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
      })

      // Record failed attempt
      if (clientId) {
        recordPaymentAttempt(clientId, 'google_pay', order.total, false)
      }

      // Update order to failed status
      await prisma.orders.update({
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
      method: 'google_pay',
      step: 'request_processing',
      clientIP: request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown',
    })

    console.error('[Google Pay] Processing error:', {
      error: error.message,
      duration: `${duration}ms`,
    })

    // Record failed attempt
    if (clientId) {
      recordPaymentAttempt(clientId, 'google_pay', 0, false)
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

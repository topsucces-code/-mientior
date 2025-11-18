import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, paymentRateLimit } from '@/middleware/rate-limit'

/**
 * Google Pay payment initialization endpoint
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimit = checkRateLimit(request, paymentRateLimit)
  
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { success: false, error: 'Trop de requêtes. Veuillez réessayer plus tard.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { amount, items } = body

    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Montant invalide' },
        { status: 400 }
      )
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Panier vide' },
        { status: 400 }
      )
    }

    // Generate Google Pay payment request
    const paymentDataRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [
        {
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX'],
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: process.env.GOOGLE_PAY_GATEWAY || 'example',
              gatewayMerchantId: process.env.GOOGLE_PAY_MERCHANT_ID,
            },
          },
        },
      ],
      merchantInfo: {
        merchantId: process.env.GOOGLE_PAY_MERCHANT_ID,
        merchantName: 'Mientior Marketplace',
      },
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: (amount / 100).toFixed(2),
        currencyCode: 'EUR',
        countryCode: 'FR',
        displayItems: items.map((item: { name?: string; productName?: string; price: number; quantity: number }) => ({
          label: item.name || item.productName,
          type: 'LINE_ITEM',
          price: ((item.price * item.quantity) / 100).toFixed(2),
        })),
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentDataRequest,
      },
    })
  } catch (error) {
    console.error('Google Pay initialization error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'initialisation Google Pay' },
      { status: 500 }
    )
  }
}

/**
 * Google Pay payment completion
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentData, orderId } = body

    if (!paymentData || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Données de paiement manquantes' },
        { status: 400 }
      )
    }

    // Process Google Pay payment token
    // In production, send to payment processor
    // const paymentToken = JSON.parse(paymentData.paymentMethodData.tokenizationData.token)

    // Update order status
    // const order = await prisma.order.update({
    //   where: { id: orderId },
    //   data: {
    //     status: 'PROCESSING',
    //     paymentStatus: 'PAID',
    //     paymentReference: paymentToken.id || `gpay_${Date.now()}`,
    //     paymentGateway: 'GOOGLE_PAY',
    //   },
    // })

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        status: 'PROCESSING',
      },
    })
  } catch (error) {
    console.error('Google Pay completion error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du traitement du paiement' },
      { status: 500 }
    )
  }
}

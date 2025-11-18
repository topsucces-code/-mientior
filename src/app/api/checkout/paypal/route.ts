import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, paymentRateLimit } from '@/middleware/rate-limit'

/**
 * PayPal order creation endpoint
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
    const { amount, items, shippingAddress } = body

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

    // Create PayPal order
    // Note: Will be used when PayPal API integration is complete
    const _paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'EUR',
            value: (amount / 100).toFixed(2),
            breakdown: {
              item_total: {
                currency_code: 'EUR',
                value: (
                  items.reduce(
                    (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
                    0
                  ) / 100
                ).toFixed(2),
              },
            },
          },
          items: items.map((item: { name?: string; productName?: string; quantity: number; price: number }) => ({
            name: item.name || item.productName,
            quantity: item.quantity.toString(),
            unit_amount: {
              currency_code: 'EUR',
              value: (item.price / 100).toFixed(2),
            },
          })),
          shipping: shippingAddress
            ? {
                name: {
                  full_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
                },
                address: {
                  address_line_1: shippingAddress.line1,
                  address_line_2: shippingAddress.line2 || '',
                  admin_area_2: shippingAddress.city,
                  postal_code: shippingAddress.postalCode,
                  country_code: shippingAddress.country,
                },
              }
            : undefined,
        },
      ],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_URL}/checkout/confirmation`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/checkout`,
        brand_name: 'Mientior Marketplace',
        landing_page: 'NO_PREFERENCE',
        shipping_preference: 'SET_PROVIDED_ADDRESS',
        user_action: 'PAY_NOW',
      },
    }

    // In production, make actual PayPal API call
    // const response = await fetch(`${process.env.PAYPAL_API_URL}/v2/checkout/orders`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${getPayPalAccessToken()}`,
    //   },
    //   body: JSON.stringify(_paypalOrder),
    // })

    // Mock response for development
    const mockOrderId = `PAYPAL_${Date.now()}`
    
    // Log order details for debugging (remove in production)
    console.log('PayPal order created:', { mockOrderId, orderDetails: _paypalOrder })

    return NextResponse.json({
      success: true,
      data: {
        orderId: mockOrderId,
        approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${mockOrderId}`,
      },
    })
  } catch (error) {
    console.error('PayPal order creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de la commande PayPal' },
      { status: 500 }
    )
  }
}

/**
 * PayPal order capture endpoint
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { paypalOrderId, orderId } = body

    if (!paypalOrderId || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Identifiant de commande manquant' },
        { status: 400 }
      )
    }

    // Capture PayPal payment
    // In production, make actual PayPal API call
    // const response = await fetch(
    //   `${process.env.PAYPAL_API_URL}/v2/checkout/orders/${paypalOrderId}/capture`,
    //   {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       Authorization: `Bearer ${getPayPalAccessToken()}`,
    //     },
    //   }
    // )

    // Update order status
    // const order = await prisma.order.update({
    //   where: { id: orderId },
    //   data: {
    //     status: 'PROCESSING',
    //     paymentStatus: 'PAID',
    //     paymentReference: paypalOrderId,
    //     paymentGateway: 'PAYPAL',
    //   },
    // })

    return NextResponse.json({
      success: true,
      data: {
        orderId,
        status: 'PROCESSING',
        paypalOrderId,
      },
    })
  } catch (error) {
    console.error('PayPal capture error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du traitement du paiement PayPal' },
      { status: 500 }
    )
  }
}

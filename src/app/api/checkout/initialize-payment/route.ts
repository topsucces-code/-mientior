import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { initializePaystackTransaction } from '@/lib/paystack'
import { initializeFlutterwavePayment } from '@/lib/flutterwave'
import { convertAmountForGateway, getCallbackUrl } from '@/lib/payment-gateways'
import type { PaymentGateway } from '@/lib/payment-gateways'

const FREE_SHIPPING_THRESHOLD = 2500 // 25€ in cents
const SHIPPING_COSTS = {
  standard: 490,
  express: 990,
  relay: 390,
  pickup: 0,
} as const
const VAT_RATE = 0.2

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const allowGuestCheckout = process.env.ALLOW_GUEST_CHECKOUT !== 'false'

    const body = await request.json()
    const {
      items,
      shippingOption = 'standard',
      email,
      orderId,
      gateway, // 'PAYSTACK' or 'FLUTTERWAVE'
      metadata = {},
    }: {
      items: Array<{ productId: string; variantId?: string; quantity: number }>
      shippingOption?: string
      email?: string
      orderId?: string
      gateway: PaymentGateway
      metadata?: Record<string, unknown>
    } = body

    // Validate
    if (!gateway || !['PAYSTACK', 'FLUTTERWAVE'].includes(gateway)) {
      return NextResponse.json({ error: 'Invalid payment gateway' }, { status: 400 })
    }
    if (!session && !email) {
      return NextResponse.json({ error: 'Email is required for guest checkout' }, { status: 400 })
    }
    if (!session && !allowGuestCheckout) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // If orderId is provided, fetch totals from existing provisional order
    let subtotal = 0
    let shippingCost = 0
    let tax = 0
    let discount = 0
    let total = 0

    if (orderId) {
      // Fetch provisional order
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          subtotal: true,
          shippingCost: true,
          tax: true,
          discount: true,
          total: true,
        },
      })

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 })
      }

      subtotal = Math.round(order.subtotal * 100)
      shippingCost = Math.round(order.shippingCost * 100)
      tax = Math.round(order.tax * 100)
      discount = Math.round(order.discount * 100)
      total = Math.round(order.total * 100)
    } else if (items && items.length > 0) {
      // SERVER-SIDE TOTAL RECOMPUTATION for backward compatibility
      for (const item of items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            variants: {
              where: item.variantId ? { id: item.variantId } : undefined,
              select: { id: true, priceModifier: true },
            },
          },
        })

        if (!product) {
          return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 })
        }
        if (product.stock < item.quantity) {
          return NextResponse.json(
            { error: `Insufficient stock for product ${product.name}` },
            { status: 400 }
          )
        }

        let itemPrice = Math.round(product.price * 100)
        if (item.variantId && product.variants.length > 0) {
          const variant = product.variants[0]
          if (variant && variant.priceModifier) {
            itemPrice += Math.round(variant.priceModifier * 100)
          }
        }
        subtotal += itemPrice * item.quantity
      }

      shippingCost = (SHIPPING_COSTS as Record<string, number>)[shippingOption] ?? SHIPPING_COSTS.standard
      if (shippingOption === 'standard' && subtotal >= FREE_SHIPPING_THRESHOLD) {
        shippingCost = 0
      }

      tax = Math.round((subtotal + shippingCost) * VAT_RATE)
      discount = 0
      // TODO: Validate promo code

      total = subtotal + shippingCost + tax - discount
    } else {
      return NextResponse.json({ error: 'Either orderId or items must be provided' }, { status: 400 })
    }

    // Convert amount for gateway
    const gatewayAmount = convertAmountForGateway(total, gateway)

    // Initialize payment based on gateway
    let paymentData: Record<string, unknown>

    if (gateway === 'PAYSTACK') {
      const paystackData = await initializePaystackTransaction({
        email: email || session?.user?.email || '',
        amount: gatewayAmount, // In kobo
        metadata: {
          orderId: orderId || '',
          userId: session?.user?.id || '',
          items: items && items.length > 0
            ? JSON.stringify(items.map(i => ({ productId: i.productId, quantity: i.quantity })))
            : '[]',
          subtotal: subtotal.toString(),
          shippingCost: shippingCost.toString(),
          tax: tax.toString(),
          total: total.toString(),
          ...metadata,
        },
        callbackUrl: getCallbackUrl(orderId || ''),
      })
      paymentData = paystackData as unknown as Record<string, unknown>

      // Update provisional order with payment reference if orderId provided
      if (orderId && paymentData.reference) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentReference: paymentData.reference as string,
            paymentGateway: 'PAYSTACK',
            updatedAt: new Date(),
          },
        })
      }

      return NextResponse.json({
        success: true,
        gateway: 'PAYSTACK',
        reference: paymentData.reference,
        authorization_url: paymentData.authorization_url,
        access_code: paymentData.access_code,
        amount: total,
        metadata,
      })
    }

    if (gateway === 'FLUTTERWAVE') {
      paymentData = await initializeFlutterwavePayment({
        email: email || session?.user?.email || '',
        amount: gatewayAmount, // In currency unit
        name: session?.user?.name || 'Guest',
        phone: (metadata.phone as string) || '',
        metadata: {
          orderId: orderId || '',
          userId: session?.user?.id || '',
          items: items && items.length > 0
            ? JSON.stringify(items.map(i => ({ productId: i.productId, quantity: i.quantity })))
            : '[]',
          subtotal: subtotal.toString(),
          shippingCost: shippingCost.toString(),
          tax: tax.toString(),
          total: total.toString(),
          ...metadata,
        },
        callbackUrl: getCallbackUrl(orderId || ''),
      })

      // Update provisional order with payment reference if orderId provided
      if (orderId && paymentData.tx_ref) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentReference: paymentData.tx_ref as string,
            paymentGateway: 'FLUTTERWAVE',
            updatedAt: new Date(),
          },
        })
      }

      return NextResponse.json({
        success: true,
        gateway: 'FLUTTERWAVE',
        tx_ref: paymentData.tx_ref,
        link: paymentData.link,
        amount: total,
        metadata,
      })
    }

    return NextResponse.json({ error: 'Unsupported gateway' }, { status: 400 })
  } catch (error: unknown) {
    console.error('Payment initialization error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to initialize payment', details: errorMessage, success: false },
      { status: 500 }
    )
  }
}

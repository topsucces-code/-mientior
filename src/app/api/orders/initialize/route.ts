import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import {
  generateOrderNumber,
  computeOrderTotals,
  type OrderItem,
} from '@/lib/checkout-utils'
import type { Address, PaymentGateway } from '@/types'

/**
 * POST /api/orders/initialize
 * Creates a provisional order before payment to store metadata
 * This ensures webhooks always find orders by reference
 *
 * Enhanced to:
 * - Use server-side computeOrderTotals for stock validation
 * - Support updating existing provisional orders
 * - Store gateway information
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    const allowGuestCheckout = process.env.ALLOW_GUEST_CHECKOUT !== 'false'

    const body = await request.json()
    const {
      items,
      shippingAddress,
      billingAddress,
      shippingOption = 'standard',
      gateway = 'PAYSTACK',
      email,
      promoCode,
      orderId,
      orderNotes,
      totals,
    }: {
      items: OrderItem[]
      shippingAddress: Address
      billingAddress?: Address
      shippingOption?: string
      gateway?: PaymentGateway
      email?: string
      promoCode?: string
      orderId?: string // For updating existing provisional order
      orderNotes?: string
      totals?: {
        subtotal: number
        shippingCost: number
        tax: number
        discount: number
        total: number
      }
    } = body

    // Validation
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required', success: false },
        { status: 400 }
      )
    }
    if (!shippingAddress) {
      return NextResponse.json(
        { error: 'Shipping address is required', success: false },
        { status: 400 }
      )
    }
    if (!session && !email) {
      return NextResponse.json(
        { error: 'Email is required for guest checkout', success: false },
        { status: 400 }
      )
    }
    if (!session && !allowGuestCheckout) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    // If orderId provided, update existing provisional order
    if (orderId) {
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId },
      })

      if (!existingOrder) {
        return NextResponse.json(
          { error: 'Order not found', success: false },
          { status: 404 }
        )
      }

      // Recompute totals with current items/shipping
      const totalsResult = await computeOrderTotals(
        {
          items,
          shippingOption,
          promoCode,
        },
        prisma
      )

      // Update the provisional order
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          subtotal: (totals?.subtotal ?? totalsResult.subtotal) / 100, // Convert cents to euros for DB
          shippingCost: (totals?.shippingCost ?? totalsResult.shippingCost) / 100,
          tax: (totals?.tax ?? totalsResult.tax) / 100,
          discount: (totals?.discount ?? totalsResult.discount) / 100,
          total: (totals?.total ?? totalsResult.total) / 100,
          shippingAddress: shippingAddress as any, // Pass as JSON object
          ...(billingAddress && { billingAddress: billingAddress as any }), // Only update if provided
          notes: orderNotes || existingOrder.notes,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        totals: totals || {
          subtotal: totalsResult.subtotal,
          shippingCost: totalsResult.shippingCost,
          tax: totalsResult.tax,
          discount: totalsResult.discount,
          total: totalsResult.total,
        },
        provisional: false, // Updated existing order
      })
    }

    // Create new provisional order
    // Compute totals with stock validation
    const totalsResult = await computeOrderTotals(
      {
        items,
        shippingOption,
        promoCode,
      },
      prisma
    )

    // Get product details for order items (name, image, variant info)
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
    const orderNumber = generateOrderNumber()

    // Create provisional order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: session?.user?.id || null,
        email: email || session?.user?.email || shippingAddress.email,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentGateway: gateway,
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
        subtotal: (totals?.subtotal ?? totalsResult.subtotal) / 100,
        shippingCost: (totals?.shippingCost ?? totalsResult.shippingCost) / 100,
        tax: (totals?.tax ?? totalsResult.tax) / 100,
        discount: (totals?.discount ?? totalsResult.discount) / 100,
        total: (totals?.total ?? totalsResult.total) / 100,
        shippingAddress: shippingAddress as any, // Pass as JSON object
        billingAddress: (billingAddress || shippingAddress) as any, // Default to shipping, pass as JSON object
        couponCode: promoCode || null,
        notes: orderNotes || null,
        customer: session?.user?.email
          ? JSON.stringify({
              firstName: shippingAddress.firstName,
              lastName: shippingAddress.lastName,
              email: session.user.email,
            })
          : JSON.stringify({
              firstName: shippingAddress.firstName,
              lastName: shippingAddress.lastName,
              email: email || shippingAddress.email || '',
            }),
      },
      select: {
        id: true,
        orderNumber: true,
      },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totals: totals || {
        subtotal: totalsResult.subtotal,
        shippingCost: totalsResult.shippingCost,
        tax: totalsResult.tax,
        discount: totalsResult.discount,
        total: totalsResult.total,
      },
      provisional: true,
    })
  } catch (error: unknown) {
    console.error('Order initialization error:', error)

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('Stock insuffisant')) {
        return NextResponse.json(
          { error: error.message, success: false },
          { status: 400 }
        )
      }

      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message, success: false },
          { status: 404 }
        )
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to initialize order', details: errorMessage, success: false },
      { status: 500 }
    )
  }
}

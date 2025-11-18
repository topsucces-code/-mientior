import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { verifyPaystackTransaction } from '@/lib/paystack'
import { verifyFlutterwaveTransaction } from '@/lib/flutterwave'
import type { Address, PaymentGateway } from '@/types'

/**
 * PATCH /api/orders/[id]/complete
 * Completes a provisional order after successful payment
 *
 * Enhanced to:
 * - Verify payment reference with gateway before completing
 * - Decrement stock for all order items
 * - Update status to PROCESSING and paymentStatus to PAID
 * - Send confirmation email (TODO)
 * - Handle idempotency (already completed orders)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    const allowGuestCheckout = process.env.ALLOW_GUEST_CHECKOUT !== 'false'

    const body = await request.json()
    const {
      paymentReference,
      paymentGateway,
      billingAddress,
      promoCode,
    }: {
      paymentReference: string
      paymentGateway: PaymentGateway
      billingAddress?: Address
      promoCode?: string
    } = body

    // Validation
    if (!paymentReference) {
      return NextResponse.json(
        { error: 'Payment reference is required', success: false },
        { status: 400 }
      )
    }
    if (!paymentGateway || !['PAYSTACK', 'FLUTTERWAVE'].includes(paymentGateway)) {
      return NextResponse.json(
        { error: 'Valid payment gateway is required', success: false },
        { status: 400 }
      )
    }
    if (!session && !allowGuestCheckout) {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    // Fetch the provisional order with items
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: {
          select: {
            id: true,
            productId: true,
            variantId: true,
            quantity: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found', success: false },
        { status: 404 }
      )
    }

    // Security: Ensure the user owns this order (or is guest)
    if (session?.user?.id && order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 403 }
      )
    }

    // Idempotency: Check if already completed
    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({
        success: true,
        message: 'Order already completed',
        orderId: order.id,
        orderNumber: order.orderNumber,
      })
    }

    // VERIFY PAYMENT WITH GATEWAY before completing
    let verificationResult: any
    let paymentAmount = 0

    try {
      if (paymentGateway === 'PAYSTACK') {
        verificationResult = await verifyPaystackTransaction(paymentReference)
        paymentAmount = verificationResult.amount / 100 // Convert kobo to decimal

        // Validate payment status
        if (verificationResult.status !== 'success') {
          return NextResponse.json(
            {
              error: 'Payment verification failed',
              details: 'Payment not successful',
              success: false,
            },
            { status: 400 }
          )
        }
      } else if (paymentGateway === 'FLUTTERWAVE') {
        verificationResult = await verifyFlutterwaveTransaction(paymentReference)
        paymentAmount = verificationResult.amount // Already in decimal

        // Validate payment status
        if (verificationResult.status !== 'successful') {
          return NextResponse.json(
            {
              error: 'Payment verification failed',
              details: 'Payment not successful',
              success: false,
            },
            { status: 400 }
          )
        }
      }

      // Validate amount matches order total
      if (Math.abs(paymentAmount - order.total) > 0.01) {
        return NextResponse.json(
          {
            error: 'Amount mismatch',
            details: `Expected ${order.total}, got ${paymentAmount}`,
            success: false,
          },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      return NextResponse.json(
        {
          error: 'Payment verification failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        },
        { status: 400 }
      )
    }

    // COMPLETE ORDER IN TRANSACTION (update order + decrement stock)
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order status
      const updated = await tx.order.update({
        where: { id: params.id },
        data: {
          paymentReference,
          paymentGateway,
          billingAddress: billingAddress ? JSON.stringify(billingAddress) : undefined,
          couponCode: promoCode || order.couponCode,
          status: 'PROCESSING',
          paymentStatus: 'PAID',
          paymentMetadata: {
            gateway: paymentGateway,
            reference: paymentReference,
            amount: paymentAmount,
            verifiedAt: new Date().toISOString(),
            customer: verificationResult.customer?.email || order.email,
          },
          updatedAt: new Date(),
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          email: true,
        },
      })

      // Decrement stock for each item
      for (const item of order.items) {
        if (item.variantId) {
          // Decrement variant stock
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        } else {
          // Decrement product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        }
      }

      return updated
    })

    // TODO: Send confirmation email
    // await sendOrderConfirmationEmail({
    //   email: updatedOrder.email,
    //   orderNumber: updatedOrder.orderNumber,
    //   total: updatedOrder.total,
    // })

    return NextResponse.json({
      success: true,
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      message: 'Order completed successfully',
    })
  } catch (error: unknown) {
    console.error('Order completion error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to complete order', details: errorMessage, success: false },
      { status: 500 }
    )
  }
}

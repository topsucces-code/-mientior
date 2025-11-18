import { redirect } from 'next/navigation'
import { verifyPaystackTransaction } from '@/lib/paystack'
import { verifyFlutterwaveTransaction } from '@/lib/flutterwave'
import { prisma } from '@/lib/prisma'

interface CallbackPageProps {
  searchParams: {
    reference?: string // Paystack
    tx_ref?: string // Flutterwave
    transaction_id?: string // Flutterwave
    status?: string
    orderId?: string
  }
}

export default async function CallbackPage({ searchParams }: CallbackPageProps) {
  const { reference, tx_ref, transaction_id } = searchParams

  try {
    let paymentReference: string | undefined
    let verificationData: Record<string, unknown> | null = null

    // Verify Paystack payment
    if (reference) {
      const paystackData = await verifyPaystackTransaction(reference)
      verificationData = paystackData as unknown as Record<string, unknown>
      if (verificationData && verificationData.status === 'success') {
        paymentReference = reference
      }
    }

    // Verify Flutterwave payment
    if (transaction_id) {
      const flutterwaveData = await verifyFlutterwaveTransaction(transaction_id)
      verificationData = flutterwaveData as unknown as Record<string, unknown> | null
      if (verificationData && verificationData.status === 'successful') {
        paymentReference = tx_ref
      }
    }

    if (!paymentReference) {
      // Payment failed or cancelled
      return redirect('/checkout?error=payment_failed')
    }

    // Find order by payment reference with items for stock decrementing
    let order = await prisma.order.findFirst({
      where: { paymentReference },
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

    // Fallback: Try to find by orderId from searchParams if not found by reference
    if (!order && searchParams.orderId) {
      order = await prisma.order.findUnique({
        where: { id: searchParams.orderId },
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

      // Update provisional order with payment reference
      if (order && (!order.paymentStatus || order.paymentStatus === 'PENDING')) {
        order = await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentReference,
            paymentGateway: reference ? 'PAYSTACK' : 'FLUTTERWAVE',
          },
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
      }
    }

    if (!order) {
      console.error('Order not found for payment reference:', paymentReference)
      return redirect('/checkout?error=order_not_found')
    }

    // Validate payment amount matches order total
    const paymentAmount = reference
      ? (verificationData?.amount as number) / 100 // Paystack kobo to currency
      : (verificationData?.amount as number) // Flutterwave already in currency

    if (Math.abs(paymentAmount - order.total) > 0.01) {
      console.error(`Amount mismatch for order ${order.orderNumber}: Expected ${order.total}, got ${paymentAmount}`)
      return redirect('/checkout?error=amount_mismatch')
    }

    // Update order status and decrement stock if not already done by webhook (idempotent)
    if (order.paymentStatus !== 'PAID') {
      await prisma.$transaction(async (tx) => {
        // Update order status
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING',
            paymentGateway: reference ? 'PAYSTACK' : 'FLUTTERWAVE',
            paymentMetadata: {
              gateway: reference ? 'PAYSTACK' : 'FLUTTERWAVE',
              reference: paymentReference,
              amount: paymentAmount,
              verifiedAt: new Date().toISOString(),
              verifiedBy: 'callback',
            },
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
            }).catch((err) => {
              console.error(`Failed to decrement variant stock for ${item.variantId}:`, err)
              // Continue processing even if stock decrement fails
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
            }).catch((err) => {
              console.error(`Failed to decrement product stock for ${item.productId}:`, err)
              // Continue processing even if stock decrement fails
            })
          }
        }
      })

      console.log(`Order ${order.orderNumber} marked as PAID via callback and stock decremented`)
    } else {
      console.log(`Order ${order.orderNumber} already marked as PAID, skipping stock decrement`)
    }

    // Redirect to confirmation page
    return redirect(`/checkout/confirmation/${order.id}`)
  } catch (error) {
    console.error('Payment callback error:', error)
    return redirect('/checkout?error=verification_failed')
  }
}

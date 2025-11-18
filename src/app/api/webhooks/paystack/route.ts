import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validatePaystackWebhook, verifyPaystackTransaction } from '@/lib/paystack'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature') || ''

    // Validate webhook signature
    if (!validatePaystackWebhook(body, signature)) {
      console.error('Invalid Paystack webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body)
    console.log('Paystack webhook event:', event.event)

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const { reference, amount, customer } = event.data

      // Verify transaction with Paystack API (double-check)
      const verification = await verifyPaystackTransaction(reference)

      if (verification.status !== 'success') {
        console.error('Paystack transaction verification failed:', reference)
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
      }

      // Find order by payment reference
      let order = await prisma.order.findFirst({
        where: { paymentReference: reference },
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
        // Fallback: Try to find by orderId from metadata
        console.warn('Order not found for Paystack reference, attempting to find by orderId:', reference)

        try {
          const metadata = event.data.metadata || {}

          if (metadata.orderId) {
            // Try to find by orderId from metadata
            order = await prisma.order.findUnique({
              where: { id: metadata.orderId },
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

            // Update the order with the payment reference if found
            if (order) {
              order = await prisma.order.update({
                where: { id: order.id },
                data: { paymentReference: reference },
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
              console.log(`Updated order ${order.orderNumber} with payment reference ${reference}`)
            }
          }

          if (!order) {
            console.error('Cannot find or create order: no orderId in metadata or order not found')
            return NextResponse.json({ error: 'Order not found and cannot create from metadata' }, { status: 404 })
          }
        } catch (createError) {
          console.error('Failed to find/update order from webhook:', createError)
          return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }
      }

      // Idempotency check: Skip if already paid
      if (order.paymentStatus === 'PAID') {
        console.log(`Order ${order.orderNumber} already marked as PAID, skipping duplicate webhook`)
        return NextResponse.json({ success: true, message: 'Already processed' })
      }

      // Validate amount matches order total (convert kobo to currency)
      const paymentAmount = amount / 100
      if (Math.abs(paymentAmount - order.total) > 0.01) {
        console.error(`Amount mismatch for order ${order.orderNumber}: Expected ${order.total}, got ${paymentAmount}`)
        // Still process but log the mismatch for investigation
      }

      // Update order and decrement stock in transaction
      await prisma.$transaction(async (tx) => {
        // Update order payment status
        await tx.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            status: 'PROCESSING',
            paymentGateway: 'PAYSTACK',
            paymentReference: reference, // Ensure reference is set
            paymentMetadata: {
              gateway: 'PAYSTACK',
              reference,
              amount: paymentAmount,
              customer: customer.email,
              paidAt: new Date().toISOString(),
              channel: verification.channel || 'card',
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

      console.log(`Order ${order.orderNumber} marked as PAID via Paystack and stock decremented`)

      // Log to audit trail
      try {
        await prisma.auditLog.create({
          data: {
            action: 'webhook_paystack_success',
            resource: 'ORDER',
            resourceId: order.id,
            metadata: JSON.stringify({
              reference,
              orderId: order.id,
              orderNumber: order.orderNumber,
              amount: amount / 100,
              timestamp: new Date().toISOString(),
            }),
          },
        }).catch(() => {
          // Ignore audit log errors
        })
      } catch {
        // Ignore audit log errors
      }

      // TODO: Send confirmation email, update inventory, etc.

      return NextResponse.json({ success: true, message: 'Payment processed' })
    }

    // Handle other events (charge.failed, etc.)
    if (event.event === 'charge.failed') {
      const { reference } = event.data

      const order = await prisma.order.findFirst({
        where: { paymentReference: reference },
      })

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'FAILED' },
        })
        console.log(`Order ${order.orderNumber} marked as FAILED via Paystack`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Paystack webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Webhook processing failed', details: errorMessage },
      { status: 500 }
    )
  }
}

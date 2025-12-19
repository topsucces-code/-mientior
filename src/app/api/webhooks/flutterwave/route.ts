import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateFlutterwaveWebhook, verifyFlutterwaveTransaction } from '@/lib/flutterwave'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('verif-hash') || ''

    // Validate webhook signature
    if (!validateFlutterwaveWebhook(signature)) {
      console.error('Invalid Flutterwave webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = body.event
    console.log('Flutterwave webhook event:', event)

    // Handle charge.completed event
    if (event === 'charge.completed') {
      const { id, tx_ref, amount, customer } = body.data

      // Verify transaction with Flutterwave API (double-check)
      const verification = await verifyFlutterwaveTransaction(id.toString()) as { status: string }

      if (verification && verification.status !== 'successful') {
        console.error('Flutterwave transaction verification failed:', tx_ref)
        return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
      }

      // Find order by payment reference (tx_ref)
      let order = await prisma.orders.findFirst({
        where: { paymentReference: tx_ref },
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
        console.warn('Order not found for Flutterwave tx_ref, attempting to find from metadata:', tx_ref)

        try {
          const metadata = body.data.meta || body.data.metadata || {}

          if (metadata.orderId) {
            order = await prisma.orders.findUnique({
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
              order = await prisma.orders.update({
                where: { id: order.id },
                data: { paymentReference: tx_ref },
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
              console.log(`Updated order ${order.orderNumber} with payment reference ${tx_ref}`)
            }
          }

          if (!order) {
            console.error('Cannot find order: insufficient metadata in webhook')
            return NextResponse.json({ error: 'Order not found and cannot locate from metadata' }, { status: 404 })
          }
        } catch (findError) {
          console.error('Failed to find order from webhook:', findError)
          return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }
      }

      // Idempotency check: Skip if already paid
      if (order.paymentStatus === 'PAID') {
        console.log(`Order ${order.orderNumber} already marked as PAID, skipping duplicate webhook`)
        return NextResponse.json({ success: true, message: 'Already processed' })
      }

      // Validate amount matches order total
      if (Math.abs(amount - order.total) > 0.01) {
        console.error(`Amount mismatch for order ${order.orderNumber}: Expected ${order.total}, got ${amount}`)
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
            paymentGateway: 'FLUTTERWAVE',
            paymentReference: tx_ref, // Ensure reference is set
            paymentMetadata: {
              gateway: 'FLUTTERWAVE',
              tx_ref,
              transaction_id: id,
              amount,
              customer: {
                email: customer.email || customer.customer_email || '',
                phone: customer.phone_number || customer.phone || '',
              },
              paidAt: new Date().toISOString(),
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

      console.log(`Order ${order.orderNumber} marked as PAID via Flutterwave and stock decremented`)

      // Log to audit trail
      try {
        await prisma.audit_logs.create({
          data: {
            action: 'webhook_flutterwave_success',
            resource: 'ORDER',
            resourceId: order.id,
            metadata: JSON.stringify({
              tx_ref,
              transaction_id: id,
              orderId: order.id,
              orderNumber: order.orderNumber,
              amount,
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
    if (event === 'charge.failed') {
      const { tx_ref } = body.data

      const order = await prisma.orders.findFirst({
        where: { paymentReference: tx_ref },
      })

      if (order) {
        await prisma.orders.update({
          where: { id: order.id },
          data: { paymentStatus: 'FAILED' },
        })
        console.log(`Order ${order.orderNumber} marked as FAILED via Flutterwave`)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Flutterwave webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Webhook processing failed', details: errorMessage },
      { status: 500 }
    )
  }
}

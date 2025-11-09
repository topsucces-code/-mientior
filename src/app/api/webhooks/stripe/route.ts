import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!

  try {
    const event = constructWebhookEvent(Buffer.from(body), signature)

    switch (event.type) {
      case 'checkout.session.completed':
        // Handle order creation
        break
      case 'payment_intent.succeeded':
        // Handle payment success
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: errorMessage }, { status: 400 })
  }
}

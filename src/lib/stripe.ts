import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true
})

export async function createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
  return stripe.checkout.sessions.create(params)
}

export async function retrieveSession(sessionId: string) {
  return stripe.checkout.sessions.retrieve(sessionId)
}

export function constructWebhookEvent(body: Buffer, signature: string, secret?: string) {
  return stripe.webhooks.constructEvent(body, signature, secret || process.env.STRIPE_WEBHOOK_SECRET || '')
}

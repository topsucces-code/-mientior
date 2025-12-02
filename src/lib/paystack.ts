import Paystack from 'paystack'
import crypto from 'crypto'

// Only initialize Paystack if the secret key is available
const paystack = process.env.PAYSTACK_SECRET_KEY 
  ? Paystack(process.env.PAYSTACK_SECRET_KEY)
  : null

function ensurePaystack() {
  if (!paystack) {
    throw new Error('Paystack is not configured. Please set PAYSTACK_SECRET_KEY environment variable.')
  }
  return paystack
}

/**
 * Initialize a Paystack transaction
 * @param email Customer email
 * @param amount Amount in kobo (smallest currency unit, e.g., 10000 = 100 NGN)
 * @param metadata Additional transaction metadata
 * @returns Transaction initialization response with authorization_url and reference
 */
export async function initializePaystackTransaction({
  email,
  amount,
  metadata = {},
  callbackUrl,
}: {
  email: string
  amount: number
  metadata?: Record<string, unknown>
  callbackUrl?: string
}) {
  const response = await ensurePaystack().transaction.initialize({
    email,
    amount, // In kobo (100 kobo = 1 NGN)
    currency: 'NGN', // Nigerian Naira (change to XOF for West Africa, etc.)
    callback_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/callback`,
    metadata,
  })

  if (!response.status) {
    throw new Error(response.message || 'Failed to initialize Paystack transaction')
  }

  return response.data
}

/**
 * Verify a Paystack transaction
 * @param reference Transaction reference
 * @returns Verification response with transaction details
 */
export async function verifyPaystackTransaction(reference: string) {
  const response = await ensurePaystack().transaction.verify(reference)

  if (!response.status) {
    throw new Error(response.message || 'Failed to verify Paystack transaction')
  }

  return response.data
}

/**
 * Validate Paystack webhook signature
 * @param body Raw request body
 * @param signature Paystack signature from headers
 * @returns True if signature is valid
 */
export function validatePaystackWebhook(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET || '')
    .update(body)
    .digest('hex')
  return hash === signature
}

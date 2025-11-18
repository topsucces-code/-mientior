import Flutterwave from 'flutterwave-node-v3'

if (!process.env.FLUTTERWAVE_SECRET_KEY) {
  throw new Error('Missing required environment variable: FLUTTERWAVE_SECRET_KEY')
}

export const flutterwave = new Flutterwave(
  process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
  process.env.FLUTTERWAVE_SECRET_KEY
)

/**
 * Initialize a Flutterwave payment
 * @param email Customer email
 * @param amount Amount in currency (e.g., 100.00 for 100 NGN)
 * @param metadata Additional payment metadata
 * @returns Payment initialization response with link
 */
export async function initializeFlutterwavePayment({
  email,
  amount,
  name,
  phone,
  metadata = {},
  callbackUrl,
}: {
  email: string
  amount: number
  name: string
  phone?: string
  metadata?: Record<string, unknown>
  callbackUrl?: string
}) {
  const tx_ref = `FLW-${Date.now()}-${Math.random().toString(36).substring(7)}`

  const payload = {
    tx_ref,
    amount,
    currency: 'NGN', // Nigerian Naira (change to XOF, GHS, etc.)
    redirect_url: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/callback`,
    payment_options: 'card,mobilemoney,ussd,banktransfer',
    customer: {
      email,
      name,
      phonenumber: phone || '',
    },
    customizations: {
      title: 'Mientior Marketplace',
      description: 'Payment for order',
      logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
    },
    meta: metadata,
  }

  try {
    const response = await flutterwave.Charge.card(payload)
    return { tx_ref, ...response }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize Flutterwave payment'
    throw new Error(errorMessage)
  }
}

/**
 * Verify a Flutterwave transaction
 * @param transactionId Transaction ID from Flutterwave
 * @returns Verification response with transaction details
 */
export async function verifyFlutterwaveTransaction(transactionId: string) {
  try {
    const response = await flutterwave.Transaction.verify({ id: transactionId })

    if (response.status !== 'success') {
      throw new Error(response.message || 'Transaction verification failed')
    }

    return response.data
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to verify Flutterwave transaction'
    throw new Error(errorMessage)
  }
}

/**
 * Validate Flutterwave webhook signature
 * @param signature Flutterwave signature from headers
 * @returns True if signature is valid
 */
export function validateFlutterwaveWebhook(signature: string): boolean {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET || ''
  return signature === secretHash
}

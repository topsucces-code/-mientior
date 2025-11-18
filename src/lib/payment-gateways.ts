/**
 * Payment gateway utilities and configuration
 */

export type PaymentGateway = 'PAYSTACK' | 'FLUTTERWAVE'

export interface PaymentGatewayConfig {
  id: PaymentGateway
  name: string
  description: string
  logo: string
  enabled: boolean
  supportedMethods: string[]
}

/**
 * Get available payment gateways based on environment configuration
 */
/**
 * Get lowercase slug for API parameters
 */
export function getGatewaySlug(gateway: PaymentGateway): 'paystack' | 'flutterwave' {
  return gateway.toLowerCase() as 'paystack' | 'flutterwave'
}

export function getAvailableGateways(): PaymentGatewayConfig[] {
  const config = process.env.PAYMENT_GATEWAY || 'both'
  const gateways: PaymentGatewayConfig[] = []

  if (config === 'paystack' || config === 'both') {
    gateways.push({
      id: 'PAYSTACK',
      name: 'Paystack',
      description: 'Carte bancaire, Mobile Money, Virement',
      logo: '/icons/paystack.svg',
      enabled: !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      supportedMethods: ['card', 'bank', 'ussd', 'mobile_money'],
    })
  }

  if (config === 'flutterwave' || config === 'both') {
    gateways.push({
      id: 'FLUTTERWAVE',
      name: 'Flutterwave',
      description: 'Carte, Mobile Money (MTN, Airtel), USSD',
      logo: '/icons/flutterwave.svg',
      enabled: !!process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
      supportedMethods: ['card', 'mobilemoney', 'ussd', 'banktransfer'],
    })
  }

  return gateways.filter((g) => g.enabled)
}

/**
 * Convert amount from cents to currency unit
 * @param cents Amount in cents (e.g., 10000 = 100.00 EUR)
 * @param gateway Payment gateway (affects conversion)
 * @returns Amount in gateway's expected format
 */
export function convertAmountForGateway(cents: number, gateway: PaymentGateway): number {
  // Paystack uses kobo (smallest unit), Flutterwave uses currency unit
  if (gateway === 'PAYSTACK') {
    // Convert EUR cents to NGN kobo (example: 1 EUR = 1000 NGN)
    // Adjust exchange rate as needed
    const exchangeRate = 1000 // 1 EUR = 1000 NGN
    return Math.round((cents / 100) * exchangeRate * 100) // Convert to kobo
  }

  if (gateway === 'FLUTTERWAVE') {
    // Convert EUR cents to NGN (currency unit)
    const exchangeRate = 1000
    return Math.round((cents / 100) * exchangeRate)
  }

  return cents
}

/**
 * Get callback URL for payment gateway
 */
export function getCallbackUrl(orderId: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/checkout/callback?orderId=${orderId}`
}

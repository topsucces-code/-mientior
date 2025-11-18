/**
 * Currency formatting utilities
 * Centralizes currency display logic for consistent formatting across the app
 */

// Default currency configuration
export const DEFAULT_CURRENCY = {
  code: 'EUR',
  symbol: '€',
  locale: 'fr-FR',
  symbolPosition: 'after' as const, // 'before' or 'after'
} as const

export interface CurrencyConfig {
  code: string
  symbol: string
  locale: string
  symbolPosition: 'before' | 'after'
}

/**
 * Format a price amount in cents to a localized currency string
 * @param amountInCents - Amount in cents (e.g., 2999 for 29.99)
 * @param config - Currency configuration (defaults to EUR)
 * @returns Formatted currency string (e.g., "29,99 €")
 */
export function formatCurrency(
  amountInCents: number,
  config: CurrencyConfig = DEFAULT_CURRENCY
): string {
  const amount = amountInCents / 100

  // Use Intl.NumberFormat for proper localization
  const formatter = new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return formatter.format(amount)
}

/**
 * Format a price amount without currency symbol
 * Useful for input fields or when symbol is displayed separately
 * @param amountInCents - Amount in cents
 * @param config - Currency configuration
 * @returns Formatted number string (e.g., "29,99")
 */
export function formatPrice(
  amountInCents: number,
  config: CurrencyConfig = DEFAULT_CURRENCY
): string {
  const amount = amountInCents / 100

  const formatter = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return formatter.format(amount)
}

/**
 * Get just the currency symbol
 * @param config - Currency configuration
 * @returns Currency symbol (e.g., "€")
 */
export function getCurrencySymbol(config: CurrencyConfig = DEFAULT_CURRENCY): string {
  return config.symbol
}

/**
 * Get the currency code for analytics and API calls
 * @param config - Currency configuration
 * @returns Currency code (e.g., "EUR")
 */
export function getCurrencyCode(config: CurrencyConfig = DEFAULT_CURRENCY): string {
  return config.code
}

/**
 * Parse a formatted currency string to cents
 * @param formattedAmount - Formatted string (e.g., "29,99 €" or "29.99")
 * @returns Amount in cents
 */
export function parseCurrency(formattedAmount: string): number {
  // Remove currency symbols and whitespace
  const cleaned = formattedAmount.replace(/[€$£¥\s]/g, '')
  // Replace comma with dot for parsing
  const normalized = cleaned.replace(',', '.')
  const amount = parseFloat(normalized)

  return Math.round(amount * 100)
}

/**
 * Format a discount amount with sign
 * @param amountInCents - Discount amount in cents
 * @param config - Currency configuration
 * @returns Formatted string with minus sign (e.g., "-5,00 €")
 */
export function formatDiscount(
  amountInCents: number,
  config: CurrencyConfig = DEFAULT_CURRENCY
): string {
  return `-${formatCurrency(amountInCents, config)}`
}

/**
 * Format a price range
 * @param minInCents - Minimum price in cents
 * @param maxInCents - Maximum price in cents
 * @param config - Currency configuration
 * @returns Formatted range string (e.g., "29,99 € - 49,99 €")
 */
export function formatPriceRange(
  minInCents: number,
  maxInCents: number,
  config: CurrencyConfig = DEFAULT_CURRENCY
): string {
  return `${formatCurrency(minInCents, config)} - ${formatCurrency(maxInCents, config)}`
}

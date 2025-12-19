import { currencies, type CurrencyCode } from '@/i18n/config';

/**
 * Format a price in the specified currency
 */
export function formatPrice(
  amount: number,
  currencyCode: CurrencyCode = 'XOF',
  locale: string = 'fr'
): string {
  const currency = currencies[currencyCode];
  
  if (!currency) {
    return `${amount.toFixed(2)} €`;
  }

  // Convert from EUR (base currency) to target currency
  const convertedAmount = amount * currency.rate;
  
  // Format based on currency
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });

  // For CFA francs, use custom formatting
  if (currencyCode === 'XOF' || currencyCode === 'XAF') {
    const formatted = Math.round(convertedAmount).toLocaleString(locale);
    return `${formatted} FCFA`;
  }

  return formatter.format(convertedAmount);
}

/**
 * Convert price from EUR to target currency
 */
export function convertPrice(
  amountInEur: number,
  targetCurrency: CurrencyCode
): number {
  const currency = currencies[targetCurrency];
  if (!currency) return amountInEur;
  
  return amountInEur * currency.rate;
}

/**
 * Convert price from target currency to EUR
 */
export function convertToEur(
  amount: number,
  fromCurrency: CurrencyCode
): number {
  const currency = currencies[fromCurrency];
  if (!currency) return amount;
  
  return amount / currency.rate;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currencyCode: CurrencyCode): string {
  return currencies[currencyCode]?.symbol || '€';
}

/**
 * Format price for display with discount
 */
export function formatPriceWithDiscount(
  originalPrice: number,
  discountedPrice: number,
  currencyCode: CurrencyCode = 'XOF',
  locale: string = 'fr'
): {
  original: string;
  discounted: string;
  savings: string;
  percentage: number;
} {
  const percentage = Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  const savings = originalPrice - discountedPrice;

  return {
    original: formatPrice(originalPrice, currencyCode, locale),
    discounted: formatPrice(discountedPrice, currencyCode, locale),
    savings: formatPrice(savings, currencyCode, locale),
    percentage,
  };
}

/**
 * Parse price input (handles different formats)
 */
export function parsePrice(input: string, currencyCode: CurrencyCode = 'XOF'): number {
  // Remove currency symbols and spaces
  const cleaned = input
    .replace(/[^\d.,]/g, '')
    .replace(',', '.');
  
  const amount = parseFloat(cleaned);
  
  if (isNaN(amount)) return 0;
  
  // Convert to EUR for storage
  return convertToEur(amount, currencyCode);
}

/**
 * Get minimum order amount for free shipping (in FCFA - default currency)
 * Aligned with CART_CONFIG.freeShippingThreshold (30,000 FCFA for SN/CI)
 */
export function getFreeShippingThreshold(countryCode: string): number {
  // Different thresholds based on region (in FCFA)
  const thresholds: Record<string, number> = {
    // West Africa - aligned with CART_CONFIG (30,000 FCFA)
    SN: 30000, CI: 30000, ML: 35000, BF: 35000, NE: 40000, TG: 30000, BJ: 30000, GW: 40000,
    // Central Africa
    CM: 35000, GA: 40000, CG: 40000, TD: 45000, CF: 50000, GQ: 45000,
    // Other Francophone
    CD: 40000, GN: 40000, MG: 50000,
    // Anglophone (approximate conversions)
    NG: 35000, GH: 35000, KE: 40000, ZA: 50000, TZ: 45000, UG: 45000, RW: 40000,
    // North Africa
    MA: 40000, DZ: 45000, TN: 40000, EG: 45000,
  };

  return thresholds[countryCode] || 50000;
}

/**
 * Calculate shipping cost based on country and order total
 * All values are in FCFA (default currency) to avoid conversion issues
 */
export function calculateShippingCost(
  orderTotal: number,
  countryCode: string,
  currencyCode: CurrencyCode = 'XOF'
): { cost: number; isFree: boolean; threshold: number } {
  // Threshold is now in FCFA (default currency)
  const thresholdInFCFA = getFreeShippingThreshold(countryCode);

  // Compare orderTotal (assumed to be in FCFA) with threshold
  const isFree = orderTotal >= thresholdInFCFA;

  // Base shipping costs by region (in FCFA)
  const baseCosts: Record<string, number> = {
    // West Africa FCFA zone - lower costs (~2000-3000 FCFA)
    SN: 2000, CI: 2000, ML: 2500, BF: 2500, NE: 3000, TG: 2000, BJ: 2000, GW: 3000,
    // Central Africa
    CM: 2500, GA: 3000, CG: 3000, TD: 3500, CF: 4000, GQ: 3500,
    // Other
    CD: 3500, GN: 3000, MG: 5000,
    NG: 2500, GH: 2500, KE: 3000, ZA: 4500, TZ: 3500, UG: 3500, RW: 3000,
    MA: 3000, DZ: 3500, TN: 3000, EG: 3500,
  };

  const baseCostInFCFA = baseCosts[countryCode] || 3000;
  const costInFCFA = isFree ? 0 : baseCostInFCFA;

  // Convert to target currency if needed
  return {
    cost: currencyCode === 'XOF' ? costInFCFA : convertPrice(convertToEur(costInFCFA, 'XOF'), currencyCode),
    isFree,
    threshold: currencyCode === 'XOF' ? thresholdInFCFA : convertPrice(convertToEur(thresholdInFCFA, 'XOF'), currencyCode),
  };
}

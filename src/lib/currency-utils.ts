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
 * Get minimum order amount for free shipping (in EUR)
 */
export function getFreeShippingThreshold(countryCode: string): number {
  // Different thresholds based on region
  const thresholds: Record<string, number> = {
    // West Africa
    SN: 30, CI: 30, ML: 35, BF: 35, NE: 40, TG: 30, BJ: 30, GW: 40,
    // Central Africa
    CM: 35, GA: 40, CG: 40, TD: 45, CF: 50, GQ: 45,
    // Other Francophone
    CD: 40, GN: 40, MG: 50,
    // Anglophone
    NG: 35, GH: 35, KE: 40, ZA: 50, TZ: 45, UG: 45, RW: 40,
    // North Africa
    MA: 40, DZ: 45, TN: 40, EG: 45,
  };

  return thresholds[countryCode] || 50;
}

/**
 * Calculate shipping cost based on country and order total
 */
export function calculateShippingCost(
  orderTotal: number,
  countryCode: string,
  currencyCode: CurrencyCode = 'XOF'
): { cost: number; isFree: boolean; threshold: number } {
  const threshold = getFreeShippingThreshold(countryCode);
  const isFree = orderTotal >= threshold;

  // Base shipping costs by region (in EUR)
  const baseCosts: Record<string, number> = {
    // West Africa FCFA zone - lower costs
    SN: 3, CI: 3, ML: 4, BF: 4, NE: 5, TG: 3, BJ: 3, GW: 5,
    // Central Africa
    CM: 4, GA: 5, CG: 5, TD: 6, CF: 7, GQ: 6,
    // Other
    CD: 6, GN: 5, MG: 8,
    NG: 4, GH: 4, KE: 5, ZA: 7, TZ: 6, UG: 6, RW: 5,
    MA: 5, DZ: 6, TN: 5, EG: 6,
  };

  const baseCost = baseCosts[countryCode] || 5;
  const cost = isFree ? 0 : baseCost;

  return {
    cost: convertPrice(cost, currencyCode),
    isFree,
    threshold: convertPrice(threshold, currencyCode),
  };
}

/**
 * Tax calculation service with VAT logic for Pan-African platform
 * Supports West, Central, East, Southern, and North African zones
 */

import { getCachedData } from '@/lib/redis'
import type { Address, DeliveryZone, TaxCalculationResult } from '@/types'

// ==================== CONFIGURATION ====================

/**
 * West Africa (ECOWAS/CEDEAO) countries with their ISO codes and VAT rates
 */
export const WEST_AFRICA_COUNTRIES = [
  { code: 'NG', name: 'Nigeria', vat: 7.5 },
  { code: 'CI', name: 'Côte d\'Ivoire', vat: 18 },
  { code: 'GH', name: 'Ghana', vat: 15 },
  { code: 'SN', name: 'Senegal', vat: 18 },
  { code: 'ML', name: 'Mali', vat: 18 },
  { code: 'BF', name: 'Burkina Faso', vat: 18 },
  { code: 'NE', name: 'Niger', vat: 19 },
  { code: 'TG', name: 'Togo', vat: 18 },
  { code: 'BJ', name: 'Benin', vat: 18 },
  { code: 'GN', name: 'Guinea', vat: 18 },
  { code: 'LR', name: 'Liberia', vat: 0 }, // No VAT
  { code: 'SL', name: 'Sierra Leone', vat: 15 },
  { code: 'GM', name: 'Gambia', vat: 15 },
  { code: 'GW', name: 'Guinea-Bissau', vat: 15 },
  { code: 'CV', name: 'Cape Verde', vat: 15 },
]

/**
 * Central Africa (CEMAC/ECCAS) countries with their ISO codes and VAT rates
 */
export const CENTRAL_AFRICA_COUNTRIES = [
  { code: 'CM', name: 'Cameroon', vat: 19.25 },
  { code: 'GA', name: 'Gabon', vat: 18 },
  { code: 'CG', name: 'Congo', vat: 18.9 },
  { code: 'CD', name: 'DR Congo', vat: 16 },
  { code: 'CF', name: 'Central African Republic', vat: 19 },
  { code: 'TD', name: 'Chad', vat: 18 },
  { code: 'GQ', name: 'Equatorial Guinea', vat: 15 },
  { code: 'ST', name: 'São Tomé and Príncipe', vat: 15 },
  { code: 'AO', name: 'Angola', vat: 14 },
]

/**
 * East Africa (EAC) countries with their ISO codes and VAT rates
 */
export const EAST_AFRICA_COUNTRIES = [
  { code: 'KE', name: 'Kenya', vat: 16 },
  { code: 'TZ', name: 'Tanzania', vat: 18 },
  { code: 'UG', name: 'Uganda', vat: 18 },
  { code: 'RW', name: 'Rwanda', vat: 18 },
  { code: 'BI', name: 'Burundi', vat: 18 },
  { code: 'SS', name: 'South Sudan', vat: 18 },
  { code: 'ET', name: 'Ethiopia', vat: 15 },
  { code: 'SO', name: 'Somalia', vat: 0 }, // No VAT
  { code: 'DJ', name: 'Djibouti', vat: 10 },
  { code: 'ER', name: 'Eritrea', vat: 5 },
]

/**
 * Southern Africa (SADC) countries with their ISO codes and VAT rates
 */
export const SOUTHERN_AFRICA_COUNTRIES = [
  { code: 'ZA', name: 'South Africa', vat: 15 },
  { code: 'ZW', name: 'Zimbabwe', vat: 14.5 },
  { code: 'BW', name: 'Botswana', vat: 14 },
  { code: 'NA', name: 'Namibia', vat: 15 },
  { code: 'ZM', name: 'Zambia', vat: 16 },
  { code: 'MW', name: 'Malawi', vat: 16.5 },
  { code: 'MZ', name: 'Mozambique', vat: 17 },
  { code: 'LS', name: 'Lesotho', vat: 15 },
  { code: 'SZ', name: 'Eswatini', vat: 15 },
  { code: 'MG', name: 'Madagascar', vat: 20 },
  { code: 'MU', name: 'Mauritius', vat: 15 },
  { code: 'SC', name: 'Seychelles', vat: 15 },
  { code: 'KM', name: 'Comoros', vat: 10 },
]

/**
 * North Africa (UMA) countries with their ISO codes and VAT rates
 */
export const NORTH_AFRICA_COUNTRIES = [
  { code: 'MA', name: 'Morocco', vat: 20 },
  { code: 'DZ', name: 'Algeria', vat: 19 },
  { code: 'TN', name: 'Tunisia', vat: 19 },
  { code: 'LY', name: 'Libya', vat: 0 }, // No VAT
  { code: 'EG', name: 'Egypt', vat: 14 },
  { code: 'SD', name: 'Sudan', vat: 17 },
  { code: 'MR', name: 'Mauritania', vat: 16 },
]

/**
 * All African countries consolidated
 */
const ALL_AFRICAN_COUNTRIES = [
  ...WEST_AFRICA_COUNTRIES,
  ...CENTRAL_AFRICA_COUNTRIES,
  ...EAST_AFRICA_COUNTRIES,
  ...SOUTHERN_AFRICA_COUNTRIES,
  ...NORTH_AFRICA_COUNTRIES,
]

/**
 * Default VAT rates by zone (weighted average)
 */
export const VAT_RATES: Record<DeliveryZone, number> = {
  WEST_AFRICA: parseFloat(process.env.DEFAULT_VAT_WEST_AFRICA || '16'), // Average ~16%
  CENTRAL_AFRICA: parseFloat(process.env.DEFAULT_VAT_CENTRAL_AFRICA || '17'), // Average ~17%
  EAST_AFRICA: parseFloat(process.env.DEFAULT_VAT_EAST_AFRICA || '16'), // Average ~16%
  SOUTHERN_AFRICA: parseFloat(process.env.DEFAULT_VAT_SOUTHERN_AFRICA || '15'), // Average ~15%
  NORTH_AFRICA: parseFloat(process.env.DEFAULT_VAT_NORTH_AFRICA || '17'), // Average ~17%
  INTERNATIONAL: 0, // No VAT for international orders
}

/**
 * Cache TTL for tax calculations (in seconds)
 */
const TAX_CALC_CACHE_TTL = parseInt(process.env.TAX_CALC_CACHE_TTL || '3600', 10)

// ==================== ZONE DETECTION ====================

/**
 * Detects the delivery zone based on address (African regions)
 *
 * @param address - The delivery address
 * @returns The detected delivery zone
 *
 * @example
 * ```typescript
 * const zone = detectDeliveryZone({
 *   country: 'NG',
 *   postalCode: '100001',
 *   city: 'Lagos',
 *   // ... other address fields
 * })
 * // Returns: 'WEST_AFRICA'
 * ```
 */
export function detectDeliveryZone(address: Address): DeliveryZone {
  const countryCode = address.country?.toUpperCase() || ''

  // Check West Africa
  if (WEST_AFRICA_COUNTRIES.some(c => c.code === countryCode)) {
    return 'WEST_AFRICA'
  }

  // Check Central Africa
  if (CENTRAL_AFRICA_COUNTRIES.some(c => c.code === countryCode)) {
    return 'CENTRAL_AFRICA'
  }

  // Check East Africa
  if (EAST_AFRICA_COUNTRIES.some(c => c.code === countryCode)) {
    return 'EAST_AFRICA'
  }

  // Check Southern Africa
  if (SOUTHERN_AFRICA_COUNTRIES.some(c => c.code === countryCode)) {
    return 'SOUTHERN_AFRICA'
  }

  // Check North Africa
  if (NORTH_AFRICA_COUNTRIES.some(c => c.code === countryCode)) {
    return 'NORTH_AFRICA'
  }

  // Rest of the world
  return 'INTERNATIONAL'
}

/**
 * Gets whether a country is in Africa
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns True if the country is in Africa
 */
export function isAfricanCountry(countryCode: string): boolean {
  return ALL_AFRICAN_COUNTRIES.some(c => c.code === countryCode.toUpperCase())
}

// ==================== TAX CALCULATION ====================

/**
 * Calculates tax based on subtotal and delivery address
 *
 * @param subtotal - The order subtotal in cents
 * @param address - The delivery address
 * @returns Tax calculation result with detailed breakdown
 *
 * @example
 * ```typescript
 * const taxResult = calculateTax(100000, {
 *   country: 'NG',
 *   postalCode: '100001',
 *   city: 'Lagos',
 *   // ... other address fields
 * })
 * // Returns: { taxRate: 7.5, taxAmount: 7500, zone: 'WEST_AFRICA', country: 'NG', isAfrican: true }
 * ```
 */
export function calculateTax(
  subtotal: number,
  address: Address
): TaxCalculationResult {
  const zone = detectDeliveryZone(address)
  const countryCode = address.country?.toUpperCase() || ''

  // Try to get country-specific VAT rate first
  const countryData = ALL_AFRICAN_COUNTRIES.find(c => c.code === countryCode)
  const taxRate = countryData?.vat ?? VAT_RATES[zone]

  // Calculate tax amount (rounded to nearest cent)
  const taxAmount = Math.round(subtotal * taxRate / 100)

  return {
    taxRate,
    taxAmount,
    zone,
    country: countryCode,
    isEU: false, // Not applicable for African platform (kept for type compatibility)
  }
}

/**
 * Gets the VAT rate for a specific country code
 *
 * @param countryCode - ISO 3166-1 alpha-2 country code
 * @returns The VAT rate in percentage
 *
 * @example
 * ```typescript
 * const rate = getTaxRateForCountry('NG')
 * // Returns: 7.5
 * ```
 */
export function getTaxRateForCountry(countryCode: string): number {
  const normalizedCode = countryCode.toUpperCase()

  // Try to find country-specific rate
  const countryData = ALL_AFRICAN_COUNTRIES.find(c => c.code === normalizedCode)
  if (countryData) {
    return countryData.vat
  }

  // Fall back to zone average if country not found
  const zone = detectDeliveryZone({ country: normalizedCode } as Address)
  return VAT_RATES[zone]
}

// ==================== CACHING ====================

/**
 * Gets cached tax calculation or computes and caches it
 *
 * @param cacheKey - Cache key for this calculation
 * @param calculator - Function that performs the calculation
 * @returns Tax calculation result (from cache or fresh)
 *
 * @example
 * ```typescript
 * const result = await getCachedTaxCalculation(
 *   'tax:calc:NG:100001:100000',
 *   async () => calculateTax(100000, address)
 * )
 * ```
 */
export async function getCachedTaxCalculation(
  cacheKey: string,
  calculator: () => Promise<TaxCalculationResult>
): Promise<TaxCalculationResult> {
  return getCachedData(cacheKey, calculator, TAX_CALC_CACHE_TTL)
}

/**
 * Generates a cache key for tax calculation
 *
 * @param countryCode - ISO country code
 * @param postalCode - Postal code
 * @param subtotal - Subtotal in cents
 * @returns Cache key string
 */
export function generateTaxCacheKey(
  countryCode: string,
  postalCode: string,
  subtotal: number
): string {
  return `tax:calc:${countryCode.toUpperCase()}:${postalCode.replace(/\s/g, '')}:${subtotal}`
}

/**
 * Shipping calculation service for Pan-African platform
 * Zone-based and weight-based pricing for African regions
 */

import { getCachedData } from '@/lib/redis'
import { detectDeliveryZone } from '@/lib/tax-calculation'
import { adjustShippingDaysForLocation } from '@/lib/delivery-calculation'
import type {
  Address,
  CartItem,
  DeliveryZone,
  ShippingCalculationResult,
  ShippingOption
} from '@/types'

// ==================== CONFIGURATION ====================

/**
 * Free shipping threshold in cents (applies to same region only)
 * Default: 50000 cents = 500 units (XOF/XAF/etc.)
 * Adjust based on your platform's main currency
 */
export const FREE_SHIPPING_THRESHOLD = parseInt(
  process.env.FREE_SHIPPING_THRESHOLD || '50000',
  10
)

/**
 * Shipping rates by African zone and shipping type
 * All prices in cents (multiply by 100 from base currency)
 *
 * Notes on African logistics:
 * - West Africa: Established corridor (Lagos-Abidjan-Dakar)
 * - Central Africa: More expensive due to infrastructure
 * - East Africa: Good intra-EAC routes
 * - Southern Africa: Well-developed with SA hub
 * - North Africa: Mediterranean access advantages
 * - Cross-region: Significantly more expensive
 */
export const SHIPPING_RATES: Record<
  DeliveryZone,
  Record<
    string,
    {
      base: number
      perKg: number
      estimatedDays: number
    }
  >
> = {
  WEST_AFRICA: {
    standard: {
      base: parseInt(process.env.SHIPPING_WEST_AFRICA_STANDARD || '2500', 10), // ~25 currency units
      perKg: 500, // ~5 per kg
      estimatedDays: 7
    },
    express: {
      base: parseInt(process.env.SHIPPING_WEST_AFRICA_EXPRESS || '5000', 10), // ~50 currency units
      perKg: 1000, // ~10 per kg
      estimatedDays: 3
    }
  },
  CENTRAL_AFRICA: {
    standard: {
      base: parseInt(process.env.SHIPPING_CENTRAL_AFRICA_STANDARD || '3500', 10), // ~35 currency units
      perKg: 700, // ~7 per kg
      estimatedDays: 10
    },
    express: {
      base: parseInt(process.env.SHIPPING_CENTRAL_AFRICA_EXPRESS || '7000', 10), // ~70 currency units
      perKg: 1400, // ~14 per kg
      estimatedDays: 5
    }
  },
  EAST_AFRICA: {
    standard: {
      base: parseInt(process.env.SHIPPING_EAST_AFRICA_STANDARD || '2800', 10), // ~28 currency units
      perKg: 600, // ~6 per kg
      estimatedDays: 7
    },
    express: {
      base: parseInt(process.env.SHIPPING_EAST_AFRICA_EXPRESS || '5500', 10), // ~55 currency units
      perKg: 1100, // ~11 per kg
      estimatedDays: 3
    }
  },
  SOUTHERN_AFRICA: {
    standard: {
      base: parseInt(process.env.SHIPPING_SOUTHERN_AFRICA_STANDARD || '3000', 10), // ~30 currency units
      perKg: 650, // ~6.5 per kg
      estimatedDays: 8
    },
    express: {
      base: parseInt(process.env.SHIPPING_SOUTHERN_AFRICA_EXPRESS || '6000', 10), // ~60 currency units
      perKg: 1200, // ~12 per kg
      estimatedDays: 4
    }
  },
  NORTH_AFRICA: {
    standard: {
      base: parseInt(process.env.SHIPPING_NORTH_AFRICA_STANDARD || '2200', 10), // ~22 currency units
      perKg: 450, // ~4.5 per kg
      estimatedDays: 6
    },
    express: {
      base: parseInt(process.env.SHIPPING_NORTH_AFRICA_EXPRESS || '4500', 10), // ~45 currency units
      perKg: 900, // ~9 per kg
      estimatedDays: 3
    }
  },
  INTERNATIONAL: {
    standard: {
      base: parseInt(process.env.SHIPPING_INTERNATIONAL_STANDARD || '8000', 10), // ~80 currency units
      perKg: 2000, // ~20 per kg
      estimatedDays: 15
    },
    express: {
      base: parseInt(process.env.SHIPPING_INTERNATIONAL_EXPRESS || '15000', 10), // ~150 currency units
      perKg: 3500, // ~35 per kg
      estimatedDays: 7
    }
  }
}

/**
 * Default product weight in grams (used when weight not specified)
 * Default: 500g per product
 */
const DEFAULT_PRODUCT_WEIGHT = parseInt(
  process.env.DEFAULT_PRODUCT_WEIGHT || '500',
  10
)

/**
 * Cache TTL for shipping calculations (in seconds)
 */
const SHIPPING_CALC_CACHE_TTL = parseInt(
  process.env.SHIPPING_CALC_CACHE_TTL || '3600',
  10
)

// ==================== WEIGHT ESTIMATION ====================

/**
 * Estimates the total weight of cart items in kilograms
 *
 * @param items - Cart items
 * @returns Total weight in kilograms
 *
 * @example
 * ```typescript
 * const weight = estimateTotalWeight(cartItems)
 * // Returns: 1.5 (for 3 items of 500g each)
 * ```
 */
export function estimateTotalWeight(items: CartItem[]): number {
  const enableWeightBased = process.env.ENABLE_WEIGHT_BASED_SHIPPING === 'true'

  if (!enableWeightBased) {
    // Use simple estimation: DEFAULT_PRODUCT_WEIGHT per item
    const totalGrams = items.reduce(
      (sum, item) => sum + DEFAULT_PRODUCT_WEIGHT * item.quantity,
      0
    )
    return totalGrams / 1000 // Convert to kg
  }

  // If weight-based shipping is enabled, check if products have weight field
  // For now, fall back to default weight per item
  // TODO: Fetch product weights from database when product model includes weight field
  const totalGrams = items.reduce(
    (sum, item) => sum + DEFAULT_PRODUCT_WEIGHT * item.quantity,
    0
  )
  return totalGrams / 1000 // Convert to kg
}

// ==================== SHIPPING COST CALCULATION ====================

/**
 * Calculates shipping cost based on items, address, and shipping type
 *
 * @param items - Cart items
 * @param address - Delivery address
 * @param shippingType - Shipping method (standard, express)
 * @param subtotal - Order subtotal in cents
 * @returns Shipping calculation result with detailed breakdown
 *
 * @example
 * ```typescript
 * const shipping = calculateShippingCost(
 *   cartItems,
 *   address,
 *   'standard',
 *   50000
 * )
 * // Returns: { cost: 2500, zone: 'WEST_AFRICA', estimatedDays: 7, freeShippingApplied: false }
 * ```
 */
export function calculateShippingCost(
  items: CartItem[],
  address: Address,
  shippingType: 'standard' | 'express',
  subtotal: number
): ShippingCalculationResult {
  const zone = detectDeliveryZone(address)

  // Check if shipping type is available for this zone
  const zoneRates = SHIPPING_RATES[zone]
  if (!zoneRates[shippingType]) {
    throw new Error(
      `Shipping type "${shippingType}" not available for zone "${zone}"`
    )
  }

  const rates = zoneRates[shippingType]

  // Calculate weight and weight surcharge
  const totalWeightKg = estimateTotalWeight(items)
  const weightSurcharge = Math.round(totalWeightKg * rates.perKg)

  // Calculate base cost
  let cost = rates.base + weightSurcharge

  // Apply free shipping for same-region orders if threshold met
  // Note: Free shipping only applies within the same African region
  let freeShippingApplied = false
  if (zone !== 'INTERNATIONAL' && subtotal >= FREE_SHIPPING_THRESHOLD) {
    cost = 0
    freeShippingApplied = true
  }

  // Adjust estimated days based on location (using existing delivery calculation logic)
  const estimatedDays = adjustShippingDaysForLocation(
    rates.estimatedDays,
    {
      country: address.country,
      region: address.city
    }
  )

  return {
    cost,
    zone,
    estimatedDays,
    freeShippingApplied,
    weightSurcharge: weightSurcharge > 0 ? weightSurcharge : undefined
  }
}

// ==================== SHIPPING OPTIONS ====================

/**
 * Gets available shipping options for the given address and cart
 *
 * @param address - Delivery address
 * @param items - Cart items
 * @param subtotal - Order subtotal in cents
 * @returns Array of available shipping options with calculated prices
 *
 * @example
 * ```typescript
 * const options = getAvailableShippingOptions(address, cartItems, 50000)
 * // Returns array of ShippingOption with dynamic pricing for African zones
 * ```
 */
export function getAvailableShippingOptions(
  address: Address,
  items: CartItem[],
  subtotal: number
): ShippingOption[] {
  const zone = detectDeliveryZone(address)
  const zoneRates = SHIPPING_RATES[zone]

  const options: ShippingOption[] = []

  // Zone-specific carrier names (major African logistics providers)
  const carrierMap: Record<DeliveryZone, Record<string, string>> = {
    WEST_AFRICA: {
      standard: 'DHL Africa / UPS',
      express: 'FedEx / Chronopost Africa'
    },
    CENTRAL_AFRICA: {
      standard: 'DHL Africa',
      express: 'FedEx Express'
    },
    EAST_AFRICA: {
      standard: 'DHL / Posta Kenya',
      express: 'FedEx / Skynet'
    },
    SOUTHERN_AFRICA: {
      standard: 'PostNet / Aramex',
      express: 'DHL Express'
    },
    NORTH_AFRICA: {
      standard: 'Amana / CTM',
      express: 'DHL / FedEx'
    },
    INTERNATIONAL: {
      standard: 'DHL International',
      express: 'FedEx International'
    }
  }

  // Generate options for each available shipping type in this zone
  for (const [shippingType] of Object.entries(zoneRates)) {
    try {
      const calculation = calculateShippingCost(
        items,
        address,
        shippingType as 'standard' | 'express',
        subtotal
      )

      // Map shipping type to user-friendly names
      const nameMap: Record<string, string> = {
        standard: 'Livraison Standard',
        express: 'Livraison Express'
      }

      const descriptionMap: Record<string, string> = {
        standard: 'Livraison économique en jours ouvrés',
        express: 'Livraison rapide prioritaire'
      }

      const carriers = carrierMap[zone]

      options.push({
        id: shippingType,
        name: nameMap[shippingType] || shippingType,
        price: calculation.cost,
        estimatedDays: calculation.estimatedDays,
        carrier: carriers?.[shippingType] || 'DHL',
        description: descriptionMap[shippingType] || ''
      })
    } catch (error) {
      // Skip unavailable shipping types
      continue
    }
  }

  return options
}

// ==================== CACHING ====================

/**
 * Gets cached shipping calculation or computes and caches it
 *
 * @param cacheKey - Cache key for this calculation
 * @param calculator - Function that performs the calculation
 * @returns Shipping calculation result (from cache or fresh)
 *
 * @example
 * ```typescript
 * const result = await getCachedShippingCalculation(
 *   'shipping:calc:WEST_AFRICA:standard:1.5:50000',
 *   async () => calculateShippingCost(items, address, 'standard', 50000)
 * )
 * ```
 */
export async function getCachedShippingCalculation(
  cacheKey: string,
  calculator: () => Promise<ShippingCalculationResult>
): Promise<ShippingCalculationResult> {
  return getCachedData(cacheKey, calculator, SHIPPING_CALC_CACHE_TTL)
}

/**
 * Generates a cache key for shipping calculation
 *
 * @param zone - Delivery zone
 * @param shippingType - Shipping method
 * @param totalWeight - Total weight in kg
 * @param subtotal - Subtotal in cents
 * @returns Cache key string
 */
export function generateShippingCacheKey(
  zone: DeliveryZone,
  shippingType: string,
  totalWeight: number,
  subtotal: number
): string {
  return `shipping:calc:${zone}:${shippingType}:${totalWeight.toFixed(2)}:${subtotal}`
}

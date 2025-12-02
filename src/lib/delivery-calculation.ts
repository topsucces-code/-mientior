/**
 * Delivery date calculation utilities
 * Handles business day calculations, holiday exclusions, and date range estimation
 */

import { addDays, isWeekend, format } from 'date-fns'
import type { DeliveryEstimate, ShippingOption } from '@/types/delivery'

/**
 * French holidays for 2024-2025 (can be extended or moved to database)
 */
const FRENCH_HOLIDAYS = [
  '2024-01-01', // New Year
  '2024-04-01', // Easter Monday
  '2024-05-01', // Labor Day
  '2024-05-08', // Victory Day
  '2024-05-09', // Ascension
  '2024-05-20', // Whit Monday
  '2024-07-14', // Bastille Day
  '2024-08-15', // Assumption
  '2024-11-01', // All Saints
  '2024-11-11', // Armistice
  '2024-12-25', // Christmas
  '2025-01-01', // New Year
  '2025-04-21', // Easter Monday
  '2025-05-01', // Labor Day
  '2025-05-08', // Victory Day
  '2025-05-29', // Ascension
  '2025-06-09', // Whit Monday
  '2025-07-14', // Bastille Day
  '2025-08-15', // Assumption
  '2025-11-01', // All Saints
  '2025-11-11', // Armistice
  '2025-12-25', // Christmas
]

/**
 * Check if a date is a French holiday
 */
function isFrenchHoliday(date: Date): boolean {
  const dateStr = format(date, 'yyyy-MM-dd')
  return FRENCH_HOLIDAYS.includes(dateStr)
}

/**
 * Check if a date is a business day (not weekend or holiday)
 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isFrenchHoliday(date)
}

/**
 * Add business days to a date, excluding weekends and holidays
 */
export function addBusinessDays(startDate: Date, businessDays: number): Date {
  let currentDate = new Date(startDate)
  let daysAdded = 0

  while (daysAdded < businessDays) {
    currentDate = addDays(currentDate, 1)
    if (isBusinessDay(currentDate)) {
      daysAdded++
    }
  }

  return currentDate
}

/**
 * Count business days between two dates
 */
export function countBusinessDays(startDate: Date, endDate: Date): number {
  let count = 0
  let currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    if (isBusinessDay(currentDate)) {
      count++
    }
    currentDate = addDays(currentDate, 1)
  }

  return count
}

/**
 * Calculate delivery date range for a product
 */
export function calculateDeliveryDate(
  currentDate: Date,
  processingDays: number,
  shippingDays: number
): Date {
  // Add processing days
  const afterProcessing = addBusinessDays(currentDate, processingDays)
  
  // Add shipping days
  const deliveryDate = addBusinessDays(afterProcessing, shippingDays)
  
  return deliveryDate
}

/**
 * Calculate delivery estimates for multiple shipping options
 */
export function calculateDeliveryEstimates(
  currentDate: Date,
  processingDays: number,
  shippingOptions: ShippingOption[]
): DeliveryEstimate[] {
  return shippingOptions.map((option) => {
    // Calculate min date (optimistic: exact days)
    const minDate = calculateDeliveryDate(
      currentDate,
      processingDays,
      option.estimatedDays
    )

    // Calculate max date (add 2 business days buffer)
    const maxDate = addBusinessDays(minDate, 2)

    return {
      minDate,
      maxDate,
      shippingOption: option,
      processingDays,
    }
  })
}

/**
 * Calculate delivery estimate for backordered items
 */
export function calculateBackorderDelivery(
  restockDate: Date,
  processingDays: number,
  shippingDays: number
): DeliveryEstimate {
  // Start from restock date instead of current date
  const minDate = calculateDeliveryDate(restockDate, processingDays, shippingDays)
  const maxDate = addBusinessDays(minDate, 3) // Longer buffer for backorders

  return {
    minDate,
    maxDate,
    shippingOption: {
      id: 'backorder',
      name: 'Backorder Delivery',
      price: 0,
      estimatedDays: shippingDays,
      description: 'Delivery after restock',
    },
    processingDays,
  }
}

/**
 * Format delivery date range for display
 */
export function formatDeliveryRange(estimate: DeliveryEstimate): string {
  const minFormatted = format(estimate.minDate, 'MMM d')
  const maxFormatted = format(estimate.maxDate, 'MMM d, yyyy')
  
  return `${minFormatted} - ${maxFormatted}`
}

/**
 * Adjust shipping days based on location
 * Different regions may have different delivery times
 */
export function adjustShippingDaysForLocation(
  baseShippingDays: number,
  location?: { country?: string; region?: string }
): number {
  if (!location?.country) {
    return baseShippingDays
  }

  // Note: Base shipping days are already calculated based on the African zone (West, Central, etc.)
  // in shipping-calculation.ts.
  // Future: Add logic here for specific remote areas within African countries if needed.

  return baseShippingDays
}

/**
 * Calculate location-based delivery estimates
 */
export function calculateLocationBasedEstimates(
  currentDate: Date,
  processingDays: number,
  shippingOptions: ShippingOption[],
  location?: { country?: string; region?: string }
): DeliveryEstimate[] {
  // Adjust shipping options based on location
  const adjustedOptions = shippingOptions.map((option) => ({
    ...option,
    estimatedDays: adjustShippingDaysForLocation(option.estimatedDays, location),
  }))

  return calculateDeliveryEstimates(currentDate, processingDays, adjustedOptions)
}

/**
 * Generate cache key for delivery estimates
 */
export function getDeliveryCacheKey(
  productId: string,
  variantId: string | undefined,
  location: { country?: string; region?: string } | undefined
): string {
  const locationKey = location
    ? `${location.country || 'default'}-${location.region || 'default'}`
    : 'default'
  return `delivery:${productId}:${variantId || 'default'}:${locationKey}`
}

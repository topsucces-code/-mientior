/**
 * Property-based tests for delivery calculation
 * Feature: immersive-product-page, Property 27: Delivery date calculation
 * Validates: Requirements 9.1, 9.4
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  isBusinessDay,
  addBusinessDays,
  countBusinessDays,
  calculateDeliveryDate,
  calculateDeliveryEstimates,
  calculateBackorderDelivery,
} from './delivery-calculation'
import type { ShippingOption } from '@/types/delivery'

describe('Delivery Calculation', () => {
  describe('Business Day Logic', () => {
    it('should correctly identify weekends', () => {
      // Saturday
      const saturday = new Date('2024-01-06')
      expect(isBusinessDay(saturday)).toBe(false)

      // Sunday
      const sunday = new Date('2024-01-07')
      expect(isBusinessDay(sunday)).toBe(false)

      // Monday
      const monday = new Date('2024-01-08')
      expect(isBusinessDay(monday)).toBe(true)
    })

    it('should correctly identify French holidays', () => {
      // New Year 2024
      const newYear = new Date('2024-01-01')
      expect(isBusinessDay(newYear)).toBe(false)

      // Bastille Day 2024
      const bastilleDay = new Date('2024-07-14')
      expect(isBusinessDay(bastilleDay)).toBe(false)

      // Regular day
      const regularDay = new Date('2024-01-10')
      expect(isBusinessDay(regularDay)).toBe(true)
    })
  })

  describe('Add Business Days', () => {
    it('should add business days correctly', () => {
      // Starting from Monday, add 5 business days = next Monday
      const monday = new Date('2024-01-08') // Monday
      const result = addBusinessDays(monday, 5)
      const expected = new Date('2024-01-15') // Next Monday
      
      expect(result.toDateString()).toBe(expected.toDateString())
    })

    it('should skip weekends when adding business days', () => {
      // Starting from Friday, add 1 business day = next Monday
      const friday = new Date('2024-01-05') // Friday
      const result = addBusinessDays(friday, 1)
      const expected = new Date('2024-01-08') // Monday
      
      expect(result.toDateString()).toBe(expected.toDateString())
    })
  })

  describe('Count Business Days', () => {
    it('should count business days between dates', () => {
      const start = new Date('2024-01-08') // Monday
      const end = new Date('2024-01-12') // Friday
      
      const count = countBusinessDays(start, end)
      expect(count).toBe(5) // Mon, Tue, Wed, Thu, Fri
    })

    it('should exclude weekends from count', () => {
      const start = new Date('2024-01-05') // Friday
      const end = new Date('2024-01-08') // Monday
      
      const count = countBusinessDays(start, end)
      expect(count).toBe(2) // Friday and Monday only
    })
  })

  describe('Property 27: Delivery date calculation', () => {
    /**
     * **Feature: immersive-product-page, Property 27: Delivery date calculation**
     * **Validates: Requirements 9.1, 9.4**
     * 
     * For any product with processing days P and shipping days S,
     * the estimated delivery date should be current date + P + S (excluding weekends).
     */
    it('should calculate delivery date correctly for any valid inputs', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).filter(d => !isNaN(d.getTime())),
          fc.integer({ min: 1, max: 5 }), // processing days
          fc.integer({ min: 1, max: 10 }), // shipping days
          (currentDate, processingDays, shippingDays) => {
            const deliveryDate = calculateDeliveryDate(
              currentDate,
              processingDays,
              shippingDays
            )

            // Delivery date should be in the future
            expect(deliveryDate.getTime()).toBeGreaterThan(currentDate.getTime())

            // Should account for processing + shipping business days
            const businessDays = countBusinessDays(currentDate, deliveryDate)
            expect(businessDays).toBeGreaterThanOrEqual(processingDays + shippingDays)

            // Delivery date should be a business day
            expect(isBusinessDay(deliveryDate)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle edge case of zero processing days', () => {
      const currentDate = new Date('2024-01-08') // Monday
      const deliveryDate = calculateDeliveryDate(currentDate, 0, 3)
      
      // Should still add shipping days
      expect(deliveryDate.getTime()).toBeGreaterThan(currentDate.getTime())
    })

    it('should produce consistent results for same inputs', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).filter(d => !isNaN(d.getTime())),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 10 }),
          (currentDate, processingDays, shippingDays) => {
            const result1 = calculateDeliveryDate(currentDate, processingDays, shippingDays)
            const result2 = calculateDeliveryDate(currentDate, processingDays, shippingDays)
            
            expect(result1.getTime()).toBe(result2.getTime())
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Calculate Delivery Estimates', () => {
    it('should calculate estimates for multiple shipping options', () => {
      const currentDate = new Date('2024-01-08') // Monday
      const processingDays = 2
      const shippingOptions: ShippingOption[] = [
        {
          id: 'standard',
          name: 'Standard',
          price: 5,
          estimatedDays: 5,
          description: 'Standard shipping',
        },
        {
          id: 'express',
          name: 'Express',
          price: 15,
          estimatedDays: 2,
          description: 'Express shipping',
        },
      ]

      const estimates = calculateDeliveryEstimates(
        currentDate,
        processingDays,
        shippingOptions
      )

      expect(estimates).toHaveLength(2)
      
      // Express should arrive before standard
      expect(estimates[1]?.minDate.getTime()).toBeLessThan(
        estimates[0]?.minDate.getTime() ?? 0
      )

      // Each estimate should have min and max dates
      estimates.forEach((estimate) => {
        expect(estimate.minDate).toBeInstanceOf(Date)
        expect(estimate.maxDate).toBeInstanceOf(Date)
        expect(estimate.maxDate.getTime()).toBeGreaterThan(estimate.minDate.getTime())
        expect(estimate.processingDays).toBe(processingDays)
      })
    })
  })

  describe('Property 28: Multiple shipping option estimates', () => {
    /**
     * **Feature: immersive-product-page, Property 28: Multiple shipping option estimates**
     * **Validates: Requirements 9.3**
     * 
     * For any product with N shipping options, N delivery estimates should be displayed,
     * one for each option.
     */
    it('should generate one estimate per shipping option', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).filter(d => !isNaN(d.getTime())),
          fc.integer({ min: 1, max: 5 }), // processing days
          fc.array(
            fc.record({
              id: fc.string(),
              name: fc.string(),
              price: fc.integer({ min: 0, max: 50 }),
              estimatedDays: fc.integer({ min: 1, max: 10 }),
              description: fc.string(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (currentDate, processingDays, shippingOptions) => {
            const estimates = calculateDeliveryEstimates(
              currentDate,
              processingDays,
              shippingOptions
            )

            // Should have exactly one estimate per shipping option
            expect(estimates.length).toBe(shippingOptions.length)

            // Each estimate should correspond to a shipping option
            estimates.forEach((estimate, index) => {
              expect(estimate.shippingOption).toEqual(shippingOptions[index])
              expect(estimate.processingDays).toBe(processingDays)
              expect(estimate.minDate).toBeInstanceOf(Date)
              expect(estimate.maxDate).toBeInstanceOf(Date)
              expect(estimate.maxDate.getTime()).toBeGreaterThan(estimate.minDate.getTime())
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should order estimates by shipping speed', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).filter(d => !isNaN(d.getTime())),
          fc.integer({ min: 1, max: 3 }),
          (currentDate, processingDays) => {
            // Create options with different speeds
            const shippingOptions: ShippingOption[] = [
              {
                id: 'slow',
                name: 'Slow',
                price: 0,
                estimatedDays: 10,
                description: 'Slow shipping',
              },
              {
                id: 'fast',
                name: 'Fast',
                price: 20,
                estimatedDays: 2,
                description: 'Fast shipping',
              },
            ]

            const estimates = calculateDeliveryEstimates(
              currentDate,
              processingDays,
              shippingOptions
            )

            // Faster shipping should arrive earlier
            expect(estimates[1].minDate.getTime()).toBeLessThan(
              estimates[0].minDate.getTime()
            )
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Backorder Delivery Calculation', () => {
    it('should calculate delivery from restock date', () => {
      const restockDate = new Date('2024-02-01')
      const processingDays = 2
      const shippingDays = 5

      const estimate = calculateBackorderDelivery(
        restockDate,
        processingDays,
        shippingDays
      )

      // Delivery should be after restock date
      expect(estimate.minDate.getTime()).toBeGreaterThan(restockDate.getTime())

      // Should account for processing and shipping
      const businessDays = countBusinessDays(restockDate, estimate.minDate)
      expect(businessDays).toBeGreaterThanOrEqual(processingDays + shippingDays)
    })

    it('should have longer buffer for backorders', () => {
      const restockDate = new Date('2024-02-01')
      const estimate = calculateBackorderDelivery(restockDate, 2, 5)

      // Max date should be at least 3 business days after min date
      const buffer = countBusinessDays(estimate.minDate, estimate.maxDate)
      expect(buffer).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Property: Delivery calculation monotonicity', () => {
    /**
     * Additional property: More processing/shipping days should result in later delivery
     */
    it('should produce later delivery dates with more days', () => {
      fc.assert(
        fc.property(
          fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).filter(d => !isNaN(d.getTime())),
          fc.integer({ min: 1, max: 5 }),
          fc.integer({ min: 1, max: 10 }),
          fc.integer({ min: 1, max: 3 }), // additional days
          (currentDate, processingDays, shippingDays, additionalDays) => {
            const delivery1 = calculateDeliveryDate(
              currentDate,
              processingDays,
              shippingDays
            )
            const delivery2 = calculateDeliveryDate(
              currentDate,
              processingDays,
              shippingDays + additionalDays
            )

            // More shipping days should result in later delivery
            expect(delivery2.getTime()).toBeGreaterThan(delivery1.getTime())
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

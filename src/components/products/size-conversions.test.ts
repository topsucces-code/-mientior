/**
 * Property-Based Tests for Size System Conversions
 * Feature: immersive-product-page, Property 13: Size system conversions
 * Validates: Requirements 5.3
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Converts measurements between metric (cm) and imperial (inches)
 * Based on requirement 5.3: conversions between sizing systems should maintain 
 * mathematical accuracy (1 inch = 2.54 cm)
 */
export function convertMeasurement(
  value: number,
  fromUnit: 'cm' | 'in',
  toUnit: 'cm' | 'in'
): number {
  if (fromUnit === toUnit) {
    return value
  }

  if (fromUnit === 'cm' && toUnit === 'in') {
    // Convert cm to inches
    return Math.round((value / 2.54) * 10) / 10
  } else {
    // Convert inches to cm
    return Math.round((value * 2.54) * 10) / 10
  }
}

describe('Size System Conversions Property Tests', () => {
  /**
   * Property 13: Size system conversions
   * For any size guide with measurements, conversions between metric and imperial 
   * systems should maintain mathematical accuracy (1 inch = 2.54 cm)
   */
  it('should convert cm to inches with correct ratio', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(500), noNaN: true }), // measurement in cm (min 1 to avoid rounding to 0)
        (cmValue) => {
          const inchValue = convertMeasurement(cmValue, 'cm', 'in')
          
          // The conversion should follow the formula: inches = cm / 2.54
          const expectedInches = Math.round((cmValue / 2.54) * 10) / 10
          
          expect(inchValue).toBe(expectedInches)
          
          // Verify the ratio is approximately 2.54 (allow some tolerance for rounding and floating point precision)
          if (inchValue > 0) {
            const ratio = cmValue / inchValue
            expect(ratio).toBeGreaterThanOrEqual(2.3)
            expect(ratio).toBeLessThanOrEqual(2.8)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should convert inches to cm with correct ratio', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.5), max: Math.fround(200), noNaN: true }), // measurement in inches (min 0.5 to avoid rounding issues)
        (inchValue) => {
          const cmValue = convertMeasurement(inchValue, 'in', 'cm')
          
          // The conversion should follow the formula: cm = inches * 2.54
          const expectedCm = Math.round((inchValue * 2.54) * 10) / 10
          
          expect(cmValue).toBe(expectedCm)
          
          // Verify the ratio is approximately 2.54 (allow some tolerance for rounding and floating point precision)
          if (inchValue > 0) {
            const ratio = cmValue / inchValue
            expect(ratio).toBeGreaterThanOrEqual(2.3)
            expect(ratio).toBeLessThanOrEqual(2.8)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return same value when converting to same unit', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.1), max: Math.fround(500), noNaN: true }),
        fc.constantFrom('cm' as const, 'in' as const),
        (value, unit) => {
          const converted = convertMeasurement(value, unit, unit)
          
          // Converting to the same unit should return the same value
          expect(converted).toBe(value)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain approximate accuracy in round-trip conversion', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(500), noNaN: true }), // starting value in cm
        (originalCm) => {
          // Convert cm -> in -> cm
          const inches = convertMeasurement(originalCm, 'cm', 'in')
          const backToCm = convertMeasurement(inches, 'in', 'cm')
          
          // Due to rounding, we should be within 0.2 cm of the original
          const difference = Math.abs(backToCm - originalCm)
          expect(difference).toBeLessThanOrEqual(0.2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain approximate accuracy in reverse round-trip conversion', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(1), max: Math.fround(200), noNaN: true }), // starting value in inches
        (originalInches) => {
          // Convert in -> cm -> in
          const cm = convertMeasurement(originalInches, 'in', 'cm')
          const backToInches = convertMeasurement(cm, 'cm', 'in')
          
          // Due to rounding, we should be within 0.1 inches of the original
          const difference = Math.abs(backToInches - originalInches)
          expect(difference).toBeLessThanOrEqual(0.1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle small values correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(0.5), max: Math.fround(5), noNaN: true }),
        fc.constantFrom('cm' as const, 'in' as const),
        (value, fromUnit) => {
          const toUnit = fromUnit === 'cm' ? 'in' : 'cm'
          const converted = convertMeasurement(value, fromUnit, toUnit)
          
          // Converted value should be positive (or 0 for very small values that round down)
          expect(converted).toBeGreaterThanOrEqual(0)
          
          // Should maintain the correct ratio for non-zero conversions
          if (converted > 0) {
            if (fromUnit === 'cm') {
              expect(converted).toBeLessThanOrEqual(value) // cm to in should be smaller or equal
            } else {
              expect(converted).toBeGreaterThanOrEqual(value) // in to cm should be larger or equal
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle large values correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: Math.fround(100), max: Math.fround(500), noNaN: true }),
        fc.constantFrom('cm' as const, 'in' as const),
        (value, fromUnit) => {
          const toUnit = fromUnit === 'cm' ? 'in' : 'cm'
          const converted = convertMeasurement(value, fromUnit, toUnit)
          
          // Converted value should be positive and finite
          expect(converted).toBeGreaterThan(0)
          expect(Number.isFinite(converted)).toBe(true)
          
          // Verify the conversion ratio (allow tolerance for floating point precision)
          const ratio = fromUnit === 'cm' ? value / converted : converted / value
          expect(ratio).toBeGreaterThanOrEqual(2.3)
          expect(ratio).toBeLessThanOrEqual(2.8)
        }
      ),
      { numRuns: 100 }
    )
  })
})

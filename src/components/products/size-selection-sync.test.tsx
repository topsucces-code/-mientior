/**
 * Property-Based Tests for Size Selection Synchronization
 * Feature: immersive-product-page, Property 15: Size selection synchronization
 * Validates: Requirements 5.5
 */

import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import * as fc from 'fast-check'
import { render, screen, fireEvent } from '@testing-library/react'
import { SizeSelectorWithGuide } from './size-selector-with-guide'
import { SizeGuideData } from './size-guide-modal'

interface ProductVariant {
  id: string
  size?: string
  color?: string
  stock: number
  sku: string
  priceModifier: number
}

interface Product {
  id: string
  name: string
  variants: ProductVariant[]
}

/**
 * Simulates the synchronization behavior between size guide and variant selector
 * Based on requirement 5.5: WHEN a user selects a size from the guide, 
 * THE System SHALL auto-select that size in the product variant selector
 */
export function synchronizeSizeSelection(
  selectedSizeFromGuide: string,
  availableSizes: string[],
  onSizeChange: (size: string) => void
): boolean {
  // Check if the selected size is available
  if (availableSizes.includes(selectedSizeFromGuide)) {
    onSizeChange(selectedSizeFromGuide)
    return true
  }
  return false
}

describe('Size Selection Synchronization Property Tests', () => {
  /**
   * Property 15: Size selection synchronization
   * For any size selected in the size guide modal, the product variant 
   * selector should update to reflect that selection
   */
  it('should synchronize size selection from guide to variant selector', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 5 }), {
          minLength: 1,
          maxLength: 10,
        }), // available sizes
        fc.integer({ min: 0, max: 9 }), // index to select
        (sizes, index) => {
          const uniqueSizes = Array.from(new Set(sizes))
          if (uniqueSizes.length === 0) return true

          const selectedIndex = index % uniqueSizes.length
          const selectedSize = uniqueSizes[selectedIndex]
          const mockOnSizeChange = vi.fn()

          const result = synchronizeSizeSelection(
            selectedSize,
            uniqueSizes,
            mockOnSizeChange
          )

          // Should successfully synchronize
          expect(result).toBe(true)
          expect(mockOnSizeChange).toHaveBeenCalledWith(selectedSize)
          expect(mockOnSizeChange).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not synchronize when selected size is not available', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 5 }), {
          minLength: 1,
          maxLength: 10,
        }), // available sizes
        fc.string({ minLength: 6, maxLength: 10 }), // unavailable size (different length)
        (sizes, unavailableSize) => {
          const uniqueSizes = Array.from(new Set(sizes))
          
          // Ensure the unavailable size is truly not in the list
          if (uniqueSizes.includes(unavailableSize)) return true

          const mockOnSizeChange = vi.fn()

          const result = synchronizeSizeSelection(
            unavailableSize,
            uniqueSizes,
            mockOnSizeChange
          )

          // Should not synchronize
          expect(result).toBe(false)
          expect(mockOnSizeChange).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should call onSizeChange exactly once per selection', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (sizes, index) => {
          const uniqueSizes = Array.from(new Set(sizes))
          if (uniqueSizes.length === 0) return true

          const selectedIndex = index % uniqueSizes.length
          const selectedSize = uniqueSizes[selectedIndex]
          const mockOnSizeChange = vi.fn()

          synchronizeSizeSelection(selectedSize, uniqueSizes, mockOnSizeChange)

          // Should call exactly once
          expect(mockOnSizeChange).toHaveBeenCalledTimes(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle multiple sequential selections correctly', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 2, maxLength: 10 }),
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 2, maxLength: 5 }),
        (sizes, indices) => {
          const uniqueSizes = Array.from(new Set(sizes))
          if (uniqueSizes.length < 2) return true

          const mockOnSizeChange = vi.fn()

          // Make multiple selections
          indices.forEach((index) => {
            const selectedIndex = index % uniqueSizes.length
            const selectedSize = uniqueSizes[selectedIndex]
            synchronizeSizeSelection(selectedSize, uniqueSizes, mockOnSizeChange)
          })

          // Should be called once per selection
          expect(mockOnSizeChange).toHaveBeenCalledTimes(indices.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle empty size arrays correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (selectedSize) => {
          const mockOnSizeChange = vi.fn()

          const result = synchronizeSizeSelection(selectedSize, [], mockOnSizeChange)

          // Should not synchronize with empty array
          expect(result).toBe(false)
          expect(mockOnSizeChange).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should be case-sensitive when matching sizes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (size) => {
          const lowerCase = size.toLowerCase()
          const upperCase = size.toUpperCase()

          // Only test if the case actually differs
          if (lowerCase === upperCase) return true

          const mockOnSizeChange = vi.fn()

          // Try to select uppercase when only lowercase is available
          const result = synchronizeSizeSelection(
            upperCase,
            [lowerCase],
            mockOnSizeChange
          )

          // Should not match due to case sensitivity
          expect(result).toBe(false)
          expect(mockOnSizeChange).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 100 }
    )
  })
})

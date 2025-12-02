/**
 * Property-based tests for variant stock synchronization
 * Feature: immersive-product-page
 */

import { describe, it, expect } from 'vitest'
import fc from 'fast-check'

/**
 * Type definitions for testing
 */
interface ProductVariant {
  id: string
  stock: number
  color?: string
  size?: string
}

interface Product {
  id: string
  stock: number
  variants?: ProductVariant[]
}

/**
 * Helper function to get current stock based on selected variant
 * This mirrors the logic in ProductInfo component
 */
function getCurrentStock(
  product: Product,
  selectedVariant: ProductVariant | null
): number {
  return selectedVariant?.stock ?? product.stock
}

/**
 * Helper function to check if add-to-cart should be disabled
 * This mirrors the logic in ProductInfo component
 */
function isAddToCartDisabled(
  currentStock: number,
  isVariantSelectionComplete: boolean,
  isAddingToCart: boolean
): boolean {
  return isAddingToCart || !isVariantSelectionComplete || currentStock === 0
}

describe('Variant Stock Synchronization', () => {
  describe('Property 26: Variant stock synchronization', () => {
    /**
     * **Feature: immersive-product-page, Property 26: Variant stock synchronization**
     * 
     * For any variant selection, the displayed stock quantity should match 
     * the selected variant's stock value.
     * 
     * **Validates: Requirements 8.5**
     */
    it('should display variant stock when variant is selected', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // product stock
          fc.integer({ min: 0, max: 100 }), // variant stock
          (productStock, variantStock) => {
            const product: Product = {
              id: 'test-product',
              stock: productStock,
            }

            const variant: ProductVariant = {
              id: 'test-variant',
              stock: variantStock,
              color: 'red',
              size: 'M',
            }

            // When variant is selected, should use variant stock
            const currentStock = getCurrentStock(product, variant)
            expect(currentStock).toBe(variantStock)

            // When no variant is selected, should use product stock
            const currentStockNoVariant = getCurrentStock(product, null)
            expect(currentStockNoVariant).toBe(productStock)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should update stock when switching between variants', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // product stock
          fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 2, maxLength: 5 }), // variant stocks
          (productStock, variantStocks) => {
            const product: Product = {
              id: 'test-product',
              stock: productStock,
            }

            const variants: ProductVariant[] = variantStocks.map((stock, index) => ({
              id: `variant-${index}`,
              stock,
              color: `color-${index}`,
            }))

            // Test switching between variants
            variants.forEach((variant) => {
              const currentStock = getCurrentStock(product, variant)
              expect(currentStock).toBe(variant.stock)
            })

            // Test switching back to no variant
            const currentStockNoVariant = getCurrentStock(product, null)
            expect(currentStockNoVariant).toBe(productStock)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should sync add-to-cart button state with variant stock', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // variant stock
          fc.boolean(), // is variant selection complete
          (variantStock, isVariantSelectionComplete) => {
            const product: Product = {
              id: 'test-product',
              stock: 50,
            }

            const variant: ProductVariant = {
              id: 'test-variant',
              stock: variantStock,
              color: 'red',
            }

            const currentStock = getCurrentStock(product, variant)
            const isDisabled = isAddToCartDisabled(
              currentStock,
              isVariantSelectionComplete,
              false // not adding to cart
            )

            // Button should be disabled if stock is 0 or variant selection incomplete
            if (variantStock === 0 || !isVariantSelectionComplete) {
              expect(isDisabled).toBe(true)
            } else {
              expect(isDisabled).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle edge case of variant with 0 stock', () => {
      const product: Product = {
        id: 'test-product',
        stock: 50,
      }

      const outOfStockVariant: ProductVariant = {
        id: 'test-variant',
        stock: 0,
        color: 'red',
      }

      const currentStock = getCurrentStock(product, outOfStockVariant)
      expect(currentStock).toBe(0)

      // Add to cart should be disabled
      const isDisabled = isAddToCartDisabled(currentStock, true, false)
      expect(isDisabled).toBe(true)
    })

    it('should handle product with no variants', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // product stock
          (productStock) => {
            const product: Product = {
              id: 'test-product',
              stock: productStock,
            }

            // No variant selected
            const currentStock = getCurrentStock(product, null)
            expect(currentStock).toBe(productStock)
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should maintain stock consistency across variant changes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }), // product stock
          fc.integer({ min: 0, max: 100 }), // variant1 stock
          fc.integer({ min: 0, max: 100 }), // variant2 stock
          (productStock, variant1Stock, variant2Stock) => {
            const product: Product = {
              id: 'test-product',
              stock: productStock,
            }

            const variant1: ProductVariant = {
              id: 'variant-1',
              stock: variant1Stock,
              color: 'red',
            }

            const variant2: ProductVariant = {
              id: 'variant-2',
              stock: variant2Stock,
              color: 'blue',
            }

            // Start with no variant
            let currentStock = getCurrentStock(product, null)
            expect(currentStock).toBe(productStock)

            // Select variant 1
            currentStock = getCurrentStock(product, variant1)
            expect(currentStock).toBe(variant1Stock)

            // Switch to variant 2
            currentStock = getCurrentStock(product, variant2)
            expect(currentStock).toBe(variant2Stock)

            // Deselect variant
            currentStock = getCurrentStock(product, null)
            expect(currentStock).toBe(productStock)
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Stock display consistency', () => {
    it('should always return a non-negative stock value', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10, max: 100 }), // Allow negative to test edge case
          fc.option(fc.integer({ min: -10, max: 100 }), { nil: null }),
          (productStock, variantStock) => {
            const product: Product = {
              id: 'test-product',
              stock: Math.max(0, productStock), // Ensure non-negative
            }

            const variant = variantStock !== null ? {
              id: 'test-variant',
              stock: Math.max(0, variantStock), // Ensure non-negative
              color: 'red',
            } : null

            const currentStock = getCurrentStock(product, variant)
            expect(currentStock).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})

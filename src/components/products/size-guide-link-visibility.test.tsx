/**
 * Property-Based Tests for Size Guide Link Visibility
 * Feature: immersive-product-page, Property 12: Size guide link visibility
 * Validates: Requirements 5.1
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

interface ProductVariant {
  id: string
  size?: string
  color?: string
  stock: number
}

interface Product {
  id: string
  name: string
  variants: ProductVariant[]
}

/**
 * Determines if a size guide link should be visible for a product
 * Based on requirement 5.1: WHEN a product has size variants, 
 * THE System SHALL display a "Size Guide" link
 */
export function shouldShowSizeGuideLink(product: Product): boolean {
  // Check if any variant has a size property defined
  return product.variants.some(variant => 
    variant.size !== undefined && variant.size !== null && variant.size.trim() !== ''
  )
}

describe('Size Guide Link Visibility Property Tests', () => {
  /**
   * Property 12: Size guide link visibility
   * For any product with size variants, the size guide link should be visible
   */
  it('should show size guide link when product has size variants', () => {
    fc.assert(
      fc.property(
        // Generate products with various variant configurations
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          variants: fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              size: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
              color: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
              stock: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        (product) => {
          const hasSizeVariants = product.variants.some(v => 
            v.size !== undefined && v.size !== null && v.size.trim() !== ''
          )
          const shouldShow = shouldShowSizeGuideLink(product)

          // The link should be visible if and only if there are size variants
          expect(shouldShow).toBe(hasSizeVariants)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not show size guide link when product has no size variants', () => {
    fc.assert(
      fc.property(
        // Generate products with variants that have no size
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          variants: fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              size: fc.constant(undefined),
              color: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
              stock: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        (product) => {
          const shouldShow = shouldShowSizeGuideLink(product)

          // Should not show link when no variants have size
          expect(shouldShow).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not show size guide link when size is empty string', () => {
    fc.assert(
      fc.property(
        // Generate products with empty string sizes
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          variants: fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              size: fc.constantFrom('', '   ', '\t', '\n'),
              color: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
              stock: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        (product) => {
          const shouldShow = shouldShowSizeGuideLink(product)

          // Should not show link when sizes are empty/whitespace
          expect(shouldShow).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should show size guide link when at least one variant has size', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // product id
        fc.string({ minLength: 1 }), // product name
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1 }),
            size: fc.constant(undefined),
            color: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            stock: fc.integer({ min: 0, max: 100 }),
          }),
          { minLength: 0, maxLength: 5 }
        ), // variants without size
        fc.record({
          id: fc.string({ minLength: 1 }),
          size: fc.string({ minLength: 1 }),
          color: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
          stock: fc.integer({ min: 0, max: 100 }),
        }), // at least one variant with size
        (productId, productName, variantsWithoutSize, variantWithSize) => {
          const product: Product = {
            id: productId,
            name: productName,
            variants: [...variantsWithoutSize, variantWithSize],
          }

          const shouldShow = shouldShowSizeGuideLink(product)

          // Should show link when at least one variant has size
          expect(shouldShow).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})

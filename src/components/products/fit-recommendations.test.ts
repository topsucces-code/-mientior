/**
 * Property-Based Tests for Category-Specific Fit Recommendations
 * Feature: immersive-product-page, Property 14: Category-specific fit recommendations
 * Validates: Requirements 5.4
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

interface FitRecommendation {
  size: string
  recommendation: string
}

interface SizeGuide {
  id: string
  categoryId: string
  fitRecommendations?: FitRecommendation[]
}

interface Category {
  id: string
  name: string
  hasFitRecommendations: boolean
}

/**
 * Determines if fit recommendations should be displayed for a category
 * Based on requirement 5.4: WHEN applicable, THE System SHALL provide 
 * fit recommendations based on product category
 */
export function shouldDisplayFitRecommendations(
  sizeGuide: SizeGuide | null,
  category: Category
): boolean {
  if (!sizeGuide || !category.hasFitRecommendations) {
    return false
  }

  return (
    sizeGuide.fitRecommendations !== undefined &&
    sizeGuide.fitRecommendations.length > 0
  )
}

/**
 * Gets fit recommendations for a specific category
 */
export function getFitRecommendationsForCategory(
  sizeGuide: SizeGuide | null,
  category: Category
): FitRecommendation[] {
  if (!shouldDisplayFitRecommendations(sizeGuide, category)) {
    return []
  }

  return sizeGuide!.fitRecommendations || []
}

describe('Fit Recommendations Property Tests', () => {
  /**
   * Property 14: Category-specific fit recommendations
   * For any product category with defined fit recommendations, 
   * those recommendations should be displayed in the size guide
   */
  it('should display fit recommendations when category has them defined', () => {
    fc.assert(
      fc.property(
        // Generate size guides with fit recommendations
        fc.record({
          id: fc.string({ minLength: 1 }),
          categoryId: fc.string({ minLength: 1 }),
          fitRecommendations: fc.array(
            fc.record({
              size: fc.string({ minLength: 1 }),
              recommendation: fc.string({ minLength: 10 }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
        }),
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          hasFitRecommendations: fc.constant(true),
        }),
        (sizeGuide, category) => {
          const shouldDisplay = shouldDisplayFitRecommendations(sizeGuide, category)
          const recommendations = getFitRecommendationsForCategory(sizeGuide, category)

          // Should display recommendations when category supports them
          expect(shouldDisplay).toBe(true)
          expect(recommendations.length).toBeGreaterThan(0)
          expect(recommendations).toEqual(sizeGuide.fitRecommendations)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not display fit recommendations when category does not support them', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          categoryId: fc.string({ minLength: 1 }),
          fitRecommendations: fc.option(
            fc.array(
              fc.record({
                size: fc.string({ minLength: 1 }),
                recommendation: fc.string({ minLength: 10 }),
              }),
              { minLength: 1, maxLength: 10 }
            ),
            { nil: undefined }
          ),
        }),
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          hasFitRecommendations: fc.constant(false),
        }),
        (sizeGuide, category) => {
          const shouldDisplay = shouldDisplayFitRecommendations(sizeGuide, category)
          const recommendations = getFitRecommendationsForCategory(sizeGuide, category)

          // Should not display when category doesn't support recommendations
          expect(shouldDisplay).toBe(false)
          expect(recommendations).toEqual([])
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not display fit recommendations when size guide is null', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          hasFitRecommendations: fc.boolean(),
        }),
        (category) => {
          const shouldDisplay = shouldDisplayFitRecommendations(null, category)
          const recommendations = getFitRecommendationsForCategory(null, category)

          // Should not display when size guide is null
          expect(shouldDisplay).toBe(false)
          expect(recommendations).toEqual([])
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not display fit recommendations when array is empty', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1 }),
          categoryId: fc.string({ minLength: 1 }),
          fitRecommendations: fc.constant([]),
        }),
        fc.record({
          id: fc.string({ minLength: 1 }),
          name: fc.string({ minLength: 1 }),
          hasFitRecommendations: fc.constant(true),
        }),
        (sizeGuide, category) => {
          const shouldDisplay = shouldDisplayFitRecommendations(sizeGuide, category)
          const recommendations = getFitRecommendationsForCategory(sizeGuide, category)

          // Should not display when recommendations array is empty
          expect(shouldDisplay).toBe(false)
          expect(recommendations).toEqual([])
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all recommendations for a category', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }), // category id
        fc.array(
          fc.record({
            size: fc.string({ minLength: 1 }),
            recommendation: fc.string({ minLength: 10 }),
          }),
          { minLength: 1, maxLength: 10 }
        ), // fit recommendations
        (categoryId, fitRecommendations) => {
          const sizeGuide: SizeGuide = {
            id: 'guide-1',
            categoryId,
            fitRecommendations,
          }

          const category: Category = {
            id: categoryId,
            name: 'Test Category',
            hasFitRecommendations: true,
          }

          const recommendations = getFitRecommendationsForCategory(sizeGuide, category)

          // Should return all recommendations
          expect(recommendations.length).toBe(fitRecommendations.length)
          expect(recommendations).toEqual(fitRecommendations)

          // Each recommendation should have required fields
          recommendations.forEach((rec) => {
            expect(rec.size).toBeDefined()
            expect(rec.size.length).toBeGreaterThan(0)
            expect(rec.recommendation).toBeDefined()
            expect(rec.recommendation.length).toBeGreaterThan(0)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle categories with different recommendation counts', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }), // number of recommendations
        (count) => {
          const fitRecommendations: FitRecommendation[] = Array.from(
            { length: count },
            (_, i) => ({
              size: `Size ${i}`,
              recommendation: `Recommendation for size ${i}`,
            })
          )

          const sizeGuide: SizeGuide = {
            id: 'guide-1',
            categoryId: 'cat-1',
            fitRecommendations,
          }

          const category: Category = {
            id: 'cat-1',
            name: 'Test Category',
            hasFitRecommendations: true,
          }

          const recommendations = getFitRecommendationsForCategory(sizeGuide, category)

          // Should return exact number of recommendations
          expect(recommendations.length).toBe(count)
        }
      ),
      { numRuns: 100 }
    )
  })
})

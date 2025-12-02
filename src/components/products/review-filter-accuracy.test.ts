/**
 * Property-based test for review filtering accuracy
 * Feature: immersive-product-page, Property 21: Review filtering accuracy
 * Validates: Requirements 7.2
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Types
interface Review {
  id: string
  rating: number
  comment: string
  images?: string[]
  videos?: string[]
  verified: boolean
  helpful: number
  notHelpful: number
  createdAt: Date
}

interface ReviewFilters {
  photos: boolean
  videos: boolean
  verified: boolean
}

/**
 * Apply filters to review list
 * This is the core filtering logic from ProductTabs component
 */
function applyReviewFilters(reviews: Review[], filters: ReviewFilters): Review[] {
  return reviews.filter(review => {
    if (filters.photos && (!review.images || review.images.length === 0)) {
      return false
    }
    if (filters.videos && (!review.videos || review.videos.length === 0)) {
      return false
    }
    if (filters.verified && !review.verified) {
      return false
    }
    return true
  })
}

// Generators
const reviewGenerator = fc.record({
  id: fc.uuid(),
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.string({ minLength: 10, maxLength: 500 }),
  images: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }), { nil: undefined }),
  videos: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 3 }), { nil: undefined }),
  verified: fc.boolean(),
  helpful: fc.integer({ min: 0, max: 100 }),
  notHelpful: fc.integer({ min: 0, max: 50 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() })
})

const filtersGenerator = fc.record({
  photos: fc.boolean(),
  videos: fc.boolean(),
  verified: fc.boolean()
})

describe('Review Filter Accuracy - Property 21', () => {
  it('should only return reviews matching all active filter criteria', () => {
    fc.assert(
      fc.property(
        fc.array(reviewGenerator, { minLength: 0, maxLength: 50 }),
        filtersGenerator,
        (reviews, filters) => {
          const filtered = applyReviewFilters(reviews, filters)

          // All filtered reviews must match all active filter criteria
          filtered.forEach(review => {
            if (filters.photos) {
              expect(review.images).toBeDefined()
              expect(review.images!.length).toBeGreaterThan(0)
            }
            if (filters.videos) {
              expect(review.videos).toBeDefined()
              expect(review.videos!.length).toBeGreaterThan(0)
            }
            if (filters.verified) {
              expect(review.verified).toBe(true)
            }
          })

          // Filtered count should be <= original count
          expect(filtered.length).toBeLessThanOrEqual(reviews.length)

          // If no filters are active, all reviews should be returned
          if (!filters.photos && !filters.videos && !filters.verified) {
            expect(filtered.length).toBe(reviews.length)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should exclude reviews that do not match any active filter', () => {
    fc.assert(
      fc.property(
        fc.array(reviewGenerator, { minLength: 1, maxLength: 50 }),
        filtersGenerator,
        (reviews, filters) => {
          const filtered = applyReviewFilters(reviews, filters)
          const excluded = reviews.filter(r => !filtered.includes(r))

          // Each excluded review must fail at least one active filter
          excluded.forEach(review => {
            let failsAtLeastOne = false

            if (filters.photos && (!review.images || review.images.length === 0)) {
              failsAtLeastOne = true
            }
            if (filters.videos && (!review.videos || review.videos.length === 0)) {
              failsAtLeastOne = true
            }
            if (filters.verified && !review.verified) {
              failsAtLeastOne = true
            }

            // If any filter is active, excluded reviews must fail at least one
            if (filters.photos || filters.videos || filters.verified) {
              expect(failsAtLeastOne).toBe(true)
            }
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain filter consistency when applied multiple times', () => {
    fc.assert(
      fc.property(
        fc.array(reviewGenerator, { minLength: 0, maxLength: 50 }),
        filtersGenerator,
        (reviews, filters) => {
          const filtered1 = applyReviewFilters(reviews, filters)
          const filtered2 = applyReviewFilters(reviews, filters)

          // Applying the same filters twice should yield identical results
          expect(filtered1.length).toBe(filtered2.length)
          expect(filtered1).toEqual(filtered2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge cases correctly', () => {
    // Empty reviews array
    const emptyFiltered = applyReviewFilters([], { photos: true, videos: true, verified: true })
    expect(emptyFiltered).toEqual([])

    // No filters active
    const reviews: Review[] = [
      {
        id: '1',
        rating: 5,
        comment: 'Great product',
        verified: false,
        helpful: 10,
        notHelpful: 0,
        createdAt: new Date()
      }
    ]
    const noFilters = applyReviewFilters(reviews, { photos: false, videos: false, verified: false })
    expect(noFilters).toEqual(reviews)

    // All filters active, no matching reviews
    const noMatch = applyReviewFilters(reviews, { photos: true, videos: true, verified: true })
    expect(noMatch).toEqual([])
  })

  it('should correctly filter by multiple criteria simultaneously', () => {
    fc.assert(
      fc.property(
        fc.array(reviewGenerator, { minLength: 10, maxLength: 50 }),
        (reviews) => {
          // Apply all filters
          const allFilters = { photos: true, videos: true, verified: true }
          const filtered = applyReviewFilters(reviews, allFilters)

          // All filtered reviews must have photos, videos, AND be verified
          filtered.forEach(review => {
            expect(review.images).toBeDefined()
            expect(review.images!.length).toBeGreaterThan(0)
            expect(review.videos).toBeDefined()
            expect(review.videos!.length).toBeGreaterThan(0)
            expect(review.verified).toBe(true)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property-based test for verified review filter correctness
 * Feature: immersive-product-page, Property 23: Verified filter correctness
 * Validates: Requirements 7.4
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

/**
 * Filter reviews to only show verified purchases
 */
function filterVerifiedReviews(reviews: Review[]): Review[] {
  return reviews.filter(review => review.verified === true)
}

// Generators
const verifiedReviewGenerator = fc.record({
  id: fc.uuid(),
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.string({ minLength: 10, maxLength: 500 }),
  images: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }), { nil: undefined }),
  videos: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 3 }), { nil: undefined }),
  verified: fc.constant(true), // Always verified
  helpful: fc.integer({ min: 0, max: 100 }),
  notHelpful: fc.integer({ min: 0, max: 50 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() })
})

const unverifiedReviewGenerator = fc.record({
  id: fc.uuid(),
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.string({ minLength: 10, maxLength: 500 }),
  images: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }), { nil: undefined }),
  videos: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 3 }), { nil: undefined }),
  verified: fc.constant(false), // Always unverified
  helpful: fc.integer({ min: 0, max: 100 }),
  notHelpful: fc.integer({ min: 0, max: 50 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() })
})

const mixedReviewsGenerator = fc.tuple(
  fc.array(verifiedReviewGenerator, { minLength: 0, maxLength: 25 }),
  fc.array(unverifiedReviewGenerator, { minLength: 0, maxLength: 25 })
).map(([verified, unverified]) => [...verified, ...unverified])

describe('Review Verified Filter - Property 23', () => {
  it('should only return reviews with verified = true', () => {
    fc.assert(
      fc.property(
        mixedReviewsGenerator,
        (reviews) => {
          const filtered = filterVerifiedReviews(reviews)

          // All filtered reviews must have verified = true
          filtered.forEach(review => {
            expect(review.verified).toBe(true)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should exclude all unverified reviews', () => {
    fc.assert(
      fc.property(
        mixedReviewsGenerator,
        (reviews) => {
          const filtered = filterVerifiedReviews(reviews)
          const excluded = reviews.filter(r => !filtered.includes(r))

          // All excluded reviews must have verified = false
          excluded.forEach(review => {
            expect(review.verified).toBe(false)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all reviews when all are verified', () => {
    fc.assert(
      fc.property(
        fc.array(verifiedReviewGenerator, { minLength: 1, maxLength: 50 }),
        (reviews) => {
          const filtered = filterVerifiedReviews(reviews)

          // All reviews should be included
          expect(filtered.length).toBe(reviews.length)
          expect(filtered).toEqual(reviews)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return empty array when no reviews are verified', () => {
    fc.assert(
      fc.property(
        fc.array(unverifiedReviewGenerator, { minLength: 1, maxLength: 50 }),
        (reviews) => {
          const filtered = filterVerifiedReviews(reviews)

          // No reviews should be included
          expect(filtered.length).toBe(0)
          expect(filtered).toEqual([])
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain original order of reviews', () => {
    fc.assert(
      fc.property(
        mixedReviewsGenerator,
        (reviews) => {
          const filtered = filterVerifiedReviews(reviews)

          // Check that filtered reviews maintain their relative order
          let lastIndex = -1
          filtered.forEach(filteredReview => {
            const originalIndex = reviews.findIndex(r => r.id === filteredReview.id)
            expect(originalIndex).toBeGreaterThan(lastIndex)
            lastIndex = originalIndex
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not modify the original reviews array', () => {
    fc.assert(
      fc.property(
        mixedReviewsGenerator,
        (reviews) => {
          const originalLength = reviews.length
          const originalIds = reviews.map(r => r.id)
          const originalVerifiedStates = reviews.map(r => r.verified)

          filterVerifiedReviews(reviews)

          // Original array should be unchanged
          expect(reviews.length).toBe(originalLength)
          expect(reviews.map(r => r.id)).toEqual(originalIds)
          expect(reviews.map(r => r.verified)).toEqual(originalVerifiedStates)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge cases correctly', () => {
    // Empty array
    expect(filterVerifiedReviews([])).toEqual([])

    // Unverified review
    const unverifiedReview: Review = {
      id: '1',
      rating: 5,
      comment: 'Great product',
      verified: false,
      helpful: 10,
      notHelpful: 0,
      createdAt: new Date()
    }
    expect(filterVerifiedReviews([unverifiedReview])).toEqual([])

    // Verified review
    const verifiedReview: Review = {
      id: '2',
      rating: 5,
      comment: 'Great product',
      verified: true,
      helpful: 10,
      notHelpful: 0,
      createdAt: new Date()
    }
    expect(filterVerifiedReviews([verifiedReview])).toEqual([verifiedReview])

    // Mixed reviews
    const mixed = [unverifiedReview, verifiedReview]
    expect(filterVerifiedReviews(mixed)).toEqual([verifiedReview])
  })

  it('should correctly count verified vs total reviews', () => {
    fc.assert(
      fc.property(
        mixedReviewsGenerator,
        (reviews) => {
          const filtered = filterVerifiedReviews(reviews)
          const verifiedCount = reviews.filter(r => r.verified).length

          // Filtered count should match manual count
          expect(filtered.length).toBe(verifiedCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should work independently of other review properties', () => {
    fc.assert(
      fc.property(
        mixedReviewsGenerator,
        (reviews) => {
          const filtered = filterVerifiedReviews(reviews)

          // Verified filter should not depend on images, videos, rating, etc.
          filtered.forEach(review => {
            expect(review.verified).toBe(true)
            // These properties can be anything
            // Just checking they exist doesn't affect verification
          })

          // Verify that reviews with different properties but verified=true are included
          const verifiedWithPhotos = reviews.filter(r => r.verified && r.images && r.images.length > 0)
          const verifiedWithoutPhotos = reviews.filter(r => r.verified && (!r.images || r.images.length === 0))
          
          verifiedWithPhotos.forEach(review => {
            expect(filtered).toContainEqual(review)
          })
          verifiedWithoutPhotos.forEach(review => {
            expect(filtered).toContainEqual(review)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})

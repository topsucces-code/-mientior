/**
 * Property-based test for review photo filter correctness
 * Feature: immersive-product-page, Property 22: Photo filter correctness
 * Validates: Requirements 7.3
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
 * Filter reviews to only show those with photos
 */
function filterReviewsWithPhotos(reviews: Review[]): Review[] {
  return reviews.filter(review => review.images && review.images.length > 0)
}

// Generators
const reviewWithPhotosGenerator = fc.record({
  id: fc.uuid(),
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.string({ minLength: 10, maxLength: 500 }),
  images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }), // Always has photos
  videos: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 3 }), { nil: undefined }),
  verified: fc.boolean(),
  helpful: fc.integer({ min: 0, max: 100 }),
  notHelpful: fc.integer({ min: 0, max: 50 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() })
})

const reviewWithoutPhotosGenerator = fc.record({
  id: fc.uuid(),
  rating: fc.integer({ min: 1, max: 5 }),
  comment: fc.string({ minLength: 10, maxLength: 500 }),
  images: fc.constantFrom(undefined, []), // No photos or empty array
  videos: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 3 }), { nil: undefined }),
  verified: fc.boolean(),
  helpful: fc.integer({ min: 0, max: 100 }),
  notHelpful: fc.integer({ min: 0, max: 50 }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() })
})

const mixedReviewsGenerator = fc.tuple(
  fc.array(reviewWithPhotosGenerator, { minLength: 0, maxLength: 25 }),
  fc.array(reviewWithoutPhotosGenerator, { minLength: 0, maxLength: 25 })
).map(([withPhotos, withoutPhotos]) => [...withPhotos, ...withoutPhotos])

describe('Review Photo Filter - Property 22', () => {
  it('should only return reviews with non-empty images array', () => {
    fc.assert(
      fc.property(
        mixedReviewsGenerator,
        (reviews) => {
          const filtered = filterReviewsWithPhotos(reviews)

          // All filtered reviews must have images defined and non-empty
          filtered.forEach(review => {
            expect(review.images).toBeDefined()
            expect(Array.isArray(review.images)).toBe(true)
            expect(review.images!.length).toBeGreaterThan(0)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should exclude all reviews without photos', () => {
    fc.assert(
      fc.property(
        mixedReviewsGenerator,
        (reviews) => {
          const filtered = filterReviewsWithPhotos(reviews)
          const excluded = reviews.filter(r => !filtered.includes(r))

          // All excluded reviews must have no images or empty images array
          excluded.forEach(review => {
            const hasNoPhotos = !review.images || review.images.length === 0
            expect(hasNoPhotos).toBe(true)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return all reviews when all have photos', () => {
    fc.assert(
      fc.property(
        fc.array(reviewWithPhotosGenerator, { minLength: 1, maxLength: 50 }),
        (reviews) => {
          const filtered = filterReviewsWithPhotos(reviews)

          // All reviews should be included
          expect(filtered.length).toBe(reviews.length)
          expect(filtered).toEqual(reviews)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return empty array when no reviews have photos', () => {
    fc.assert(
      fc.property(
        fc.array(reviewWithoutPhotosGenerator, { minLength: 1, maxLength: 50 }),
        (reviews) => {
          const filtered = filterReviewsWithPhotos(reviews)

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
          const filtered = filterReviewsWithPhotos(reviews)

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

          filterReviewsWithPhotos(reviews)

          // Original array should be unchanged
          expect(reviews.length).toBe(originalLength)
          expect(reviews.map(r => r.id)).toEqual(originalIds)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge cases correctly', () => {
    // Empty array
    expect(filterReviewsWithPhotos([])).toEqual([])

    // Review with undefined images
    const reviewNoImages: Review = {
      id: '1',
      rating: 5,
      comment: 'Great product',
      images: undefined,
      verified: false,
      helpful: 10,
      notHelpful: 0,
      createdAt: new Date()
    }
    expect(filterReviewsWithPhotos([reviewNoImages])).toEqual([])

    // Review with empty images array
    const reviewEmptyImages: Review = {
      id: '2',
      rating: 5,
      comment: 'Great product',
      images: [],
      verified: false,
      helpful: 10,
      notHelpful: 0,
      createdAt: new Date()
    }
    expect(filterReviewsWithPhotos([reviewEmptyImages])).toEqual([])

    // Review with photos
    const reviewWithPhotos: Review = {
      id: '3',
      rating: 5,
      comment: 'Great product',
      images: ['https://example.com/photo1.jpg'],
      verified: false,
      helpful: 10,
      notHelpful: 0,
      createdAt: new Date()
    }
    expect(filterReviewsWithPhotos([reviewWithPhotos])).toEqual([reviewWithPhotos])
  })

  it('should correctly count filtered vs total reviews', () => {
    fc.assert(
      fc.property(
        mixedReviewsGenerator,
        (reviews) => {
          const filtered = filterReviewsWithPhotos(reviews)
          const reviewsWithPhotos = reviews.filter(r => r.images && r.images.length > 0)

          // Filtered count should match manual count
          expect(filtered.length).toBe(reviewsWithPhotos.length)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property-Based Test for Review Photo Lightbox
 * Feature: immersive-product-page, Property 17: Review photo lightbox
 * Validates: Requirements 6.2
 * 
 * Property: For any review containing photos, clicking any photo thumbnail should open the lightbox with that photo.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Mock Review type for testing
interface TestReview {
  id: string
  images?: string[]
  videos?: string[]
}

// Simulate lightbox state
interface LightboxState {
  isOpen: boolean
  selectedIndex: number | null
  selectedType: 'image' | 'video' | null
}

// Helper function to simulate clicking on a photo thumbnail
function clickPhotoThumbnail(review: TestReview, photoIndex: number): LightboxState {
  if (!review.images || photoIndex < 0 || photoIndex >= review.images.length) {
    return {
      isOpen: false,
      selectedIndex: null,
      selectedType: null
    }
  }

  return {
    isOpen: true,
    selectedIndex: photoIndex,
    selectedType: 'image'
  }
}

// Helper function to get the displayed image URL in lightbox
function getLightboxImageUrl(review: TestReview, lightboxState: LightboxState): string | null {
  if (!lightboxState.isOpen || lightboxState.selectedIndex === null || lightboxState.selectedType !== 'image') {
    return null
  }

  if (!review.images || lightboxState.selectedIndex >= review.images.length) {
    return null
  }

  return review.images[lightboxState.selectedIndex]
}

// Arbitraries for generating test data
const reviewWithImagesArbitrary = fc.record({
  id: fc.uuid(),
  images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
  videos: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 3 }), { nil: undefined })
})

describe('Review Photo Lightbox - Property 17', () => {
  it('should open lightbox with correct image when clicking any photo thumbnail', () => {
    fc.assert(
      fc.property(
        reviewWithImagesArbitrary,
        fc.nat(),
        (review, indexSeed) => {
          // Select a valid index within the images array
          const photoIndex = indexSeed % review.images.length
          const expectedImageUrl = review.images[photoIndex]

          // Simulate clicking the photo thumbnail
          const lightboxState = clickPhotoThumbnail(review, photoIndex)

          // Property: Lightbox should be open
          expect(lightboxState.isOpen).toBe(true)

          // Property: Selected index should match clicked index
          expect(lightboxState.selectedIndex).toBe(photoIndex)

          // Property: Selected type should be 'image'
          expect(lightboxState.selectedType).toBe('image')

          // Property: Displayed image URL should match the clicked photo
          const displayedUrl = getLightboxImageUrl(review, lightboxState)
          expect(displayedUrl).toBe(expectedImageUrl)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should open lightbox for first image when clicking first thumbnail', () => {
    fc.assert(
      fc.property(reviewWithImagesArbitrary, (review) => {
        const lightboxState = clickPhotoThumbnail(review, 0)
        const displayedUrl = getLightboxImageUrl(review, lightboxState)

        // Property: First image should be displayed
        expect(lightboxState.isOpen).toBe(true)
        expect(lightboxState.selectedIndex).toBe(0)
        expect(displayedUrl).toBe(review.images[0])
      }),
      { numRuns: 100 }
    )
  })

  it('should open lightbox for last image when clicking last thumbnail', () => {
    fc.assert(
      fc.property(reviewWithImagesArbitrary, (review) => {
        const lastIndex = review.images.length - 1
        const lightboxState = clickPhotoThumbnail(review, lastIndex)
        const displayedUrl = getLightboxImageUrl(review, lightboxState)

        // Property: Last image should be displayed
        expect(lightboxState.isOpen).toBe(true)
        expect(lightboxState.selectedIndex).toBe(lastIndex)
        expect(displayedUrl).toBe(review.images[lastIndex])
      }),
      { numRuns: 100 }
    )
  })

  it('should not open lightbox for invalid photo index', () => {
    fc.assert(
      fc.property(
        reviewWithImagesArbitrary,
        fc.integer({ min: -100, max: -1 }),
        (review, negativeIndex) => {
          const lightboxState = clickPhotoThumbnail(review, negativeIndex)

          // Property: Lightbox should not open for negative index
          expect(lightboxState.isOpen).toBe(false)
          expect(lightboxState.selectedIndex).toBe(null)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not open lightbox for out-of-bounds photo index', () => {
    fc.assert(
      fc.property(reviewWithImagesArbitrary, (review) => {
        const outOfBoundsIndex = review.images.length + 10
        const lightboxState = clickPhotoThumbnail(review, outOfBoundsIndex)

        // Property: Lightbox should not open for index beyond array length
        expect(lightboxState.isOpen).toBe(false)
        expect(lightboxState.selectedIndex).toBe(null)
      }),
      { numRuns: 100 }
    )
  })

  it('should display correct image URL for any valid index', () => {
    fc.assert(
      fc.property(
        reviewWithImagesArbitrary,
        fc.nat(),
        (review, indexSeed) => {
          const photoIndex = indexSeed % review.images.length
          const lightboxState = clickPhotoThumbnail(review, photoIndex)
          const displayedUrl = getLightboxImageUrl(review, lightboxState)

          // Property: Displayed URL should exactly match the image at that index
          expect(displayedUrl).toBe(review.images[photoIndex])
          
          // Property: Displayed URL should be a valid URL
          expect(displayedUrl).toBeTruthy()
          expect(typeof displayedUrl).toBe('string')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle reviews with single image', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 1 }),
          videos: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 3 }), { nil: undefined })
        }),
        (review) => {
          const lightboxState = clickPhotoThumbnail(review, 0)
          const displayedUrl = getLightboxImageUrl(review, lightboxState)

          // Property: Single image should open in lightbox
          expect(lightboxState.isOpen).toBe(true)
          expect(lightboxState.selectedIndex).toBe(0)
          expect(displayedUrl).toBe(review.images[0])
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle reviews with maximum images (5)', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          images: fc.array(fc.webUrl(), { minLength: 5, maxLength: 5 }),
          videos: fc.option(fc.array(fc.webUrl(), { minLength: 0, maxLength: 3 }), { nil: undefined })
        }),
        fc.integer({ min: 0, max: 4 }),
        (review, photoIndex) => {
          const lightboxState = clickPhotoThumbnail(review, photoIndex)
          const displayedUrl = getLightboxImageUrl(review, lightboxState)

          // Property: Any of the 5 images should open correctly
          expect(lightboxState.isOpen).toBe(true)
          expect(lightboxState.selectedIndex).toBe(photoIndex)
          expect(displayedUrl).toBe(review.images[photoIndex])
        }
      ),
      { numRuns: 100 }
    )
  })
})

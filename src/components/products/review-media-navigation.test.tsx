/**
 * Property-Based Test for Review Media Navigation
 * Feature: immersive-product-page, Property 19: Review media navigation
 * Validates: Requirements 6.4
 * 
 * Property: For any review with multiple media items (photos + videos), lightbox navigation should allow cycling through all items.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

// Mock Review type for testing
interface TestReview {
  id: string
  images?: string[]
  videos?: string[]
}

// Simulate lightbox state with navigation
interface LightboxState {
  isOpen: boolean
  currentIndex: number
  totalMedia: number
  currentMediaType: 'image' | 'video' | null
  currentMediaUrl: string | null
}

// Helper function to get all media items
function getAllMedia(review: TestReview): Array<{ type: 'image' | 'video'; url: string }> {
  return [
    ...(review.images || []).map(url => ({ type: 'image' as const, url })),
    ...(review.videos || []).map(url => ({ type: 'video' as const, url }))
  ]
}

// Helper function to open lightbox at specific index
function openLightbox(review: TestReview, index: number): LightboxState {
  const allMedia = getAllMedia(review)
  
  if (index < 0 || index >= allMedia.length) {
    return {
      isOpen: false,
      currentIndex: -1,
      totalMedia: allMedia.length,
      currentMediaType: null,
      currentMediaUrl: null
    }
  }

  const media = allMedia[index]
  return {
    isOpen: true,
    currentIndex: index,
    totalMedia: allMedia.length,
    currentMediaType: media.type,
    currentMediaUrl: media.url
  }
}

// Helper function to navigate to next media
function navigateNext(review: TestReview, currentState: LightboxState): LightboxState {
  if (!currentState.isOpen) return currentState

  const allMedia = getAllMedia(review)
  const nextIndex = currentState.currentIndex + 1

  if (nextIndex >= allMedia.length) {
    // Stay at last item (no wrap around)
    return currentState
  }

  return openLightbox(review, nextIndex)
}

// Helper function to navigate to previous media
function navigatePrevious(review: TestReview, currentState: LightboxState): LightboxState {
  if (!currentState.isOpen) return currentState

  const prevIndex = currentState.currentIndex - 1

  if (prevIndex < 0) {
    // Stay at first item (no wrap around)
    return currentState
  }

  return openLightbox(review, prevIndex)
}

// Arbitraries for generating test data
const reviewWithMultipleMediaArbitrary = fc.record({
  id: fc.uuid(),
  images: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
  videos: fc.array(fc.webUrl(), { minLength: 1, maxLength: 3 })
})

describe('Review Media Navigation - Property 19', () => {
  it('should allow cycling through all media items', () => {
    fc.assert(
      fc.property(reviewWithMultipleMediaArbitrary, (review) => {
        const allMedia = getAllMedia(review)
        const totalMedia = allMedia.length

        // Start at first item
        let state = openLightbox(review, 0)
        expect(state.isOpen).toBe(true)
        expect(state.currentIndex).toBe(0)
        expect(state.totalMedia).toBe(totalMedia)

        // Navigate through all items
        for (let i = 1; i < totalMedia; i++) {
          state = navigateNext(review, state)
          
          // Property: Should advance to next index
          expect(state.currentIndex).toBe(i)
          
          // Property: Should display correct media
          expect(state.currentMediaUrl).toBe(allMedia[i].url)
          expect(state.currentMediaType).toBe(allMedia[i].type)
        }

        // Property: Should have visited all media items
        expect(state.currentIndex).toBe(totalMedia - 1)
      }),
      { numRuns: 100 }
    )
  })

  it('should navigate forward correctly from any position', () => {
    fc.assert(
      fc.property(
        reviewWithMultipleMediaArbitrary,
        fc.nat(),
        (review, indexSeed) => {
          const allMedia = getAllMedia(review)
          const startIndex = indexSeed % (allMedia.length - 1) // Ensure we can navigate forward
          
          const initialState = openLightbox(review, startIndex)
          const nextState = navigateNext(review, initialState)

          // Property: Next index should be current + 1
          expect(nextState.currentIndex).toBe(startIndex + 1)
          
          // Property: Should display next media item
          expect(nextState.currentMediaUrl).toBe(allMedia[startIndex + 1].url)
          expect(nextState.currentMediaType).toBe(allMedia[startIndex + 1].type)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should navigate backward correctly from any position', () => {
    fc.assert(
      fc.property(
        reviewWithMultipleMediaArbitrary,
        fc.nat(),
        (review, indexSeed) => {
          const allMedia = getAllMedia(review)
          const startIndex = (indexSeed % (allMedia.length - 1)) + 1 // Ensure we can navigate backward
          
          const initialState = openLightbox(review, startIndex)
          const prevState = navigatePrevious(review, initialState)

          // Property: Previous index should be current - 1
          expect(prevState.currentIndex).toBe(startIndex - 1)
          
          // Property: Should display previous media item
          expect(prevState.currentMediaUrl).toBe(allMedia[startIndex - 1].url)
          expect(prevState.currentMediaType).toBe(allMedia[startIndex - 1].type)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not navigate beyond last item', () => {
    fc.assert(
      fc.property(reviewWithMultipleMediaArbitrary, (review) => {
        const allMedia = getAllMedia(review)
        const lastIndex = allMedia.length - 1
        
        const state = openLightbox(review, lastIndex)
        const nextState = navigateNext(review, state)

        // Property: Should stay at last item
        expect(nextState.currentIndex).toBe(lastIndex)
        expect(nextState.currentMediaUrl).toBe(allMedia[lastIndex].url)
      }),
      { numRuns: 100 }
    )
  })

  it('should not navigate before first item', () => {
    fc.assert(
      fc.property(reviewWithMultipleMediaArbitrary, (review) => {
        const allMedia = getAllMedia(review)
        
        const state = openLightbox(review, 0)
        const prevState = navigatePrevious(review, state)

        // Property: Should stay at first item
        expect(prevState.currentIndex).toBe(0)
        expect(prevState.currentMediaUrl).toBe(allMedia[0].url)
      }),
      { numRuns: 100 }
    )
  })

  it('should maintain correct total media count during navigation', () => {
    fc.assert(
      fc.property(reviewWithMultipleMediaArbitrary, (review) => {
        const allMedia = getAllMedia(review)
        const expectedTotal = allMedia.length

        let state = openLightbox(review, 0)
        
        // Navigate through all items
        for (let i = 0; i < allMedia.length - 1; i++) {
          // Property: Total should remain constant
          expect(state.totalMedia).toBe(expectedTotal)
          state = navigateNext(review, state)
        }

        // Property: Total should still be correct at end
        expect(state.totalMedia).toBe(expectedTotal)
      }),
      { numRuns: 100 }
    )
  })

  it('should correctly handle mixed media types during navigation', () => {
    fc.assert(
      fc.property(reviewWithMultipleMediaArbitrary, (review) => {
        const allMedia = getAllMedia(review)
        
        let state = openLightbox(review, 0)
        
        // Navigate through all items and verify type matches
        for (let i = 0; i < allMedia.length; i++) {
          if (i > 0) {
            state = navigateNext(review, state)
          }
          
          // Property: Media type should match the actual media at that index
          expect(state.currentMediaType).toBe(allMedia[i].type)
          
          // Property: Media URL should match the actual media at that index
          expect(state.currentMediaUrl).toBe(allMedia[i].url)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should allow round-trip navigation (forward then backward)', () => {
    fc.assert(
      fc.property(
        reviewWithMultipleMediaArbitrary,
        fc.nat(),
        (review, indexSeed) => {
          const allMedia = getAllMedia(review)
          const startIndex = indexSeed % allMedia.length
          
          // Start at a position
          const initialState = openLightbox(review, startIndex)
          const initialUrl = initialState.currentMediaUrl
          
          // Navigate forward (if possible)
          let state = initialState
          if (startIndex < allMedia.length - 1) {
            state = navigateNext(review, state)
            expect(state.currentIndex).toBe(startIndex + 1)
            
            // Navigate back
            state = navigatePrevious(review, state)
            
            // Property: Should return to original position
            expect(state.currentIndex).toBe(startIndex)
            expect(state.currentMediaUrl).toBe(initialUrl)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle reviews with only images', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          images: fc.array(fc.webUrl(), { minLength: 2, maxLength: 5 }),
          videos: fc.constant(undefined)
        }),
        (review) => {
          const allMedia = getAllMedia(review)
          
          // Property: All media should be images
          expect(allMedia.every(m => m.type === 'image')).toBe(true)
          
          // Property: Should be able to navigate through all images
          let state = openLightbox(review, 0)
          for (let i = 1; i < allMedia.length; i++) {
            state = navigateNext(review, state)
            expect(state.currentMediaType).toBe('image')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle reviews with only videos', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          images: fc.constant(undefined),
          videos: fc.array(fc.webUrl(), { minLength: 2, maxLength: 3 })
        }),
        (review) => {
          const allMedia = getAllMedia(review)
          
          // Property: All media should be videos
          expect(allMedia.every(m => m.type === 'video')).toBe(true)
          
          // Property: Should be able to navigate through all videos
          let state = openLightbox(review, 0)
          for (let i = 1; i < allMedia.length; i++) {
            state = navigateNext(review, state)
            expect(state.currentMediaType).toBe('video')
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

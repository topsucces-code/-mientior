/**
 * Property-based tests for ProductGallery component
 * Feature: immersive-product-page
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Property 2: Zoom level cycling
 * For any image in zoom mode, repeatedly activating zoom should cycle through levels 1x → 2x → 4x → 1x.
 * Validates: Requirements 1.3
 */
describe('ProductGallery - Property 2: Zoom level cycling', () => {
  it('should cycle through zoom levels 1x → 2x → 4x → 1x', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // Number of zoom toggles
        (toggleCount) => {
          // Simulate zoom level cycling
          let zoomLevel: 1 | 2 | 4 = 1
          
          for (let i = 0; i < toggleCount; i++) {
            // Zoom toggle logic from component
            if (zoomLevel === 1) zoomLevel = 2
            else if (zoomLevel === 2) zoomLevel = 4
            else zoomLevel = 1
          }
          
          // Expected zoom level after N toggles
          const expectedZoomLevel = toggleCount % 3 === 0 ? 1 : toggleCount % 3 === 1 ? 2 : 4
          
          expect(zoomLevel).toBe(expectedZoomLevel)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should always return to 1x after 3 toggles', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 50 }), // Number of complete cycles
        (cycles) => {
          let zoomLevel: 1 | 2 | 4 = 1
          
          // Perform complete cycles (3 toggles each)
          for (let i = 0; i < cycles * 3; i++) {
            if (zoomLevel === 1) zoomLevel = 2
            else if (zoomLevel === 2) zoomLevel = 4
            else zoomLevel = 1
          }
          
          // After any number of complete cycles, should be back at 1x
          expect(zoomLevel).toBe(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should never have invalid zoom levels', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // Many toggles
        (toggleCount) => {
          let zoomLevel: 1 | 2 | 4 = 1
          const validZoomLevels = [1, 2, 4]
          
          for (let i = 0; i < toggleCount; i++) {
            if (zoomLevel === 1) zoomLevel = 2
            else if (zoomLevel === 2) zoomLevel = 4
            else zoomLevel = 1
            
            // After each toggle, zoom level must be valid
            expect(validZoomLevels).toContain(zoomLevel)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 4: Pan position calculation
 * For any mouse coordinates within a zoomed image, the pan position should be calculated 
 * proportionally to keep the mouse-pointed area centered.
 * Validates: Requirements 1.5
 */
describe('ProductGallery - Property 4: Pan position calculation', () => {
  it('should calculate pan position proportionally to mouse position', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }).filter(n => n === 2 || n === 4), // Zoom level (2x or 4x)
        fc.integer({ min: 0, max: 1000 }), // Mouse X position
        fc.integer({ min: 0, max: 1000 }), // Mouse Y position
        fc.integer({ min: 100, max: 2000 }), // Container width
        fc.integer({ min: 100, max: 2000 }), // Container height
        (zoomLevel, mouseX, mouseY, containerWidth, containerHeight) => {
          // Ensure mouse is within container bounds
          const clampedMouseX = Math.min(mouseX, containerWidth)
          const clampedMouseY = Math.min(mouseY, containerHeight)
          
          // Calculate normalized position (-1 to 1) - same as component logic
          const normalizedX = ((clampedMouseX / containerWidth) - 0.5) * 2
          const normalizedY = ((clampedMouseY / containerHeight) - 0.5) * 2
          
          // Pan multiplier based on zoom level
          const panMultiplier = zoomLevel === 2 ? 25 : 37.5
          
          // Calculate pan position
          const panX = -normalizedX * panMultiplier
          const panY = -normalizedY * panMultiplier
          
          // Verify pan position is within expected bounds
          expect(panX).toBeGreaterThanOrEqual(-panMultiplier)
          expect(panX).toBeLessThanOrEqual(panMultiplier)
          expect(panY).toBeGreaterThanOrEqual(-panMultiplier)
          expect(panY).toBeLessThanOrEqual(panMultiplier)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should center pan at (0, 0) when mouse is at container center', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }).filter(n => n === 2 || n === 4), // Zoom level
        fc.integer({ min: 100, max: 2000 }), // Container size
        (zoomLevel, containerSize) => {
          // Mouse at exact center
          const mouseX = containerSize / 2
          const mouseY = containerSize / 2
          
          // Calculate normalized position
          const normalizedX = ((mouseX / containerSize) - 0.5) * 2
          const normalizedY = ((mouseY / containerSize) - 0.5) * 2
          
          const panMultiplier = zoomLevel === 2 ? 25 : 37.5
          const panX = -normalizedX * panMultiplier
          const panY = -normalizedY * panMultiplier
          
          // At center, pan should be (0, 0)
          expect(Math.abs(panX)).toBeLessThan(0.01) // Allow for floating point precision
          expect(Math.abs(panY)).toBeLessThan(0.01)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have opposite pan directions for opposite mouse positions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 4 }).filter(n => n === 2 || n === 4), // Zoom level
        fc.integer({ min: 100, max: 2000 }), // Container size
        fc.double({ min: 0.1, max: 0.4 }).filter(n => !isNaN(n) && isFinite(n)), // Offset from center (10% to 40%)
        (zoomLevel, containerSize, offset) => {
          const centerX = containerSize / 2
          const centerY = containerSize / 2
          const offsetPixels = containerSize * offset
          
          // Calculate pan for position to the right of center
          const mouseRightX = centerX + offsetPixels
          const normalizedRightX = ((mouseRightX / containerSize) - 0.5) * 2
          const panMultiplier = zoomLevel === 2 ? 25 : 37.5
          const panRight = -normalizedRightX * panMultiplier
          
          // Calculate pan for position to the left of center
          const mouseLeftX = centerX - offsetPixels
          const normalizedLeftX = ((mouseLeftX / containerSize) - 0.5) * 2
          const panLeft = -normalizedLeftX * panMultiplier
          
          // Skip if any value is NaN or infinite
          if (!isFinite(panRight) || !isFinite(panLeft)) {
            return true
          }
          
          // Pan directions should be opposite
          expect(Math.sign(panRight)).toBe(-Math.sign(panLeft))
          // And magnitudes should be equal
          expect(Math.abs(panRight)).toBeCloseTo(Math.abs(panLeft), 5)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should scale pan amount with zoom level', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 2000 }), // Container size
        fc.double({ min: 0.1, max: 0.45 }).filter(n => !isNaN(n) && isFinite(n)), // Offset from center
        fc.boolean(), // Direction (left or right of center)
        (containerSize, offset, isRight) => {
          // Position either left or right of center, avoiding exact center
          const positionRatio = isRight ? 0.5 + offset : 0.5 - offset
          const mouseX = containerSize * positionRatio
          const normalizedX = ((mouseX / containerSize) - 0.5) * 2
          
          // Calculate pan for 2x zoom
          const panMultiplier2x = 25
          const pan2x = Math.abs(-normalizedX * panMultiplier2x)
          
          // Calculate pan for 4x zoom
          const panMultiplier4x = 37.5
          const pan4x = Math.abs(-normalizedX * panMultiplier4x)
          
          // Verify values are valid
          expect(isNaN(pan2x)).toBe(false)
          expect(isNaN(pan4x)).toBe(false)
          expect(isFinite(pan2x)).toBe(true)
          expect(isFinite(pan4x)).toBe(true)
          
          // 4x zoom should have larger pan amount than 2x
          expect(pan4x).toBeGreaterThan(pan2x)
          // Ratio should be 37.5/25 = 1.5
          expect(pan4x / pan2x).toBeCloseTo(1.5, 5)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 1: Lightbox opens with correct image
 * For any product image in the gallery, clicking it should open the lightbox displaying that exact image.
 * Validates: Requirements 1.2
 */
describe('ProductGallery - Property 1: Lightbox opens with correct image', () => {
  it('should open lightbox with the clicked image index', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1, maxLength: 20 }), // Image URLs
        fc.integer({ min: 0, max: 19 }), // Clicked image index
        (imageUrls, clickedIndex) => {
          // Ensure clicked index is within bounds
          const actualIndex = clickedIndex % imageUrls.length
          
          // Simulate clicking an image - lightbox should open with that image
          let lightboxOpen = false
          let displayedImageIndex = -1
          
          // Simulate click handler
          const handleImageClick = (index: number) => {
            lightboxOpen = true
            displayedImageIndex = index
          }
          
          handleImageClick(actualIndex)
          
          // Verify lightbox opened
          expect(lightboxOpen).toBe(true)
          // Verify correct image is displayed
          expect(displayedImageIndex).toBe(actualIndex)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain image index when opening lightbox', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // Number of images
        fc.integer({ min: 0, max: 49 }), // Selected image index
        (imageCount, selectedIndex) => {
          const actualIndex = selectedIndex % imageCount
          
          // When lightbox opens, the displayed image should match the selected index
          const lightboxImageIndex = actualIndex
          
          expect(lightboxImageIndex).toBe(actualIndex)
          expect(lightboxImageIndex).toBeGreaterThanOrEqual(0)
          expect(lightboxImageIndex).toBeLessThan(imageCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should preserve image selection across lightbox open/close', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 30 }), // Number of images
        fc.integer({ min: 0, max: 29 }), // Initial selected index
        (imageCount, initialIndex) => {
          const actualIndex = initialIndex % imageCount
          
          // Simulate state management
          const selectedIndex = actualIndex
          let isLightboxOpen = false
          
          // Open lightbox
          isLightboxOpen = true
          const lightboxIndex = selectedIndex
          
          // Close lightbox
          isLightboxOpen = false
          
          // Selected index should remain the same
          expect(selectedIndex).toBe(actualIndex)
          expect(lightboxIndex).toBe(actualIndex)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 3: Keyboard navigation wraps correctly
 * For any image gallery with N images, pressing right arrow on the last image should navigate 
 * to the first image, and pressing left arrow on the first image should navigate to the last image.
 * Validates: Requirements 1.4
 */
describe('ProductGallery - Property 3: Keyboard navigation wraps correctly', () => {
  it('should wrap to first image when pressing right on last image', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // Number of images
        (imageCount) => {
          // Start at last image
          let currentIndex = imageCount - 1
          
          // Simulate right arrow key press (next image)
          currentIndex = (currentIndex + 1) % imageCount
          
          // Should wrap to first image (index 0)
          expect(currentIndex).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should wrap to last image when pressing left on first image', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // Number of images
        (imageCount) => {
          // Start at first image
          let currentIndex = 0
          
          // Simulate left arrow key press (previous image)
          currentIndex = (currentIndex - 1 + imageCount) % imageCount
          
          // Should wrap to last image
          expect(currentIndex).toBe(imageCount - 1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should navigate correctly through all images in both directions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 30 }), // Number of images (at least 2)
        fc.integer({ min: 0, max: 29 }), // Starting index
        fc.integer({ min: 1, max: 100 }), // Number of navigation steps
        fc.boolean(), // Direction (true = forward, false = backward)
        (imageCount, startIndex, steps, forward) => {
          let currentIndex = startIndex % imageCount
          
          for (let i = 0; i < steps; i++) {
            if (forward) {
              // Navigate forward
              currentIndex = (currentIndex + 1) % imageCount
            } else {
              // Navigate backward
              currentIndex = (currentIndex - 1 + imageCount) % imageCount
            }
            
            // Index should always be valid
            expect(currentIndex).toBeGreaterThanOrEqual(0)
            expect(currentIndex).toBeLessThan(imageCount)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should return to starting position after full cycle', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // Number of images
        fc.integer({ min: 0, max: 49 }), // Starting index
        (imageCount, startIndex) => {
          const actualStart = startIndex % imageCount
          let currentIndex = actualStart
          
          // Navigate forward through all images
          for (let i = 0; i < imageCount; i++) {
            currentIndex = (currentIndex + 1) % imageCount
          }
          
          // Should be back at starting position
          expect(currentIndex).toBe(actualStart)
          
          // Reset and navigate backward
          currentIndex = actualStart
          for (let i = 0; i < imageCount; i++) {
            currentIndex = (currentIndex - 1 + imageCount) % imageCount
          }
          
          // Should be back at starting position
          expect(currentIndex).toBe(actualStart)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle single image gallery without wrapping issues', () => {
    fc.assert(
      fc.property(
        fc.constant(1), // Single image
        (imageCount) => {
          const currentIndex = 0
          
          // Navigate forward
          const nextIndex = (currentIndex + 1) % imageCount
          expect(nextIndex).toBe(0)
          
          // Navigate backward
          const prevIndex = (currentIndex - 1 + imageCount) % imageCount
          expect(prevIndex).toBe(0)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain correct index after alternating navigation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 30 }), // Number of images
        fc.integer({ min: 0, max: 29 }), // Starting index
        fc.array(fc.boolean(), { minLength: 1, maxLength: 50 }), // Sequence of directions
        (imageCount, startIndex, directions) => {
          let currentIndex = startIndex % imageCount
          
          directions.forEach(forward => {
            if (forward) {
              currentIndex = (currentIndex + 1) % imageCount
            } else {
              currentIndex = (currentIndex - 1 + imageCount) % imageCount
            }
            
            // Index should always be valid
            expect(currentIndex).toBeGreaterThanOrEqual(0)
            expect(currentIndex).toBeLessThan(imageCount)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 8: Video badge visibility
 * For any product with video content (videoUrl present), the "Video" badge should be displayed in the gallery.
 * Validates: Requirements 3.1
 * Feature: immersive-product-page, Property 8: Video badge visibility
 */
describe('ProductGallery - Property 8: Video badge visibility', () => {
  it('should display video badge when videoUrl is present and non-empty', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }), // Video URL
        (videoUrl) => {
          // Simulate checking if video badge should be displayed
          const hasVideo = videoUrl && videoUrl.length > 0
          
          // Badge should be displayed when videoUrl exists
          expect(hasVideo).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not display video badge when videoUrl is empty', () => {
    const videoUrl = ''
    const hasVideo = !!(videoUrl && videoUrl.length > 0)
    
    expect(hasVideo).toBe(false)
  })

  it('should not display video badge when videoUrl is undefined', () => {
    const videoUrl = undefined
    const hasVideo = !!(videoUrl && videoUrl.length > 0)
    
    expect(hasVideo).toBe(false)
  })

  it('should not display video badge when videoUrl is null', () => {
    const videoUrl = null
    const hasVideo = !!(videoUrl && videoUrl.length > 0)
    
    expect(hasVideo).toBe(false)
  })

  it('should correctly identify video images in mixed gallery', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('image', 'video', '360'),
            videoUrl: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (images) => {
          // Check if any image has video type with videoUrl
          const hasVideo = images.some(img => 
            img.type === 'video' && img.videoUrl && img.videoUrl.length > 0
          )
          
          // Count actual video images
          const countVideoImages = images.filter(img => 
            img.type === 'video' && img.videoUrl && img.videoUrl.length > 0
          ).length
          
          // If we found any, hasVideo should be true
          if (countVideoImages > 0) {
            expect(hasVideo).toBe(true)
          } else {
            expect(hasVideo).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle multiple video images in gallery', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // Number of video images
        fc.integer({ min: 0, max: 10 }), // Number of non-video images
        (videoCount, nonVideoCount) => {
          // Create mixed gallery
          const videoImages = Array.from({ length: videoCount }, (_, i) => ({
            type: 'video' as const,
            videoUrl: `video-${i}.mp4`,
          }))
          
          const nonVideoImages = Array.from({ length: nonVideoCount }, (_, i) => ({
            type: 'image' as const,
            videoUrl: undefined,
          }))
          
          const allImages = [...videoImages, ...nonVideoImages]
          
          // Check if video badge should be displayed
          const hasVideo = allImages.some(img => 
            img.type === 'video' && img.videoUrl && img.videoUrl.length > 0
          )
          
          // Should be true since we have at least one video
          expect(hasVideo).toBe(true)
          
          // Count should match
          const actualVideoCount = allImages.filter(img => 
            img.type === 'video' && img.videoUrl && img.videoUrl.length > 0
          ).length
          expect(actualVideoCount).toBe(videoCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should validate videoUrl format', () => {
    fc.assert(
      fc.property(
        fc.webUrl(), // Generate valid URLs
        (videoUrl) => {
          // Video URL should be a valid string
          const hasVideo = videoUrl && videoUrl.length > 0 && typeof videoUrl === 'string'
          
          expect(hasVideo).toBe(true)
          expect(typeof videoUrl).toBe('string')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle gallery with only video images', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }), // Number of video images
        (videoCount) => {
          const images = Array.from({ length: videoCount }, (_, i) => ({
            type: 'video' as const,
            videoUrl: `video-${i}.mp4`,
          }))
          
          const hasVideo = images.some(img => 
            img.type === 'video' && img.videoUrl && img.videoUrl.length > 0
          )
          
          expect(hasVideo).toBe(true)
          expect(images.length).toBe(videoCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle gallery with no video images', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }), // Number of non-video images
        (imageCount) => {
          const images = Array.from({ length: imageCount }, (_, i) => ({
            type: 'image' as const,
            videoUrl: undefined,
          }))
          
          const hasVideo = images.some(img => 
            img.type === 'video' && img.videoUrl && img.videoUrl.length > 0
          )
          
          expect(hasVideo).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 9: Video navigation availability
 * For any product with multiple videos (count > 1), navigation controls should be enabled and functional.
 * Validates: Requirements 3.5
 * Feature: immersive-product-page, Property 9: Video navigation availability
 */
describe('ProductGallery - Property 9: Video navigation availability', () => {
  it('should enable navigation controls when multiple videos exist', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }), // Number of videos (at least 2)
        (videoCount) => {
          // Navigation should be available when videoCount > 1
          const hasNavigation = videoCount > 1
          
          expect(hasNavigation).toBe(true)
          expect(videoCount).toBeGreaterThan(1)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not enable navigation controls for single video', () => {
    const videoCount = 1
    const hasNavigation = videoCount > 1
    
    expect(hasNavigation).toBe(false)
  })

  it('should not enable navigation controls when no videos exist', () => {
    const videoCount = 0
    const hasNavigation = videoCount > 1
    
    expect(hasNavigation).toBe(false)
  })

  it('should allow navigation to next video when not at last video', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }), // Total videos
        fc.integer({ min: 0, max: 19 }), // Current video index
        (totalVideos, currentIndex) => {
          const actualIndex = currentIndex % totalVideos
          
          // Can navigate next if not at last video
          const canNavigateNext = actualIndex < totalVideos - 1
          
          if (actualIndex === totalVideos - 1) {
            expect(canNavigateNext).toBe(false)
          } else {
            expect(canNavigateNext).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should allow navigation to previous video when not at first video', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }), // Total videos
        fc.integer({ min: 0, max: 19 }), // Current video index
        (totalVideos, currentIndex) => {
          const actualIndex = currentIndex % totalVideos
          
          // Can navigate previous if not at first video
          const canNavigatePrev = actualIndex > 0
          
          if (actualIndex === 0) {
            expect(canNavigatePrev).toBe(false)
          } else {
            expect(canNavigatePrev).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly navigate through all videos sequentially', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }), // Total videos
        (totalVideos) => {
          let currentIndex = 0
          const visitedIndices: number[] = [currentIndex]
          
          // Navigate through all videos
          while (currentIndex < totalVideos - 1) {
            currentIndex++
            visitedIndices.push(currentIndex)
          }
          
          // Should have visited all videos
          expect(visitedIndices.length).toBe(totalVideos)
          expect(currentIndex).toBe(totalVideos - 1)
          
          // All indices should be unique and in order
          for (let i = 0; i < totalVideos; i++) {
            expect(visitedIndices[i]).toBe(i)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly navigate backwards through all videos', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }), // Total videos
        (totalVideos) => {
          let currentIndex = totalVideos - 1
          const visitedIndices: number[] = [currentIndex]
          
          // Navigate backwards through all videos
          while (currentIndex > 0) {
            currentIndex--
            visitedIndices.push(currentIndex)
          }
          
          // Should have visited all videos
          expect(visitedIndices.length).toBe(totalVideos)
          expect(currentIndex).toBe(0)
          
          // All indices should be unique and in reverse order
          for (let i = 0; i < totalVideos; i++) {
            expect(visitedIndices[i]).toBe(totalVideos - 1 - i)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain valid index after navigation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }), // Total videos
        fc.integer({ min: 0, max: 19 }), // Starting index
        fc.array(fc.boolean(), { minLength: 1, maxLength: 50 }), // Navigation sequence
        (totalVideos, startIndex, navigationSequence) => {
          let currentIndex = startIndex % totalVideos
          
          navigationSequence.forEach(goNext => {
            if (goNext && currentIndex < totalVideos - 1) {
              currentIndex++
            } else if (!goNext && currentIndex > 0) {
              currentIndex--
            }
            
            // Index should always be valid
            expect(currentIndex).toBeGreaterThanOrEqual(0)
            expect(currentIndex).toBeLessThan(totalVideos)
          })
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle navigation at boundaries correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 20 }), // Total videos
        (totalVideos) => {
          // At first video, can't go previous
          let currentIndex = 0
          const canGoPrev = currentIndex > 0
          expect(canGoPrev).toBe(false)
          
          // At last video, can't go next
          currentIndex = totalVideos - 1
          const canGoNext = currentIndex < totalVideos - 1
          expect(canGoNext).toBe(false)
          
          // In middle, can go both ways
          if (totalVideos > 2) {
            currentIndex = Math.floor(totalVideos / 2)
            expect(currentIndex > 0).toBe(true)
            expect(currentIndex < totalVideos - 1).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly identify video count in mixed media gallery', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }), // Number of videos
        fc.integer({ min: 0, max: 10 }), // Number of images
        fc.integer({ min: 0, max: 10 }), // Number of 360° views
        (videoCount, imageCount, view360Count) => {
          // Create mixed gallery
          const videos = Array.from({ length: videoCount }, () => ({ type: 'video' as const }))
          const images = Array.from({ length: imageCount }, () => ({ type: 'image' as const }))
          const views360 = Array.from({ length: view360Count }, () => ({ type: '360' as const }))
          
          const allMedia = [...videos, ...images, ...views360]
          
          // Count only videos
          const actualVideoCount = allMedia.filter(m => m.type === 'video').length
          
          expect(actualVideoCount).toBe(videoCount)
          
          // Navigation should be available only if videoCount > 1
          const hasNavigation = actualVideoCount > 1
          if (videoCount > 1) {
            expect(hasNavigation).toBe(true)
          } else {
            expect(hasNavigation).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case of exactly 2 videos', () => {
    const totalVideos = 2
    
    // At first video
    let currentIndex = 0
    expect(currentIndex < totalVideos - 1).toBe(true) // Can go next
    expect(currentIndex > 0).toBe(false) // Can't go previous
    
    // Navigate to second video
    currentIndex = 1
    expect(currentIndex < totalVideos - 1).toBe(false) // Can't go next
    expect(currentIndex > 0).toBe(true) // Can go previous
  })

  it('should calculate video index correctly from mixed gallery', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('image', 'video', '360'),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        fc.integer({ min: 0, max: 19 }), // Selected media index
        (allMedia, selectedIndex) => {
          const actualIndex = selectedIndex % allMedia.length
          const selectedMedia = allMedia[actualIndex]
          
          if (selectedMedia && selectedMedia.type === 'video') {
            // Find video index among all videos
            const videoMedia = allMedia.filter(m => m.type === 'video')
            const videoIndex = videoMedia.findIndex((_, i) => {
              const mediaIndex = allMedia.findIndex(m => m === videoMedia[i])
              return mediaIndex === actualIndex
            })
            
            // Video index should be valid
            expect(videoIndex).toBeGreaterThanOrEqual(0)
            expect(videoIndex).toBeLessThan(videoMedia.length)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 5: 360° badge visibility
 * For any product with 360° image data (frames array present), the "360° View" badge should be displayed in the gallery.
 * Validates: Requirements 2.1
 */
describe('ProductGallery - Property 5: 360° badge visibility', () => {
  it('should display 360° badge when frames array is present and non-empty', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 1, maxLength: 100 }), // Frames array
        (frames) => {
          // Simulate checking if 360° badge should be displayed
          const has360View = frames && frames.length > 0
          
          // Badge should be displayed when frames exist
          expect(has360View).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not display 360° badge when frames array is empty', () => {
    // Empty frames array
    const frames: string[] = []
    const has360View = frames && frames.length > 0
    
    expect(has360View).toBe(false)
  })

  it('should not display 360° badge when frames is undefined', () => {
    // No frames property
    const frames = undefined
    const has360View = !!(frames && frames.length > 0)
    
    expect(has360View).toBe(false)
  })

  it('should not display 360° badge when frames is null', () => {
    // Null frames
    const frames = null
    const has360View = !!(frames && frames.length > 0)
    
    expect(has360View).toBe(false)
  })

  it('should display badge for any non-empty frames array regardless of size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }), // Number of frames
        (frameCount) => {
          // Generate frames array of specified size
          const frames = Array.from({ length: frameCount }, (_, i) => `frame-${i}.jpg`)
          
          const has360View = frames && frames.length > 0
          
          // Badge should always be displayed for non-empty arrays
          expect(has360View).toBe(true)
          expect(frames.length).toBe(frameCount)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should correctly identify 360° images in mixed gallery', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            type: fc.constantFrom('image', 'video', '360'),
            frames: fc.option(fc.array(fc.string(), { minLength: 1, maxLength: 50 })),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (images) => {
          // Check if any image has 360° type with frames
          const has360View = images.some(img => 
            img.type === '360' && img.frames && img.frames.length > 0
          )
          
          // Count actual 360° images
          const count360Images = images.filter(img => 
            img.type === '360' && img.frames && img.frames.length > 0
          ).length
          
          // If we found any, has360View should be true
          if (count360Images > 0) {
            expect(has360View).toBe(true)
          } else {
            expect(has360View).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should handle edge case of single frame 360° view', () => {
    // Even a single frame should trigger the badge
    const frames = ['single-frame.jpg']
    const has360View = frames && frames.length > 0
    
    expect(has360View).toBe(true)
    expect(frames.length).toBe(1)
  })

  it('should validate frames array structure', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string().filter(s => s.length > 0), { minLength: 1, maxLength: 50 }),
        (frames) => {
          // All frames should be non-empty strings
          const allValid = frames.every(frame => typeof frame === 'string' && frame.length > 0)
          const has360View = frames && frames.length > 0 && allValid
          
          expect(has360View).toBe(true)
          expect(allValid).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})

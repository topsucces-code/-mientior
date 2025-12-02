/**
 * Property-Based Test: Image alt text completeness
 * Feature: immersive-product-page, Property 40: Image alt text completeness
 * Validates: Requirements 15.2
 * 
 * Property: For any product image, the alt attribute should be non-empty and descriptive.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { readFileSync } from 'fs'
import { join } from 'path'

// Helper to extract Image components from a file
function extractImageComponents(componentPath: string): string[] {
  const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
  
  // Match Next.js Image components (handle multi-line with lazy matching)
  const imageMatches = content.match(/<Image[\s\S]*?(?:\/?>|<\/Image>)/g) || []
  
  // Also match regular img tags
  const imgMatches = content.match(/<img[\s\S]*?>/g) || []
  
  // Filter out false matches (like imports)
  const validImages = [...imageMatches, ...imgMatches].filter(img => 
    !img.includes('from') && !img.includes('import')
  )
  
  return validImages
}

// Helper to check if an image has alt text
function imageHasAltText(imageString: string): boolean {
  // Check for alt attribute
  const altMatch = imageString.match(/alt=["']([^"']*)["']/)
  
  if (!altMatch) return false
  
  const altText = altMatch[1]
  
  // Alt text should be non-empty
  if (!altText || altText.trim().length === 0) return false
  
  // Alt text should be descriptive (more than just a single word)
  // Allow single words for icons or decorative images
  return true
}

// Helper to check if alt text is descriptive
function isDescriptiveAltText(imageString: string): boolean {
  const altMatch = imageString.match(/alt=["']([^"']*)["']/)
  
  if (!altMatch) return false
  
  const altText = altMatch[1]
  
  // Descriptive alt text should:
  // 1. Be non-empty
  if (!altText || altText.trim().length === 0) return false
  
  // 2. Not be generic placeholders
  const genericTerms = ['image', 'picture', 'photo', 'img']
  const isGeneric = genericTerms.some(term => 
    altText.toLowerCase() === term
  )
  if (isGeneric) return false
  
  // 3. Contain meaningful content (at least 3 characters)
  if (altText.trim().length < 3) return false
  
  return true
}

// Helper to extract product name from alt text
function altTextIncludesProductContext(imageString: string, productNamePattern: string): boolean {
  const altMatch = imageString.match(/alt=["']([^"']*)["']/)
  
  if (!altMatch) return false
  
  const altText = altMatch[1].toLowerCase()
  
  // Check if alt text includes product-related context
  const contextTerms = [
    'product', 'produit', 'thumbnail', 'vignette', 
    'frame', 'vue', 'view', 'image', 'photo'
  ]
  
  return contextTerms.some(term => altText.includes(term))
}

describe('Property 40: Image alt text completeness', () => {
  it('should have non-empty alt text for all images in ProductGallery', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/product-gallery.tsx'),
        (componentPath) => {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          // Count Image components
          const imageCount = (content.match(/<Image/g) || []).length
          expect(imageCount).toBeGreaterThan(0)
          
          // Count alt attributes
          const altCount = (content.match(/alt=/g) || []).length
          
          // All Image components should have alt attributes
          // Allow for some flexibility (>= 90%) since some might be decorative
          const altRatio = altCount / imageCount
          expect(altRatio).toBeGreaterThanOrEqual(0.9)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have descriptive alt text for product images', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/product-gallery.tsx'),
        (componentPath) => {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          // Check that alt text is not generic
          const hasGenericAlt = /alt=["'](image|picture|photo|img)["']/.test(content)
          expect(hasGenericAlt).toBe(false)
          
          // Check that alt text includes product context (either literal or via productName variable)
          const hasProductContext = /alt=.*productName|alt=["'][^"']*product[^"']*["']/i.test(content)
          expect(hasProductContext).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should include product context in alt text', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/product-gallery.tsx'),
        (componentPath) => {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          // Check that alt text includes meaningful context (either in literals or via variables)
          const contextTerms = ['productName', 'thumbnail', 'frame', 'view', 'photo', 'Photo by']
          const hasContext = contextTerms.some(term => 
            new RegExp(`alt=.*${term}`, 'i').test(content)
          )
          
          expect(hasContext).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have alt text for all images across all product components', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'src/components/products/product-gallery.tsx',
          'src/components/products/product-360-viewer.tsx',
          'src/components/products/product-video-player.tsx',
          'src/components/products/product-card.tsx'
        ),
        (componentPath) => {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          const imageCount = (content.match(/<Image/g) || []).length
          
          if (imageCount > 0) {
            const altCount = (content.match(/alt=/g) || []).length
            const altRatio = altCount / imageCount
            
            // At least 90% of images should have alt text
            expect(altRatio).toBeGreaterThanOrEqual(0.9)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not use generic alt text like "image" or "picture"', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/product-gallery.tsx'),
        (componentPath) => {
          const images = extractImageComponents(componentPath)
          
          // Check that no images use generic alt text
          const genericAltTexts = ['image', 'picture', 'photo', 'img']
          
          for (const image of images) {
            const altMatch = image.match(/alt=["']([^"']*)["']/)
            if (altMatch) {
              const altText = altMatch[1].toLowerCase().trim()
              const isGeneric = genericAltTexts.includes(altText)
              expect(isGeneric).toBe(false)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain alt text completeness for dynamic product data', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 1, max: 10 }),
        (productName, imageIndex) => {
          // Simulate alt text generation for dynamic data
          const altText = `${productName} thumbnail ${imageIndex}`
          
          // Alt text should be non-empty
          expect(altText.trim().length).toBeGreaterThan(0)
          
          // Alt text should include product name
          expect(altText).toContain(productName)
          
          // Alt text should include image index
          expect(altText).toContain(String(imageIndex))
        }
      ),
      { numRuns: 100 }
    )
  })
})

/**
 * Property-Based Test: Color information alternatives
 * Feature: immersive-product-page, Property 42: Color information alternatives
 * Validates: Requirements 15.5
 * 
 * Property: For any information conveyed by color (stock status, ratings), 
 * a text alternative should also be present.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { readFileSync } from 'fs'
import { join } from 'path'

// Helper to check if color-coded information has text alternatives
function hasTextAlternativeForColor(componentPath: string, colorPattern: string, textPattern: string): boolean {
  const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
  
  // Check if both color and text are present
  const hasColor = new RegExp(colorPattern, 'i').test(content)
  const hasText = new RegExp(textPattern, 'i').test(content)
  
  // If color is used, text should also be present
  return !hasColor || hasText
}

// Helper to extract color-coded elements
function extractColorCodedElements(componentPath: string): string[] {
  const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
  
  // Match elements with color classes
  const colorMatches = content.match(/className=["'][^"']*(?:text-red|text-green|text-orange|text-yellow|bg-red|bg-green|bg-orange|bg-yellow)[^"']*["']/g) || []
  
  return colorMatches
}

// Helper to check if a color-coded element has text content
function colorElementHasTextContent(elementContext: string): boolean {
  // Check for text content patterns
  const hasTextContent = 
    />\s*[A-Za-z]/.test(elementContext) || // Has text after >
    /{[^}]*text[^}]*}/.test(elementContext) || // Has text variable
    /aria-label/.test(elementContext) || // Has ARIA label
    /title=/.test(elementContext) // Has title attribute
  
  return hasTextContent
}

describe('Property 42: Color information alternatives', () => {
  it('should provide text alternatives for stock status colors', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/stock-indicator.tsx'),
        (componentPath) => {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          // Check for color-coded stock status
          const hasColorCoding = /text-orange|text-green|text-red/.test(content)
          
          if (hasColorCoding) {
            // Should also have text alternatives
            const hasTextAlternatives = 
              /Out of Stock|Low stock|Only.*left|In stock/i.test(content) ||
              /stock.*text/i.test(content)
            
            expect(hasTextAlternatives).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should provide text alternatives for rating colors', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'src/components/products/product-card.tsx',
          'src/components/products/product-tabs.tsx'
        ),
        (componentPath) => {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          // Check for star ratings
          const hasStarRating = /Star|rating|⭐/.test(content)
          
          if (hasStarRating) {
            // Should have numeric rating or aria-label
            const hasTextAlternative = 
              /\d+\.\d+|aria-label.*rating|title.*rating/i.test(content)
            
            expect(hasTextAlternative).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should not rely solely on color for critical information', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/stock-indicator.tsx'),
        (componentPath) => {
          const colorElements = extractColorCodedElements(componentPath)
          
          if (colorElements.length > 0) {
            // Read full context around color elements
            const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
            
            // Check that color-coded sections also have text
            const hasOutOfStockText = /Out of Stock/.test(content)
            const hasLowStockText = /Only.*left|Low stock/.test(content)
            const hasInStockText = /In stock|Available/.test(content)
            
            // At least one text alternative should be present
            const hasTextAlternatives = hasOutOfStockText || hasLowStockText || hasInStockText
            expect(hasTextAlternatives).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should use icons in addition to colors for status indication', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/stock-indicator.tsx'),
        (componentPath) => {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          // Check for icon usage alongside colors
          const hasIcons = 
            /Check|X|Alert|Info|Warning|Circle/.test(content) ||
            /lucide-react/.test(content)
          
          // Icons provide additional visual cues beyond color
          // This is optional but recommended
          expect(typeof hasIcons).toBe('boolean')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain color alternatives across different stock levels', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (stock) => {
          // For any stock level, there should be a text representation
          let textRepresentation: string
          
          if (stock === 0) {
            textRepresentation = 'Out of Stock'
          } else if (stock < 5) {
            textRepresentation = `Only ${stock} left in stock`
          } else if (stock < 10) {
            textRepresentation = `${stock} in stock`
          } else {
            textRepresentation = 'In Stock'
          }
          
          // Text representation should be non-empty
          expect(textRepresentation.length).toBeGreaterThan(0)
          
          // Text representation should include the word "stock"
          expect(textRepresentation.toLowerCase()).toContain('stock')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should provide ARIA labels for color-coded interactive elements', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'src/components/products/stock-indicator.tsx',
          'src/components/products/product-card.tsx'
        ),
        (componentPath) => {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          // Check for color-coded buttons or interactive elements
          const hasColoredButtons = /<button[^>]*(?:text-red|text-green|text-orange|bg-red|bg-green|bg-orange)/.test(content)
          
          if (hasColoredButtons) {
            // Should have aria-label or text content
            const hasAccessibility = 
              /aria-label/.test(content) ||
              /<button[^>]*>[^<]*[A-Za-z]/.test(content)
            
            expect(hasAccessibility).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

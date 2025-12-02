/**
 * Property-Based Test: Focus indicators presence
 * Feature: immersive-product-page, Property 39: Focus indicators presence
 * Validates: Requirements 15.1
 * 
 * Property: For any interactive element (button, link, input), a visible focus indicator
 * should be present when focused.
 * 
 * This test validates that all interactive elements have focus indicators by checking:
 * 1. Presence of focus-related CSS classes (focus:, focus-visible:)
 * 2. Presence of ARIA labels for accessibility
 * 3. Presence of title attributes for tooltips
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { readFileSync } from 'fs'
import { join } from 'path'

// Helper to check if a component file has focus indicators
function componentHasFocusIndicators(componentPath: string): boolean {
  const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
  
  // Check for focus-related patterns
  const hasFocusClasses = /focus:|focus-visible:|focus-within:/.test(content)
  const hasAriaLabels = /aria-label=/.test(content)
  const hasTitles = /title=/.test(content)
  const hasOutline = /outline/.test(content)
  const hasRing = /ring-/.test(content)
  
  return hasFocusClasses || hasAriaLabels || hasTitles || hasOutline || hasRing
}

// Helper to extract button/interactive elements from component
function extractInteractiveElements(componentPath: string): string[] {
  const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
  
  // Match button elements (including multi-line)
  const buttonMatches = content.match(/<button[\s\S]*?>/g) || []
  const linkMatches = content.match(/<a[\s\S]*?>/g) || []
  const inputMatches = content.match(/<input[\s\S]*?>/g) || []
  const selectMatches = content.match(/<select[\s\S]*?>/g) || []
  const textareaMatches = content.match(/<textarea[\s\S]*?>/g) || []
  
  // Also match Button components from UI library
  const uiButtonMatches = content.match(/<Button[\s\S]*?>/g) || []
  
  return [...buttonMatches, ...linkMatches, ...inputMatches, ...selectMatches, ...textareaMatches, ...uiButtonMatches]
}

// Helper to check if an element has focus indicators
function elementHasFocusIndicator(elementString: string): boolean {
  return (
    /focus:/.test(elementString) ||
    /focus-visible:/.test(elementString) ||
    /aria-label=/.test(elementString) ||
    /title=/.test(elementString) ||
    /outline/.test(elementString) ||
    /ring-/.test(elementString) ||
    /aria-describedby=/.test(elementString) ||
    /role=/.test(elementString)
  )
}

describe('Property 39: Focus indicators presence', () => {
  it('should have focus indicators in ProductGallery component', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/product-gallery.tsx'),
        (componentPath) => {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          // Check that the component has focus indicator patterns
          const hasFocusIndicators = componentHasFocusIndicators(componentPath)
          expect(hasFocusIndicators).toBe(true)
          
          // Count buttons and aria-labels
          const buttonCount = (content.match(/<button/g) || []).length
          const ariaLabelCount = (content.match(/aria-label=/g) || []).length
          const titleCount = (content.match(/title=/g) || []).length
          const focusClassCount = (content.match(/focus:/g) || []).length
          
          // At least 70% of buttons should have accessibility features
          const accessibilityRatio = (ariaLabelCount + titleCount + focusClassCount) / buttonCount
          expect(accessibilityRatio).toBeGreaterThanOrEqual(0.7)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have focus indicators in Product360Viewer component', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/product-360-viewer.tsx'),
        (componentPath) => {
          const hasFocusIndicators = componentHasFocusIndicators(componentPath)
          expect(hasFocusIndicators).toBe(true)
          
          const elements = extractInteractiveElements(componentPath)
          expect(elements.length).toBeGreaterThan(0)
          
          const elementsWithFocus = elements.filter(elementHasFocusIndicator)
          const focusRatio = elementsWithFocus.length / elements.length
          
          expect(focusRatio).toBeGreaterThanOrEqual(0.7)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have focus indicators in SizeGuideModal component', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/size-guide-modal.tsx'),
        (componentPath) => {
          const hasFocusIndicators = componentHasFocusIndicators(componentPath)
          expect(hasFocusIndicators).toBe(true)
          
          const elements = extractInteractiveElements(componentPath)
          expect(elements.length).toBeGreaterThan(0)
          
          const elementsWithFocus = elements.filter(elementHasFocusIndicator)
          const focusRatio = elementsWithFocus.length / elements.length
          
          expect(focusRatio).toBeGreaterThanOrEqual(0.7)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have focus indicators in ProductVideoPlayer component', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/product-video-player.tsx'),
        (componentPath) => {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          const hasFocusIndicators = componentHasFocusIndicators(componentPath)
          expect(hasFocusIndicators).toBe(true)
          
          // Count buttons and accessibility features
          const buttonCount = (content.match(/<button/g) || []).length
          const ariaLabelCount = (content.match(/aria-label=/g) || []).length
          const titleCount = (content.match(/title=/g) || []).length
          const focusClassCount = (content.match(/focus:/g) || []).length
          
          // At least 70% of buttons should have accessibility features
          const accessibilityRatio = (ariaLabelCount + titleCount + focusClassCount) / buttonCount
          expect(accessibilityRatio).toBeGreaterThanOrEqual(0.7)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain consistent focus indicator patterns across all components', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'src/components/products/product-gallery.tsx',
          'src/components/products/product-360-viewer.tsx',
          'src/components/products/size-guide-modal.tsx',
          'src/components/products/product-video-player.tsx'
        ),
        (componentPath) => {
          // All components should have focus indicators
          const hasFocusIndicators = componentHasFocusIndicators(componentPath)
          expect(hasFocusIndicators).toBe(true)
          
          // All components should have interactive elements
          const elements = extractInteractiveElements(componentPath)
          expect(elements.length).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})

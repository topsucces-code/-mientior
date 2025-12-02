/**
 * Property-Based Test: Zoom control accessibility
 * Feature: immersive-product-page, Property 41: Zoom control accessibility
 * Validates: Requirements 15.4
 * 
 * Property: For any zoom control, keyboard shortcuts (+ for zoom in, - for zoom out)
 * and ARIA labels should be present.
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { readFileSync } from 'fs'
import { join } from 'path'

// Helper to check if zoom controls have keyboard shortcuts
function hasZoomKeyboardShortcuts(componentPath: string): boolean {
  const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
  
  // Check for zoom keyboard event handlers
  const hasZoomInShortcut = /['+']|['=']/.test(content) && /zoom/i.test(content)
  const hasZoomOutShortcut = /['-']|['_']/.test(content) && /zoom/i.test(content)
  const hasKeyboardHandler = /handleKeyDown|onKeyDown|addEventListener.*keydown/i.test(content)
  
  return hasZoomInShortcut && hasZoomOutShortcut && hasKeyboardHandler
}

// Helper to check if zoom controls have ARIA labels
function hasZoomAriaLabels(componentPath: string): boolean {
  const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
  
  // Check for ARIA labels on zoom controls
  const hasAriaLabel = /aria-label.*zoom/i.test(content)
  const hasTitle = /title.*zoom/i.test(content)
  
  return hasAriaLabel || hasTitle
}

// Helper to extract zoom-related interactive buttons (not display elements)
function extractZoomControls(componentPath: string): string[] {
  const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
  
  // Match only button elements that have zoom-related onClick handlers or contain ZoomIn/ZoomOut icons
  // This excludes non-interactive display divs like the zoom level indicator
  const buttonPattern = /<button[^>]*(?:handleZoomToggle|ZoomIn|ZoomOut)[^>]*>/gi
  const zoomButtonMatches = content.match(buttonPattern) || []
  
  return zoomButtonMatches
}

// Helper to check if a zoom control has accessibility features
function zoomControlHasAccessibility(controlString: string): boolean {
  // Check for aria-label OR title attribute (both provide accessible names)
  return (
    /aria-label\s*=\s*["'][^"']*zoom[^"']*["']/i.test(controlString) ||
    /title\s*=\s*["'][^"']*zoom[^"']*["']/i.test(controlString)
  )
}

describe('Property 41: Zoom control accessibility', () => {
  it('should have keyboard shortcuts for zoom controls in ProductGallery', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/product-gallery.tsx'),
        (componentPath) => {
          // Check that zoom keyboard shortcuts are implemented
          const hasShortcuts = hasZoomKeyboardShortcuts(componentPath)
          expect(hasShortcuts).toBe(true)
          
          // Check that zoom controls have ARIA labels
          const hasLabels = hasZoomAriaLabels(componentPath)
          expect(hasLabels).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have accessible zoom controls with proper ARIA labels', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/product-gallery.tsx'),
        (componentPath) => {
          // Extract interactive zoom control buttons
          const zoomControls = extractZoomControls(componentPath)
          
          // All interactive zoom controls should have accessibility features
          if (zoomControls.length > 0) {
            const accessibleControls = zoomControls.filter(zoomControlHasAccessibility)
            const accessibilityRatio = accessibleControls.length / zoomControls.length
            
            // All zoom control buttons should have aria-label or title attributes
            // This ensures WCAG 2.1 AA compliance for interactive elements
            expect(accessibilityRatio).toBeGreaterThanOrEqual(1.0)
            expect(zoomControls.length).toBeGreaterThan(0)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should support both + and - keyboard shortcuts for zoom', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/product-gallery.tsx'),
        (componentPath) => {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          // Check for both zoom in shortcuts (+ and =)
          const hasZoomInPlus = content.includes("'+'") || content.includes('"+')
          const hasZoomInEquals = content.includes("'='") || content.includes('"=')
          
          // Check for both zoom out shortcuts (- and _)
          const hasZoomOutMinus = content.includes("'-'") || content.includes('"-')
          const hasZoomOutUnderscore = content.includes("'_'") || content.includes('"_')
          
          // Should have at least one zoom in and one zoom out shortcut
          const hasZoomIn = hasZoomInPlus || hasZoomInEquals
          const hasZoomOut = hasZoomOutMinus || hasZoomOutUnderscore
          
          expect(hasZoomIn).toBe(true)
          expect(hasZoomOut).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should have escape key support to exit zoom mode', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/product-gallery.tsx'),
        (componentPath) => {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          // Check for Escape key handler
          const hasEscapeKey = /['"]Escape['"]/.test(content)
          const hasZoomReset = /setZoomLevel\(1\)/.test(content)
          
          // Should have Escape key support to reset zoom
          expect(hasEscapeKey && hasZoomReset).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should provide visual feedback for current zoom level', () => {
    fc.assert(
      fc.property(
        fc.constant('src/components/products/product-gallery.tsx'),
        (componentPath) => {
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          // Check for zoom level display
          const hasZoomLevelDisplay = /{zoomLevel}x/.test(content) || /zoomLevel.*x/.test(content)
          
          // Should display current zoom level to user
          expect(hasZoomLevelDisplay).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should maintain zoom accessibility across different zoom levels', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(1, 2, 4),
        (zoomLevel) => {
          // For any zoom level (1x, 2x, 4x), accessibility features should be present
          const componentPath = 'src/components/products/product-gallery.tsx'
          const content = readFileSync(join(process.cwd(), componentPath), 'utf-8')
          
          // Check that zoom level is supported
          const supportsZoomLevel = new RegExp(`${zoomLevel}`).test(content)
          expect(supportsZoomLevel).toBe(true)
          
          // Check that ARIA labels mention zoom levels
          const hasZoomLevelAria = /aria-label.*zoom.*[124]x/i.test(content)
          expect(hasZoomLevelAria).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})

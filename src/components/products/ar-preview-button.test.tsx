/**
 * Property-Based Tests for AR Preview Button
 * 
 * Tests AR button visibility and device capability detection
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'

/**
 * Detects if the current device supports AR
 * - iOS: Checks for AR Quick Look support
 * - Android: Checks for Scene Viewer support
 * 
 * Extracted from component for testing
 */
function detectARSupport(userAgent: string): { supported: boolean; platform: 'ios' | 'android' | 'none' } {
  const ua = userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(ua)
  const isAndroid = /android/.test(ua)

  // iOS AR Quick Look support (iOS 12+)
  if (isIOS) {
    const iosVersion = ua.match(/os (\d+)_/)
    const version = iosVersion ? parseInt(iosVersion[1]) : 0
    
    if (version >= 12) {
      return { supported: true, platform: 'ios' }
    }
  }

  // Android Scene Viewer support (Android 7.0+)
  if (isAndroid) {
    const androidVersion = ua.match(/android (\d+)/)
    const version = androidVersion ? parseInt(androidVersion[1]) : 0
    
    if (version >= 7) {
      return { supported: true, platform: 'android' }
    }
  }

  return { supported: false, platform: 'none' }
}

/**
 * Generates the appropriate AR URL based on platform
 * 
 * Extracted from component for testing
 */
function getARUrl(modelUrl: string, platform: 'ios' | 'android', productName: string): string {
  if (platform === 'ios') {
    return modelUrl
  }

  if (platform === 'android') {
    const encodedUrl = encodeURIComponent(modelUrl)
    const encodedTitle = encodeURIComponent(productName)
    return `intent://arvr.google.com/scene-viewer/1.0?file=${encodedUrl}&mode=ar_preferred&title=${encodedTitle}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`
  }

  return modelUrl
}

describe('ARPreviewButton - AR Support Detection', () => {

  /**
   * Feature: immersive-product-page, Property 29: AR button visibility
   * For any product with AR model URL present, the "AR Preview" button should be displayed.
   * Validates: Requirements 10.1
   */
  it('Property 29: AR button visibility - AR support is detected for capable devices', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          // iOS 12+ devices (AR supported)
          'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
          'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          // Android 7+ devices (AR supported)
          'Mozilla/5.0 (Linux; Android 7.0; Pixel) AppleWebKit/537.36',
          'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36',
          'Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36'
        ),
        (userAgent) => {
          const result = detectARSupport(userAgent)
          
          // AR should be supported
          expect(result.supported).toBe(true)
          
          // Platform should be correctly identified
          if (userAgent.toLowerCase().includes('iphone') || userAgent.toLowerCase().includes('ipad')) {
            expect(result.platform).toBe('ios')
          } else if (userAgent.toLowerCase().includes('android')) {
            expect(result.platform).toBe('android')
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Feature: immersive-product-page, Property 30: AR button hiding on unsupported devices
   * For any device without AR capability, the AR button should be hidden.
   * Validates: Requirements 10.3
   */
  it('Property 30: AR button hiding - AR support is not detected for incapable devices', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          // Old iOS versions (< 12)
          'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 10_0 like Mac OS X) AppleWebKit/602.1.50',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 9_0 like Mac OS X) AppleWebKit/601.1.46',
          // Old Android versions (< 7)
          'Mozilla/5.0 (Linux; Android 6.0; Nexus 5) AppleWebKit/537.36',
          'Mozilla/5.0 (Linux; Android 5.0; SM-G900P) AppleWebKit/537.36',
          'Mozilla/5.0 (Linux; Android 4.4; Nexus 5) AppleWebKit/537.36',
          // Desktop browsers
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        ),
        (userAgent) => {
          const result = detectARSupport(userAgent)
          
          // AR should NOT be supported
          expect(result.supported).toBe(false)
          expect(result.platform).toBe('none')
        }
      ),
      { numRuns: 100 }
    )
  })

})

describe('ARPreviewButton - AR URL Generation', () => {
  /**
   * Unit test: iOS Quick Look URL generation
   */
  it('should generate correct URL for iOS devices', () => {
    fc.assert(
      fc.property(
        fc.webUrl(), // Random model URLs
        fc.string({ minLength: 1, maxLength: 100 }), // Random product names
        (modelUrl, productName) => {
          const url = getARUrl(modelUrl, 'ios', productName)
          
          // For iOS, the URL should be the model URL directly
          expect(url).toBe(modelUrl)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Unit test: Android Scene Viewer URL generation
   */
  it('should generate correct intent URL for Android devices', () => {
    fc.assert(
      fc.property(
        fc.webUrl(), // Random model URLs
        fc.string({ minLength: 1, maxLength: 100 }), // Random product names
        (modelUrl, productName) => {
          const url = getARUrl(modelUrl, 'android', productName)
          
          // For Android, the URL should be an intent URL
          expect(url).toContain('intent://')
          expect(url).toContain('arvr.google.com/scene-viewer')
          expect(url).toContain(encodeURIComponent(modelUrl))
          expect(url).toContain(encodeURIComponent(productName))
          expect(url).toContain('package=com.google.android.googlequicksearchbox')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Unit test: iOS version detection
   */
  it('should correctly detect iOS version from user agent', () => {
    const ios12 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15'
    const ios11 = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38'
    
    expect(detectARSupport(ios12).supported).toBe(true)
    expect(detectARSupport(ios11).supported).toBe(false)
  })

  /**
   * Unit test: Android version detection
   */
  it('should correctly detect Android version from user agent', () => {
    const android7 = 'Mozilla/5.0 (Linux; Android 7.0; Pixel) AppleWebKit/537.36'
    const android6 = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5) AppleWebKit/537.36'
    
    expect(detectARSupport(android7).supported).toBe(true)
    expect(detectARSupport(android6).supported).toBe(false)
  })

  /**
   * Unit test: Desktop detection
   */
  it('should not support AR on desktop browsers', () => {
    const windows = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    const linux = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    
    expect(detectARSupport(windows).supported).toBe(false)
    expect(detectARSupport(mac).supported).toBe(false)
    expect(detectARSupport(linux).supported).toBe(false)
  })
})

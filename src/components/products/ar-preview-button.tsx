'use client'

/**
 * AR Preview Button Component
 * 
 * Provides AR (Augmented Reality) preview functionality for products
 * - Detects device AR capabilities
 * - iOS Quick Look integration (USDZ)
 * - Android Scene Viewer integration (GLB)
 * - Hides button on unsupported devices
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { useState, useEffect } from 'react'
import { Cube } from 'lucide-react'

interface ARPreviewButtonProps {
  modelUrl: string // URL to AR model (USDZ for iOS, GLB for Android)
  productName: string
}

/**
 * Detects if the current device supports AR
 * - iOS: Checks for AR Quick Look support
 * - Android: Checks for Scene Viewer support
 */
function detectARSupport(): { supported: boolean; platform: 'ios' | 'android' | 'none' } {
  if (typeof window === 'undefined') {
    return { supported: false, platform: 'none' }
  }

  const userAgent = navigator.userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(userAgent)
  const isAndroid = /android/.test(userAgent)

  // iOS AR Quick Look support (iOS 12+)
  if (isIOS) {
    // Check if the device supports AR Quick Look
    // This is available on iOS 12+ with A9 chip or later
    const iosVersion = userAgent.match(/os (\d+)_/)
    const version = iosVersion ? parseInt(iosVersion[1]) : 0
    
    if (version >= 12) {
      return { supported: true, platform: 'ios' }
    }
  }

  // Android Scene Viewer support (Android 7.0+)
  if (isAndroid) {
    // Check if the device supports Scene Viewer
    // Available on Android 7.0+ with ARCore support
    const androidVersion = userAgent.match(/android (\d+)/)
    const version = androidVersion ? parseInt(androidVersion[1]) : 0
    
    if (version >= 7) {
      return { supported: true, platform: 'android' }
    }
  }

  return { supported: false, platform: 'none' }
}

/**
 * Generates the appropriate AR URL based on platform
 */
function getARUrl(modelUrl: string, platform: 'ios' | 'android', productName: string): string {
  if (platform === 'ios') {
    // iOS Quick Look uses a direct link to the USDZ file
    // The rel="ar" attribute on the anchor tag triggers Quick Look
    return modelUrl
  }

  if (platform === 'android') {
    // Android Scene Viewer uses an intent URL
    const encodedUrl = encodeURIComponent(modelUrl)
    const encodedTitle = encodeURIComponent(productName)
    return `intent://arvr.google.com/scene-viewer/1.0?file=${encodedUrl}&mode=ar_preferred&title=${encodedTitle}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`
  }

  return modelUrl
}

export function ARPreviewButton({ modelUrl, productName }: ARPreviewButtonProps) {
  const [arSupport, setArSupport] = useState<{ supported: boolean; platform: 'ios' | 'android' | 'none' }>({
    supported: false,
    platform: 'none',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)

  useEffect(() => {
    // Detect AR support on mount
    const support = detectARSupport()
    setArSupport(support)
  }, [])

  // Don't render if AR is not supported
  if (!arSupport.supported) {
    return null
  }

  const arUrl = getARUrl(modelUrl, arSupport.platform, productName)

  const handleARClick = () => {
    setIsLoading(true)
    setShowInstructions(true)

    // Hide instructions after 3 seconds
    setTimeout(() => {
      setShowInstructions(false)
      setIsLoading(false)
    }, 3000)
  }

  return (
    <>
      {/* AR Preview Button */}
      <a
        href={arUrl}
        rel={arSupport.platform === 'ios' ? 'ar' : undefined}
        onClick={handleARClick}
        className="inline-flex items-center gap-2 bg-white/90 hover:bg-white px-4 py-2 rounded-full shadow-elevation-2 transition-all text-sm font-medium text-nuanced-900 hover:shadow-elevation-3"
        aria-label={`View ${productName} in AR`}
      >
        <Cube className="w-5 h-5" />
        <span>Voir en AR</span>
      </a>

      {/* AR Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-elevation-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Cube className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-nuanced-900">Aperçu AR</h3>
                <p className="text-sm text-nuanced-600">Visualisez le produit dans votre espace</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-nuanced-700">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-orange-600">1</span>
                </div>
                <p>Pointez votre appareil vers une surface plane</p>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-orange-600">2</span>
                </div>
                <p>Déplacez votre appareil pour détecter la surface</p>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-orange-600">3</span>
                </div>
                <p>Touchez pour placer le produit et utilisez les gestes pour le manipuler</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowInstructions(false)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

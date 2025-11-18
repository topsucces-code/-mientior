'use client'

import { useCallback } from 'react'

export function useScreenReaderAnnounce() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (typeof window === 'undefined') return

    // Create live region element
    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status')
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    liveRegion.textContent = message

    // Append to body
    document.body.appendChild(liveRegion)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion)
    }, 1000)
  }, [])

  return { announce }
}

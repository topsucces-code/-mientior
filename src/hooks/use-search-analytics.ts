'use client'

import { useCallback } from 'react'

export function useSearchAnalytics() {
  const trackSearchClick = useCallback(async (params: {
    query: string
    productId: string
    position: number
    searchLogId?: string
  }) => {
    try {
      // Send click event to backend
      await fetch('/api/search/analytics/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      
      // Also track in client-side analytics (GA4, PostHog)
      if (typeof window !== 'undefined') {
        // Google Analytics 4
        if (window.gtag) {
          window.gtag('event', 'search_result_click', {
            search_term: params.query,
            item_id: params.productId,
            position: params.position,
          })
        }
        
        // PostHog
        if (window.posthog) {
          window.posthog.capture('search_result_click', {
            query: params.query,
            product_id: params.productId,
            position: params.position,
          })
        }
      }
    } catch (error) {
      console.error('Failed to track search click:', error)
      // Don't throw - tracking failures shouldn't break UX
    }
  }, [])
  
  return { trackSearchClick }
}

// Global type declarations for analytics tools
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void
    posthog?: {
      capture: (eventName: string, params: Record<string, unknown>) => void
    }
  }
}

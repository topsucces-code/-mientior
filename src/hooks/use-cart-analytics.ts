'use client'

import { useCallback } from 'react'
import type { CartItem } from '@/types'
import { getCurrencyCode } from '@/lib/currency'

// Type definitions for global analytics objects
declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params: Record<string, unknown>) => void
    fbq?: (command: string, eventName: string, params: Record<string, unknown>) => void
    posthog?: {
      capture: (eventName: string, params: Record<string, unknown>) => void
    }
  }
}

// Analytics event tracking for cart actions
export function useCartAnalytics() {
  // Get current currency code
  const currency = getCurrencyCode()

  // Format price from cents to dollars for analytics
  const formatPrice = useCallback((cents: number) => (cents / 100).toFixed(2), [])

  // Format item for analytics
  const formatItem = useCallback((item: CartItem) => ({
    item_id: item.productId,
    item_name: item.productName,
    item_variant: item.variant?.sku || undefined,
    price: formatPrice(item.price),
    quantity: item.quantity
  }), [formatPrice])

  const trackAddToCart = useCallback((item: CartItem) => {
    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'add_to_cart', {
          currency,
          value: formatPrice(item.price * item.quantity),
          items: [formatItem(item)]
        })
      }

      // Facebook Pixel
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'AddToCart', {
          content_ids: [item.productId],
          content_name: item.productName,
          content_type: 'product',
          value: formatPrice(item.price * item.quantity),
          currency
        })
      }

      // PostHog
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('add_to_cart', {
          product_id: item.productId,
          product_name: item.productName,
          price: formatPrice(item.price),
          quantity: item.quantity
        })
      }
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }, [currency, formatPrice, formatItem])

  const trackRemoveFromCart = useCallback((item: CartItem) => {
    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'remove_from_cart', {
          currency,
          value: formatPrice(item.price * item.quantity),
          items: [formatItem(item)]
        })
      }

      // PostHog
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('remove_from_cart', {
          product_id: item.productId,
          product_name: item.productName
        })
      }
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }, [currency, formatPrice, formatItem])

  const trackViewCart = useCallback((items: CartItem[], total: number) => {
    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'view_cart', {
          currency,
          value: formatPrice(total),
          items: items.map(formatItem)
        })
      }

      // PostHog
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('view_cart', {
          cart_total: formatPrice(total),
          item_count: items.length
        })
      }
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }, [currency, formatPrice, formatItem])

  const trackBeginCheckout = useCallback((items: CartItem[], total: number, coupon?: string) => {
    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'begin_checkout', {
          currency,
          value: formatPrice(total),
          coupon: coupon || undefined,
          items: items.map(formatItem)
        })
      }

      // Facebook Pixel
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_ids: items.map(item => item.productId),
          contents: items.map(item => ({
            id: item.productId,
            quantity: item.quantity
          })),
          value: formatPrice(total),
          currency
        })
      }

      // PostHog
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('begin_checkout', {
          cart_total: formatPrice(total),
          item_count: items.length,
          coupon: coupon || undefined
        })
      }
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }, [currency, formatPrice, formatItem])

  const trackCouponApplied = useCallback((code: string, discount: number) => {
    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'coupon_applied', {
          coupon: code,
          discount: formatPrice(discount)
        })
      }

      // PostHog
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture('coupon_applied', {
          coupon_code: code,
          discount_amount: formatPrice(discount)
        })
      }
    } catch (error) {
      console.error('Analytics tracking error:', error)
    }
  }, [formatPrice])

  return {
    trackAddToCart,
    trackRemoveFromCart,
    trackViewCart,
    trackBeginCheckout,
    trackCouponApplied
  }
}

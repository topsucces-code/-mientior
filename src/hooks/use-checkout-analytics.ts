"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  trackCheckoutStarted,
  trackCheckoutStepCompleted,
  trackShippingInfoEntered,
  trackPaymentInfoEntered,
  trackCheckoutError,
  trackCouponApplied,
  trackRelayPointSelected,
} from "@/lib/analytics";
import type { CartItem, CheckoutStep } from "@/types";

// Extend Window interface to include gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      eventName: string,
      params?: Record<string, unknown>
    ) => void
  }
}

interface UseCheckoutAnalyticsOptions {
  step: CheckoutStep;
  items: CartItem[];
  total: number;
}

export function useCheckoutAnalytics({
  step,
  items,
  total,
}: UseCheckoutAnalyticsOptions) {
  const checkoutStartTime = useRef<number>(Date.now())
  const stepStartTime = useRef<number>(Date.now())
  const hasTrackedStart = useRef<boolean>(false)
  const abandonmentTracked = useRef<boolean>(false)

  // Track checkout started (only once when component mounts)
  useEffect(() => {
    if (step === "shipping" && !hasTrackedStart.current) {
      trackCheckoutStarted(items, total);
      checkoutStartTime.current = Date.now()
      hasTrackedStart.current = true
    }
  }, [step, items, total])

  // Track step changes with time spent
  useEffect(() => {
    const stepNumber = step === "shipping" ? 1 : step === "payment" ? 2 : 3;
    const stepName =
      step === "shipping"
        ? "Livraison"
        : step === "payment"
          ? "Paiement"
          : "Confirmation";

    // Calculate time spent on previous step
    const timeSpent = Math.round((Date.now() - stepStartTime.current) / 1000)
    
    trackCheckoutStepCompleted(stepNumber, stepName);

    // Track with additional metadata
    if (typeof window !== 'undefined' && window.gtag) {
      const gtag = window.gtag!;
      gtag('event', 'checkout_progress', {
        checkout_step: stepNumber,
        step_name: stepName,
        time_spent: timeSpent,
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name || item.productName,
          quantity: item.quantity,
        })),
        value: total,
        currency: 'EUR',
      })
    }

    // Reset step timer
    stepStartTime.current = Date.now()
  }, [step, items, total])

  // Track abandonment on page unload
  useEffect(() => {
    const handleBeforeUnload = (_e: BeforeUnloadEvent) => {
      // Only track abandonment if not on review/confirmation page and haven't tracked yet
      if (step !== 'review' && !abandonmentTracked.current) {
        const timeSpent = Math.round((Date.now() - checkoutStartTime.current) / 1000)
        
        // Use sendBeacon for reliable tracking on page unload
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          const data = JSON.stringify({
            event: 'checkout_abandoned',
            step: step,
            items: items.map(item => ({
              id: item.id,
              name: item.name || item.productName,
              quantity: item.quantity,
            })),
            total: total,
            timeSpent: timeSpent,
            timestamp: Date.now(),
          })
          
          navigator.sendBeacon('/api/analytics/track', data)
        }

        // Also track with gtag if available
        if (typeof window !== 'undefined' && window.gtag) {
          const gtag = window.gtag!;
          gtag('event', 'abandon_checkout', {
            checkout_step: step === 'shipping' ? 1 : 2,
            step_name: step,
            time_spent: timeSpent,
            items_count: items.length,
            value: total,
            currency: 'EUR',
          })
        }
        
        abandonmentTracked.current = true
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [step, items, total])

  // Track shipping method selected
  const trackShippingMethod = useCallback((method: string) => {
    trackShippingInfoEntered(method);

    if (typeof window !== 'undefined' && window.gtag) {
      const gtag = window.gtag!;
      gtag('event', 'add_shipping_info', {
        shipping_tier: method,
        value: total,
        currency: 'EUR',
      })
    }
  }, [total])

  // Track payment method selected
  const trackPaymentMethod = useCallback((method: string) => {
    trackPaymentInfoEntered(method);

    if (typeof window !== 'undefined' && window.gtag) {
      const gtag = window.gtag!;
      gtag('event', 'add_payment_info', {
        payment_type: method,
        value: total,
        currency: 'EUR',
      })
    }
  }, [total])

  // Track errors with categories
  const trackError = useCallback((error: string, category?: string) => {
    const stepName =
      step === "shipping"
        ? "Livraison"
        : step === "payment"
          ? "Paiement"
          : "Confirmation";
    
    trackCheckoutError(stepName, error);

    // Categorize errors
    const errorCategory = category || categorizeError(error)

    if (typeof window !== 'undefined' && window.gtag) {
      const gtag = window.gtag!;
      gtag('event', 'exception', {
        description: error,
        fatal: errorCategory === 'critical',
        checkout_step: stepName,
        error_category: errorCategory,
      })
    }
  }, [step])

  // Track coupon application
  const trackCoupon = useCallback(
    (couponCode: string, discountAmount: number) => {
      trackCouponApplied(couponCode, discountAmount);

      if (typeof window !== 'undefined' && window.gtag) {
        const gtag = window.gtag!;
        gtag('event', 'promotion_applied', {
          promotion_id: couponCode,
          promotion_name: couponCode,
          discount_amount: discountAmount,
          currency: 'EUR',
        })
      }
    },
    []
  )

  // Track relay point selection
  const trackRelayPoint = useCallback((relayPointId: string) => {
    trackRelayPointSelected(relayPointId);

    if (typeof window !== 'undefined' && window.gtag) {
      const gtag = window.gtag!;
      gtag('event', 'select_relay_point', {
        relay_point_id: relayPointId,
      })
    }
  }, [])

  // Track conversion (call this on successful checkout)
  const trackConversion = useCallback((orderId: string, revenue: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      const gtag = window.gtag!;
      gtag('event', 'purchase', {
        transaction_id: orderId,
        value: revenue,
        currency: 'EUR',
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name || item.productName,
          quantity: item.quantity,
          price: item.price,
        })),
      })
    }

    // Mark abandonment as resolved
    abandonmentTracked.current = true
  }, [items])

  return {
    trackShippingMethod,
    trackPaymentMethod,
    trackError,
    trackCoupon,
    trackRelayPoint,
    trackConversion,
  }
}

// Helper function to categorize errors
function categorizeError(error: string): string {
  const errorLower = error.toLowerCase()
  
  if (errorLower.includes('payment') || errorLower.includes('card') || errorLower.includes('paiement')) {
    return 'payment_error'
  }
  
  if (errorLower.includes('network') || errorLower.includes('timeout') || errorLower.includes('réseau')) {
    return 'network_error'
  }
  
  if (errorLower.includes('invalid') || errorLower.includes('required') || errorLower.includes('validation')) {
    return 'validation_error'
  }
  
  if (errorLower.includes('stock') || errorLower.includes('inventory') || errorLower.includes('disponible')) {
    return 'inventory_error'
  }
  
  return 'general_error'
}

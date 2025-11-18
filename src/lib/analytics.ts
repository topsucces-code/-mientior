import type { CartItem, Order } from "@/types";

/**
 * Analytics tracking module for checkout funnel
 * Integrates with Google Analytics 4, Facebook Pixel, and other platforms
 */

// Types
interface AnalyticsItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_category?: string;
  item_brand?: string;
}

interface GTMEvent {
  event: string;
  ecommerce?: unknown;
  [key: string]: unknown;
}

// Helper to check if we're in development mode
const isDev = process.env.NODE_ENV === "development";

// Helper to push events to GTM/GA4
function pushToDataLayer(event: GTMEvent): void {
  if (typeof window === "undefined") return;

  if (isDev) {
    console.log("[Analytics] Event:", event);
  }

  // Google Tag Manager / GA4
  if (typeof window.gtag !== "undefined") {
    window.gtag("event", event.event, event.ecommerce || {});
  }

  // Data Layer (for GTM)
  if (typeof window.dataLayer !== "undefined") {
    window.dataLayer.push(event);
  }
}

// Helper to push events to Facebook Pixel
function pushToFacebookPixel(eventName: string, data?: unknown): void {
  if (typeof window === "undefined") return;

  if (isDev) {
    console.log("[Facebook Pixel] Event:", eventName, data);
  }

  if (typeof window.fbq !== "undefined") {
    window.fbq("track", eventName, data);
  }
}

// Convert CartItem to AnalyticsItem
function convertCartItemToAnalyticsItem(item: CartItem): AnalyticsItem {
  return {
    item_id: item.id,
    item_name: item.name || item.productName || '',
    price: item.price,
    quantity: item.quantity,
    item_category: item.category,
    item_brand: item.brand,
  };
}

/**
 * Track when user starts checkout process
 */
export function trackCheckoutStarted(
  items: CartItem[],
  total: number
): void {
  const analyticsItems = items.map(convertCartItemToAnalyticsItem);

  // GA4
  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency: "EUR",
      value: total,
      items: analyticsItems,
    },
  });

  // Facebook Pixel
  pushToFacebookPixel("InitiateCheckout", {
    content_ids: items.map((item) => item.id),
    content_type: "product",
    value: total,
    currency: "EUR",
    num_items: items.reduce((acc, item) => acc + item.quantity, 0),
  });
}

/**
 * Track completion of a checkout step
 */
export function trackCheckoutStepCompleted(
  step: number,
  stepName: string,
  additionalData?: Record<string, unknown>
): void {
  pushToDataLayer({
    event: "checkout_progress",
    checkout_step: step,
    checkout_step_name: stepName,
    ...additionalData,
  });
}

/**
 * Track when user enters shipping information
 */
export function trackShippingInfoEntered(shippingMethod: string): void {
  pushToDataLayer({
    event: "add_shipping_info",
    shipping_tier: shippingMethod,
  });

  trackCheckoutStepCompleted(1, "shipping", { shipping_method: shippingMethod });
}

/**
 * Track when user enters payment information
 */
export function trackPaymentInfoEntered(paymentMethod: string): void {
  pushToDataLayer({
    event: "add_payment_info",
    payment_type: paymentMethod,
  });

  // Facebook Pixel
  pushToFacebookPixel("AddPaymentInfo");

  trackCheckoutStepCompleted(2, "payment", { payment_method: paymentMethod });
}

/**
 * Track successful purchase
 */
export function trackPurchase(order: Order): void {
  const analyticsItems = order.items.map((item) => ({
    item_id: item.productId,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));

  // GA4
  pushToDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: order.id,
      value: order.total,
      tax: order.taxTotal || 0,
      shipping: order.shippingTotal || 0,
      currency: "EUR",
      coupon: order.couponCode,
      items: analyticsItems,
    },
  });

  // Facebook Pixel
  pushToFacebookPixel("Purchase", {
    content_ids: order.items.map((item) => item.productId),
    content_type: "product",
    value: order.total,
    currency: "EUR",
    num_items: order.items.reduce((acc, item) => acc + item.quantity, 0),
  });
}

/**
 * Track checkout errors
 */
export function trackCheckoutError(step: string, error: string): void {
  pushToDataLayer({
    event: "checkout_error",
    error_step: step,
    error_message: error,
  });

  if (isDev) {
    console.error(`[Checkout Error] ${step}:`, error);
  }
}

/**
 * Track when user applies a coupon code
 */
export function trackCouponApplied(
  couponCode: string,
  discountAmount: number
): void {
  pushToDataLayer({
    event: "coupon_applied",
    coupon_code: couponCode,
    discount_amount: discountAmount,
  });
}

/**
 * Track when user selects a relay point
 */
export function trackRelayPointSelected(relayPointId: string): void {
  pushToDataLayer({
    event: "relay_point_selected",
    relay_point_id: relayPointId,
  });
}

// Type declarations for window objects
declare global {
  interface Window {
    gtag?: (
      type: string,
      event: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer?: GTMEvent[];
    fbq?: (type: string, event: string, params?: Record<string, unknown>) => void;
  }
}

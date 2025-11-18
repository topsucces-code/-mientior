/**
 * Checkout Components Barrel Export
 *
 * This file provides a centralized export for all checkout-related components.
 * Import components from this file for cleaner imports.
 *
 * @example
 * import { CheckoutHeader, ProgressStepper, TrustBadges } from '@/components/checkout'
 */

export { CheckoutHeader } from "./checkout-header";
export { ProgressStepper } from "./progress-stepper";
export { TrustBadges } from "./trust-badges";
export { OrderSummarySidebar } from "./order-summary-sidebar";
export { OrderConfirmation } from "./order-confirmation";
export { RelayPointModal } from "./relay-point-modal";
export { ExpressCheckout } from "./express-checkout";
export { MobileStickyBar } from "./mobile-sticky-bar";

// Re-export the original forms (these will be enhanced but maintain backward compatibility)
// Note: These are the existing components that will be modified
export type { CheckoutStep } from "./progress-stepper";

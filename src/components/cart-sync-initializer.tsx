'use client'

/**
 * CartSyncInitializer
 * Initializes automatic cart synchronization with the server
 * Should be placed in the app layout to enable sync on authentication changes
 */

import { useCartSync } from '@/hooks/use-cart-sync'

export function CartSyncInitializer() {
  // Initialize the cart sync hook
  // This handles:
  // - Initial sync on login (merge local + server with conflict resolution)
  // - Auto-sync on cart changes (debounced)
  // - Cleanup on logout
  useCartSync()

  // This component doesn't render anything
  return null
}

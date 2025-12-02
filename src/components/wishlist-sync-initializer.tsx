'use client'

/**
 * WishlistSyncInitializer
 * Initializes automatic wishlist synchronization with the server
 * Should be placed in the app layout to enable sync on authentication changes
 */

import { useWishlistSync } from '@/hooks/use-wishlist-sync'

export function WishlistSyncInitializer() {
  // Initialize the wishlist sync hook
  // This handles:
  // - Initial sync on login (merge local + server)
  // - Auto-sync on wishlist changes (debounced)
  // - Cleanup on logout
  useWishlistSync()

  // This component doesn't render anything
  return null
}

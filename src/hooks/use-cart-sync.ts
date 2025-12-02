/**
 * Hook for automatic cart synchronization with server
 * Handles bidirectional sync on login and debounced sync on cart changes
 */

import { useEffect, useRef } from 'react'
import { useSession } from '@/lib/auth-client'
import { useCartStore } from '@/stores/cart.store'
import { useDebounce } from '@/hooks/use-debounce'
import { useToast } from '@/hooks/use-toast'
import type { ConflictReport } from '@/lib/cart-conflict-resolver'

// Helper function to show conflict notifications
function showConflictNotifications(
  conflicts: ConflictReport[],
  toast: ReturnType<typeof useToast>['toast']
) {
  // Group conflicts by type
  const deletedProducts = conflicts.filter(c => c.type === 'PRODUCT_DELETED')
  const stockIssues = conflicts.filter(c => c.type === 'STOCK_INSUFFICIENT')
  const priceChanges = conflicts.filter(c => c.type === 'PRICE_CHANGED')

  if (deletedProducts.length > 0) {
    toast({
      title: 'Produits indisponibles',
      description: `${deletedProducts.length} produit(s) ne sont plus disponibles et ont été retirés.`,
      variant: 'destructive'
    })
  }

  if (stockIssues.length > 0) {
    toast({
      title: 'Stock limité',
      description: `Le stock de ${stockIssues.length} produit(s) a été ajusté.`,
    })
  }

  if (priceChanges.length > 0) {
    toast({
      title: 'Prix mis à jour',
      description: `Le prix de ${priceChanges.length} produit(s) a changé.`,
    })
  }
}

export function useCartSync() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const hasInitialized = useRef(false)
  const previousUserId = useRef<string | null>(null)

  const {
    items,
    savedForLater,
    appliedCoupon,
    isSyncing,
    lastSyncedAt,
    syncToServer,
    loadFromServer,
    mergeWithServer
  } = useCartStore()

  // Debounce cart changes with 2000ms delay
  const debouncedItems = useDebounce(items, 2000)
  const debouncedSavedForLater = useDebounce(savedForLater, 2000)
  const debouncedCoupon = useDebounce(appliedCoupon, 2000)

  // Handle authentication changes (login/logout)
  useEffect(() => {
    const userId = session?.user?.id

    // User just logged in
    if (userId && userId !== previousUserId.current && !hasInitialized.current) {
      hasInitialized.current = true
      previousUserId.current = userId

      // Perform initial sync on login
      const performInitialSync = async () => {
        try {
          // Load server cart using store method
          await loadFromServer()
          
          // Retrieve updated state from store
          const { items: updatedItems, savedForLater: updatedSaved, appliedCoupon: updatedCoupon } = useCartStore.getState()
          
          // Build server cart data structure from store state
          // Note: loadFromServer already set the store with server data
          const serverCart = {
             items: updatedItems,
             savedForLater: updatedSaved,
             appliedCoupon: updatedCoupon
          }

          // Resolve conflicts for both local (pre-login) and server items
          // Note: effectively we are merging local items into the loaded server items
          const allItems = [...items, ...serverCart.items]

          if (allItems.length > 0) {
            const conflictResponse = await fetch('/api/user/cart/resolve-conflicts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: allItems })
            })

            if (conflictResponse.ok) {
              const { data: conflictResult } = await conflictResponse.json()

              // Update server cart with resolved items
              serverCart.items = conflictResult.resolvedItems

              // Show conflicts to user if any
              if (conflictResult.conflicts && conflictResult.conflicts.length > 0) {
                showConflictNotifications(conflictResult.conflicts, toast)
              }
            }
          }

          // Merge server cart with local cart
          mergeWithServer(serverCart)

          // Sync merged cart back to server
          await syncToServer()

          toast({
            title: 'Panier synchronisé',
            description: 'Votre panier a été synchronisé avec succès.',
          })
        } catch (error) {
          console.error('Initial cart sync error:', error)
          toast({
            title: 'Erreur de synchronisation',
            description: 'Impossible de synchroniser votre panier.',
            variant: 'destructive'
          })
        }
      }

      performInitialSync()
    }

    // User logged out
    if (!userId && previousUserId.current) {
      hasInitialized.current = false
      previousUserId.current = null
    }
  }, [session?.user?.id, items, loadFromServer, mergeWithServer, syncToServer, toast])

  // Auto-sync on cart changes (debounced)
  useEffect(() => {
    // Only sync if user is authenticated and not currently syncing
    if (!session?.user?.id || isSyncing || !hasInitialized.current) {
      return
    }

    // Don't sync on initial mount
    if (!lastSyncedAt && items.length === 0 && savedForLater.length === 0) {
      return
    }

    const performSync = async () => {
      try {
        await syncToServer()
      } catch (error) {
        console.error('Auto-sync error:', error)
        // Silent fail for auto-sync - don't show toast to avoid annoying user
      }
    }

    performSync()
  }, [debouncedItems, debouncedSavedForLater, debouncedCoupon, isSyncing, lastSyncedAt, items.length, savedForLater.length, session?.user?.id, syncToServer])

  // Manual sync function
  const syncNow = async () => {
    if (!session?.user?.id) {
      toast({
        title: 'Non connecté',
        description: 'Vous devez être connecté pour synchroniser.',
        variant: 'destructive'
      })
      return
    }

    try {
      await syncToServer()
      toast({
        title: 'Synchronisation réussie',
        description: 'Votre panier a été synchronisé.',
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de synchroniser votre panier.',
        variant: 'destructive'
      })
    }
  }

  return {
    isSyncing,
    lastSyncedAt,
    syncNow
  }
}

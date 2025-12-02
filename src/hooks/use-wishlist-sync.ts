/**
 * Hook for automatic wishlist synchronization with server
 * Handles bidirectional sync on login and debounced sync on wishlist changes
 */

import { useEffect, useRef } from 'react'
import { useSession } from '@/lib/auth-client'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useDebounce } from '@/hooks/use-debounce'
import { useToast } from '@/hooks/use-toast'

export function useWishlistSync() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const hasInitialized = useRef(false)
  const previousUserId = useRef<string | null>(null)

  const {
    items,
    isSyncing,
    lastSyncedAt,
    syncToServer
  } = useWishlistStore()

  // Debounce wishlist changes with 2000ms delay
  const debouncedItems = useDebounce(items, 2000)

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
          // Sync local wishlist to server with merge=true
          // This replaces the load -> merge -> sync cycle
          await syncToServer({ merge: true })

          if (items.length > 0) {
            toast({
              title: 'Liste de souhaits synchronisée',
              description: 'Votre liste de souhaits a été synchronisée avec succès.',
            })
          }
        } catch (error) {
          console.error('Initial wishlist sync error:', error)
          toast({
            title: 'Erreur de synchronisation',
            description: 'Impossible de synchroniser votre liste de souhaits.',
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
  }, [session?.user?.id, items, syncToServer, toast])

  // Auto-sync on wishlist changes (debounced)
  useEffect(() => {
    // Only sync if user is authenticated and not currently syncing
    if (!session?.user?.id || isSyncing || !hasInitialized.current) {
      return
    }

    // Don't sync on initial mount with empty wishlist
    if (!lastSyncedAt && items.length === 0) {
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
  }, [debouncedItems, isSyncing, lastSyncedAt, items.length, session?.user?.id, syncToServer])

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
        description: 'Votre liste de souhaits a été synchronisée.',
      })
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de synchroniser votre liste de souhaits.',
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

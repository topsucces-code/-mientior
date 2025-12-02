import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WishlistItem = {
  productId: string
  slug?: string
  name?: string
  price?: number
  image?: string
  addedAt: string
}

type WishlistStore = {
  items: WishlistItem[]
  isSyncing: boolean
  lastSyncedAt: Date | null
  addItem: (item: WishlistItem) => void
  removeItem: (productId: string) => void
  clearWishlist: () => void
  isInWishlist: (productId: string) => boolean
  syncToServer: (options?: { merge?: boolean }) => Promise<void>
  loadFromServer: () => Promise<void>
  mergeWithServer: (serverProductIds: string[]) => void
  setIsSyncing: (value: boolean) => void
  setLastSyncedAt: (date: Date) => void
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      isSyncing: false,
      lastSyncedAt: null,

      addItem: (item) => {
        const exists = get().items.find((i) => i.productId === item.productId)
        if (exists) return
        set({ items: [...get().items, { ...item, addedAt: new Date().toISOString() }] })
      },

      removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),

      clearWishlist: () => set({ items: [] }),

      isInWishlist: (productId) => !!get().items.find((i) => i.productId === productId),

      // Sync methods
      syncToServer: async (options: { merge?: boolean } = {}) => {
        try {
          set({ isSyncing: true })

          const productIds = get().items.map(item => item.productId)
          const merge = options.merge !== undefined ? options.merge : false

          const response = await fetch('/api/user/wishlist/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productIds, merge })
          })

          if (!response.ok) {
            throw new Error('Failed to sync wishlist')
          }
          
          // If we asked to merge, the server returns the merged list
          if (merge) {
             const { data } = await response.json()
             // Update local items with merged list
             const mergedItems = data.map((productId: string) => {
                const existing = get().items.find(i => i.productId === productId)
                return existing || { productId, addedAt: new Date().toISOString() }
             })
             set({ items: mergedItems })
          }

          set({ lastSyncedAt: new Date(), isSyncing: false })
        } catch (error) {
          console.error('Wishlist sync error:', error)
          set({ isSyncing: false })
          throw error
        }
      },

      loadFromServer: async () => {
        try {
          set({ isSyncing: true })

          const response = await fetch('/api/user/wishlist/sync')

          if (!response.ok) {
            throw new Error('Failed to load wishlist')
          }

          const { data } = await response.json()

          // Convert productIds to WishlistItems
          const items: WishlistItem[] = data.map((productId: string) => ({
            productId,
            addedAt: new Date().toISOString()
          }))

          set({ items, isSyncing: false })
        } catch (error) {
          console.error('Wishlist load error:', error)
          set({ isSyncing: false })
          throw error
        }
      },

      mergeWithServer: (serverProductIds) => {
        const localItems = get().items
        const localProductIds = new Set(localItems.map(item => item.productId))

        // Create map for existing items (to preserve full data)
        const itemsMap = new Map(localItems.map(item => [item.productId, item]))

        // Add server productIds that don't exist locally
        serverProductIds.forEach(productId => {
          if (!localProductIds.has(productId)) {
            itemsMap.set(productId, {
              productId,
              addedAt: new Date().toISOString()
            })
          }
        })

        set({ items: Array.from(itemsMap.values()) })
      },

      setIsSyncing: (value) => set({ isSyncing: value }),

      setLastSyncedAt: (date) => set({ lastSyncedAt: date })
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({
        items: state.items
      })
    }
  )
)

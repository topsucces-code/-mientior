import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type WishlistItem = {
  productId: string
  name?: string
  price?: number
  image?: string
  addedAt: string
}

type WishlistStore = {
  items: WishlistItem[]
  addItem: (item: WishlistItem) => void
  removeItem: (productId: string) => void
  clearWishlist: () => void
  isInWishlist: (productId: string) => boolean
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const exists = get().items.find((i) => i.productId === item.productId)
        if (exists) return
        set({ items: [...get().items, { ...item, addedAt: new Date().toISOString() }] })
      },
      removeItem: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      clearWishlist: () => set({ items: [] }),
      isInWishlist: (productId) => !!get().items.find((i) => i.productId === productId)
    }),
    { name: 'wishlist-storage' }
  )
)

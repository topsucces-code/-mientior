import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  variant?: Record<string, unknown>
}

type CartStore = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items.slice()
        const idx = items.findIndex((i) => i.id === item.id && JSON.stringify(i.variant) === JSON.stringify(item.variant))
        if (idx > -1) {
          items[idx]!.quantity += item.quantity
        } else {
          items.push(item)
        }
        set({ items })
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQuantity: (id, quantity) => {
        const items = get().items.map((i) => (i.id === id ? { ...i, quantity } : i))
        set({ items })
      },
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      getTotalPrice: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0)
    }),
    { name: 'cart-storage' }
  )
)

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, SavedForLaterItem, CouponCode } from '@/types'

type CartStore = {
  items: CartItem[]
  savedForLater: SavedForLaterItem[]
  appliedCoupon?: CouponCode
  freeShippingThreshold: number

  // Cart actions
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void

  // Save for later actions
  saveForLater: (id: string) => void
  moveToCart: (id: string) => void
  removeSavedItem: (id: string) => void

  // Coupon actions
  applyCoupon: (coupon: CouponCode) => void
  removeCoupon: () => void

  // Getters
  getTotalItems: () => number
  getSubtotal: () => number
  getDiscount: () => number
  getShipping: () => number
  getTax: () => number
  getTotal: () => number
  getFreeShippingProgress: () => { percentage: number; remaining: number; unlocked: boolean }
  getTotalPrice: () => number // Deprecated, use getTotal()
}

const TAX_RATE = 0.20 // 20% TVA as per spec

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      savedForLater: [],
      appliedCoupon: undefined,
      freeShippingThreshold: 5000, // $50.00 in cents

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

      clearCart: () => set({ items: [], appliedCoupon: undefined }),

      saveForLater: (id) => {
        const item = get().items.find((i) => i.id === id)
        if (!item) return

        const savedItem: SavedForLaterItem = {
          ...item,
          savedAt: new Date()
        }

        set({
          items: get().items.filter((i) => i.id !== id),
          savedForLater: [...get().savedForLater, savedItem]
        })
      },

      moveToCart: (id) => {
        const savedItem = get().savedForLater.find((i) => i.id === id)
        if (!savedItem) return

        // Remove savedAt property when moving back to cart by only copying CartItem fields
        const cartItem: CartItem = {
          id: savedItem.id,
          productId: savedItem.productId,
          productName: savedItem.productName,
          productSlug: savedItem.productSlug,
          productImage: savedItem.productImage,
          price: savedItem.price,
          quantity: savedItem.quantity,
          variant: savedItem.variant,
          stock: savedItem.stock,
          inStock: savedItem.inStock,
        }

        const items = get().items.slice()
        const idx = items.findIndex((i) => i.id === cartItem.id && JSON.stringify(i.variant) === JSON.stringify(cartItem.variant))
        if (idx > -1) {
          items[idx]!.quantity += cartItem.quantity
        } else {
          items.push(cartItem)
        }

        set({
          items,
          savedForLater: get().savedForLater.filter((i) => i.id !== id)
        })
      },

      removeSavedItem: (id) => {
        set({ savedForLater: get().savedForLater.filter((i) => i.id !== id) })
      },

      applyCoupon: (coupon) => {
        set({ appliedCoupon: coupon })
      },

      removeCoupon: () => {
        set({ appliedCoupon: undefined })
      },

      getTotalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),

      getSubtotal: () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),

      getDiscount: () => {
        const { appliedCoupon } = get()
        if (!appliedCoupon) return 0

        // Only apply discount if scope is 'cart' (not 'shipping')
        if (appliedCoupon.scope !== 'cart') return 0

        const subtotal = get().getSubtotal()

        let discount = 0
        if (appliedCoupon.type === 'percentage') {
          discount = Math.round((subtotal * appliedCoupon.discount) / 100)
        } else {
          // Fixed discount in cents
          discount = appliedCoupon.discount
        }

        // Clamp discount to subtotal to prevent negative taxable amount
        return Math.min(discount, subtotal)
      },

      getShipping: () => {
        const { appliedCoupon, freeShippingThreshold } = get()
        const subtotal = get().getSubtotal()

        // Free shipping if threshold met
        if (subtotal >= freeShippingThreshold) return 0

        // Calculate base shipping (flat rate of $5.99 / 599 cents)
        let shipping = 599

        // Apply shipping-scoped coupons
        if (appliedCoupon && appliedCoupon.scope === 'shipping') {
          if (appliedCoupon.type === 'percentage') {
            const discount = Math.round((shipping * appliedCoupon.discount) / 100)
            shipping = Math.max(0, shipping - discount)
          } else {
            // Fixed discount on shipping
            shipping = Math.max(0, shipping - appliedCoupon.discount)
          }
        }

        return shipping
      },

      getTax: () => {
        const subtotal = get().getSubtotal()
        const discount = get().getDiscount()
        // Clamp taxable amount to zero to prevent negative tax
        const taxableAmount = Math.max(0, subtotal - discount)

        return Math.round(taxableAmount * TAX_RATE)
      },

      getTotal: () => {
        const subtotal = get().getSubtotal()
        const discount = get().getDiscount()
        const shipping = get().getShipping()
        const tax = get().getTax()

        return subtotal - discount + shipping + tax
      },

      getFreeShippingProgress: () => {
        const subtotal = get().getSubtotal()
        const { freeShippingThreshold } = get()

        const percentage = Math.min((subtotal / freeShippingThreshold) * 100, 100)
        const remaining = Math.max(freeShippingThreshold - subtotal, 0)
        const unlocked = subtotal >= freeShippingThreshold

        return { percentage, remaining, unlocked }
      },

      getTotalPrice: () => get().getTotal() // Backward compatibility
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        savedForLater: state.savedForLater,
        appliedCoupon: state.appliedCoupon
      })
    }
  )
)

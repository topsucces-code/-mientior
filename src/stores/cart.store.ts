/**
 * Cart Store - Client-side shopping cart state management
 *
 * IMPORTANT NOTES ON CALCULATIONS:
 *
 * This store provides local/client-side calculations for cart totals, shipping, and taxes.
 * These are ESTIMATES for display purposes in the cart and for unauthenticated users.
 *
 * For FINAL/DEFINITIVE calculations used during checkout:
 * - Use `/api/checkout/calculate-totals` endpoint (calculates based on delivery address)
 * - Tax rates vary by zone (West/East/Central/Southern/North Africa)
 * - Shipping costs are dynamic based on zone, weight, and selected shipping method
 * - Free shipping threshold is applied only within the same African region
 *
 * The methods `getShipping()`, `getTax()`, and `getTotal()` in this store are:
 * - Using fixed/default values (20% VAT, standard shipping rates)
 * - Not zone-aware (don't account for customer's delivery address)
 * - Useful for cart display and quick estimates
 * - Should NOT be used for order creation or payment processing
 *
 * During checkout, the `checkout-client.tsx` component fetches real-time calculations
 * from the server which take into account the actual delivery address and selected options.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, SavedForLaterItem, CouponCode, AppliedPromotion, PromotionType } from '@/types'
import { toast } from 'sonner'

// Lazy load PostHog to avoid SSR issues
type PostHogInstance = typeof import('posthog-js').default
let posthog: PostHogInstance | null = null
if (typeof window !== 'undefined') {
  import('posthog-js').then((module) => {
    posthog = module.default
  })
}

interface CartData {
  items: CartItem[]
  savedForLater: SavedForLaterItem[]
  appliedCoupon?: CouponCode
}

type PendingOperation = 'add' | 'update' | 'remove' | 'save' | 'restore'

interface CartError {
  type: 'network' | 'stock' | 'validation' | 'unknown'
  message: string
  operation: PendingOperation
  itemId?: string
  retryCount?: number
}

type CartStore = {
  items: CartItem[]
  savedForLater: SavedForLaterItem[]
  appliedCoupon?: CouponCode
  freeShippingThreshold: number
  isSyncing: boolean
  lastSyncedAt: Date | null
  pendingOperations: Map<string, PendingOperation>
  errors: CartError[]

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

  // Sync actions
  syncToServer: () => Promise<void>
  loadFromServer: () => Promise<void>
  mergeWithServer: (serverCart: CartData) => void
  setIsSyncing: (value: boolean) => void
  setLastSyncedAt: (date: Date) => void

  // Error handling
  addError: (error: CartError) => void
  clearErrors: () => void

  // Getters
  getTotalItems: () => number
  getSubtotal: () => number
  getDiscount: () => number
  getShipping: () => number
  getTax: () => number
  getTotal: () => number
  getFreeShippingProgress: () => { percentage: number; remaining: number; unlocked: boolean }
  getTotalPrice: () => number // Deprecated, use getTotal()

  // Promotion helpers
  getItemPromotions: (itemId: string) => AppliedPromotion[]
  getAllPromotions: () => AppliedPromotion[]
  getTotalSavings: () => number
}

const TAX_RATE = 0.18 // ~18% average VAT for African regions
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 1000

// Helper function to retry async operations with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxAttempts: number = MAX_RETRY_ATTEMPTS,
  delayMs: number = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error

      // Don't retry on validation errors (4xx except 429) or auth errors (401)
      if (error instanceof Response && error.status >= 400 && error.status < 500 && error.status !== 429) {
        throw error
      }

      if (attempt < maxAttempts - 1) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      savedForLater: [],
      appliedCoupon: undefined,
      freeShippingThreshold: 5000, // $50.00 in cents
      isSyncing: false,
      lastSyncedAt: null,
      pendingOperations: new Map(),
      errors: [],

      addItem: (item) => {
        const itemKey = `${item.id}-${JSON.stringify(item.variant || {})}`
        const items = get().items.slice()
        const idx = items.findIndex((i) => i.id === item.id && JSON.stringify(i.variant) === JSON.stringify(item.variant))

        // Determine available stock (prioritize inStock boolean, fallback to stock number)
        const availableStock = item.stock ?? 0
        const existingQuantity = idx > -1 ? items[idx]!.quantity : 0
        let requestedQuantity = item.quantity

        // Stock validation: clamp to available stock
        if (existingQuantity + requestedQuantity > availableStock) {
          const maxAllowed = Math.max(0, availableStock - existingQuantity)
          requestedQuantity = maxAllowed

          // Record stock limitation error
          get().addError({
            type: 'stock',
            message: `Stock limité à ${availableStock} unités pour cet article.`,
            operation: 'add',
            itemId: item.id,
          })

          // Optionally notify user
          if (requestedQuantity === 0) {
            toast.warning("Stock insuffisant", {
              description: "Cet article n'a plus de stock disponible.",
            })
          } else {
            toast.warning("Quantité ajustée", {
              description: `Seulement ${requestedQuantity} unité(s) disponible(s).`,
            })
          }
        }

        // Only proceed if we can add at least 1 item
        if (requestedQuantity <= 0 && existingQuantity >= availableStock) {
          return
        }

        // Optimistic update
        if (idx > -1) {
          items[idx]!.quantity += requestedQuantity
        } else {
          items.push({ ...item, quantity: requestedQuantity })
        }

        // Mark as pending
        const pendingOps = new Map(get().pendingOperations)
        pendingOps.set(itemKey, 'add')

        set({ items, pendingOperations: pendingOps })

        // Track analytics event
        if (posthog) {
          posthog.capture('cart_item_added', {
            productId: item.productId,
            productName: item.productName,
            variantId: item.variant?.sku,
            variantSize: item.variant?.size,
            variantColor: item.variant?.color,
            quantity: item.quantity,
            price: item.price,
            currency: 'USD',
          })
        }

        // Async sync with retry
        retryWithBackoff(() => get().syncToServer())
          .then(() => {
            const pending = new Map(get().pendingOperations)
            pending.delete(itemKey)
            set({ pendingOperations: pending })
          })
          .catch((error) => {
            // Rollback on failure
            const rolledBackItems = get().items.filter(i => {
              const key = `${i.id}-${JSON.stringify(i.variant || {})}`
              return key !== itemKey
            })

            set({ items: rolledBackItems })

            const pending = new Map(get().pendingOperations)
            pending.delete(itemKey)
            set({ pendingOperations: pending })

            get().addError({
              type: error instanceof Response && error.status >= 500 ? 'network' : 'unknown',
              message: "Échec de l'ajout au panier. Veuillez réessayer.",
              operation: 'add',
              itemId: item.id,
            })

            // Track failed cart sync
            if (posthog) {
              posthog.capture('cart_sync_failed', {
                operation: 'add',
                productId: item.productId,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            }

            toast.error("Échec de l'ajout au panier", {
              description: "Une erreur s'est produite. Veuillez réessayer.",
            })
          })
      },

      removeItem: (id) => {
        const item = get().items.find((i) => i.id === id)
        if (!item) return

        const itemKey = `${item.id}-${JSON.stringify(item.variant || {})}`
        const previousItems = get().items.slice()

        // Optimistic update
        set({ items: get().items.filter((i) => i.id !== id) })

        // Mark as pending
        const pendingOps = new Map(get().pendingOperations)
        pendingOps.set(itemKey, 'remove')
        set({ pendingOperations: pendingOps })

        // Track analytics event
        if (posthog) {
          posthog.capture('cart_item_removed', {
            productId: item.productId,
            productName: item.productName,
            reason: 'user',
          })
        }

        // Async sync with retry
        retryWithBackoff(() => get().syncToServer())
          .then(() => {
            const pending = new Map(get().pendingOperations)
            pending.delete(itemKey)
            set({ pendingOperations: pending })
          })
          .catch((error) => {
            // Rollback on failure
            set({ items: previousItems })

            const pending = new Map(get().pendingOperations)
            pending.delete(itemKey)
            set({ pendingOperations: pending })

            get().addError({
              type: error instanceof Response && error.status >= 500 ? 'network' : 'unknown',
              message: "Échec de la suppression du panier. Veuillez réessayer.",
              operation: 'remove',
              itemId: item.id,
            })

            // Track failed cart sync
            if (posthog) {
              posthog.capture('cart_sync_failed', {
                operation: 'remove',
                productId: item.productId,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            }

            toast.error("Échec de la suppression du panier", {
              description: "Une erreur s'est produite. Veuillez réessayer.",
            })
          })
      },

      updateQuantity: (id, quantity) => {
        const item = get().items.find((i) => i.id === id)
        if (!item) return

        const itemKey = `${item.id}-${JSON.stringify(item.variant || {})}`
        const previousItems = get().items.slice()

        // Stock validation: clamp to available stock
        const availableStock = item.stock ?? 0
        let finalQuantity = quantity

        if (quantity > availableStock) {
          finalQuantity = availableStock

          // Record stock limitation error
          get().addError({
            type: 'stock',
            message: `Stock limité à ${availableStock} unités pour cet article.`,
            operation: 'update',
            itemId: item.id,
          })

          // Notify user
          toast.warning("Quantité ajustée", {
            description: `Stock limité à ${availableStock} unité(s).`,
          })
        }

        // Optimistic update
        const items = get().items.map((i) => (i.id === id ? { ...i, quantity: finalQuantity } : i))
        set({ items })

        // Mark as pending
        const pendingOps = new Map(get().pendingOperations)
        pendingOps.set(itemKey, 'update')
        set({ pendingOperations: pendingOps })

        // Async sync with retry
        retryWithBackoff(() => get().syncToServer())
          .then(() => {
            const pending = new Map(get().pendingOperations)
            pending.delete(itemKey)
            set({ pendingOperations: pending })
          })
          .catch((error) => {
            // Rollback on failure
            set({ items: previousItems })

            const pending = new Map(get().pendingOperations)
            pending.delete(itemKey)
            set({ pendingOperations: pending })

            get().addError({
              type: error instanceof Response && error.status >= 500 ? 'network' : 'unknown',
              message: "Échec de la mise à jour de la quantité. Veuillez réessayer.",
              operation: 'update',
              itemId: item.id,
            })

            // Track failed cart sync
            if (posthog) {
              posthog.capture('cart_sync_failed', {
                operation: 'update',
                productId: item.productId,
                error: error instanceof Error ? error.message : 'Unknown error',
              })
            }

            toast.error("Échec de la mise à jour de la quantité", {
              description: "La modification a été annulée. Veuillez réessayer.",
            })
          })
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

        // Track analytics event
        if (posthog) {
          posthog.capture('cart_coupon_applied', {
            code: coupon.code,
            discount: coupon.discount,
            type: coupon.type,
            scope: coupon.scope,
          })
        }
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

      /**
       * LOCAL ESTIMATE - Get shipping cost for cart display
       * NOTE: This is a simplified calculation using fixed rates.
       * For checkout, use `/api/checkout/calculate-totals` which calculates
       * dynamic shipping based on delivery zone, weight, and shipping method.
       */
      getShipping: () => {
        const { appliedCoupon, freeShippingThreshold } = get()
        const subtotal = get().getSubtotal()

        // Free shipping if threshold met (simplified - only applies to same region in reality)
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

      /**
       * LOCAL ESTIMATE - Get tax for cart display
       * NOTE: This uses a fixed 18% VAT rate (African average).
       * For checkout, use `/api/checkout/calculate-totals` which calculates
       * zone-specific tax rates (West/East/Central/Southern/North Africa).
       */
      getTax: () => {
        const subtotal = get().getSubtotal()
        const discount = get().getDiscount()
        // Clamp taxable amount to zero to prevent negative tax
        const taxableAmount = Math.max(0, subtotal - discount)

        return Math.round(taxableAmount * TAX_RATE)
      },

      /**
       * LOCAL ESTIMATE - Get total for cart display
       * NOTE: This is a simplified calculation for display purposes.
       * For checkout, use `/api/checkout/calculate-totals` which provides
       * accurate totals based on delivery address and selected shipping method.
       */
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

      getTotalPrice: () => get().getTotal(), // Backward compatibility

      getItemPromotions: (itemId) => {
        const item = get().items.find(i => i.id === itemId)
        if (!item) return []
        
        const promotions: AppliedPromotion[] = []
        
        // Promotion automatique si compareAtPrice existe
        if (item.compareAtPrice && item.compareAtPrice > item.price) {
          const discount = (item.compareAtPrice - item.price) * item.quantity
          const percentage = Math.round((1 - item.price / item.compareAtPrice) * 100)
          promotions.push({
            id: `auto-${itemId}`,
            type: 'automatic',
            label: 'Promotion',
            discount,
            discountType: 'percentage',
            scope: 'item',
            appliedTo: [itemId],
            description: `-${percentage}% de réduction`
          })
        }
        
        // Badge promotionnel
        if (item.badge) {
          // Only consider promotion-related badges
          const badgeType = item.badge === 'NEW' ? 'new' : (item.badge === 'SALE' ? 'sale' : undefined)
          
          if (badgeType) {
            promotions.push({
              id: `badge-${itemId}`,
              type: badgeType as PromotionType,
              label: item.badge,
              discount: 0,
              discountType: 'fixed',
              scope: 'item',
              appliedTo: [itemId]
            })
          }
        }
        
        return promotions
      },

      getAllPromotions: () => {
        const { items, appliedCoupon } = get()
        const promotions: AppliedPromotion[] = []

        // Promotions par item
        items.forEach(item => {
          const itemPromos = get().getItemPromotions(item.id)
          promotions.push(...itemPromos)
        })

        // Coupon manuel
        if (appliedCoupon) {
          let discount = 0
          let description = ''

          if (appliedCoupon.scope === 'cart') {
            // Cart-scoped coupon: use getDiscount() which handles cart discount logic
            discount = get().getDiscount()
            description = appliedCoupon.type === 'percentage'
              ? `-${appliedCoupon.discount}% sur votre commande`
              : `-${appliedCoupon.discount / 100}€ sur votre commande`
          } else if (appliedCoupon.scope === 'shipping') {
            // Shipping-scoped coupon: calculate shipping savings
            // Base shipping (without coupon)
            const baseShipping = 599 // Flat rate from getShipping()
            const actualShipping = get().getShipping()
            discount = Math.max(0, baseShipping - actualShipping)
            description = appliedCoupon.type === 'percentage'
              ? `-${appliedCoupon.discount}% sur la livraison`
              : `-${appliedCoupon.discount / 100}€ sur la livraison`
          }

          promotions.push({
            id: appliedCoupon.code,
            type: 'manual',
            code: appliedCoupon.code,
            label: appliedCoupon.scope === 'shipping' ? 'Code promo livraison' : 'Code promo',
            description,
            discount,
            discountType: appliedCoupon.type,
            scope: appliedCoupon.scope,
            expiresAt: appliedCoupon.expiresAt ? new Date(appliedCoupon.expiresAt) : undefined,
            conditions: appliedCoupon.minPurchase ? `Minimum d'achat: ${appliedCoupon.minPurchase / 100}€` : undefined
          })
        }

        return promotions
      },

      getTotalSavings: () => {
        const promotions = get().getAllPromotions()
        return promotions.reduce((total, promo) => total + promo.discount, 0)
      },

      // Sync methods
      syncToServer: async () => {
        try {
          set({ isSyncing: true })

          const { items, savedForLater, appliedCoupon } = get()

          const response = await fetch('/api/user/cart/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, savedForLater, appliedCoupon })
          })

          // If user is not authenticated (401), silently skip sync
          // Cart data is persisted locally and will sync when user logs in
          if (response.status === 401) {
            set({ isSyncing: false })
            return // Silent return - don't throw, don't log error
          }

          if (!response.ok) {
            throw new Error('Failed to sync cart')
          }

          set({ lastSyncedAt: new Date(), isSyncing: false })
        } catch (error) {
          console.error('Cart sync error:', error)
          set({ isSyncing: false })
          throw error
        }
      },

      loadFromServer: async () => {
        try {
          set({ isSyncing: true })

          const response = await fetch('/api/user/cart/load')

          if (!response.ok) {
            throw new Error('Failed to load cart')
          }

          const { data } = await response.json()

          set({
            items: data.items || [],
            savedForLater: data.savedForLater || [],
            appliedCoupon: data.appliedCoupon,
            isSyncing: false
          })
        } catch (error) {
          console.error('Cart load error:', error)
          set({ isSyncing: false })
          throw error
        }
      },

      mergeWithServer: (serverCart) => {
        const localItems = get().items
        const localSavedForLater = get().savedForLater
        const localCoupon = get().appliedCoupon

        // Merge items: For each item, use max quantity if exists in both
        const mergedItemsMap = new Map<string, CartItem>()

        // Add all local items to map
        localItems.forEach(item => {
          const key = `${item.id}-${JSON.stringify(item.variant || {})}`
          mergedItemsMap.set(key, item)
        })

        // Merge with server items
        serverCart.items.forEach(serverItem => {
          const key = `${serverItem.id}-${JSON.stringify(serverItem.variant || {})}`
          const existingItem = mergedItemsMap.get(key)

          if (existingItem) {
            // Take max quantity
            mergedItemsMap.set(key, {
              ...existingItem,
              quantity: Math.max(existingItem.quantity, serverItem.quantity)
            })
          } else {
            // Add new item from server
            mergedItemsMap.set(key, serverItem)
          }
        })

        // Merge savedForLater similarly
        const mergedSavedMap = new Map<string, SavedForLaterItem>()

        localSavedForLater.forEach(item => {
          const key = `${item.id}-${JSON.stringify(item.variant || {})}`
          mergedSavedMap.set(key, item)
        })

        serverCart.savedForLater.forEach(serverItem => {
          const key = `${serverItem.id}-${JSON.stringify(serverItem.variant || {})}`
          const existingItem = mergedSavedMap.get(key)

          if (existingItem) {
            // Take max quantity
            mergedSavedMap.set(key, {
              ...existingItem,
              quantity: Math.max(existingItem.quantity, serverItem.quantity)
            })
          } else {
            mergedSavedMap.set(key, serverItem)
          }
        })

        // For appliedCoupon, prefer server if exists and not expired
        let finalCoupon = localCoupon
        if (serverCart.appliedCoupon) {
          const isExpired = serverCart.appliedCoupon.expiresAt && new Date(serverCart.appliedCoupon.expiresAt) < new Date()
          if (!isExpired) {
            finalCoupon = serverCart.appliedCoupon
          }
        }

        set({
          items: Array.from(mergedItemsMap.values()),
          savedForLater: Array.from(mergedSavedMap.values()),
          appliedCoupon: finalCoupon
        })
      },

      setIsSyncing: (value) => set({ isSyncing: value }),

      setLastSyncedAt: (date) => set({ lastSyncedAt: date }),

      addError: (error) => {
        const errors = [...get().errors, error]
        set({ errors })
      },

      clearErrors: () => set({ errors: [] })
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

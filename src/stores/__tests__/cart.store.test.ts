import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useCartStore } from '../cart.store'
import type { CartItem, CouponCode } from '@/types'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}))

describe('Cart Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useCartStore.setState({
      items: [],
      savedForLater: [],
      appliedCoupon: undefined,
      pendingOperations: new Map(),
      errors: [],
      isSyncing: false,
      lastSyncedAt: null,
    })
  })

  describe('addItem', () => {
    it('should add a new item to cart', () => {
      const { addItem, items } = useCartStore.getState()

      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test Product',
        productSlug: 'test-product',
        productImage: '/test.jpg',
        price: 5000,
        quantity: 1,
        stock: 10,
      }

      addItem(item)

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0]?.productName).toBe('Test Product')
      expect(state.items[0]?.quantity).toBe(1)
    })

    it('should increment quantity if item already exists (same variant)', () => {
      const { addItem } = useCartStore.getState()

      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test Product',
        productSlug: 'test-product',
        productImage: '/test.jpg',
        price: 5000,
        quantity: 1,
        stock: 10,
      }

      addItem(item)
      addItem(item)

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0]?.quantity).toBe(2)
    })

    it('should add separate items for different variants', () => {
      const { addItem } = useCartStore.getState()

      const item1: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test Product',
        productSlug: 'test-product',
        productImage: '/test.jpg',
        price: 5000,
        quantity: 1,
        stock: 10,
        variant: { size: 'M', color: 'Blue', sku: 'SKU-M-BLUE' },
      }

      const item2: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test Product',
        productSlug: 'test-product',
        productImage: '/test.jpg',
        price: 5000,
        quantity: 1,
        stock: 10,
        variant: { size: 'L', color: 'Red', sku: 'SKU-L-RED' },
      }

      addItem(item1)
      addItem(item2)

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(2)
    })
  })

  describe('removeItem', () => {
    it('should remove an item from cart', () => {
      const { addItem, removeItem } = useCartStore.getState()

      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test Product',
        productSlug: 'test-product',
        productImage: '/test.jpg',
        price: 5000,
        quantity: 1,
        stock: 10,
      }

      addItem(item)
      expect(useCartStore.getState().items).toHaveLength(1)

      removeItem('prod-1')
      expect(useCartStore.getState().items).toHaveLength(0)
    })
  })

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const { addItem, updateQuantity } = useCartStore.getState()

      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test Product',
        productSlug: 'test-product',
        productImage: '/test.jpg',
        price: 5000,
        quantity: 1,
        stock: 10,
      }

      addItem(item)
      updateQuantity('prod-1', 5)

      const state = useCartStore.getState()
      expect(state.items[0]?.quantity).toBe(5)
    })
  })

  describe('clearCart', () => {
    it('should clear all items and applied coupon', () => {
      const { addItem, applyCoupon, clearCart } = useCartStore.getState()

      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test Product',
        productSlug: 'test-product',
        productImage: '/test.jpg',
        price: 5000,
        quantity: 1,
        stock: 10,
      }

      const coupon: CouponCode = {
        code: 'SAVE10',
        discount: 10,
        type: 'percentage',
        scope: 'cart',
      }

      addItem(item)
      applyCoupon(coupon)

      expect(useCartStore.getState().items).toHaveLength(1)
      expect(useCartStore.getState().appliedCoupon).toBeDefined()

      clearCart()

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
      expect(state.appliedCoupon).toBeUndefined()
    })
  })

  describe('saveForLater', () => {
    it('should move item to savedForLater', () => {
      const { addItem, saveForLater } = useCartStore.getState()

      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test Product',
        productSlug: 'test-product',
        productImage: '/test.jpg',
        price: 5000,
        quantity: 1,
        stock: 10,
      }

      addItem(item)
      saveForLater('prod-1')

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(0)
      expect(state.savedForLater).toHaveLength(1)
      expect(state.savedForLater[0]?.productName).toBe('Test Product')
      expect(state.savedForLater[0]?.savedAt).toBeInstanceOf(Date)
    })
  })

  describe('moveToCart', () => {
    it('should move item from savedForLater back to cart', () => {
      const { addItem, saveForLater, moveToCart } = useCartStore.getState()

      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test Product',
        productSlug: 'test-product',
        productImage: '/test.jpg',
        price: 5000,
        quantity: 1,
        stock: 10,
      }

      addItem(item)
      saveForLater('prod-1')
      moveToCart('prod-1')

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.savedForLater).toHaveLength(0)
      expect(state.items[0]?.productName).toBe('Test Product')
    })

    it('should merge quantities when moving to cart if item exists', () => {
      const { addItem, saveForLater, moveToCart } = useCartStore.getState()

      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test Product',
        productSlug: 'test-product',
        productImage: '/test.jpg',
        price: 5000,
        quantity: 2,
        stock: 10,
      }

      addItem(item)
      saveForLater('prod-1')

      // Add same item to cart again
      addItem({ ...item, quantity: 3 })

      // Move from savedForLater
      moveToCart('prod-1')

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(1)
      expect(state.items[0]?.quantity).toBe(5) // 2 + 3
      expect(state.savedForLater).toHaveLength(0)
    })
  })

  describe('applyCoupon', () => {
    it('should apply a coupon', () => {
      const { applyCoupon } = useCartStore.getState()

      const coupon: CouponCode = {
        code: 'SAVE10',
        discount: 10,
        type: 'percentage',
        scope: 'cart',
      }

      applyCoupon(coupon)

      const state = useCartStore.getState()
      expect(state.appliedCoupon).toBeDefined()
      expect(state.appliedCoupon?.code).toBe('SAVE10')
    })
  })

  describe('Calculations', () => {
    beforeEach(() => {
      // Add some items for calculation tests
      const { addItem } = useCartStore.getState()

      addItem({
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Product 1',
        productSlug: 'product-1',
        productImage: '/test.jpg',
        price: 1000, // $10.00
        quantity: 2,
        stock: 10,
      })

      addItem({
        id: 'prod-2',
        productId: 'prod-2',
        productName: 'Product 2',
        productSlug: 'product-2',
        productImage: '/test.jpg',
        price: 2000, // $20.00
        quantity: 1,
        stock: 10,
      })
    })

    describe('getSubtotal', () => {
      it('should calculate subtotal correctly', () => {
        const { getSubtotal } = useCartStore.getState()

        const subtotal = getSubtotal()
        expect(subtotal).toBe(4000) // (1000 * 2) + (2000 * 1) = 4000 cents / $40.00
      })
    })

    describe('getDiscount', () => {
      it('should calculate percentage discount correctly', () => {
        const { applyCoupon, getDiscount } = useCartStore.getState()

        const coupon: CouponCode = {
          code: 'SAVE10',
          discount: 10,
          type: 'percentage',
          scope: 'cart',
        }

        applyCoupon(coupon)

        const discount = getDiscount()
        expect(discount).toBe(400) // 10% of 4000 = 400 cents / $4.00
      })

      it('should calculate fixed discount correctly', () => {
        const { applyCoupon, getDiscount } = useCartStore.getState()

        const coupon: CouponCode = {
          code: 'SAVE5',
          discount: 500, // $5.00 in cents
          type: 'fixed',
          scope: 'cart',
        }

        applyCoupon(coupon)

        const discount = getDiscount()
        expect(discount).toBe(500)
      })

      it('should return 0 for shipping-scoped coupons', () => {
        const { applyCoupon, getDiscount } = useCartStore.getState()

        const coupon: CouponCode = {
          code: 'FREESHIP',
          discount: 100,
          type: 'percentage',
          scope: 'shipping',
        }

        applyCoupon(coupon)

        const discount = getDiscount()
        expect(discount).toBe(0) // Shipping coupons don't affect cart discount
      })

      it('should clamp discount to subtotal', () => {
        const { applyCoupon, getDiscount } = useCartStore.getState()

        const coupon: CouponCode = {
          code: 'HUGE',
          discount: 10000, // $100.00 - more than subtotal
          type: 'fixed',
          scope: 'cart',
        }

        applyCoupon(coupon)

        const discount = getDiscount()
        expect(discount).toBe(4000) // Clamped to subtotal
      })
    })

    describe('getShipping', () => {
      it('should return free shipping if threshold met', () => {
        const { getShipping } = useCartStore.getState()

        // Add more items to exceed threshold
        useCartStore.getState().addItem({
          id: 'prod-3',
          productId: 'prod-3',
          productName: 'Product 3',
          productSlug: 'product-3',
          productImage: '/test.jpg',
          price: 1500, // Total will be 5500, exceeding 5000 threshold
          quantity: 1,
          stock: 10,
        })

        const shipping = getShipping()
        expect(shipping).toBe(0)
      })

      it('should return base shipping if threshold not met', () => {
        const { getShipping } = useCartStore.getState()

        const shipping = getShipping()
        expect(shipping).toBe(599) // $5.99
      })

      it('should apply shipping-scoped percentage coupon', () => {
        const { applyCoupon, getShipping } = useCartStore.getState()

        const coupon: CouponCode = {
          code: 'SHIP50',
          discount: 50,
          type: 'percentage',
          scope: 'shipping',
        }

        applyCoupon(coupon)

        const shipping = getShipping()
        expect(shipping).toBe(300) // 599 * 0.5 = 299.5 rounded to 300
      })

      it('should apply shipping-scoped fixed coupon', () => {
        const { applyCoupon, getShipping } = useCartStore.getState()

        const coupon: CouponCode = {
          code: 'SHIP3',
          discount: 300,
          type: 'fixed',
          scope: 'shipping',
        }

        applyCoupon(coupon)

        const shipping = getShipping()
        expect(shipping).toBe(299) // 599 - 300 = 299
      })
    })

    describe('getTax', () => {
      it('should calculate tax correctly (18% VAT)', () => {
        const { getTax } = useCartStore.getState()

        const tax = getTax()
        expect(tax).toBe(720) // 4000 * 0.18 = 720 cents
      })

      it('should calculate tax after discount', () => {
        const { applyCoupon, getTax } = useCartStore.getState()

        const coupon: CouponCode = {
          code: 'SAVE10',
          discount: 10,
          type: 'percentage',
          scope: 'cart',
        }

        applyCoupon(coupon)

        const tax = getTax()
        // Subtotal: 4000
        // Discount: 400
        // Taxable: 3600
        // Tax: 3600 * 0.18 = 648
        expect(tax).toBe(648)
      })
    })

    describe('getTotal', () => {
      it('should calculate total correctly', () => {
        const { getTotal } = useCartStore.getState()

        const total = getTotal()
        // Subtotal: 4000
        // Discount: 0
        // Shipping: 599
        // Tax: 720
        // Total: 4000 + 599 + 720 = 5319
        expect(total).toBe(5319)
      })

      it('should calculate total with discount', () => {
        const { applyCoupon, getTotal } = useCartStore.getState()

        const coupon: CouponCode = {
          code: 'SAVE10',
          discount: 10,
          type: 'percentage',
          scope: 'cart',
        }

        applyCoupon(coupon)

        const total = getTotal()
        // Subtotal: 4000
        // Discount: 400
        // Shipping: 599
        // Tax: 648 (on 3600)
        // Total: 4000 - 400 + 599 + 648 = 4847
        expect(total).toBe(4847)
      })
    })

    describe('getFreeShippingProgress', () => {
      it('should calculate free shipping progress', () => {
        const { getFreeShippingProgress } = useCartStore.getState()

        const progress = getFreeShippingProgress()
        // Subtotal: 4000
        // Threshold: 5000
        // Percentage: (4000 / 5000) * 100 = 80%
        // Remaining: 1000
        expect(progress.percentage).toBe(80)
        expect(progress.remaining).toBe(1000)
        expect(progress.unlocked).toBe(false)
      })

      it('should return 100% when threshold met', () => {
        const { addItem, getFreeShippingProgress } = useCartStore.getState()

        addItem({
          id: 'prod-3',
          productId: 'prod-3',
          productName: 'Product 3',
          productSlug: 'product-3',
          productImage: '/test.jpg',
          price: 1500,
          quantity: 1,
          stock: 10,
        })

        const progress = getFreeShippingProgress()
        expect(progress.percentage).toBe(100)
        expect(progress.remaining).toBe(0)
        expect(progress.unlocked).toBe(true)
      })
    })
  })

  describe('mergeWithServer', () => {
    it('should merge items and take max quantity', () => {
      const { addItem, mergeWithServer } = useCartStore.getState()

      // Add local item
      addItem({
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Product 1',
        productSlug: 'product-1',
        productImage: '/test.jpg',
        price: 1000,
        quantity: 2,
        stock: 10,
      })

      // Server cart with same item but different quantity
      const serverCart = {
        items: [
          {
            id: 'prod-1',
            productId: 'prod-1',
            productName: 'Product 1',
            productSlug: 'product-1',
            productImage: '/test.jpg',
            price: 1000,
            quantity: 5,
            stock: 10,
          },
          {
            id: 'prod-2',
            productId: 'prod-2',
            productName: 'Product 2',
            productSlug: 'product-2',
            productImage: '/test.jpg',
            price: 2000,
            quantity: 1,
            stock: 10,
          },
        ],
        savedForLater: [],
      }

      mergeWithServer(serverCart)

      const state = useCartStore.getState()
      expect(state.items).toHaveLength(2)

      const prod1 = state.items.find((i) => i.id === 'prod-1')
      expect(prod1?.quantity).toBe(5) // Max of 2 and 5

      const prod2 = state.items.find((i) => i.id === 'prod-2')
      expect(prod2).toBeDefined()
    })
  })
})

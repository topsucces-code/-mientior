import { describe, it, expect } from 'vitest'
import { createCartItem, isCartItemInStock, getMaxQuantity } from '../cart-utils'
import type { Product, ProductVariant, CartItem } from '@/types'

describe('Cart Utils', () => {
  const mockProduct: Product = {
    id: 'prod-1',
    name: 'Test Product',
    slug: 'test-product',
    description: 'Test description',
    price: 5000,
    compareAtPrice: 6000,
    stock: 10,
    images: [{ id: 'img-1', url: '/test.jpg', alt: 'Test', type: 'IMAGE', productId: 'prod-1' }],
    category: { id: 'cat-1', name: 'Category', slug: 'category' },
    status: 'ACTIVE',
    rating: 4.5,
    reviewCount: 10,
    onSale: true,
    featured: false,
    tags: [],
    variants: [],
    seo: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe('createCartItem', () => {
    it('should create CartItem without variant', () => {
      const cartItem = createCartItem({ product: mockProduct })

      expect(cartItem).toMatchObject({
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test Product',
        productSlug: 'test-product',
        productImage: '/test.jpg',
        price: 5000,
        quantity: 1,
        stock: 10,
        inStock: true,
        maxQuantity: 10,
        compareAtPrice: 6000,
      })
      expect(cartItem.variant).toBeUndefined()
    })

    it('should create CartItem with variant (price modifier)', () => {
      const variant: ProductVariant = {
        id: 'var-1',
        productId: 'prod-1',
        sku: 'SKU-M-BLUE',
        size: 'M',
        color: 'Blue',
        priceModifier: 500, // +$5.00
        stock: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const cartItem = createCartItem({ product: mockProduct, variant })

      expect(cartItem.id).toBe('prod-1-var-1')
      expect(cartItem.price).toBe(5500) // 5000 + 500
      expect(cartItem.stock).toBe(5)
      expect(cartItem.variant).toEqual({
        size: 'M',
        color: 'Blue',
        sku: 'SKU-M-BLUE',
      })
    })

    it('should create CartItem with variant (no price modifier)', () => {
      const variant: ProductVariant = {
        id: 'var-2',
        productId: 'prod-1',
        sku: 'SKU-L-RED',
        size: 'L',
        color: 'Red',
        stock: 8,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const cartItem = createCartItem({ product: mockProduct, variant })

      expect(cartItem.price).toBe(5000) // No modifier, use base price
      expect(cartItem.stock).toBe(8)
    })

    it('should set inStock correctly based on stock', () => {
      const productOutOfStock: Product = {
        ...mockProduct,
        stock: 0,
      }

      const cartItem = createCartItem({ product: productOutOfStock })

      expect(cartItem.inStock).toBe(false)
      expect(cartItem.stock).toBe(0)
    })

    it('should use custom quantity', () => {
      const cartItem = createCartItem({ product: mockProduct, quantity: 5 })

      expect(cartItem.quantity).toBe(5)
    })

    it('should handle product without images', () => {
      const productNoImages: Product = {
        ...mockProduct,
        images: [],
      }

      const cartItem = createCartItem({ product: productNoImages })

      expect(cartItem.productImage).toBe('/placeholder-product.jpg')
    })

    it('should handle free shipping based on threshold', () => {
      const productWithShipping: Product = {
        ...mockProduct,
        shippingInfo: {
          freeShippingThreshold: 4000, // $40.00
        },
      }

      const cartItem1 = createCartItem({ product: productWithShipping })
      expect(cartItem1.freeShipping).toBe(true) // 5000 >= 4000

      const productWithShipping2: Product = {
        ...mockProduct,
        price: 3000, // $30.00
        shippingInfo: {
          freeShippingThreshold: 5000,
        },
      }

      const cartItem2 = createCartItem({ product: productWithShipping2 })
      expect(cartItem2.freeShipping).toBe(false) // 3000 < 5000
    })

    it('should include badge from product', () => {
      const productWithBadge: Product = {
        ...mockProduct,
        badge: 'NEW',
      }

      const cartItem = createCartItem({ product: productWithBadge })

      expect(cartItem.badge).toBe('NEW')
    })
  })

  describe('isCartItemInStock', () => {
    it('should return true if inStock is true', () => {
      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test',
        productSlug: 'test',
        productImage: '/test.jpg',
        price: 1000,
        quantity: 1,
        stock: 5,
        inStock: true,
      }

      expect(isCartItemInStock(item)).toBe(true)
    })

    it('should return false if inStock is false', () => {
      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test',
        productSlug: 'test',
        productImage: '/test.jpg',
        price: 1000,
        quantity: 1,
        stock: 0,
        inStock: false,
      }

      expect(isCartItemInStock(item)).toBe(false)
    })

    it('should fallback to stock > 0 if inStock is undefined (legacy)', () => {
      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test',
        productSlug: 'test',
        productImage: '/test.jpg',
        price: 1000,
        quantity: 1,
        stock: 5,
      }

      expect(isCartItemInStock(item)).toBe(true)
    })

    it('should fallback to stock === 0 if inStock is undefined (legacy, out of stock)', () => {
      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test',
        productSlug: 'test',
        productImage: '/test.jpg',
        price: 1000,
        quantity: 1,
        stock: 0,
      }

      expect(isCartItemInStock(item)).toBe(false)
    })
  })

  describe('getMaxQuantity', () => {
    it('should return maxQuantity if defined', () => {
      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test',
        productSlug: 'test',
        productImage: '/test.jpg',
        price: 1000,
        quantity: 1,
        stock: 10,
        maxQuantity: 5,
      }

      expect(getMaxQuantity(item)).toBe(5)
    })

    it('should fallback to stock if maxQuantity is undefined', () => {
      const item: CartItem = {
        id: 'prod-1',
        productId: 'prod-1',
        productName: 'Test',
        productSlug: 'test',
        productImage: '/test.jpg',
        price: 1000,
        quantity: 1,
        stock: 10,
      }

      expect(getMaxQuantity(item)).toBe(10)
    })
  })
})

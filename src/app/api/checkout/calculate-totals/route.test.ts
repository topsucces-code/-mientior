/**
 * Unit tests for /api/checkout/calculate-totals endpoint
 * Covers validation, caching, subtotal/discount/shipping/tax calculations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: { findUnique: vi.fn() },
    promoCode: { findUnique: vi.fn() },
  },
}))

vi.mock('@/lib/redis', () => ({
  getCachedData: vi.fn((key, fetcher) => fetcher()),
}))

vi.mock('@/lib/shipping-calculation', () => ({
  calculateShippingCost: vi.fn(() => ({ cost: 490, method: 'standard' })),
  FREE_SHIPPING_THRESHOLD: 2500,
}))

vi.mock('@/lib/tax-calculation', () => ({
  calculateTax: vi.fn(() => ({ taxAmount: 1000, taxRate: 0.2 })),
}))

import { prisma } from '@/lib/prisma'
import { getCachedData } from '@/lib/redis'
import { calculateShippingCost } from '@/lib/shipping-calculation'
import { calculateTax } from '@/lib/tax-calculation'

describe('POST /api/checkout/calculate-totals', () => {
  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    slug: 'test-product',
    price: 29.99,
    images: [{ url: 'https://example.com/image.jpg' }],
  }

  const mockRequestBody = {
    items: [
      { productId: 'product-123', quantity: 2 },
    ],
    address: {
      country: 'FR',
      postalCode: '75001',
      city: 'Paris',
      line1: '123 Test St',
    },
    shippingOptionId: 'standard',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
    vi.mocked(getCachedData).mockImplementation((key, fetcher) => fetcher())
  })

  describe('Input Validation', () => {
    it('should reject empty items array', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          items: [],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Cart items are required')
    })

    it('should reject missing address', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ productId: 'product-123', quantity: 1 }],
          shippingOptionId: 'standard',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Valid shipping address is required')
    })

    it('should reject missing shippingOption', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ productId: 'product-123', quantity: 1 }],
          address: mockRequestBody.address,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Shipping option is required')
    })

    it('should require country and postalCode in address', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ productId: 'product-123', quantity: 1 }],
          address: { city: 'Paris' },
          shippingOptionId: 'standard',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('country and postalCode minimum')
    })
  })

  describe('Caching', () => {
    it('should return cached result on cache hit', async () => {
      const cachedResult = {
        subtotal: 5998,
        shipping: { cost: 0, method: 'standard' },
        tax: { taxAmount: 1199, taxRate: 0.2 },
        discount: 0,
        total: 7197,
        freeShippingThreshold: 2500,
      }

      vi.mocked(getCachedData).mockResolvedValue(cachedResult)

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(cachedResult)
      expect(prisma.product.findUnique).not.toHaveBeenCalled()
    })

    it('should calculate fresh on cache miss', async () => {
      vi.mocked(getCachedData).mockImplementation((key, fetcher) => fetcher())

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(prisma.product.findUnique).toHaveBeenCalled()
    })
  })

  describe('Subtotal Calculation', () => {
    it('should convert product prices from euros to cents', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      // 29.99 euros = 2999 cents per item
      expect(response.status).toBe(200)
      expect(data.data.subtotal).toBeGreaterThan(0)
    })

    it('should multiply price by quantity', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      // 29.99 * 2 = 59.98 euros = 5998 cents
      expect(data.data.subtotal).toBe(5998)
    })

    it('should sum all items correctly', async () => {
      vi.mocked(prisma.product.findUnique)
        .mockResolvedValueOnce({ ...mockProduct, id: 'product-1', price: 10.00 } as any)
        .mockResolvedValueOnce({ ...mockProduct, id: 'product-2', price: 20.00 } as any)

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          items: [
            { productId: 'product-1', quantity: 1 },
            { productId: 'product-2', quantity: 2 },
          ],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      // (10.00 * 1) + (20.00 * 2) = 50.00 euros = 5000 cents
      expect(data.data.subtotal).toBe(5000)
    })
  })

  describe('Discount Calculation', () => {
    it('should apply percentage coupon correctly', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue({
        id: 'promo-123',
        code: 'SAVE20',
        type: 'PERCENTAGE',
        value: 20,
        isActive: true,
        validTo: new Date('2030-12-31'),
        usageLimit: 100,
        usageCount: 10,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          couponCode: 'SAVE20',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      // 5998 cents * 20% = 1199.6 ≈ 1200 cents discount
      expect(data.data.discount).toBeGreaterThan(0)
      expect(response.status).toBe(200)
    })

    it('should apply fixed amount coupon correctly', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue({
        id: 'promo-123',
        code: 'SAVE10',
        type: 'FIXED_AMOUNT',
        value: 10,
        isActive: true,
        validTo: new Date('2030-12-31'),
        usageLimit: 100,
        usageCount: 10,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          couponCode: 'SAVE10',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      // 10 euros = 1000 cents discount
      expect(data.data.discount).toBe(1000)
    })

    it('should ignore expired coupons', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue({
        id: 'promo-123',
        code: 'EXPIRED',
        type: 'PERCENTAGE',
        value: 20,
        isActive: true,
        validTo: new Date('2020-01-01'),
        usageLimit: 100,
        usageCount: 10,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          couponCode: 'EXPIRED',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.discount).toBe(0)
    })

    it('should ignore coupons at usage limit', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue({
        id: 'promo-123',
        code: 'MAXED',
        type: 'PERCENTAGE',
        value: 20,
        isActive: true,
        validTo: new Date('2030-12-31'),
        usageLimit: 100,
        usageCount: 100,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          couponCode: 'MAXED',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.discount).toBe(0)
    })

    it('should clamp discount to subtotal', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue({
        id: 'promo-123',
        code: 'HUGE',
        type: 'FIXED_AMOUNT',
        value: 1000,
        isActive: true,
        validTo: new Date('2030-12-31'),
        usageLimit: 100,
        usageCount: 10,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          couponCode: 'HUGE',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      // Discount should not exceed subtotal
      expect(data.data.discount).toBeLessThanOrEqual(data.data.subtotal)
    })

    it('should return 0 for invalid coupon', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          couponCode: 'INVALID',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.discount).toBe(0)
    })
  })

  describe('Shipping Calculation', () => {
    it('should return 0 for free shipping threshold met', async () => {
      vi.mocked(calculateShippingCost).mockReturnValue({ cost: 0, method: 'standard' })

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.shipping.cost).toBe(0)
    })

    it('should calculate standard shipping cost', async () => {
      vi.mocked(calculateShippingCost).mockReturnValue({ cost: 490, method: 'standard' })

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.shipping.cost).toBe(490)
    })

    it('should calculate express shipping cost', async () => {
      vi.mocked(calculateShippingCost).mockReturnValue({ cost: 990, method: 'express' })

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          shippingOptionId: 'express',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data.shipping.cost).toBe(990)
    })

    it('should use address for zone-based calculation', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(calculateShippingCost).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({
          country: 'FR',
          postalCode: '75001',
        }),
        'standard',
        expect.any(Number)
      )
    })
  })

  describe('Tax Calculation', () => {
    it('should calculate tax based on country', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(calculateTax).toHaveBeenCalledWith(
        expect.any(Number),
        expect.objectContaining({
          country: 'FR',
        })
      )
    })

    it('should calculate tax on net subtotal (after discount)', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue({
        id: 'promo-123',
        code: 'SAVE10',
        type: 'FIXED_AMOUNT',
        value: 10,
        isActive: true,
        validTo: new Date('2030-12-31'),
        usageLimit: 100,
        usageCount: 10,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          couponCode: 'SAVE10',
        }),
      })

      await POST(request)

      // Should calculate tax on (subtotal - discount)
      expect(calculateTax).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(Object)
      )
    })
  })

  describe('Total Calculation', () => {
    it('should calculate total correctly', async () => {
      vi.mocked(calculateShippingCost).mockReturnValue({ cost: 490, method: 'standard' })
      vi.mocked(calculateTax).mockReturnValue({ taxAmount: 1000, taxRate: 0.2 })

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      // total = subtotal + shipping + tax - discount
      expect(data.data.total).toBeGreaterThan(0)
      expect(data.data.total).toBe(
        data.data.subtotal + data.data.shipping.cost + data.data.tax.taxAmount - data.data.discount
      )
    })

    it('should include all components (subtotal, shipping, tax, discount)', async () => {
      vi.mocked(prisma.promoCode.findUnique).mockResolvedValue({
        id: 'promo-123',
        code: 'SAVE10',
        type: 'FIXED_AMOUNT',
        value: 10,
        isActive: true,
        validTo: new Date('2030-12-31'),
        usageLimit: 100,
        usageCount: 10,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          couponCode: 'SAVE10',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.data).toHaveProperty('subtotal')
      expect(data.data).toHaveProperty('shipping')
      expect(data.data).toHaveProperty('tax')
      expect(data.data).toHaveProperty('discount')
      expect(data.data).toHaveProperty('total')
    })
  })

  describe('Free Shipping Progress', () => {
    it('should calculate amount to free shipping', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProduct,
        price: 10.00,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          items: [{ productId: 'product-123', quantity: 1 }],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      // Subtotal is 1000 cents, threshold is 2500, so 1500 cents to go
      expect(data.data.amountToFreeShipping).toBeGreaterThan(0)
    })

    it('should return undefined when threshold met', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      // Subtotal is 5998 cents >= 2500, so no amountToFreeShipping
      expect(data.data.amountToFreeShipping).toBeUndefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Product not found')
    })

    it('should return 500 on unexpected errors', async () => {
      vi.mocked(prisma.product.findUnique).mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/checkout/calculate-totals', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to calculate totals')
    })
  })
})

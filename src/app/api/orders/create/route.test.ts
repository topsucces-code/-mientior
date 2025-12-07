/**
 * Unit tests for /api/orders/create endpoint
 * Covers authentication, validation, payment verification, stock management,
 * price calculations, promo codes, loyalty points, and order creation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: { findUnique: vi.fn() },
    order: { create: vi.fn(), count: vi.fn() },
    user: { update: vi.fn(), findUnique: vi.fn() },
  },
}))

vi.mock('@/lib/auth-server', () => ({
  requireAuth: vi.fn(),
}))

vi.mock('@/lib/paystack', () => ({
  verifyPaystackTransaction: vi.fn(),
}))

vi.mock('@/lib/flutterwave', () => ({
  verifyFlutterwaveTransaction: vi.fn(),
}))

vi.mock('@/lib/stock-lock', () => ({
  acquireMultipleStockLocks: vi.fn(),
  releaseMultipleStockLocks: vi.fn(),
  decrementStockAtomic: vi.fn(),
  isOrderProcessed: vi.fn(),
  markOrderProcessed: vi.fn(),
}))

vi.mock('@/lib/promo-code-validator', () => ({
  validatePromoCode: vi.fn(),
  recordPromoCodeUsage: vi.fn(),
}))

vi.mock('@/lib/loyalty-points', () => ({
  redeemLoyaltyPoints: vi.fn(),
  awardOrderPoints: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendOrderConfirmationEmail: vi.fn(),
}))

vi.mock('@/lib/pusher', () => ({
  triggerNewOrder: vi.fn(),
}))

vi.mock('@/lib/real-time-updates', () => ({
  triggerCustomerLoyaltyUpdate: vi.fn(),
}))

vi.mock('@/lib/checkout-utils', () => ({
  generateOrderNumber: vi.fn(() => 'ORD-2025-12345'),
  calculateEstimatedDelivery: vi.fn(() => new Date('2025-12-15')),
}))

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'
import { verifyPaystackTransaction } from '@/lib/paystack'
import { verifyFlutterwaveTransaction } from '@/lib/flutterwave'
import {
  acquireMultipleStockLocks,
  releaseMultipleStockLocks,
  decrementStockAtomic,
  isOrderProcessed,
  markOrderProcessed,
} from '@/lib/stock-lock'
import { validatePromoCode, recordPromoCodeUsage } from '@/lib/promo-code-validator'
import { redeemLoyaltyPoints, awardOrderPoints } from '@/lib/loyalty-points'

describe('POST /api/orders/create', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      emailVerified: true,
    },
  }

  const mockProduct = {
    id: 'product-123',
    name: 'Test Product',
    price: 29.99,
    stock: 100,
    images: [{ url: 'https://example.com/image.jpg', order: 0 }],
  }

  const mockRequestBody = {
    items: [
      { productId: 'product-123', quantity: 2 },
    ],
    shippingAddress: {
      firstName: 'John',
      lastName: 'Doe',
      line1: '123 Test St',
      city: 'Paris',
      postalCode: '75001',
      country: 'FR',
      phone: '+33612345678',
      email: 'test@example.com',
    },
    shippingOption: 'standard',
    paymentReference: 'pay_ref_12345',
    paymentGateway: 'PAYSTACK' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(requireAuth).mockResolvedValue(mockSession as any)
    vi.mocked(isOrderProcessed).mockResolvedValue(false)
    vi.mocked(verifyPaystackTransaction).mockResolvedValue({ status: 'success' } as any)
    vi.mocked(acquireMultipleStockLocks).mockResolvedValue({ success: true, lockedIds: ['product-123'] })
    vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
    vi.mocked(decrementStockAtomic).mockResolvedValue({ success: true, currentStock: 98 })
    vi.mocked(prisma.order.count).mockResolvedValue(0)
    vi.mocked(prisma.order.create).mockResolvedValue({
      id: 'order-123',
      orderNumber: 'ORD-2025-12345',
      items: [],
    } as any)
  })

  describe('Authentication & Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error('Unauthorized'))

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('Input Validation', () => {
    it('should reject missing required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          items: [],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('should reject empty items array', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          items: [],
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })

    it('should reject missing shipping address', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ productId: 'product-123', quantity: 1 }],
          paymentReference: 'pay_ref_12345',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required fields')
    })
  })

  describe('Idempotency', () => {
    it('should prevent duplicate orders for same payment reference', async () => {
      vi.mocked(isOrderProcessed).mockResolvedValue(true)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Order already created for this payment')
      expect(data.success).toBe(false)
    })
  })

  describe('Payment Verification', () => {
    it('should verify Paystack transaction successfully', async () => {
      vi.mocked(verifyPaystackTransaction).mockResolvedValue({ status: 'success' } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)

      expect(verifyPaystackTransaction).toHaveBeenCalledWith('pay_ref_12345')
      expect(response.status).toBe(200)
    })

    it('should verify Flutterwave transaction successfully', async () => {
      vi.mocked(verifyFlutterwaveTransaction).mockResolvedValue({ status: 'successful' } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          paymentGateway: 'FLUTTERWAVE',
        }),
      })

      const response = await POST(request)

      expect(verifyFlutterwaveTransaction).toHaveBeenCalledWith('pay_ref_12345')
      expect(response.status).toBe(200)
    })

    it('should reject unconfirmed payment', async () => {
      vi.mocked(verifyPaystackTransaction).mockResolvedValue({ status: 'failed' } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Payment not confirmed')
    })

    it('should handle payment gateway errors', async () => {
      vi.mocked(verifyPaystackTransaction).mockRejectedValue(new Error('Gateway error'))

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid payment reference')
    })
  })

  describe('Stock Management', () => {
    it('should acquire locks for all products', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(acquireMultipleStockLocks).toHaveBeenCalledWith(['product-123'])
    })

    it('should return 503 if locks cannot be acquired', async () => {
      vi.mocked(acquireMultipleStockLocks).mockResolvedValue({ success: false, lockedIds: [] })

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toContain('Unable to process order')
    })

    it('should decrement stock atomically', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(decrementStockAtomic).toHaveBeenCalledWith('product-123', 2)
    })

    it('should release locks after successful order', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(releaseMultipleStockLocks).toHaveBeenCalledWith(['product-123'])
    })

    it('should release locks on error', async () => {
      vi.mocked(prisma.product.findUnique).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(releaseMultipleStockLocks).toHaveBeenCalledWith(['product-123'])
    })

    it('should handle insufficient stock', async () => {
      vi.mocked(decrementStockAtomic).mockResolvedValue({
        success: false,
        error: 'Insufficient stock',
        currentStock: 1,
      })

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('Insufficient stock')
    })
  })

  describe('Price Calculations', () => {
    it('should calculate subtotal correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      // 29.99 * 2 = 59.98 euros
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 59.98,
          }),
        })
      )
    })

    it('should apply free shipping for orders >= 25€', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      // Subtotal is 59.98€ >= 25€, so shipping should be 0
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            shippingCost: 0,
          }),
        })
      )
    })

    it('should calculate standard shipping for orders < 25€', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProduct,
        price: 10.00,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          items: [{ productId: 'product-123', quantity: 1 }],
        }),
      })

      await POST(request)

      // Subtotal is 10€ < 25€, so shipping should be 4.90€
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            shippingCost: 4.90,
          }),
        })
      )
    })

    it('should calculate 20% VAT correctly with exact values', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      // (59.98 subtotal + 0 shipping) * 0.2 = 11.996 ≈ 12.00
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tax: 12.00,
          }),
        })
      )
    })

    it('should calculate total correctly with tax and shipping', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      // Subtotal: 59.98, Shipping: 0, Tax: 12.00, Total: 71.98
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            total: 71.98,
          }),
        })
      )
    })

    it('should calculate precise tax for small order with shipping', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProduct,
        price: 10.00,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          items: [{ productId: 'product-123', quantity: 1 }],
        }),
      })

      await POST(request)

      // Subtotal: 10.00, Shipping: 4.90, Base: 14.90, Tax: 2.98, Total: 17.88
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 10.00,
            shippingCost: 4.90,
            tax: 2.98,
            total: 17.88,
          }),
        })
      )
    })

    it('should apply discount before calculating tax', async () => {
      vi.mocked(validatePromoCode).mockResolvedValue({
        valid: true,
        discount: 10.00,
        promoCode: { id: 'promo-123' },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          promoCode: 'SAVE10',
        }),
      })

      await POST(request)

      // Subtotal: 59.98, Discount: 10.00, Shipping: 0
      // Base after discount: 49.98, Tax: 10.00, Total: 59.98
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 59.98,
            discount: 10.00,
            tax: 10.00,
            total: 59.98,
          }),
        })
      )
    })
  })

  describe('Promo Code Validation', () => {
    it('should apply valid CART-scoped promo code', async () => {
      vi.mocked(validatePromoCode).mockResolvedValue({
        valid: true,
        discount: 10.00,
        promoCode: { id: 'promo-123' },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          promoCode: 'SAVE10',
        }),
      })

      await POST(request)

      expect(validatePromoCode).toHaveBeenCalled()
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            promoCodeId: 'promo-123',
            discount: expect.any(Number),
          }),
        })
      )
    })

    it('should reject expired promo code', async () => {
      vi.mocked(validatePromoCode).mockResolvedValue({
        valid: false,
        error: 'Promo code has expired',
        errorCode: 'EXPIRED',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          promoCode: 'EXPIRED10',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Promo code has expired')
    })

    it('should apply SHIPPING-scoped promo code for free shipping', async () => {
      vi.mocked(validatePromoCode).mockResolvedValue({
        valid: true,
        discount: 4.90,
        promoCode: { id: 'promo-freeship', scope: 'SHIPPING' },
      } as any)

      // Use a product that would normally require shipping
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProduct,
        price: 15.00,
      } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          items: [{ productId: 'product-123', quantity: 1 }],
          promoCode: 'FREESHIP',
        }),
      })

      await POST(request)

      expect(validatePromoCode).toHaveBeenCalled()
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            promoCodeId: 'promo-freeship',
            discount: 4.90,
          }),
        })
      )
    })

    it('should apply CATEGORY-scoped promo code only to applicable items', async () => {
      vi.mocked(validatePromoCode).mockResolvedValue({
        valid: true,
        discount: 5.00,
        promoCode: { id: 'promo-cat', scope: 'CATEGORY', categoryIds: ['cat-1'] },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          promoCode: 'CAT10',
        }),
      })

      await POST(request)

      expect(validatePromoCode).toHaveBeenCalled()
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            promoCodeId: 'promo-cat',
          }),
        })
      )
    })

    it('should apply PRODUCT-scoped promo code only to specific products', async () => {
      vi.mocked(validatePromoCode).mockResolvedValue({
        valid: true,
        discount: 3.00,
        promoCode: { id: 'promo-prod', scope: 'PRODUCT', productIds: ['product-123'] },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          promoCode: 'PROD10',
        }),
      })

      await POST(request)

      expect(validatePromoCode).toHaveBeenCalled()
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            promoCodeId: 'promo-prod',
          }),
        })
      )
    })

    it('should reject promo code that is limited to first order when user has previous orders', async () => {
      vi.mocked(prisma.order.count).mockResolvedValue(2) // User has 2 previous orders
      vi.mocked(validatePromoCode).mockResolvedValue({
        valid: false,
        error: 'Promo code is only valid for first-time customers',
        errorCode: 'NOT_FIRST_ORDER',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          promoCode: 'FIRSTORDER',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Promo code is only valid for first-time customers')
    })

    it('should reject single-use promo code that has already been used', async () => {
      vi.mocked(validatePromoCode).mockResolvedValue({
        valid: false,
        error: 'Promo code has already been used',
        errorCode: 'ALREADY_USED',
      } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          promoCode: 'SINGLEUSE',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Promo code has already been used')
    })

    it('should record promo code usage after successful order', async () => {
      vi.mocked(validatePromoCode).mockResolvedValue({
        valid: true,
        discount: 10.00,
        promoCode: { id: 'promo-123' },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          promoCode: 'SAVE10',
        }),
      })

      await POST(request)

      expect(recordPromoCodeUsage).toHaveBeenCalledWith('promo-123', 'user-123', 'order-123')
    })
  })

  describe('Loyalty Points', () => {
    it('should redeem loyalty points successfully', async () => {
      vi.mocked(redeemLoyaltyPoints).mockResolvedValue({
        success: true,
        pointsUsed: 1000,
        discountAmount: 10.00,
      })

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          loyaltyPointsToRedeem: 1000,
        }),
      })

      await POST(request)

      expect(redeemLoyaltyPoints).toHaveBeenCalledWith('user-123', 1000, expect.any(Number))
    })

    it('should reject insufficient loyalty points', async () => {
      vi.mocked(redeemLoyaltyPoints).mockResolvedValue({
        success: false,
        error: 'Insufficient loyalty points',
      })

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify({
          ...mockRequestBody,
          loyaltyPointsToRedeem: 5000,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Insufficient loyalty points')
    })

    it('should award points for order', async () => {
      vi.mocked(awardOrderPoints).mockResolvedValue({
        success: true,
        pointsEarned: 60,
        bonusPoints: 0,
        totalPoints: 60,
      })

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(awardOrderPoints).toHaveBeenCalledWith('user-123', expect.any(Number), true)
    })

    it('should award bonus points for first order', async () => {
      vi.mocked(prisma.order.count).mockResolvedValue(0) // First order
      vi.mocked(awardOrderPoints).mockResolvedValue({
        success: true,
        pointsEarned: 60,
        bonusPoints: 100,
        totalPoints: 160,
      })

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(awardOrderPoints).toHaveBeenCalledWith('user-123', expect.any(Number), true)
    })
  })

  describe('Order Creation', () => {
    it('should create order with all fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderNumber: 'ORD-2025-12345',
            userId: 'user-123',
            status: 'PROCESSING',
            paymentStatus: 'PAID',
            subtotal: expect.any(Number),
            shippingCost: expect.any(Number),
            tax: expect.any(Number),
            total: expect.any(Number),
            shippingAddress: expect.any(Object),
            paymentReference: 'pay_ref_12345',
            paymentGateway: 'PAYSTACK',
          }),
        })
      )
    })

    it('should create nested order items', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: {
              create: expect.arrayContaining([
                expect.objectContaining({
                  productId: 'product-123',
                  quantity: 2,
                  price: expect.any(Number),
                }),
              ]),
            },
          }),
        })
      )
    })

    it('should mark order as processed', async () => {
      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(markOrderProcessed).toHaveBeenCalledWith('pay_ref_12345', 'order-123')
    })
  })

  describe('Side Effects', () => {
    it('should send order confirmation email after successful order', async () => {
      const { sendOrderConfirmationEmail } = await import('@/lib/email')

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(sendOrderConfirmationEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          orderNumber: 'ORD-2025-12345',
        })
      )
    })

    it('should trigger new order event via Pusher', async () => {
      const { triggerNewOrder } = await import('@/lib/pusher')

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(triggerNewOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'order-123',
          orderNumber: 'ORD-2025-12345',
        })
      )
    })

    it('should trigger customer loyalty update event', async () => {
      const { triggerCustomerLoyaltyUpdate } = await import('@/lib/real-time-updates')

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      expect(triggerCustomerLoyaltyUpdate).toHaveBeenCalledWith('user-123', expect.any(Object))
    })

    it('should call all side effects in happy path', async () => {
      const { sendOrderConfirmationEmail } = await import('@/lib/email')
      const { triggerNewOrder } = await import('@/lib/pusher')
      const { triggerCustomerLoyaltyUpdate } = await import('@/lib/real-time-updates')

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      await POST(request)

      // Assert all side effects were called
      expect(sendOrderConfirmationEmail).toHaveBeenCalled()
      expect(triggerNewOrder).toHaveBeenCalled()
      expect(triggerCustomerLoyaltyUpdate).toHaveBeenCalled()
      expect(awardOrderPoints).toHaveBeenCalled()
    })

    it('should continue order creation even if email fails', async () => {
      const { sendOrderConfirmationEmail } = await import('@/lib/email')
      vi.mocked(sendOrderConfirmationEmail).mockRejectedValue(new Error('Email service down'))

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)

      // Order should still be created successfully
      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should handle Prisma errors gracefully', async () => {
      vi.mocked(prisma.order.create).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/orders/create', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create order')
    })
  })
})

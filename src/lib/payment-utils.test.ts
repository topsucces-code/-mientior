/**
 * Unit tests for payment-utils.ts
 * Covers validation, fraud detection, order creation, logging, and payment processing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  validateExpressPaymentRequest,
  checkForFraud,
  createProvisionalExpressOrder,
  logPaymentAttempt,
  validateApplePayMerchantSession,
  processExpressPaymentToken,
} from './payment-utils'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/security', () => ({
  validateCSRFToken: vi.fn(),
  sanitizeInput: vi.fn((input) => input),
  validatePaymentAmount: vi.fn(),
  detectSuspiciousActivity: vi.fn(),
  hashSensitiveData: vi.fn((data) => `hashed_${data}`),
}))

vi.mock('@/middleware/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  paymentRateLimit: {},
}))

vi.mock('@/lib/checkout-utils', () => ({
  computeOrderTotals: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: { findUnique: vi.fn(), create: vi.fn() },
    product: { findUnique: vi.fn() },
  },
}))

import { validateCSRFToken, validatePaymentAmount, detectSuspiciousActivity } from '@/lib/security'
import { checkRateLimit } from '@/middleware/rate-limit'
import { computeOrderTotals } from '@/lib/checkout-utils'
import { prisma } from '@/lib/prisma'

describe('Payment Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true, remaining: 10 })
    vi.mocked(validateCSRFToken).mockReturnValue(true)
    vi.mocked(validatePaymentAmount).mockReturnValue(true)
    vi.mocked(computeOrderTotals).mockResolvedValue({
      subtotal: 5000,
      shippingCost: 490,
      tax: 1000,
      discount: 0,
      total: 6490,
      items: [{ productId: 'product-123', quantity: 2, price: 2500 }],
    } as any)
  })

  describe('validateExpressPaymentRequest', () => {
    const mockRequest = new NextRequest('http://localhost:3000/api/payment/express', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': 'valid-token',
        Cookie: 'csrf_token=stored-token',
      },
    })

    const mockOptions = {
      request: mockRequest,
      items: [{ productId: 'product-123', quantity: 2, price: 2500 }],
      total: 64.90,
      shippingOption: 'standard',
      email: 'test@example.com',
    }

    it('should reject rate limited requests', async () => {
      vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, remaining: 0 })

      const result = await validateExpressPaymentRequest(mockOptions)

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('RATE_LIMIT_EXCEEDED')
    })

    it('should reject invalid CSRF token', async () => {
      vi.mocked(validateCSRFToken).mockReturnValue(false)

      const result = await validateExpressPaymentRequest(mockOptions)

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('INVALID_CSRF')
    })

    it('should sanitize email input', async () => {
      await validateExpressPaymentRequest(mockOptions)

      expect(require('@/lib/security').sanitizeInput).toHaveBeenCalledWith('test@example.com')
    })

    it('should reject empty cart', async () => {
      const result = await validateExpressPaymentRequest({
        ...mockOptions,
        items: [],
      })

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('EMPTY_CART')
    })

    it('should validate server-side totals', async () => {
      await validateExpressPaymentRequest(mockOptions)

      expect(computeOrderTotals).toHaveBeenCalledWith(
        expect.objectContaining({
          items: mockOptions.items,
          shippingOption: 'standard',
        }),
        prisma
      )
    })

    it('should reject amount mismatch', async () => {
      vi.mocked(validatePaymentAmount).mockReturnValue(false)

      const result = await validateExpressPaymentRequest(mockOptions)

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('AMOUNT_MISMATCH')
    })

    it('should validate existing order', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-123',
        total: 64.90,
        paymentStatus: 'PENDING',
      } as any)

      const result = await validateExpressPaymentRequest({
        ...mockOptions,
        orderId: 'order-123',
      })

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-123' },
        select: { id: true, total: true, paymentStatus: true },
      })
      expect(result.valid).toBe(true)
    })

    it('should reject already paid orders', async () => {
      vi.mocked(prisma.order.findUnique).mockResolvedValue({
        id: 'order-123',
        total: 64.90,
        paymentStatus: 'PAID',
      } as any)

      const result = await validateExpressPaymentRequest({
        ...mockOptions,
        orderId: 'order-123',
      })

      expect(result.valid).toBe(false)
      expect(result.errorCode).toBe('ALREADY_PAID')
    })

    it('should return valid result with computed total', async () => {
      const result = await validateExpressPaymentRequest(mockOptions)

      expect(result.valid).toBe(true)
      expect(result.computedTotal).toBe(6490)
    })
  })

  describe('checkForFraud', () => {
    it('should detect rapid requests', () => {
      vi.mocked(detectSuspiciousActivity).mockReturnValue({
        rapidRequests: true,
        multipleFailedAttempts: false,
        suspiciousUserAgent: false,
      })

      const result = checkForFraud({
        total: 5000,
        isGuest: false,
      })

      expect(result.flags).toContain('rapid_requests')
      expect(result.riskScore).toBeGreaterThan(0)
    })

    it('should detect multiple failed attempts', () => {
      vi.mocked(detectSuspiciousActivity).mockReturnValue({
        rapidRequests: false,
        multipleFailedAttempts: true,
        suspiciousUserAgent: false,
      })

      const result = checkForFraud({
        total: 5000,
        isGuest: false,
      })

      expect(result.flags).toContain('multiple_failures')
      expect(result.riskScore).toBeGreaterThan(0)
    })

    it('should detect suspicious user agent', () => {
      vi.mocked(detectSuspiciousActivity).mockReturnValue({
        rapidRequests: false,
        multipleFailedAttempts: false,
        suspiciousUserAgent: true,
      })

      const result = checkForFraud({
        total: 5000,
        isGuest: false,
      })

      expect(result.flags).toContain('suspicious_ua')
      expect(result.riskScore).toBeGreaterThan(0)
    })

    it('should flag fast checkout (<30s)', () => {
      const result = checkForFraud({
        requestHistory: [{ timestamp: Date.now() - 20000, success: true }],
        total: 5000,
        isGuest: false,
      })

      expect(result.flags).toContain('fast_checkout')
      expect(result.riskScore).toBeGreaterThan(0)
    })

    it('should flag high-value guest checkout (>500€)', () => {
      const result = checkForFraud({
        total: 60000, // 600€ in cents
        isGuest: true,
      })

      expect(result.flags).toContain('high_value_guest')
      expect(result.riskScore).toBeGreaterThan(0)
    })

    it('should flag very high value (>2000€)', () => {
      const result = checkForFraud({
        total: 250000, // 2500€ in cents
        isGuest: false,
      })

      expect(result.flags).toContain('very_high_value')
      expect(result.riskScore).toBeGreaterThan(0)
    })

    it('should calculate risk score correctly', () => {
      vi.mocked(detectSuspiciousActivity).mockReturnValue({
        rapidRequests: true,
        multipleFailedAttempts: true,
        suspiciousUserAgent: true,
      })

      const result = checkForFraud({
        requestHistory: [{ timestamp: Date.now() - 20000, success: true }],
        total: 60000,
        isGuest: true,
      })

      // rapid(3) + failures(4) + ua(2) + fast(2) + high_value_guest(3) = 14
      expect(result.riskScore).toBeGreaterThanOrEqual(14)
    })

    it('should pass with low risk score (<8)', () => {
      vi.mocked(detectSuspiciousActivity).mockReturnValue({
        rapidRequests: false,
        multipleFailedAttempts: false,
        suspiciousUserAgent: false,
      })

      const result = checkForFraud({
        total: 5000,
        isGuest: false,
      })

      expect(result.passed).toBe(true)
      expect(result.riskScore).toBeLessThan(8)
    })

    it('should fail with high risk score (>=8)', () => {
      vi.mocked(detectSuspiciousActivity).mockReturnValue({
        rapidRequests: true,
        multipleFailedAttempts: true,
        suspiciousUserAgent: true,
      })

      const result = checkForFraud({
        total: 5000,
        isGuest: false,
      })

      expect(result.passed).toBe(false)
      expect(result.riskScore).toBeGreaterThanOrEqual(8)
    })
  })

  describe('createProvisionalExpressOrder', () => {
    const mockProduct = {
      id: 'product-123',
      name: 'Test Product',
      images: [{ url: 'https://example.com/image.jpg' }],
      variants: [],
    }

    beforeEach(() => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any)
      vi.mocked(prisma.order.create).mockResolvedValue({
        id: 'order-123',
        orderNumber: 'ORD-2025-12345',
        total: 64.90,
      } as any)
    })

    it('should compute totals correctly', async () => {
      await createProvisionalExpressOrder({
        items: [{ productId: 'product-123', quantity: 2, price: 2500 }],
        shippingAddress: { line1: '123 Test St', city: 'Paris' },
        email: 'test@example.com',
        gateway: 'APPLE_PAY',
      })

      expect(computeOrderTotals).toHaveBeenCalledWith(
        expect.objectContaining({
          items: expect.any(Array),
          shippingOption: 'standard',
        }),
        prisma
      )
    })

    it('should fetch product details', async () => {
      await createProvisionalExpressOrder({
        items: [{ productId: 'product-123', quantity: 2, price: 2500 }],
        shippingAddress: { line1: '123 Test St', city: 'Paris' },
        email: 'test@example.com',
        gateway: 'APPLE_PAY',
      })

      expect(prisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'product-123' },
        })
      )
    })

    it('should generate unique order number', async () => {
      const result = await createProvisionalExpressOrder({
        items: [{ productId: 'product-123', quantity: 2, price: 2500 }],
        shippingAddress: { line1: '123 Test St', city: 'Paris' },
        email: 'test@example.com',
        gateway: 'APPLE_PAY',
      })

      expect(result.orderNumber).toMatch(/ORD-\d{4}-\d{5}/)
    })

    it('should create order in Prisma', async () => {
      await createProvisionalExpressOrder({
        items: [{ productId: 'product-123', quantity: 2, price: 2500 }],
        shippingAddress: { line1: '123 Test St', city: 'Paris' },
        email: 'test@example.com',
        userId: 'user-123',
        gateway: 'APPLE_PAY',
      })

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-123',
            status: 'PENDING',
            paymentStatus: 'PENDING',
            items: expect.any(Object),
          }),
        })
      )
    })

    it('should map express gateway to standard gateway', async () => {
      // APPLE_PAY and GOOGLE_PAY map to PAYSTACK
      await createProvisionalExpressOrder({
        items: [{ productId: 'product-123', quantity: 2, price: 2500 }],
        shippingAddress: { line1: '123 Test St', city: 'Paris' },
        email: 'test@example.com',
        gateway: 'APPLE_PAY',
      })

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentGateway: 'PAYSTACK',
          }),
        })
      )

      // PAYPAL maps to PAYPAL
      await createProvisionalExpressOrder({
        items: [{ productId: 'product-123', quantity: 2, price: 2500 }],
        shippingAddress: { line1: '123 Test St', city: 'Paris' },
        email: 'test@example.com',
        gateway: 'PAYPAL',
      })

      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentGateway: 'PAYPAL',
          }),
        })
      )
    })

    it('should return order details', async () => {
      const result = await createProvisionalExpressOrder({
        items: [{ productId: 'product-123', quantity: 2, price: 2500 }],
        shippingAddress: { line1: '123 Test St', city: 'Paris' },
        email: 'test@example.com',
        gateway: 'APPLE_PAY',
      })

      expect(result).toHaveProperty('orderId')
      expect(result).toHaveProperty('orderNumber')
      expect(result).toHaveProperty('total')
    })
  })

  describe('logPaymentAttempt', () => {
    it('should hash sensitive data', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      await logPaymentAttempt({
        orderId: 'order-123',
        gateway: 'APPLE_PAY',
        success: true,
      })

      expect(require('@/lib/security').hashSensitiveData).toHaveBeenCalledWith('order-123')
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Payment Attempt]',
        expect.objectContaining({
          orderIdHash: 'hashed_order-123',
        })
      )

      consoleSpy.mockRestore()
    })

    it('should log to console', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      await logPaymentAttempt({
        orderId: 'order-123',
        gateway: 'APPLE_PAY',
        success: true,
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Payment Attempt]',
        expect.objectContaining({
          gateway: 'APPLE_PAY',
          success: true,
        })
      )

      consoleSpy.mockRestore()
    })

    it('should include metadata', async () => {
      const consoleSpy = vi.spyOn(console, 'log')

      await logPaymentAttempt({
        orderId: 'order-123',
        gateway: 'APPLE_PAY',
        success: false,
        errorMessage: 'Payment declined',
        metadata: { attemptNumber: 3 },
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Payment Attempt]',
        expect.objectContaining({
          error: 'Payment declined',
          attemptNumber: 3,
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('validateApplePayMerchantSession', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('should validate with Stripe', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ merchantSession: 'session-data' }),
      })

      const result = await validateApplePayMerchantSession(
        'https://apple-pay-gateway.apple.com/validate',
        'example.com'
      )

      expect(result).toHaveProperty('merchantSession')
      expect(fetch).toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Forbidden',
      })

      await expect(
        validateApplePayMerchantSession(
          'https://apple-pay-gateway.apple.com/validate',
          'example.com'
        )
      ).rejects.toThrow('Merchant validation failed')
    })

    it('should throw if no PSP configured', async () => {
      delete process.env.STRIPE_SECRET_KEY

      await expect(
        validateApplePayMerchantSession(
          'https://apple-pay-gateway.apple.com/validate',
          'example.com'
        )
      ).rejects.toThrow('Apple Pay merchant validation not configured')
    })
  })

  describe('processExpressPaymentToken', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv }
      vi.clearAllMocks()
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('should create Stripe PaymentIntent', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const mockStripe = {
        paymentIntents: {
          create: vi.fn().mockResolvedValue({
            id: 'pi_123',
            status: 'succeeded',
          }),
        },
      }

      vi.doMock('stripe', () => vi.fn(() => mockStripe))

      const result = await processExpressPaymentToken({
        gateway: 'APPLE_PAY',
        token: 'tok_123',
        amount: 6490,
        orderId: 'order-123',
        email: 'test@example.com',
      })

      expect(result.success).toBe(true)
      expect(result.reference).toBe('pi_123')
    })

    it('should handle 3D Secure', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const mockStripe = {
        paymentIntents: {
          create: vi.fn().mockResolvedValue({
            id: 'pi_123',
            status: 'requires_action',
          }),
        },
      }

      vi.doMock('stripe', () => vi.fn(() => mockStripe))

      const result = await processExpressPaymentToken({
        gateway: 'APPLE_PAY',
        token: 'tok_123',
        amount: 6490,
        orderId: 'order-123',
        email: 'test@example.com',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('additional authentication')
    })

    it('should handle payment declined', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const mockStripe = {
        paymentIntents: {
          create: vi.fn().mockResolvedValue({
            id: 'pi_123',
            status: 'canceled',
          }),
        },
      }

      vi.doMock('stripe', () => vi.fn(() => mockStripe))

      const result = await processExpressPaymentToken({
        gateway: 'APPLE_PAY',
        token: 'tok_123',
        amount: 6490,
        orderId: 'order-123',
        email: 'test@example.com',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Payment declined')
    })

    it('should handle errors gracefully', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_123'

      const mockStripe = {
        paymentIntents: {
          create: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      }

      vi.doMock('stripe', () => vi.fn(() => mockStripe))

      const result = await processExpressPaymentToken({
        gateway: 'APPLE_PAY',
        token: 'tok_123',
        amount: 6490,
        orderId: 'order-123',
        email: 'test@example.com',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should return error if no PSP configured', async () => {
      delete process.env.STRIPE_SECRET_KEY
      delete process.env.PAYSTACK_SECRET_KEY

      const result = await processExpressPaymentToken({
        gateway: 'APPLE_PAY',
        token: 'tok_123',
        amount: 6490,
        orderId: 'order-123',
        email: 'test@example.com',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('No payment service provider configured')
    })
  })
})

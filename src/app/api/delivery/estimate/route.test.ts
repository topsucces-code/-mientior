/**
 * Tests for delivery estimation API endpoint
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from './route'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
  },
}))

describe('POST /api/delivery/estimate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 for invalid request', async () => {
    const request = new Request('http://localhost/api/delivery/estimate', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid request')
  })

  it('should return 404 for non-existent product', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null)
    vi.mocked(redis.get).mockResolvedValue(null)

    const request = new Request('http://localhost/api/delivery/estimate', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'non-existent',
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Product not found')
  })

  it('should calculate delivery estimates for in-stock product', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'product-1',
      name: 'Test Product',
      processingDays: 2,
      stock: 10,
      variants: undefined,
    } as any)
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(redis.setex).mockResolvedValue('OK')

    const request = new Request('http://localhost/api/delivery/estimate', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-1',
        location: {
          country: 'France',
          region: 'Île-de-France',
        },
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.estimates).toBeDefined()
    expect(Array.isArray(data.estimates)).toBe(true)
    expect(data.estimates.length).toBeGreaterThan(0)
    expect(data.cached).toBe(false)
    expect(data.isBackordered).toBe(false)
  })

  it('should handle backordered products', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'product-1',
      name: 'Test Product',
      processingDays: 2,
      stock: 0, // Out of stock
      variants: undefined,
    } as any)
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(redis.setex).mockResolvedValue('OK')

    const request = new Request('http://localhost/api/delivery/estimate', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-1',
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isBackordered).toBe(true)
    expect(data.estimates).toBeDefined()
  })

  it('should return cached results when available', async () => {
    const cachedData = {
      estimates: [
        {
          minDate: new Date('2024-01-15').toISOString(),
          maxDate: new Date('2024-01-17').toISOString(),
          shippingOption: {
            id: 'standard',
            name: 'Standard',
            price: 5.99,
            estimatedDays: 5,
            description: 'Standard shipping',
          },
          processingDays: 2,
        },
      ],
      timestamp: Date.now(),
    }

    vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData))

    const request = new Request('http://localhost/api/delivery/estimate', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-1',
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.cached).toBe(true)
    expect(data.estimates).toEqual(cachedData.estimates)
    expect(prisma.product.findUnique).not.toHaveBeenCalled()
  })

  it('should filter by shipping method when specified', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'product-1',
      name: 'Test Product',
      processingDays: 2,
      stock: 10,
      variants: undefined,
    } as any)
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(redis.setex).mockResolvedValue('OK')

    const request = new Request('http://localhost/api/delivery/estimate', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-1',
        shippingMethod: 'express',
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.estimates).toHaveLength(1)
    expect(data.estimates[0].shippingOption.id).toBe('express')
  })

  it('should return 400 for invalid shipping method', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'product-1',
      name: 'Test Product',
      processingDays: 2,
      stock: 10,
      variants: undefined,
    } as any)
    vi.mocked(redis.get).mockResolvedValue(null)

    const request = new Request('http://localhost/api/delivery/estimate', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-1',
        shippingMethod: 'invalid-method',
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid shipping method')
  })

  it('should handle variant-specific stock', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'product-1',
      name: 'Test Product',
      processingDays: 2,
      stock: 10,
      variants: [
        {
          id: 'variant-1',
          stock: 0, // Variant out of stock
        },
      ],
    } as any)
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(redis.setex).mockResolvedValue('OK')

    const request = new Request('http://localhost/api/delivery/estimate', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-1',
        variantId: 'variant-1',
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isBackordered).toBe(true)
  })

  it('should handle Redis errors gracefully', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'product-1',
      name: 'Test Product',
      processingDays: 2,
      stock: 10,
      variants: undefined,
    } as any)
    vi.mocked(redis.get).mockRejectedValue(new Error('Redis error'))
    vi.mocked(redis.setex).mockRejectedValue(new Error('Redis error'))

    const request = new Request('http://localhost/api/delivery/estimate', {
      method: 'POST',
      body: JSON.stringify({
        productId: 'product-1',
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    // Should still return estimates despite Redis errors
    expect(response.status).toBe(200)
    expect(data.estimates).toBeDefined()
  })
})

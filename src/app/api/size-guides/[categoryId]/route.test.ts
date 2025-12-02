/**
 * Tests for size guide API caching (15.5)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, DELETE } from './route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findUnique: vi.fn(),
    },
    sizeGuide: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  },
}))

vi.mock('@/lib/auth-server', () => ({
  requireAdminAuth: vi.fn(),
}))

describe('Size Guide API Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/size-guides/[categoryId]', () => {
    it('should return cached size guide if available', async () => {
      const cachedData = {
        id: 'guide-1',
        categoryId: 'cat-1',
        measurements: [{ size: 'S', chest: 90, unit: 'cm' }],
        instructions: 'Test instructions',
        fitRecommendations: [],
      }

      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData))

      const request = new NextRequest('http://localhost/api/size-guides/cat-1')
      const response = await GET(request, { params: { categoryId: 'cat-1' } })
      const data = await response.json()

      expect(data.cached).toBe(true)
      expect(data.id).toBe('guide-1')
      expect(redis.get).toHaveBeenCalledWith('size-guide:category:cat-1')
      expect(prisma.sizeGuide.findUnique).not.toHaveBeenCalled()
    })

    it('should fetch from database and cache if not in cache', async () => {
      const sizeGuideData = {
        id: 'guide-1',
        categoryId: 'cat-1',
        measurements: {
          measurements: [{ size: 'M', chest: 95, unit: 'cm' }],
          fitRecommendations: [{ size: 'M', recommendation: 'Regular fit' }],
        },
        instructions: 'Measure carefully',
      }

      vi.mocked(redis.get).mockResolvedValue(null)
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        id: 'cat-1',
        name: 'Shirts',
      } as any)
      vi.mocked(prisma.sizeGuide.findUnique).mockResolvedValue(sizeGuideData as any)

      const request = new NextRequest('http://localhost/api/size-guides/cat-1')
      const response = await GET(request, { params: { categoryId: 'cat-1' } })
      const data = await response.json()

      expect(data.cached).toBe(false)
      expect(data.id).toBe('guide-1')
      expect(data.measurements).toEqual([{ size: 'M', chest: 95, unit: 'cm' }])
      expect(redis.setex).toHaveBeenCalledWith(
        'size-guide:category:cat-1',
        3600, // 1 hour TTL
        expect.any(String)
      )
    })

    it('should handle cache errors gracefully', async () => {
      vi.mocked(redis.get).mockRejectedValue(new Error('Redis error'))
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        id: 'cat-1',
        name: 'Shirts',
      } as any)
      vi.mocked(prisma.sizeGuide.findUnique).mockResolvedValue({
        id: 'guide-1',
        categoryId: 'cat-1',
        measurements: { measurements: [] },
        instructions: null,
      } as any)

      const request = new NextRequest('http://localhost/api/size-guides/cat-1')
      const response = await GET(request, { params: { categoryId: 'cat-1' } })

      expect(response.status).toBe(200)
      expect(prisma.sizeGuide.findUnique).toHaveBeenCalled()
    })

    it('should return 404 if category not found', async () => {
      vi.mocked(redis.get).mockResolvedValue(null)
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/size-guides/cat-1')
      const response = await GET(request, { params: { categoryId: 'cat-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Category not found')
    })

    it('should return 404 if size guide not found', async () => {
      vi.mocked(redis.get).mockResolvedValue(null)
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        id: 'cat-1',
        name: 'Shirts',
      } as any)
      vi.mocked(prisma.sizeGuide.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/size-guides/cat-1')
      const response = await GET(request, { params: { categoryId: 'cat-1' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Size guide not found for this category')
    })
  })

  describe('POST /api/size-guides/[categoryId]', () => {
    it('should invalidate cache after creating/updating size guide', async () => {
      const requestBody = {
        measurements: [{ size: 'L', chest: 100, unit: 'cm' }],
        instructions: 'New instructions',
        fitRecommendations: [],
      }

      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        id: 'cat-1',
        name: 'Shirts',
      } as any)
      vi.mocked(prisma.sizeGuide.upsert).mockResolvedValue({
        id: 'guide-1',
        categoryId: 'cat-1',
        measurements: { measurements: requestBody.measurements },
        instructions: requestBody.instructions,
      } as any)

      const request = new NextRequest('http://localhost/api/size-guides/cat-1', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      const response = await POST(request, { params: { categoryId: 'cat-1' } })

      expect(response.status).toBe(200)
      expect(redis.del).toHaveBeenCalledWith('size-guide:category:cat-1')
    })

    it('should handle cache invalidation errors gracefully', async () => {
      const requestBody = {
        measurements: [{ size: 'L', chest: 100, unit: 'cm' }],
      }

      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        id: 'cat-1',
        name: 'Shirts',
      } as any)
      vi.mocked(prisma.sizeGuide.upsert).mockResolvedValue({
        id: 'guide-1',
        categoryId: 'cat-1',
        measurements: { measurements: requestBody.measurements },
        instructions: null,
      } as any)
      vi.mocked(redis.del).mockRejectedValue(new Error('Redis error'))

      const request = new NextRequest('http://localhost/api/size-guides/cat-1', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      const response = await POST(request, { params: { categoryId: 'cat-1' } })

      expect(response.status).toBe(200)
    })
  })

  describe('DELETE /api/size-guides/[categoryId]', () => {
    it('should invalidate cache after deleting size guide', async () => {
      vi.mocked(prisma.sizeGuide.delete).mockResolvedValue({
        id: 'guide-1',
        categoryId: 'cat-1',
        measurements: {},
        instructions: null,
      } as any)

      const request = new NextRequest('http://localhost/api/size-guides/cat-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { categoryId: 'cat-1' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(redis.del).toHaveBeenCalledWith('size-guide:category:cat-1')
    })

    it('should handle cache invalidation errors gracefully', async () => {
      vi.mocked(prisma.sizeGuide.delete).mockResolvedValue({
        id: 'guide-1',
        categoryId: 'cat-1',
        measurements: {},
        instructions: null,
      } as any)
      vi.mocked(redis.del).mockRejectedValue(new Error('Redis error'))

      const request = new NextRequest('http://localhost/api/size-guides/cat-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { categoryId: 'cat-1' } })

      expect(response.status).toBe(200)
    })
  })
})

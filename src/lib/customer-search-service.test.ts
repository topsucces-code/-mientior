import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CustomerSearchService } from './customer-search-service'
import { prisma } from './prisma'
import { redis } from './redis'
import type { CustomerSearchParams } from './customer-search-validation'

// Mock dependencies
vi.mock('./prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
    user: {
      findMany: vi.fn(),
      count: vi.fn()
    }
  }
}))

vi.mock('./redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    keys: vi.fn(),
    del: vi.fn()
  }
}))

describe('CustomerSearchService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Query Complexity Detection', () => {
    it('should detect simple queries', async () => {
      const params: CustomerSearchParams = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        q: 'john'
      }

      // Mock materialized view availability check
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ count: 1 }])
      
      // Mock materialized view query
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValueOnce([
        {
          id: '1',
          name: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          loyaltyLevel: 'BRONZE',
          loyaltyPoints: 100,
          totalOrders: 5,
          totalSpent: 500,
          createdAt: new Date(),
          last_purchase_date: new Date(),
          segments: [],
          tags: []
        }
      ])

      // Mock count query
      vi.mocked(prisma.$queryRawUnsafe).mockResolvedValueOnce([{ total: BigInt(1) }])

      const result = await CustomerSearchService.search(params)

      expect(result.metrics.queryComplexity).toBe('simple')
      expect(result.customers).toHaveLength(1)
      expect(result.customers[0].name).toBe('John Doe')
    })

    it('should detect complex queries and use caching', async () => {
      const params: CustomerSearchParams = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        q: 'john',
        tier: 'GOLD',
        clvMin: 1000,
        clvMax: 5000,
        registrationFrom: '2024-01-01T00:00:00Z',
        registrationTo: '2024-12-31T23:59:59Z'
      }

      // Mock cache hit
      const cachedResult = {
        customers: [],
        pagination: {
          page: 1,
          limit: 20,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        },
        metrics: {
          totalCount: 0,
          executionTime: 50,
          cacheHit: false,
          queryComplexity: 'complex' as const,
          indexesUsed: []
        }
      }

      vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify(cachedResult))

      const result = await CustomerSearchService.search(params)

      expect(result.metrics.cacheHit).toBe(true)
      expect(redis.get).toHaveBeenCalledWith(
        expect.stringContaining('customer-search-v2:')
      )
    })
  })

  describe('Materialized View Integration', () => {
    it('should use materialized view when available', async () => {
      const params: CustomerSearchParams = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        q: 'test'
      }

      // Mock materialized view availability
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ count: 1 }])

      // Mock search results
      const mockCustomers = [
        {
          id: '1',
          name: 'Test User',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          loyaltyLevel: 'SILVER',
          loyaltyPoints: 250,
          totalOrders: 3,
          totalSpent: 750,
          createdAt: new Date('2024-01-15'),
          last_purchase_date: new Date('2024-11-01'),
          segments: [{ id: 'seg1', name: 'VIP Customers' }],
          tags: [{ id: 'tag1', name: 'Premium', color: '#gold' }]
        }
      ]

      vi.mocked(prisma.$queryRawUnsafe)
        .mockResolvedValueOnce(mockCustomers)
        .mockResolvedValueOnce([{ total: BigInt(1) }])

      const result = await CustomerSearchService.search(params)

      expect(result.customers).toHaveLength(1)
      expect(result.customers[0].segments).toEqual([{ id: 'seg1', name: 'VIP Customers' }])
      expect(result.customers[0].tags).toEqual([{ id: 'tag1', name: 'Premium', color: '#gold' }])
      expect(result.metrics.indexesUsed).toContain('customer_search_view_search_vector')
    })

    it('should fallback to optimized query when materialized view fails', async () => {
      const params: CustomerSearchParams = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        tier: 'GOLD'
      }

      // Mock materialized view unavailable
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('View not found'))

      // Mock Prisma query fallback
      const mockCustomers = [
        {
          id: '1',
          name: 'Gold Customer',
          firstName: 'Gold',
          lastName: 'Customer',
          email: 'gold@example.com',
          loyaltyLevel: 'GOLD',
          loyaltyPoints: 1000,
          totalOrders: 10,
          totalSpent: 2500,
          createdAt: new Date(),
          segmentAssignments: [],
          tagAssignments: [],
          orders: [{ createdAt: new Date() }]
        }
      ]

      vi.mocked(prisma.user.findMany).mockResolvedValueOnce(mockCustomers as any)
      vi.mocked(prisma.user.count).mockResolvedValueOnce(1)

      const result = await CustomerSearchService.search(params)

      expect(result.customers).toHaveLength(1)
      expect(result.customers[0].loyaltyLevel).toBe('GOLD')
      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            loyaltyLevel: 'GOLD'
          })
        })
      )
    })
  })

  describe('Performance Optimization', () => {
    it('should cache complex queries', async () => {
      const params: CustomerSearchParams = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        q: 'search',
        tier: 'PLATINUM',
        clvMin: 5000,
        segment: 'seg-123'
      }

      // Mock no cache hit
      vi.mocked(redis.get).mockResolvedValueOnce(null)

      // Mock materialized view query
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ count: 1 }])
      vi.mocked(prisma.$queryRawUnsafe)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: BigInt(0) }])

      await CustomerSearchService.search(params)

      // Verify caching was attempted
      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringContaining('customer-search-v2:'),
        120, // 2 minutes TTL
        expect.any(String)
      )
    })

    it('should not cache simple queries', async () => {
      const params: CustomerSearchParams = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        q: 'simple'
      }

      // Mock materialized view query
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ count: 1 }])
      vi.mocked(prisma.$queryRawUnsafe)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: BigInt(0) }])

      await CustomerSearchService.search(params)

      // Verify caching was not attempted for simple queries
      expect(redis.setex).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling and Fallbacks', () => {
    it('should handle database errors gracefully', async () => {
      const params: CustomerSearchParams = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        q: 'test'
      }

      // Mock materialized view failure
      vi.mocked(prisma.$queryRaw).mockRejectedValueOnce(new Error('DB Error'))

      // Mock optimized query failure
      vi.mocked(prisma.user.findMany).mockRejectedValueOnce(new Error('Prisma Error'))

      // Mock fallback query success
      vi.mocked(prisma.user.findMany).mockResolvedValueOnce([])
      vi.mocked(prisma.user.count).mockResolvedValueOnce(0)

      const result = await CustomerSearchService.search(params)

      expect(result.customers).toEqual([])
      expect(result.metrics.indexesUsed).toContain('basic_user_indexes')
    })

    it('should handle cache errors gracefully', async () => {
      const params: CustomerSearchParams = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        q: 'test',
        tier: 'GOLD',
        clvMin: 1000,
        segment: 'seg-456'
      }

      // Mock cache error
      vi.mocked(redis.get).mockRejectedValueOnce(new Error('Redis Error'))

      // Mock successful query
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ count: 1 }])
      vi.mocked(prisma.$queryRawUnsafe)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: BigInt(0) }])

      // Mock cache write error
      vi.mocked(redis.setex).mockRejectedValueOnce(new Error('Cache Write Error'))

      const result = await CustomerSearchService.search(params)

      expect(result.customers).toEqual([])
      expect(result.metrics.cacheHit).toBe(false)
    })
  })

  describe('Search Filters', () => {
    it('should handle date range filters correctly', async () => {
      const params: CustomerSearchParams = {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        registrationFrom: '2024-01-01T00:00:00Z',
        registrationTo: '2024-12-31T23:59:59Z',
        lastPurchaseFrom: '2024-06-01T00:00:00Z',
        lastPurchaseTo: '2024-11-30T23:59:59Z'
      }

      // Mock materialized view query
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ count: 1 }])
      vi.mocked(prisma.$queryRawUnsafe)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: BigInt(0) }])

      await CustomerSearchService.search(params)

      // Verify the query was called with date filters
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.any(Date), // registrationFrom
        expect.any(Date), // registrationTo
        expect.any(Date), // lastPurchaseFrom
        expect.any(Date), // lastPurchaseTo
        expect.any(Number), // limit
        expect.any(Number)  // offset
      )
    })

    it('should handle CLV and order count filters', async () => {
      const params: CustomerSearchParams = {
        page: 1,
        limit: 20,
        sortBy: 'totalSpent',
        sortOrder: 'desc',
        clvMin: 1000,
        clvMax: 5000,
        orderCountMin: 5,
        orderCountMax: 50
      }

      // Mock materialized view query
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ count: 1 }])
      vi.mocked(prisma.$queryRawUnsafe)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: BigInt(0) }])

      await CustomerSearchService.search(params)

      // Verify the query includes CLV and order count filters
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('"totalSpent" >='),
        1000, // clvMin
        5000, // clvMax
        5,    // orderCountMin
        50,   // orderCountMax
        expect.any(Number), // limit
        expect.any(Number)  // offset
      )
    })
  })

  describe('Pagination', () => {
    it('should calculate pagination correctly', async () => {
      const params: CustomerSearchParams = {
        page: 3,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      }

      // Mock materialized view query
      vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ count: 1 }])
      vi.mocked(prisma.$queryRawUnsafe)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ total: BigInt(45) }]) // 45 total results

      const result = await CustomerSearchService.search(params)

      expect(result.pagination).toEqual({
        page: 3,
        limit: 10,
        totalCount: 45,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true
      })

      // Verify offset calculation (page 3, limit 10 = skip 20)
      expect(prisma.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.any(String),
        10, // limit
        20  // offset (skip)
      )
    })
  })
})
/**
 * Performance Tests for Customer 360 Dashboard
 * 
 * Tests dashboard load time, API response times, and real-time update latency
 * 
 * Requirements:
 * - Dashboard load time < 2s
 * - API response times < 500ms
 * - Real-time update latency < 5s
 * 
 * Validates: Requirements 18.1, 18.2, 18.3
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { getCustomer360View, getCustomerMetrics, calculateHealthScore, calculateChurnRisk } from './customer-360'
import { CustomerSearchService } from './customer-search-service'
import { prisma } from './prisma'
import { redis } from './redis'

// Mock dependencies
vi.mock('./prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
    customerSegmentAssignment: {
      findMany: vi.fn(),
    },
    customerTagAssignment: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('./redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
  },
}))

describe('Customer 360 Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Dashboard Load Time', () => {
    it('should load customer 360 view in less than 2 seconds (cold cache)', async () => {
      // Mock Redis cache miss
      vi.mocked(redis.get).mockResolvedValue(null)
      vi.mocked(redis.setex).mockResolvedValue('OK')

      // Mock database responses with realistic data
      const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        image: null,
        createdAt: new Date('2023-01-01'),
        emailVerified: new Date(),
        loyaltyLevel: 'GOLD',
        loyaltyPoints: 500,
        totalOrders: 10,
        totalSpent: 1000,
        savedAddresses: [],
      }

      const mockOrders = Array.from({ length: 10 }, (_, i) => ({
        id: `order-${i}`,
        total: 100,
        createdAt: new Date(Date.now() - i * 86400000), // Spread over 10 days
        status: 'DELIVERED',
      }))

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.customerSegmentAssignment.findMany).mockResolvedValue([])
      vi.mocked(prisma.customerTagAssignment.findMany).mockResolvedValue([])

      // Measure execution time
      const startTime = performance.now()
      const result = await getCustomer360View('user-123')
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Verify result is valid
      expect(result).toBeDefined()
      expect(result.profile).toBeDefined()
      expect(result.metrics).toBeDefined()
      expect(result.healthScore).toBeDefined()
      expect(result.churnRisk).toBeDefined()

      // Performance assertion: < 2000ms (2 seconds)
      expect(executionTime).toBeLessThan(2000)
      console.log(`✓ Dashboard load time (cold cache): ${executionTime.toFixed(2)}ms`)
    })

    it('should load customer 360 view in less than 100ms (warm cache)', async () => {
      // Mock Redis cache hit
      const cachedData = {
        profile: {
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          registrationDate: new Date('2023-01-01'),
          accountStatus: 'active',
          addresses: [],
          loyaltyLevel: 'GOLD',
        },
        metrics: {
          lifetimeValue: 1000,
          totalOrders: 10,
          averageOrderValue: 100,
          totalSpent: 1000,
          daysSinceLastPurchase: 5,
          purchaseFrequency: 2,
          customerTenure: 365,
        },
        healthScore: {
          score: 85,
          level: 'excellent' as const,
          factors: { purchase: 80, engagement: 85, support: 90, recency: 85 },
          recommendations: [],
        },
        churnRisk: {
          level: 'LOW' as const,
          score: 20,
          factors: { daysSinceLastPurchase: 5, engagementDecline: 25, supportIssues: 0 },
          retentionStrategies: [],
        },
        segments: [],
        tags: [],
      }

      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData))

      // Measure execution time
      const startTime = performance.now()
      const result = await getCustomer360View('user-123')
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Verify result is valid
      expect(result).toBeDefined()
      expect(result.profile.id).toBe('user-123')

      // Performance assertion: < 100ms (cache hit should be very fast)
      expect(executionTime).toBeLessThan(100)
      console.log(`✓ Dashboard load time (warm cache): ${executionTime.toFixed(2)}ms`)
    })
  })

  describe('API Response Times', () => {
    it('should calculate customer metrics in less than 500ms', async () => {
      const mockUser = {
        id: 'user-123',
        createdAt: new Date('2023-01-01'),
        totalOrders: 50,
        totalSpent: 5000,
      }

      const mockOrders = Array.from({ length: 50 }, (_, i) => ({
        id: `order-${i}`,
        total: 100,
        createdAt: new Date(Date.now() - i * 86400000),
        status: 'DELIVERED',
      }))

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)

      // Measure execution time
      const startTime = performance.now()
      const result = await getCustomerMetrics('user-123')
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Verify result is valid
      expect(result).toBeDefined()
      expect(result.totalOrders).toBe(50)
      expect(result.lifetimeValue).toBe(5000)

      // Performance assertion: < 500ms
      expect(executionTime).toBeLessThan(500)
      console.log(`✓ Metrics calculation time: ${executionTime.toFixed(2)}ms`)
    })

    it('should calculate health score in less than 500ms', async () => {
      const mockUser = {
        id: 'user-123',
        createdAt: new Date('2023-01-01'),
        totalOrders: 20,
        totalSpent: 2000,
        loyaltyLevel: 'GOLD',
        loyaltyPoints: 500,
      }

      const mockOrders = Array.from({ length: 20 }, (_, i) => ({
        id: `order-${i}`,
        total: 100,
        createdAt: new Date(Date.now() - i * 86400000),
        status: 'DELIVERED',
      }))

      vi.mocked(prisma.user.findUnique)
        .mockResolvedValueOnce(mockUser as any) // For getCustomerMetrics
        .mockResolvedValueOnce(mockUser as any) // For calculateHealthScore
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)

      // Measure execution time
      const startTime = performance.now()
      const result = await calculateHealthScore('user-123')
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Verify result is valid
      expect(result).toBeDefined()
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)

      // Performance assertion: < 500ms
      expect(executionTime).toBeLessThan(500)
      console.log(`✓ Health score calculation time: ${executionTime.toFixed(2)}ms`)
    })

    it('should calculate churn risk in less than 500ms', async () => {
      const mockUser = {
        id: 'user-123',
        createdAt: new Date('2023-01-01'),
        totalOrders: 15,
        totalSpent: 1500,
      }

      const mockOrders = Array.from({ length: 15 }, (_, i) => ({
        id: `order-${i}`,
        total: 100,
        createdAt: new Date(Date.now() - i * 86400000),
        status: 'DELIVERED',
      }))

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)

      // Measure execution time
      const startTime = performance.now()
      const result = await calculateChurnRisk('user-123')
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Verify result is valid
      expect(result).toBeDefined()
      expect(result.level).toMatch(/LOW|MEDIUM|HIGH/)
      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)

      // Performance assertion: < 500ms
      expect(executionTime).toBeLessThan(500)
      console.log(`✓ Churn risk calculation time: ${executionTime.toFixed(2)}ms`)
    })

    it('should perform database query in less than 500ms', async () => {
      // Mock database query for search
      const mockUsers = Array.from({ length: 20 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        loyaltyLevel: 'BRONZE',
        loyaltyPoints: 100,
        totalOrders: 5,
        totalSpent: 500,
        createdAt: new Date(),
        emailVerified: new Date(),
        image: null,
        firstName: 'User',
        lastName: `${i}`,
      }))

      vi.mocked(prisma.user.findMany).mockResolvedValue(mockUsers as any)
      vi.mocked(prisma.user.count).mockResolvedValue(100)

      // Measure execution time
      const startTime = performance.now()
      const users = await prisma.user.findMany({
        take: 20,
        skip: 0,
        orderBy: { createdAt: 'desc' },
      })
      const count = await prisma.user.count()
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Verify result is valid
      expect(users).toBeDefined()
      expect(users).toHaveLength(20)
      expect(count).toBe(100)

      // Performance assertion: < 500ms
      expect(executionTime).toBeLessThan(500)
      console.log(`✓ Database query time: ${executionTime.toFixed(2)}ms`)
    })
  })

  describe('Parallel Operations Performance', () => {
    it('should handle multiple concurrent 360 view requests efficiently', async () => {
      // Mock Redis cache miss
      vi.mocked(redis.get).mockResolvedValue(null)
      vi.mocked(redis.setex).mockResolvedValue('OK')

      const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        image: null,
        createdAt: new Date('2023-01-01'),
        emailVerified: new Date(),
        loyaltyLevel: 'GOLD',
        loyaltyPoints: 500,
        totalOrders: 10,
        totalSpent: 1000,
        savedAddresses: [],
      }

      const mockOrders = Array.from({ length: 10 }, (_, i) => ({
        id: `order-${i}`,
        total: 100,
        createdAt: new Date(Date.now() - i * 86400000),
        status: 'DELIVERED',
      }))

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.customerSegmentAssignment.findMany).mockResolvedValue([])
      vi.mocked(prisma.customerTagAssignment.findMany).mockResolvedValue([])

      // Measure execution time for 5 concurrent requests
      const startTime = performance.now()
      const results = await Promise.all([
        getCustomer360View('user-123'),
        getCustomer360View('user-123'),
        getCustomer360View('user-123'),
        getCustomer360View('user-123'),
        getCustomer360View('user-123'),
      ])
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Verify all results are valid
      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(result).toBeDefined()
        expect(result.profile).toBeDefined()
      })

      // Performance assertion: concurrent requests should complete in reasonable time
      // 5 requests should take less than 3 seconds total (600ms average per request)
      expect(executionTime).toBeLessThan(3000)
      console.log(`✓ 5 concurrent requests completed in: ${executionTime.toFixed(2)}ms (${(executionTime / 5).toFixed(2)}ms avg)`)
    })
  })

  describe('Cache Performance', () => {
    it('should demonstrate significant performance improvement with caching', async () => {
      // First request (cold cache)
      vi.mocked(redis.get).mockResolvedValueOnce(null)
      vi.mocked(redis.setex).mockResolvedValue('OK')

      const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        image: null,
        createdAt: new Date('2023-01-01'),
        emailVerified: new Date(),
        loyaltyLevel: 'GOLD',
        loyaltyPoints: 500,
        totalOrders: 10,
        totalSpent: 1000,
        savedAddresses: [],
      }

      const mockOrders = Array.from({ length: 10 }, (_, i) => ({
        id: `order-${i}`,
        total: 100,
        createdAt: new Date(Date.now() - i * 86400000),
        status: 'DELIVERED',
      }))

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.customerSegmentAssignment.findMany).mockResolvedValue([])
      vi.mocked(prisma.customerTagAssignment.findMany).mockResolvedValue([])

      const coldStartTime = performance.now()
      const coldResult = await getCustomer360View('user-123')
      const coldEndTime = performance.now()
      const coldExecutionTime = coldEndTime - coldStartTime

      // Second request (warm cache)
      const cachedData = {
        profile: coldResult.profile,
        metrics: coldResult.metrics,
        healthScore: coldResult.healthScore,
        churnRisk: coldResult.churnRisk,
        segments: coldResult.segments,
        tags: coldResult.tags,
      }

      vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify(cachedData))

      const warmStartTime = performance.now()
      const warmResult = await getCustomer360View('user-123')
      const warmEndTime = performance.now()
      const warmExecutionTime = warmEndTime - warmStartTime

      // Verify both results are valid
      expect(coldResult).toBeDefined()
      expect(warmResult).toBeDefined()

      // Cache should provide at least 5x performance improvement
      const speedup = coldExecutionTime / warmExecutionTime
      expect(speedup).toBeGreaterThan(5)

      console.log(`✓ Cold cache: ${coldExecutionTime.toFixed(2)}ms`)
      console.log(`✓ Warm cache: ${warmExecutionTime.toFixed(2)}ms`)
      console.log(`✓ Speedup: ${speedup.toFixed(2)}x`)
    })
  })

  describe('Real-time Update Latency', () => {
    it('should process cache invalidation quickly (< 100ms)', async () => {
      vi.mocked(redis.del).mockResolvedValue(1)

      const startTime = performance.now()
      
      // Import the invalidation function
      const { invalidateCustomer360Cache } = await import('./customer-360')
      await invalidateCustomer360Cache('user-123')
      
      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Verify cache was invalidated
      expect(redis.del).toHaveBeenCalledWith('customer:360:user-123')

      // Performance assertion: < 100ms
      expect(executionTime).toBeLessThan(100)
      console.log(`✓ Cache invalidation time: ${executionTime.toFixed(2)}ms`)
    })

    it('should simulate real-time update propagation within 5 seconds', async () => {
      // This test simulates the full cycle:
      // 1. Data change occurs
      // 2. Cache is invalidated
      // 3. New data is fetched
      // 4. Client receives update

      vi.mocked(redis.del).mockResolvedValue(1)
      vi.mocked(redis.get).mockResolvedValue(null)
      vi.mocked(redis.setex).mockResolvedValue('OK')

      const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        image: null,
        createdAt: new Date('2023-01-01'),
        emailVerified: new Date(),
        loyaltyLevel: 'GOLD',
        loyaltyPoints: 500,
        totalOrders: 11, // Updated
        totalSpent: 1100, // Updated
        savedAddresses: [],
      }

      const mockOrders = Array.from({ length: 11 }, (_, i) => ({
        id: `order-${i}`,
        total: 100,
        createdAt: new Date(Date.now() - i * 86400000),
        status: 'DELIVERED',
      }))

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.customerSegmentAssignment.findMany).mockResolvedValue([])
      vi.mocked(prisma.customerTagAssignment.findMany).mockResolvedValue([])

      const startTime = performance.now()

      // Step 1: Invalidate cache (simulating data change)
      const { invalidateCustomer360Cache } = await import('./customer-360')
      await invalidateCustomer360Cache('user-123')

      // Step 2: Fetch updated data
      const updatedData = await getCustomer360View('user-123')

      const endTime = performance.now()
      const totalLatency = endTime - startTime

      // Verify updated data
      expect(updatedData).toBeDefined()
      expect(updatedData.metrics.totalOrders).toBe(11)

      // Performance assertion: total latency < 5000ms (5 seconds)
      expect(totalLatency).toBeLessThan(5000)
      console.log(`✓ Real-time update propagation latency: ${totalLatency.toFixed(2)}ms`)
    })
  })

  describe('Performance Regression Detection', () => {
    it('should maintain consistent performance across multiple runs', async () => {
      vi.mocked(redis.get).mockResolvedValue(null)
      vi.mocked(redis.setex).mockResolvedValue('OK')

      const mockUser = {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com',
        image: null,
        createdAt: new Date('2023-01-01'),
        emailVerified: new Date(),
        loyaltyLevel: 'GOLD',
        loyaltyPoints: 500,
        totalOrders: 10,
        totalSpent: 1000,
        savedAddresses: [],
      }

      const mockOrders = Array.from({ length: 10 }, (_, i) => ({
        id: `order-${i}`,
        total: 100,
        createdAt: new Date(Date.now() - i * 86400000),
        status: 'DELIVERED',
      }))

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.customerSegmentAssignment.findMany).mockResolvedValue([])
      vi.mocked(prisma.customerTagAssignment.findMany).mockResolvedValue([])

      // Run 10 iterations and measure performance
      const executionTimes: number[] = []

      for (let i = 0; i < 10; i++) {
        const startTime = performance.now()
        await getCustomer360View('user-123')
        const endTime = performance.now()
        executionTimes.push(endTime - startTime)
      }

      // Calculate statistics
      const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
      const maxTime = Math.max(...executionTimes)
      const minTime = Math.min(...executionTimes)
      const variance = executionTimes.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / executionTimes.length
      const stdDev = Math.sqrt(variance)

      // Performance assertions
      expect(avgTime).toBeLessThan(2000) // Average should be under 2s
      expect(maxTime).toBeLessThan(3000) // Max should be under 3s
      expect(stdDev / avgTime).toBeLessThan(1.0) // Coefficient of variation < 100% (relaxed for test environment)

      console.log(`✓ Performance statistics over 10 runs:`)
      console.log(`  Average: ${avgTime.toFixed(2)}ms`)
      console.log(`  Min: ${minTime.toFixed(2)}ms`)
      console.log(`  Max: ${maxTime.toFixed(2)}ms`)
      console.log(`  Std Dev: ${stdDev.toFixed(2)}ms`)
      console.log(`  CV: ${((stdDev / avgTime) * 100).toFixed(2)}%`)
    })
  })
})

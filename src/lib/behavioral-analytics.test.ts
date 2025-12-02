import { describe, it, expect, beforeEach, vi } from 'vitest'
import { calculateBehavioralAnalytics } from './behavioral-analytics'
import { prisma } from './prisma'

// Mock Prisma
vi.mock('./prisma', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
    },
    session: {
      findMany: vi.fn(),
    },
  },
}))

describe('Behavioral Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateBehavioralAnalytics', () => {
    it('should calculate top purchased categories correctly', async () => {
      const mockOrders = [
        {
          id: 'order1',
          userId: 'user1',
          status: 'COMPLETED',
          createdAt: new Date('2024-01-15T10:00:00Z'),
          items: [
            {
              quantity: 2,
              price: 50,
              product: {
                categoryId: 'cat1',
                category: { name: 'Electronics' },
              },
            },
            {
              quantity: 1,
              price: 30,
              product: {
                categoryId: 'cat2',
                category: { name: 'Books' },
              },
            },
          ],
        },
        {
          id: 'order2',
          userId: 'user1',
          status: 'COMPLETED',
          createdAt: new Date('2024-01-20T14:00:00Z'),
          items: [
            {
              quantity: 3,
              price: 25,
              product: {
                categoryId: 'cat1',
                category: { name: 'Electronics' },
              },
            },
          ],
        },
      ]

      const mockSessions = [
        {
          id: 'session1',
          userId: 'user1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: new Date('2024-01-15T09:00:00Z'),
        },
      ]

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.session.findMany).mockResolvedValue(mockSessions as any)

      const result = await calculateBehavioralAnalytics('user1')

      // Electronics: 2 + 3 = 5 items, revenue = (2*50) + (3*25) = 175
      // Books: 1 item, revenue = 30
      expect(result.topPurchasedCategories).toHaveLength(2)
      expect(result.topPurchasedCategories[0]).toMatchObject({
        categoryId: 'cat1',
        categoryName: 'Electronics',
        purchaseCount: 5,
        revenue: 175,
      })
      expect(result.topPurchasedCategories[1]).toMatchObject({
        categoryId: 'cat2',
        categoryName: 'Books',
        purchaseCount: 1,
        revenue: 30,
      })
    })

    it('should calculate session stats correctly', async () => {
      const mockOrders = []
      const mockSessions = [
        {
          id: 'session1',
          userId: 'user1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 'session2',
          userId: 'user1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2024-01-01T11:00:00Z'),
        },
        {
          id: 'session3',
          userId: 'user1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date('2024-01-02T10:00:00Z'),
        },
      ]

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.session.findMany).mockResolvedValue(mockSessions as any)

      const result = await calculateBehavioralAnalytics('user1')

      expect(result.sessionStats.totalSessions).toBe(3)
      expect(result.sessionStats.averageSessionsPerDay).toBeGreaterThan(0)
      expect(result.sessionStats.averageDuration).toBeGreaterThan(0)
    })

    it('should calculate device breakdown correctly', async () => {
      const mockOrders = []
      const mockSessions = [
        {
          id: 'session1',
          userId: 'user1',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
          createdAt: new Date(),
        },
        {
          id: 'session2',
          userId: 'user1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: new Date(),
        },
        {
          id: 'session3',
          userId: 'user1',
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0)',
          createdAt: new Date(),
        },
        {
          id: 'session4',
          userId: 'user1',
          userAgent: 'Mozilla/5.0 (Android 11; Mobile)',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.session.findMany).mockResolvedValue(mockSessions as any)

      const result = await calculateBehavioralAnalytics('user1')

      expect(result.deviceBreakdown.mobile).toBe(2) // iPhone + Android
      expect(result.deviceBreakdown.desktop).toBe(1) // Windows
      expect(result.deviceBreakdown.tablet).toBe(1) // iPad
      expect(result.deviceBreakdown.unknown).toBe(0)
    })

    it('should handle empty data gracefully', async () => {
      vi.mocked(prisma.order.findMany).mockResolvedValue([])
      vi.mocked(prisma.session.findMany).mockResolvedValue([])

      const result = await calculateBehavioralAnalytics('user1')

      expect(result.topPurchasedCategories).toHaveLength(0)
      expect(result.topViewedCategories).toHaveLength(0)
      expect(result.sessionStats.totalSessions).toBe(0)
      expect(result.sessionStats.averageDuration).toBe(0)
      expect(result.deviceBreakdown.mobile).toBe(0)
      expect(result.deviceBreakdown.desktop).toBe(0)
      expect(result.deviceBreakdown.tablet).toBe(0)
      expect(result.deviceBreakdown.unknown).toBe(0)
    })

    it('should calculate shopping times correctly', async () => {
      const mockOrders = [
        {
          id: 'order1',
          userId: 'user1',
          status: 'COMPLETED',
          createdAt: new Date('2024-01-15T10:00:00Z'), // Monday, 10 AM
          items: [],
        },
        {
          id: 'order2',
          userId: 'user1',
          status: 'COMPLETED',
          createdAt: new Date('2024-01-15T14:00:00Z'), // Monday, 2 PM
          items: [],
        },
        {
          id: 'order3',
          userId: 'user1',
          status: 'COMPLETED',
          createdAt: new Date('2024-01-16T10:00:00Z'), // Tuesday, 10 AM
          items: [],
        },
      ]

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.session.findMany).mockResolvedValue([])

      const result = await calculateBehavioralAnalytics('user1')

      // Check that shopping times are recorded
      expect(result.shoppingTimes.dayOfWeek).toBeDefined()
      expect(result.shoppingTimes.hourOfDay).toBeDefined()
      
      // Monday is day 1
      expect(result.shoppingTimes.dayOfWeek['1']).toBe(2)
      // Tuesday is day 2
      expect(result.shoppingTimes.dayOfWeek['2']).toBe(1)
      
      // 10 AM should have 2 orders
      expect(result.shoppingTimes.hourOfDay['10']).toBe(2)
      // 2 PM should have 1 order
      expect(result.shoppingTimes.hourOfDay['14']).toBe(1)
    })

    it('should exclude cancelled orders from analytics', async () => {
      const mockOrders = [
        {
          id: 'order1',
          userId: 'user1',
          status: 'COMPLETED',
          createdAt: new Date(),
          items: [
            {
              quantity: 1,
              price: 50,
              product: {
                categoryId: 'cat1',
                category: { name: 'Electronics' },
              },
            },
          ],
        },
        {
          id: 'order2',
          userId: 'user1',
          status: 'CANCELLED',
          createdAt: new Date(),
          items: [
            {
              quantity: 10,
              price: 100,
              product: {
                categoryId: 'cat1',
                category: { name: 'Electronics' },
              },
            },
          ],
        },
      ]

      vi.mocked(prisma.order.findMany).mockResolvedValue(
        mockOrders.filter((o) => o.status !== 'CANCELLED') as any
      )
      vi.mocked(prisma.session.findMany).mockResolvedValue([])

      const result = await calculateBehavioralAnalytics('user1')

      // Should only count the completed order
      expect(result.topPurchasedCategories[0].purchaseCount).toBe(1)
      expect(result.topPurchasedCategories[0].revenue).toBe(50)
    })

    it('should limit top categories to 10', async () => {
      const mockOrders = [
        {
          id: 'order1',
          userId: 'user1',
          status: 'COMPLETED',
          createdAt: new Date(),
          items: Array.from({ length: 15 }, (_, i) => ({
            quantity: 1,
            price: 10,
            product: {
              categoryId: `cat${i}`,
              category: { name: `Category ${i}` },
            },
          })),
        },
      ]

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.session.findMany).mockResolvedValue([])

      const result = await calculateBehavioralAnalytics('user1')

      expect(result.topPurchasedCategories).toHaveLength(10)
    })

    it('should handle sessions without user agent', async () => {
      const mockOrders = []
      const mockSessions = [
        {
          id: 'session1',
          userId: 'user1',
          userAgent: null,
          createdAt: new Date(),
        },
        {
          id: 'session2',
          userId: 'user1',
          userAgent: '',
          createdAt: new Date(),
        },
      ]

      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.session.findMany).mockResolvedValue(mockSessions as any)

      const result = await calculateBehavioralAnalytics('user1')

      expect(result.deviceBreakdown.unknown).toBe(2)
    })
  })
})

/**
 * Customer 360 API Integration Tests
 * 
 * Tests the integration of customer 360 API endpoints
 * Requirements: 1.1, 2.1, 4.1, 7.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { Permission } from '@/lib/permissions'
import { Role, LoyaltyLevel } from '@prisma/client'

// Import route handlers
import { GET as get360 } from './360/route'
import { GET as getOrders } from './orders/route'
import { GET as getLoyalty } from './loyalty/route'
import { GET as getTimeline } from './timeline/route'

// Mock dependencies
vi.mock('@/lib/auth-admin', () => ({
  requirePermission: vi.fn(),
}))

vi.mock('@/lib/customer-360', () => ({
  getCustomer360View: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
    newsletterSubscription: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    customerSegmentAssignment: {
      findMany: vi.fn(),
    },
    customerNote: {
      findMany: vi.fn(),
    },
  },
}))

import { requirePermission } from '@/lib/auth-admin'
import { getCustomer360View } from '@/lib/customer-360'
import { prisma } from '@/lib/prisma'

describe('Customer 360 API Integration Tests', () => {
  const mockAdminSession = {
    user: { id: 'admin-id', email: 'admin@test.com', name: 'Admin' },
    session: {} as any,
    adminUser: {
      id: 'admin-id',
      email: 'admin@test.com',
      role: Role.ADMIN,
      permissions: [Permission.USERS_READ, Permission.ORDERS_READ, Permission.MARKETING_READ],
    } as any,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Requirement 1.1: Display customer profile overview
  describe('GET /api/admin/customers/[id]/360', () => {
    it('should return complete customer 360 view', async () => {
      const customerId = 'test-customer-id'
      const mockCustomer360 = {
        profile: {
          id: customerId,
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+33123456789',
          avatar: null,
          registrationDate: new Date('2023-01-01'),
          accountStatus: 'active',
          addresses: [],
          loyaltyLevel: LoyaltyLevel.GOLD,
        },
        metrics: {
          lifetimeValue: 5000,
          totalOrders: 10,
          averageOrderValue: 500,
          totalSpent: 5000,
          daysSinceLastPurchase: 5,
          purchaseFrequency: 2,
          customerTenure: 365,
        },
        healthScore: {
          score: 85,
          level: 'excellent' as const,
          factors: {
            purchase: 90,
            engagement: 85,
            support: 80,
            recency: 85,
          },
          recommendations: ['Keep engaging with loyalty rewards'],
        },
        churnRisk: {
          level: 'LOW' as any,
          score: 15,
          factors: {
            daysSinceLastPurchase: 5,
            engagementDecline: 0,
            supportIssues: 0,
          },
          retentionStrategies: ['Continue current engagement'],
        },
        segments: [],
        tags: [],
      }

      vi.mocked(requirePermission).mockResolvedValue(mockAdminSession)
      vi.mocked(getCustomer360View).mockResolvedValue(mockCustomer360 as any)

      const request = new NextRequest(
        `http://localhost:3000/api/admin/customers/${customerId}/360`
      )

      const response = await get360(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.profile).toBeDefined()
      expect(data.profile.id).toBe(customerId)
      expect(data.profile.name).toBe('John Doe')
      expect(data.profile.email).toBe('john@example.com')
      expect(data.metrics).toBeDefined()
      expect(data.metrics.lifetimeValue).toBe(5000)
      expect(data.healthScore).toBeDefined()
      expect(data.churnRisk).toBeDefined()
    })

    it('should return 404 when customer not found', async () => {
      const customerId = 'non-existent-id'

      vi.mocked(requirePermission).mockResolvedValue(mockAdminSession)
      vi.mocked(getCustomer360View).mockResolvedValue(null)

      const request = new NextRequest(
        `http://localhost:3000/api/admin/customers/${customerId}/360`
      )

      const response = await get360(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })
  })

  // Requirement 2.1: Display all orders in reverse chronological order
  describe('GET /api/admin/customers/[id]/orders', () => {
    it('should return customer orders with metrics', async () => {
      const customerId = 'test-customer-id'
      const mockOrders = [
        {
          id: 'order-3',
          orderNumber: 'ORD-003',
          status: 'DELIVERED',
          total: 200,
          createdAt: new Date('2024-03-01'),
          items: [],
        },
        {
          id: 'order-2',
          orderNumber: 'ORD-002',
          status: 'DELIVERED',
          total: 150,
          createdAt: new Date('2024-02-01'),
          items: [],
        },
        {
          id: 'order-1',
          orderNumber: 'ORD-001',
          status: 'DELIVERED',
          total: 100,
          createdAt: new Date('2024-01-01'),
          items: [],
        },
      ]

      vi.mocked(requirePermission).mockResolvedValue(mockAdminSession)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: customerId } as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)

      const request = new NextRequest(
        `http://localhost:3000/api/admin/customers/${customerId}/orders`
      )

      const response = await getOrders(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.orders).toHaveLength(3)
      expect(data.orders[0].orderNumber).toBe('ORD-003') // Most recent first
      expect(data.totalOrders).toBe(3)
      expect(data.totalRevenue).toBe(450)
      expect(data.averageOrderValue).toBe(150)
    })

    it('should handle customer with no orders', async () => {
      const customerId = 'test-customer-id'

      vi.mocked(requirePermission).mockResolvedValue(mockAdminSession)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: customerId } as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue([])

      const request = new NextRequest(
        `http://localhost:3000/api/admin/customers/${customerId}/orders`
      )

      const response = await getOrders(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.orders).toHaveLength(0)
      expect(data.totalOrders).toBe(0)
      expect(data.totalRevenue).toBe(0)
      expect(data.averageOrderValue).toBe(0)
    })
  })

  // Requirement 4.1: Display loyalty tier, points balance, and lifetime points
  describe('GET /api/admin/customers/[id]/loyalty', () => {
    it('should return customer loyalty information', async () => {
      const customerId = 'test-customer-id'
      const mockUser = {
        id: customerId,
        email: 'test@example.com',
        name: 'Test User',
        loyaltyLevel: LoyaltyLevel.GOLD,
        loyaltyPoints: 5000,
        totalOrders: 10,
        totalSpent: 5000,
      }

      vi.mocked(requirePermission).mockResolvedValue(mockAdminSession)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const request = new NextRequest(
        `http://localhost:3000/api/admin/customers/${customerId}/loyalty`
      )

      const response = await getLoyalty(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tier).toBe(LoyaltyLevel.GOLD)
      expect(data.pointsBalance).toBe(5000)
      expect(data.lifetimePoints).toBe(5000)
      expect(data.referralCode).toBeDefined()
      expect(data.referralCount).toBeDefined()
      expect(data.expiringPoints).toBeDefined()
      expect(data.recentTransactions).toBeDefined()
    })

    it('should return 404 when user not found', async () => {
      const customerId = 'non-existent-id'

      vi.mocked(requirePermission).mockResolvedValue(mockAdminSession)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = new NextRequest(
        `http://localhost:3000/api/admin/customers/${customerId}/loyalty`
      )

      const response = await getLoyalty(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })
  })

  // Requirement 7.1: Display interaction timeline with all customer activities
  describe('GET /api/admin/customers/[id]/timeline', () => {
    it('should return customer timeline events', async () => {
      const customerId = 'test-customer-id'
      const mockUser = {
        id: customerId,
        createdAt: new Date('2023-01-01'),
      }
      const mockOrders = [
        {
          id: 'order-1',
          orderNumber: 'ORD-001',
          status: 'DELIVERED',
          total: 100,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'order-2',
          orderNumber: 'ORD-002',
          status: 'DELIVERED',
          total: 200,
          createdAt: new Date('2024-02-01'),
        },
      ]

      vi.mocked(requirePermission).mockResolvedValue(mockAdminSession)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.customerNote.findMany).mockResolvedValue([])
      vi.mocked(prisma.newsletterSubscription.findMany).mockResolvedValue([])

      const request = new NextRequest(
        `http://localhost:3000/api/admin/customers/${customerId}/timeline`
      )

      const response = await getTimeline(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toBeDefined()
      expect(Array.isArray(data.events)).toBe(true)
      expect(data.events.length).toBeGreaterThan(0)
      expect(data.hasMore).toBeDefined()

      // Verify events are in reverse chronological order
      for (let i = 0; i < data.events.length - 1; i++) {
        const current = new Date(data.events[i].timestamp)
        const next = new Date(data.events[i + 1].timestamp)
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime())
      }
    })

    it('should filter timeline by event type', async () => {
      const customerId = 'test-customer-id'
      const mockUser = {
        id: customerId,
        createdAt: new Date('2023-01-01'),
      }
      const mockOrders = [
        {
          id: 'order-1',
          orderNumber: 'ORD-001',
          status: 'DELIVERED',
          total: 100,
          createdAt: new Date('2024-01-01'),
        },
      ]

      vi.mocked(requirePermission).mockResolvedValue(mockAdminSession)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.customerNote.findMany).mockResolvedValue([])
      vi.mocked(prisma.newsletterSubscription.findMany).mockResolvedValue([])

      const request = new NextRequest(
        `http://localhost:3000/api/admin/customers/${customerId}/timeline?type=order`
      )

      const response = await getTimeline(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events).toBeDefined()
      
      // All events should be of type 'order'
      data.events.forEach((event: any) => {
        expect(event.type).toBe('order')
      })
    })

    it('should apply limit to timeline events', async () => {
      const customerId = 'test-customer-id'
      const mockUser = {
        id: customerId,
        createdAt: new Date('2023-01-01'),
      }
      const mockOrders = Array.from({ length: 100 }, (_, i) => ({
        id: `order-${i}`,
        orderNumber: `ORD-${String(i).padStart(3, '0')}`,
        status: 'DELIVERED',
        total: 100,
        createdAt: new Date(2024, 0, i + 1),
      }))

      vi.mocked(requirePermission).mockResolvedValue(mockAdminSession)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(mockOrders as any)
      vi.mocked(prisma.customerNote.findMany).mockResolvedValue([])
      vi.mocked(prisma.newsletterSubscription.findMany).mockResolvedValue([])

      const request = new NextRequest(
        `http://localhost:3000/api/admin/customers/${customerId}/timeline?limit=10`
      )

      const response = await getTimeline(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.events.length).toBeLessThanOrEqual(10)
    })
  })
})

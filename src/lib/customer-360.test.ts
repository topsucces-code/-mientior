/**
 * Customer 360 Service Property-Based Tests
 * 
 * These tests validate the correctness properties of the customer 360 service
 * using property-based testing with fast-check.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { prisma } from './prisma'
import { redis } from './redis'
import {
  getCustomer360View,
  getCustomerMetrics,
  calculateHealthScore,
  calculateChurnRisk,
} from './customer-360'
import { LoyaltyLevel, ChurnRiskLevel } from '@prisma/client'

// Mock prisma and redis
vi.mock('./prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
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

describe('Customer 360 Service - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Feature: customer-360-dashboard, Property 1: Profile data completeness
  // Validates: Requirements 1.1
  describe('Property 1: Profile data completeness', () => {
    it('should always return all required profile fields for any customer', { timeout: 30000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random customer data
          fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            image: fc.option(fc.webUrl(), { nil: null }),
            emailVerified: fc.boolean(),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            loyaltyLevel: fc.constantFrom(
              LoyaltyLevel.BRONZE,
              LoyaltyLevel.SILVER,
              LoyaltyLevel.GOLD,
              LoyaltyLevel.PLATINUM
            ),
            savedAddresses: fc.array(
              fc.record({
                id: fc.uuid(),
                firstName: fc.string({ minLength: 1, maxLength: 50 }),
                lastName: fc.string({ minLength: 1, maxLength: 50 }),
                line1: fc.string({ minLength: 1, maxLength: 100 }),
                line2: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
                city: fc.string({ minLength: 1, maxLength: 50 }),
                postalCode: fc.string({ minLength: 5, maxLength: 10 }),
                country: fc.constant('FR'),
                phone: fc.string({ minLength: 10, maxLength: 15 }),
                isDefault: fc.boolean(),
              }),
              { maxLength: 5 }
            ),
          }),
          async (userData) => {
            // Mock Redis to return null (no cache)
            vi.mocked(redis.get).mockResolvedValue(null)
            vi.mocked(redis.setex).mockResolvedValue('OK')

            // Mock Prisma user query
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              ...userData,
              updatedAt: new Date(),
              firstName: null,
              lastName: null,
              loyaltyPoints: 0,
              totalOrders: 0,
              totalSpent: 0,
              addresses: null,
              recentlyViewed: null,
              wishlist: null,
            } as any)

            // Mock orders query
            vi.mocked(prisma.order.findMany).mockResolvedValue([])

            // Mock segments and tags
            vi.mocked(prisma.customerSegmentAssignment.findMany).mockResolvedValue([])
            vi.mocked(prisma.customerTagAssignment.findMany).mockResolvedValue([])

            // Get customer 360 view
            const result = await getCustomer360View(userData.id)

            // Verify all required profile fields are present
            expect(result.profile).toBeDefined()
            expect(result.profile.id).toBe(userData.id)
            expect(result.profile.name).toBe(userData.name)
            expect(result.profile.email).toBe(userData.email)
            expect(result.profile.registrationDate).toEqual(userData.createdAt)
            expect(result.profile.accountStatus).toBeDefined()
            expect(result.profile.addresses).toBeDefined()
            expect(Array.isArray(result.profile.addresses)).toBe(true)
            expect(result.profile.loyaltyLevel).toBe(userData.loyaltyLevel)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: customer-360-dashboard, Property 2: Metrics calculation accuracy
  // Validates: Requirements 3.1, 3.2
  describe('Property 2: Metrics calculation accuracy', () => {
    it('should calculate lifetime value as sum of all completed order totals', { timeout: 30000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerId: fc.uuid(),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            orders: fc.array(
              fc.record({
                total: fc.float({ min: 10, max: 1000, noNaN: true }),
                createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
              }),
              { minLength: 0, maxLength: 20 }
            ),
          }),
          async ({ customerId, createdAt, orders }) => {
            // Mock user query
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              id: customerId,
              createdAt,
              totalOrders: orders.length,
              totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
            } as any)

            // Mock orders query
            vi.mocked(prisma.order.findMany).mockResolvedValue(
              orders.map((o) => ({
                ...o,
                id: fc.sample(fc.uuid(), 1)[0] || 'order-id',
                status: 'DELIVERED',
              })) as any
            )

            // Calculate metrics
            const metrics = await getCustomerMetrics(customerId)

            // Calculate expected values
            const expectedTotal = orders.reduce((sum, o) => sum + o.total, 0)
            const expectedCount = orders.length
            const expectedAvg = expectedCount > 0 ? expectedTotal / expectedCount : 0

            // Verify calculations
            expect(metrics.lifetimeValue).toBeCloseTo(expectedTotal, 2)
            expect(metrics.totalOrders).toBe(expectedCount)
            expect(metrics.totalSpent).toBeCloseTo(expectedTotal, 2)
            expect(metrics.averageOrderValue).toBeCloseTo(expectedAvg, 2)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Feature: customer-360-dashboard, Property 4: Health score range validity
  // Validates: Requirements 12.1
  describe('Property 4: Health score range validity', () => {
    it('should always return health score between 0 and 100 inclusive', { timeout: 30000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerId: fc.uuid(),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            loyaltyLevel: fc.constantFrom(
              LoyaltyLevel.BRONZE,
              LoyaltyLevel.SILVER,
              LoyaltyLevel.GOLD,
              LoyaltyLevel.PLATINUM
            ),
            loyaltyPoints: fc.integer({ min: 0, max: 10000 }),
            orders: fc.array(
              fc.record({
                total: fc.float({ min: 10, max: 1000, noNaN: true }),
                createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
              }),
              { minLength: 0, maxLength: 50 }
            ),
          }),
          async ({ customerId, createdAt, loyaltyLevel, loyaltyPoints, orders }) => {
            // Mock user queries
            vi.mocked(prisma.user.findUnique)
              .mockResolvedValueOnce({
                id: customerId,
                createdAt,
                totalOrders: orders.length,
                totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
              } as any)
              .mockResolvedValueOnce({
                id: customerId,
                loyaltyLevel,
                loyaltyPoints,
              } as any)

            // Mock orders query
            vi.mocked(prisma.order.findMany).mockResolvedValue(
              orders.map((o) => ({
                ...o,
                id: fc.sample(fc.uuid(), 1)[0] || 'order-id',
                status: 'DELIVERED',
              })) as any
            )

            // Calculate health score
            const healthScore = await calculateHealthScore(customerId)

            // Verify score is in valid range
            expect(healthScore.score).toBeGreaterThanOrEqual(0)
            expect(healthScore.score).toBeLessThanOrEqual(100)

            // Verify all factor scores are also in valid range
            expect(healthScore.factors.purchase).toBeGreaterThanOrEqual(0)
            expect(healthScore.factors.purchase).toBeLessThanOrEqual(100)
            expect(healthScore.factors.engagement).toBeGreaterThanOrEqual(0)
            expect(healthScore.factors.engagement).toBeLessThanOrEqual(100)
            expect(healthScore.factors.support).toBeGreaterThanOrEqual(0)
            expect(healthScore.factors.support).toBeLessThanOrEqual(100)
            expect(healthScore.factors.recency).toBeGreaterThanOrEqual(0)
            expect(healthScore.factors.recency).toBeLessThanOrEqual(100)

            // Verify level matches score
            if (healthScore.score >= 80) {
              expect(healthScore.level).toBe('excellent')
            } else if (healthScore.score >= 60) {
              expect(healthScore.level).toBe('good')
            } else if (healthScore.score >= 40) {
              expect(healthScore.level).toBe('fair')
            } else {
              expect(healthScore.level).toBe('poor')
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Additional property test for churn risk score range
  describe('Property: Churn risk score validity', () => {
    it('should always return churn risk score between 0 and 100 inclusive', { timeout: 30000 }, async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            customerId: fc.uuid(),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            orders: fc.array(
              fc.record({
                total: fc.float({ min: 10, max: 1000, noNaN: true }),
                createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
              }),
              { minLength: 0, maxLength: 50 }
            ),
          }),
          async ({ customerId, createdAt, orders }) => {
            // Mock user query
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              id: customerId,
              createdAt,
              totalOrders: orders.length,
              totalSpent: orders.reduce((sum, o) => sum + o.total, 0),
            } as any)

            // Mock orders query
            vi.mocked(prisma.order.findMany).mockResolvedValue(
              orders.map((o) => ({
                ...o,
                id: fc.sample(fc.uuid(), 1)[0] || 'order-id',
                status: 'DELIVERED',
              })) as any
            )

            // Calculate churn risk
            const churnRisk = await calculateChurnRisk(customerId)

            // Verify score is in valid range
            expect(churnRisk.score).toBeGreaterThanOrEqual(0)
            expect(churnRisk.score).toBeLessThanOrEqual(100)

            // Verify level matches score
            if (churnRisk.score >= 70) {
              expect(churnRisk.level).toBe(ChurnRiskLevel.HIGH)
            } else if (churnRisk.score >= 40) {
              expect(churnRisk.level).toBe(ChurnRiskLevel.MEDIUM)
            } else {
              expect(churnRisk.level).toBe(ChurnRiskLevel.LOW)
            }

            // Verify retention strategies are provided
            expect(Array.isArray(churnRisk.retentionStrategies)).toBe(true)
            expect(churnRisk.retentionStrategies.length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  // Unit Tests for 360 Service
  // Requirements: 3.1, 12.1, 13.1
  describe('Unit Tests', () => {
    describe('getCustomerMetrics', () => {
      it('should calculate metrics correctly for customer with orders', async () => {
        const customerId = 'test-customer-id'
        const createdAt = new Date('2023-01-01')
        const orders = [
          { total: 100, createdAt: new Date('2024-01-01') },
          { total: 200, createdAt: new Date('2024-02-01') },
          { total: 150, createdAt: new Date('2024-03-01') },
        ]

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: customerId,
          createdAt,
          totalOrders: orders.length,
          totalSpent: 450,
        } as any)

        vi.mocked(prisma.order.findMany).mockResolvedValue(
          orders.map((o, i) => ({
            ...o,
            id: `order-${i}`,
            status: 'DELIVERED',
          })) as any
        )

        const metrics = await getCustomerMetrics(customerId)

        expect(metrics.totalOrders).toBe(3)
        expect(metrics.totalSpent).toBe(450)
        expect(metrics.lifetimeValue).toBe(450)
        expect(metrics.averageOrderValue).toBe(150)
        expect(metrics.daysSinceLastPurchase).toBeGreaterThanOrEqual(0)
        expect(metrics.purchaseFrequency).toBeGreaterThan(0)
        expect(metrics.customerTenure).toBeGreaterThan(0)
      })

      it('should handle customer with no orders', async () => {
        const customerId = 'test-customer-id'
        const createdAt = new Date('2023-01-01')

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: customerId,
          createdAt,
          totalOrders: 0,
          totalSpent: 0,
        } as any)

        vi.mocked(prisma.order.findMany).mockResolvedValue([])

        const metrics = await getCustomerMetrics(customerId)

        expect(metrics.totalOrders).toBe(0)
        expect(metrics.totalSpent).toBe(0)
        expect(metrics.lifetimeValue).toBe(0)
        expect(metrics.averageOrderValue).toBe(0)
        expect(metrics.daysSinceLastPurchase).toBe(-1)
        expect(metrics.purchaseFrequency).toBeGreaterThanOrEqual(0)
      })
    })

    describe('calculateHealthScore', () => {
      it('should calculate health score for active customer', async () => {
        const customerId = 'test-customer-id'
        const createdAt = new Date('2023-01-01')
        const orders = [
          { total: 100, createdAt: new Date('2024-11-01') },
          { total: 200, createdAt: new Date('2024-11-15') },
        ]

        vi.mocked(prisma.user.findUnique)
          .mockResolvedValueOnce({
            id: customerId,
            createdAt,
            totalOrders: orders.length,
            totalSpent: 300,
          } as any)
          .mockResolvedValueOnce({
            id: customerId,
            loyaltyLevel: LoyaltyLevel.GOLD,
            loyaltyPoints: 5000,
          } as any)

        vi.mocked(prisma.order.findMany).mockResolvedValue(
          orders.map((o, i) => ({
            ...o,
            id: `order-${i}`,
            status: 'DELIVERED',
          })) as any
        )

        const healthScore = await calculateHealthScore(customerId)

        expect(healthScore.score).toBeGreaterThanOrEqual(0)
        expect(healthScore.score).toBeLessThanOrEqual(100)
        expect(healthScore.level).toBeDefined()
        expect(['excellent', 'good', 'fair', 'poor']).toContain(healthScore.level)
        expect(healthScore.factors.purchase).toBeGreaterThanOrEqual(0)
        expect(healthScore.factors.engagement).toBeGreaterThanOrEqual(0)
        expect(healthScore.factors.support).toBeGreaterThanOrEqual(0)
        expect(healthScore.factors.recency).toBeGreaterThanOrEqual(0)
        expect(Array.isArray(healthScore.recommendations)).toBe(true)
      })

      it('should assign correct level based on score', async () => {
        const customerId = 'test-customer-id'
        const createdAt = new Date('2020-01-01')

        vi.mocked(prisma.user.findUnique)
          .mockResolvedValueOnce({
            id: customerId,
            createdAt,
            totalOrders: 0,
            totalSpent: 0,
          } as any)
          .mockResolvedValueOnce({
            id: customerId,
            loyaltyLevel: LoyaltyLevel.BRONZE,
            loyaltyPoints: 0,
          } as any)

        vi.mocked(prisma.order.findMany).mockResolvedValue([])

        const healthScore = await calculateHealthScore(customerId)

        // Low activity customer should have poor or fair score
        expect(['poor', 'fair']).toContain(healthScore.level)
      })
    })

    describe('calculateChurnRisk', () => {
      it('should calculate churn risk for recent customer', async () => {
        const customerId = 'test-customer-id'
        const createdAt = new Date('2024-01-01')
        const orders = [
          { total: 100, createdAt: new Date('2024-11-01') },
          { total: 200, createdAt: new Date('2024-11-15') },
        ]

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: customerId,
          createdAt,
          totalOrders: orders.length,
          totalSpent: 300,
        } as any)

        vi.mocked(prisma.order.findMany).mockResolvedValue(
          orders.map((o, i) => ({
            ...o,
            id: `order-${i}`,
            status: 'DELIVERED',
          })) as any
        )

        const churnRisk = await calculateChurnRisk(customerId)

        expect(churnRisk.score).toBeGreaterThanOrEqual(0)
        expect(churnRisk.score).toBeLessThanOrEqual(100)
        expect([ChurnRiskLevel.LOW, ChurnRiskLevel.MEDIUM, ChurnRiskLevel.HIGH]).toContain(
          churnRisk.level
        )
        expect(churnRisk.factors.daysSinceLastPurchase).toBeGreaterThanOrEqual(0)
        expect(Array.isArray(churnRisk.retentionStrategies)).toBe(true)
        expect(churnRisk.retentionStrategies.length).toBeGreaterThan(0)
      })

      it('should assign HIGH risk for inactive customer', async () => {
        const customerId = 'test-customer-id'
        const createdAt = new Date('2020-01-01')
        const orders = [
          { total: 100, createdAt: new Date('2023-01-01') }, // Over 90 days ago
        ]

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: customerId,
          createdAt,
          totalOrders: orders.length,
          totalSpent: 100,
        } as any)

        vi.mocked(prisma.order.findMany).mockResolvedValue(
          orders.map((o, i) => ({
            ...o,
            id: `order-${i}`,
            status: 'DELIVERED',
          })) as any
        )

        const churnRisk = await calculateChurnRisk(customerId)

        // Customer with no recent purchases should have high risk
        expect(churnRisk.level).toBe(ChurnRiskLevel.HIGH)
        expect(churnRisk.score).toBeGreaterThanOrEqual(70)
      })

      it('should assign LOW risk for active customer', async () => {
        const customerId = 'test-customer-id'
        const createdAt = new Date('2023-01-01')
        const recentDate = new Date()
        recentDate.setDate(recentDate.getDate() - 5) // 5 days ago

        const orders = [
          { total: 100, createdAt: recentDate },
          { total: 200, createdAt: new Date(recentDate.getTime() - 10 * 24 * 60 * 60 * 1000) },
          { total: 150, createdAt: new Date(recentDate.getTime() - 20 * 24 * 60 * 60 * 1000) },
        ]

        vi.mocked(prisma.user.findUnique).mockResolvedValue({
          id: customerId,
          createdAt,
          totalOrders: orders.length,
          totalSpent: 450,
        } as any)

        vi.mocked(prisma.order.findMany).mockResolvedValue(
          orders.map((o, i) => ({
            ...o,
            id: `order-${i}`,
            status: 'DELIVERED',
          })) as unknown
        )

        const churnRisk = await calculateChurnRisk(customerId)

        // Active customer should have low risk
        expect(churnRisk.level).toBe(ChurnRiskLevel.LOW)
        expect(churnRisk.score).toBeLessThan(40)
      })
    })
  })
})

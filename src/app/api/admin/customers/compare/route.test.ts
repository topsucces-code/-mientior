/**
 * Customer Comparison API Tests
 * 
 * Tests for the customer comparison endpoint including metrics comparison,
 * segment overlap analysis, and 3-customer limit validation.
 * 
 * Requirements: 16.1, 16.2, 16.3
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { requirePermission } from '@/lib/auth-admin'
import { getCustomer360View } from '@/lib/customer-360'
import type { Customer360View } from '@/types/customer-360'
import { LoyaltyLevel, ChurnRiskLevel } from '@prisma/client'

// Mock dependencies
vi.mock('@/lib/auth-admin')
vi.mock('@/lib/customer-360')

const mockRequirePermission = vi.mocked(requirePermission)
const mockGetCustomer360View = vi.mocked(getCustomer360View)

// Mock customer data for testing
const mockCustomer1: Customer360View = {
  profile: {
    id: 'customer1',
    name: 'John Doe',
    email: 'john@example.com',
    registrationDate: new Date('2023-01-01'),
    accountStatus: 'active',
    addresses: [],
    loyaltyLevel: LoyaltyLevel.GOLD,
  },
  metrics: {
    lifetimeValue: 1000,
    totalOrders: 10,
    averageOrderValue: 100,
    totalSpent: 1000,
    daysSinceLastPurchase: 5,
    purchaseFrequency: 2.5,
    customerTenure: 365,
  },
  healthScore: {
    score: 85,
    level: 'excellent',
    factors: { purchase: 80, engagement: 90, support: 85, recency: 85 },
    recommendations: [],
  },
  churnRisk: {
    level: ChurnRiskLevel.LOW,
    score: 20,
    factors: { daysSinceLastPurchase: 5, engagementDecline: 10, supportIssues: 0 },
    retentionStrategies: [],
  },
  segments: [
    { id: 'seg1', name: 'High Value', isAutomatic: true, assignedAt: new Date() },
    { id: 'seg2', name: 'Frequent Buyer', isAutomatic: true, assignedAt: new Date() },
  ],
  tags: [],
}

const mockCustomer2: Customer360View = {
  profile: {
    id: 'customer2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    registrationDate: new Date('2023-02-01'),
    accountStatus: 'active',
    addresses: [],
    loyaltyLevel: LoyaltyLevel.SILVER,
  },
  metrics: {
    lifetimeValue: 500,
    totalOrders: 5,
    averageOrderValue: 100,
    totalSpent: 500,
    daysSinceLastPurchase: 15,
    purchaseFrequency: 1.5,
    customerTenure: 300,
  },
  healthScore: {
    score: 70,
    level: 'good',
    factors: { purchase: 65, engagement: 75, support: 70, recency: 70 },
    recommendations: [],
  },
  churnRisk: {
    level: ChurnRiskLevel.MEDIUM,
    score: 45,
    factors: { daysSinceLastPurchase: 15, engagementDecline: 30, supportIssues: 1 },
    retentionStrategies: [],
  },
  segments: [
    { id: 'seg1', name: 'High Value', isAutomatic: true, assignedAt: new Date() },
    { id: 'seg3', name: 'Regular Customer', isAutomatic: true, assignedAt: new Date() },
  ],
  tags: [],
}

const mockCustomer3: Customer360View = {
  profile: {
    id: 'customer3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    registrationDate: new Date('2023-03-01'),
    accountStatus: 'active',
    addresses: [],
    loyaltyLevel: LoyaltyLevel.BRONZE,
  },
  metrics: {
    lifetimeValue: 200,
    totalOrders: 2,
    averageOrderValue: 100,
    totalSpent: 200,
    daysSinceLastPurchase: 30,
    purchaseFrequency: 0.8,
    customerTenure: 250,
  },
  healthScore: {
    score: 50,
    level: 'fair',
    factors: { purchase: 45, engagement: 55, support: 50, recency: 50 },
    recommendations: [],
  },
  churnRisk: {
    level: ChurnRiskLevel.HIGH,
    score: 75,
    factors: { daysSinceLastPurchase: 30, engagementDecline: 50, supportIssues: 2 },
    retentionStrategies: [],
  },
  segments: [
    { id: 'seg3', name: 'Regular Customer', isAutomatic: true, assignedAt: new Date() },
    { id: 'seg4', name: 'New Customer', isAutomatic: true, assignedAt: new Date() },
  ],
  tags: [],
}

describe('Customer Comparison API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mocks - requirePermission resolves successfully by default
    mockRequirePermission.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockRequirePermission.mockRejectedValue(new Error('Unauthorized'))

      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=customer1,customer2'
      )
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return 403 when user lacks permissions', async () => {
      mockRequirePermission.mockRejectedValue(new Error('Forbidden'))

      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=customer1,customer2'
      )
      const response = await GET(request)

      expect(response.status).toBe(403)
    })
  })

  describe('Input Validation', () => {
    it('should return 400 when customerIds parameter is missing', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare'
      )
      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.message).toBe('customerIds parameter is required')
    })

    it('should return 400 when less than 2 customers provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=customer1'
      )
      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.message).toBe('Invalid customer IDs')
    })

    it('should return 400 when more than 3 customers provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=customer1,customer2,customer3,customer4'
      )
      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.message).toBe('Invalid customer IDs')
    })

    it('should return 400 when invalid customer ID format provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=invalid-id,customer2'
      )
      const response = await GET(request)

      expect(response.status).toBe(400)
    })
  })

  describe('Metrics Comparison', () => {
    it('should successfully compare 2 customers with metrics', async () => {
      mockGetCustomer360View
        .mockResolvedValueOnce(mockCustomer1)
        .mockResolvedValueOnce(mockCustomer2)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=clx1234567890123456,clx1234567890123457'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.customers).toHaveLength(2)
      expect(data.data.metrics).toHaveLength(2)
      expect(data.data.differences).toBeDefined()

      // Check that metrics are correctly compared
      const lifetimeValueDiff = data.data.differences.find(
        (diff: any) => diff.metric === 'lifetimeValue'
      )
      expect(lifetimeValueDiff.values).toEqual([1000, 500])
      expect(lifetimeValueDiff.variance).toBeGreaterThan(0)
    })

    it('should successfully compare 3 customers (maximum limit)', async () => {
      mockGetCustomer360View
        .mockResolvedValueOnce(mockCustomer1)
        .mockResolvedValueOnce(mockCustomer2)
        .mockResolvedValueOnce(mockCustomer3)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=clx1234567890123456,clx1234567890123457,clx1234567890123458'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.success).toBe(true)
      expect(data.data.customers).toHaveLength(3)
      expect(data.data.metrics).toHaveLength(3)

      // Verify all three customers are included
      const customerIds = data.data.customers.map((c: any) => c.id)
      expect(customerIds).toContain('customer1')
      expect(customerIds).toContain('customer2')
      expect(customerIds).toContain('customer3')
    })

    it('should calculate metric differences correctly', async () => {
      mockGetCustomer360View
        .mockResolvedValueOnce(mockCustomer1)
        .mockResolvedValueOnce(mockCustomer2)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=clx1234567890123456,clx1234567890123457'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      // Check that all expected metrics are compared
      const expectedMetrics = [
        'lifetimeValue',
        'totalOrders',
        'averageOrderValue',
        'totalSpent',
        'daysSinceLastPurchase',
        'purchaseFrequency',
        'customerTenure',
      ]

      expectedMetrics.forEach((metric) => {
        const diff = data.data.differences.find((d: any) => d.metric === metric)
        expect(diff).toBeDefined()
        expect(diff.values).toHaveLength(2)
        expect(typeof diff.variance).toBe('number')
      })
    })
  })

  describe('Segment Overlap Analysis', () => {
    it('should identify segment overlap between customers', async () => {
      mockGetCustomer360View
        .mockResolvedValueOnce(mockCustomer1)
        .mockResolvedValueOnce(mockCustomer2)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=clx1234567890123456,clx1234567890123457'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      // Both customers share "High Value" segment
      expect(data.data.segmentOverlap).toContain('High Value')
      expect(data.data.segmentOverlap).toHaveLength(1)
    })

    it('should return empty overlap when customers share no segments', async () => {
      // Create customers with no overlapping segments
      const customer1NoOverlap = {
        ...mockCustomer1,
        segments: [
          { id: 'seg1', name: 'Unique Segment 1', isAutomatic: true, assignedAt: new Date() },
        ],
      }
      const customer2NoOverlap = {
        ...mockCustomer2,
        segments: [
          { id: 'seg2', name: 'Unique Segment 2', isAutomatic: true, assignedAt: new Date() },
        ],
      }

      mockGetCustomer360View
        .mockResolvedValueOnce(customer1NoOverlap)
        .mockResolvedValueOnce(customer2NoOverlap)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=clx1234567890123456,clx1234567890123457'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.data.segmentOverlap).toHaveLength(0)
    })

    it('should find overlap across 3 customers', async () => {
      // Modify customer3 to share a segment with others
      const customer3WithOverlap = {
        ...mockCustomer3,
        segments: [
          { id: 'seg1', name: 'High Value', isAutomatic: true, assignedAt: new Date() },
          { id: 'seg4', name: 'New Customer', isAutomatic: true, assignedAt: new Date() },
        ],
      }

      mockGetCustomer360View
        .mockResolvedValueOnce(mockCustomer1)
        .mockResolvedValueOnce(mockCustomer2)
        .mockResolvedValueOnce(customer3WithOverlap)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=clx1234567890123456,clx1234567890123457,clx1234567890123458'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      // All three customers should share "High Value" segment
      expect(data.data.segmentOverlap).toContain('High Value')
    })
  })

  describe('Error Handling', () => {
    it('should handle customer not found gracefully', async () => {
      mockGetCustomer360View
        .mockResolvedValueOnce(mockCustomer1)
        .mockRejectedValueOnce(new Error('Customer not found'))

      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=clx1234567890123456,clx1234567890123457'
      )
      const response = await GET(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error.message).toBe('At least 2 valid customers required for comparison')
    })

    it('should return 500 on unexpected errors', async () => {
      // Mock both customers to throw errors that will cause Promise.all to fail
      mockGetCustomer360View.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=clx1234567890123456,clx1234567890123457'
      )
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error.message).toBe('Failed to compare customers')
    })
  })

  describe('Data Structure Validation', () => {
    it('should return properly structured comparison data', async () => {
      mockGetCustomer360View
        .mockResolvedValueOnce(mockCustomer1)
        .mockResolvedValueOnce(mockCustomer2)

      const request = new NextRequest(
        'http://localhost:3000/api/admin/customers/compare?customerIds=clx1234567890123456,clx1234567890123457'
      )
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      // Validate response structure
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('customers')
      expect(data.data).toHaveProperty('metrics')
      expect(data.data).toHaveProperty('segmentOverlap')
      expect(data.data).toHaveProperty('differences')

      // Validate customers array
      expect(Array.isArray(data.data.customers)).toBe(true)
      expect(data.data.customers[0]).toHaveProperty('id')
      expect(data.data.customers[0]).toHaveProperty('name')
      expect(data.data.customers[0]).toHaveProperty('email')

      // Validate metrics array
      expect(Array.isArray(data.data.metrics)).toBe(true)
      expect(data.data.metrics[0]).toHaveProperty('lifetimeValue')
      expect(data.data.metrics[0]).toHaveProperty('totalOrders')

      // Validate differences array
      expect(Array.isArray(data.data.differences)).toBe(true)
      if (data.data.differences.length > 0) {
        expect(data.data.differences[0]).toHaveProperty('metric')
        expect(data.data.differences[0]).toHaveProperty('values')
        expect(data.data.differences[0]).toHaveProperty('variance')
      }
    })
  })
})
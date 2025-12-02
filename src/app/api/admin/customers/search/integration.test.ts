import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'
import { prisma } from '@/lib/prisma'
import { LoyaltyLevel } from '@prisma/client'

/**
 * Integration tests for customer search functionality
 * Tests the complete search flow with real database interactions
 * 
 * Requirements:
 * - 15.1: Test search functionality
 * - 15.2: Test filtering combinations
 * - 15.3: Test pagination
 */
describe('Customer Search Integration Tests', () => {
  let testCustomers: any[] = []
  let testSegments: any[] = []
  let testTags: unknown[] = []

  beforeEach(async () => {
    // Set SKIP_AUTH for testing
    process.env.SKIP_AUTH = 'true'
    process.env.NODE_ENV = 'development'

    // Create test segments
    const segment1 = await prisma.customerSegment.create({
      data: {
        name: 'VIP Customers',
        description: 'High value customers',
        criteria: { minSpent: 1000 },
        isAutomatic: false
      }
    })

    const segment2 = await prisma.customerSegment.create({
      data: {
        name: 'New Customers',
        description: 'Recently registered customers',
        criteria: { maxDaysOld: 30 },
        isAutomatic: true
      }
    })

    testSegments = [segment1, segment2]

    // Create test tags
    const tag1 = await prisma.customerTag.create({
      data: {
        name: 'Premium',
        color: '#FF6B00',
        description: 'Premium customers'
      }
    })

    const tag2 = await prisma.customerTag.create({
      data: {
        name: 'Frequent Buyer',
        color: '#1E3A8A',
        description: 'Customers who buy frequently'
      }
    })

    testTags = [tag1, tag2]

    // Create test customers
    const customer1 = await prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        loyaltyLevel: LoyaltyLevel.GOLD,
        loyaltyPoints: 500,
        totalOrders: 10,
        totalSpent: 1250.75,
        emailVerified: true
      }
    })

    const customer2 = await prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        loyaltyLevel: LoyaltyLevel.SILVER,
        loyaltyPoints: 200,
        totalOrders: 5,
        totalSpent: 750.50,
        emailVerified: true
      }
    })

    const customer3 = await prisma.user.create({
      data: {
        email: 'bob.wilson@example.com',
        name: 'Bob Wilson',
        firstName: 'Bob',
        lastName: 'Wilson',
        loyaltyLevel: LoyaltyLevel.BRONZE,
        loyaltyPoints: 50,
        totalOrders: 2,
        totalSpent: 125.25,
        emailVerified: true
      }
    })

    testCustomers = [customer1, customer2, customer3]

    // Create segment assignments
    await prisma.customerSegmentAssignment.create({
      data: {
        customerId: customer1.id,
        segmentId: segment1.id
      }
    })

    await prisma.customerSegmentAssignment.create({
      data: {
        customerId: customer2.id,
        segmentId: segment2.id
      }
    })

    // Create tag assignments
    await prisma.customerTagAssignment.create({
      data: {
        customerId: customer1.id,
        tagId: tag1.id,
        assignedBy: 'test-admin'
      }
    })

    await prisma.customerTagAssignment.create({
      data: {
        customerId: customer1.id,
        tagId: tag2.id,
        assignedBy: 'test-admin'
      }
    })

    await prisma.customerTagAssignment.create({
      data: {
        customerId: customer2.id,
        tagId: tag2.id,
        assignedBy: 'test-admin'
      }
    })

    // Create test orders for last purchase date testing
    await prisma.order.create({
      data: {
        orderNumber: 'ORD-001',
        userId: customer1.id,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        subtotal: 100,
        total: 100,
        createdAt: new Date('2023-12-01')
      }
    })

    await prisma.order.create({
      data: {
        orderNumber: 'ORD-002',
        userId: customer2.id,
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        subtotal: 50,
        total: 50,
        createdAt: new Date('2023-11-15')
      }
    })
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.customerTagAssignment.deleteMany({
      where: {
        customerId: {
          in: testCustomers.map(c => c.id)
        }
      }
    })

    await prisma.customerSegmentAssignment.deleteMany({
      where: {
        customerId: {
          in: testCustomers.map(c => c.id)
        }
      }
    })

    await prisma.order.deleteMany({
      where: {
        userId: {
          in: testCustomers.map(c => c.id)
        }
      }
    })

    await prisma.user.deleteMany({
      where: {
        id: {
          in: testCustomers.map(c => c.id)
        }
      }
    })

    await prisma.customerTag.deleteMany({
      where: {
        id: {
          in: testTags.map(t => t.id)
        }
      }
    })

    await prisma.customerSegment.deleteMany({
      where: {
        id: {
          in: testSegments.map(s => s.id)
        }
      }
    })

    // Reset environment
    delete process.env.SKIP_AUTH
    process.env.NODE_ENV = 'test'
  })

  describe('Search Functionality', () => {
    it('should search customers by name', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?q=John')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(1)
      expect(data.customers[0].name).toBe('John Doe')
      expect(data.customers[0].email).toBe('john.doe@example.com')
      expect(data.pagination.totalCount).toBe(1)
    })

    it('should search customers by email', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?q=jane.smith')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(1)
      expect(data.customers[0].name).toBe('Jane Smith')
      expect(data.customers[0].email).toBe('jane.smith@example.com')
    })

    it('should search customers by order number', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?q=ORD-001')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(1)
      expect(data.customers[0].name).toBe('John Doe')
    })

    it('should return empty results for non-matching search', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?q=nonexistent')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(0)
      expect(data.pagination.totalCount).toBe(0)
    })

    it('should perform case-insensitive search', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?q=JOHN')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(1)
      expect(data.customers[0].name).toBe('John Doe')
    })
  })

  describe('Filtering Combinations', () => {
    it('should filter by loyalty tier', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?tier=GOLD')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(1)
      expect(data.customers[0].loyaltyLevel).toBe('GOLD')
      expect(data.customers[0].name).toBe('John Doe')
    })

    it('should filter by segment', async () => {
      const vipSegment = testSegments.find(s => s.name === 'VIP Customers')
      const request = new NextRequest(`http://localhost:3000/api/admin/customers/search?segment=${vipSegment.id}`)
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(1)
      expect(data.customers[0].name).toBe('John Doe')
      expect(data.customers[0].segments).toContainEqual({
        id: vipSegment.id,
        name: 'VIP Customers'
      })
    })

    it('should filter by tag', async () => {
      const premiumTag = testTags.find(t => t.name === 'Premium')
      const request = new NextRequest(`http://localhost:3000/api/admin/customers/search?tag=${premiumTag.id}`)
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(1)
      expect(data.customers[0].name).toBe('John Doe')
      expect(data.customers[0].tags).toContainEqual({
        id: premiumTag.id,
        name: 'Premium',
        color: '#FF6B00'
      })
    })

    it('should filter by CLV range', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?clvMin=1000&clvMax=2000')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(1)
      expect(data.customers[0].name).toBe('John Doe')
      expect(data.customers[0].totalSpent).toBe(1250.75)
    })

    it('should filter by order count range', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?orderCountMin=8&orderCountMax=15')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(1)
      expect(data.customers[0].name).toBe('John Doe')
      expect(data.customers[0].totalOrders).toBe(10)
    })

    it('should combine multiple filters', async () => {
      const frequentBuyerTag = testTags.find(t => t.name === 'Frequent Buyer')
      const request = new NextRequest(`http://localhost:3000/api/admin/customers/search?tier=GOLD&tag=${frequentBuyerTag.id}&clvMin=1000`)
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(1)
      expect(data.customers[0].name).toBe('John Doe')
      expect(data.customers[0].loyaltyLevel).toBe('GOLD')
      expect(data.customers[0].totalSpent).toBeGreaterThanOrEqual(1000)
      expect(data.customers[0].tags.some(tag => tag.id === frequentBuyerTag.id)).toBe(true)
    })

    it('should return empty results when filters do not match', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?tier=PLATINUM&clvMin=5000')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(0)
      expect(data.pagination.totalCount).toBe(0)
    })

    it('should filter by registration date range', async () => {
      const today = new Date()
      const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      const request = new NextRequest(`http://localhost:3000/api/admin/customers/search?registrationFrom=${thirtyDaysAgo.toISOString()}`)
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      // All test customers should be within the last 30 days since they were just created
      expect(data.customers.length).toBeGreaterThan(0)
      expect(data.pagination.totalCount).toBeGreaterThan(0)
    })
  })

  describe('Pagination', () => {
    it('should paginate results correctly', async () => {
      // Test first page
      const request1 = new NextRequest('http://localhost:3000/api/admin/customers/search?page=1&limit=2')
      const response1 = await GET(request1)

      expect(response1.status).toBe(200)
      const data1 = await response1.json()

      expect(data1.customers).toHaveLength(2)
      expect(data1.pagination.page).toBe(1)
      expect(data1.pagination.limit).toBe(2)
      expect(data1.pagination.totalCount).toBeGreaterThanOrEqual(3)
      expect(data1.pagination.totalPages).toBeGreaterThanOrEqual(2)
      expect(data1.pagination.hasNextPage).toBe(true)
      expect(data1.pagination.hasPreviousPage).toBe(false)

      // Test second page
      const request2 = new NextRequest('http://localhost:3000/api/admin/customers/search?page=2&limit=2')
      const response2 = await GET(request2)

      expect(response2.status).toBe(200)
      const data2 = await response2.json()

      expect(data2.customers.length).toBeGreaterThan(0)
      expect(data2.pagination.page).toBe(2)
      expect(data2.pagination.limit).toBe(2)
      expect(data2.pagination.totalCount).toBeGreaterThanOrEqual(3)
      expect(data2.pagination.totalPages).toBeGreaterThanOrEqual(2)
      expect(data2.pagination.hasNextPage).toBe(false)
      expect(data2.pagination.hasPreviousPage).toBe(true)
    })

    it('should handle empty pages correctly', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?page=10&limit=10')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(0)
      expect(data.pagination.page).toBe(10)
      expect(data.pagination.totalCount).toBeGreaterThanOrEqual(3)
      expect(data.pagination.hasNextPage).toBe(false)
      expect(data.pagination.hasPreviousPage).toBe(true)
    })

    it('should enforce maximum limit', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?limit=200')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.pagination.limit).toBe(100) // Should be capped at 100
    })

    it('should use default pagination values', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.pagination.page).toBe(1)
      expect(data.pagination.limit).toBe(20)
    })
  })

  describe('Response Structure', () => {
    it('should return customers with complete data structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?q=John')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(1)
      const customer = data.customers[0]

      // Check all required fields are present
      expect(customer).toHaveProperty('id')
      expect(customer).toHaveProperty('name')
      expect(customer).toHaveProperty('firstName')
      expect(customer).toHaveProperty('lastName')
      expect(customer).toHaveProperty('email')
      expect(customer).toHaveProperty('loyaltyLevel')
      expect(customer).toHaveProperty('loyaltyPoints')
      expect(customer).toHaveProperty('totalOrders')
      expect(customer).toHaveProperty('totalSpent')
      expect(customer).toHaveProperty('createdAt')
      expect(customer).toHaveProperty('lastPurchaseDate')
      expect(customer).toHaveProperty('segments')
      expect(customer).toHaveProperty('tags')

      // Check segments structure
      expect(Array.isArray(customer.segments)).toBe(true)
      if (customer.segments.length > 0) {
        expect(customer.segments[0]).toHaveProperty('id')
        expect(customer.segments[0]).toHaveProperty('name')
      }

      // Check tags structure
      expect(Array.isArray(customer.tags)).toBe(true)
      if (customer.tags.length > 0) {
        expect(customer.tags[0]).toHaveProperty('id')
        expect(customer.tags[0]).toHaveProperty('name')
        expect(customer.tags[0]).toHaveProperty('color')
      }
    })

    it('should include last purchase date when customer has orders', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?q=John')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(1)
      const customer = data.customers[0]

      expect(customer.lastPurchaseDate).not.toBeNull()
      expect(new Date(customer.lastPurchaseDate)).toBeInstanceOf(Date)
    })

    it('should set last purchase date to null when customer has no orders', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/customers/search?q=Bob')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.customers).toHaveLength(1)
      const customer = data.customers[0]

      expect(customer.lastPurchaseDate).toBeNull()
    })
  })
})
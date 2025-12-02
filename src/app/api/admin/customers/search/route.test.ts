import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'
import { requirePermission } from '@/lib/auth-admin'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { LoyaltyLevel } from '@prisma/client'

// Mock dependencies
vi.mock('@/lib/auth-admin')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      count: vi.fn()
    }
  }
}))

const mockRequirePermission = vi.mocked(requirePermission)
const mockPrisma = vi.mocked(prisma)

describe('GET /api/admin/customers/search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequirePermission.mockResolvedValue({
      user: { id: 'admin-1', email: 'admin@test.com' }
    } as any)
  })

  it('should require USERS_READ permission', async () => {
    mockRequirePermission.mockRejectedValue(new Error('Forbidden'))

    const request = new NextRequest('http://localhost/api/admin/customers/search')
    const response = await GET(request)

    expect(response.status).toBe(403)
    expect(mockRequirePermission).toHaveBeenCalledWith(Permission.USERS_READ)
  })

  it('should validate search parameters', async () => {
    const request = new NextRequest('http://localhost/api/admin/customers/search?page=0&limit=101')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid search parameters')
  })

  it('should search customers by text query', async () => {
    const mockCustomers = [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@test.com',
        firstName: 'John',
        lastName: 'Doe',
        loyaltyLevel: LoyaltyLevel.BRONZE,
        loyaltyPoints: 100,
        totalOrders: 5,
        totalSpent: 500,
        createdAt: new Date(),
        segmentAssignments: [],
        tagAssignments: [],
        orders: []
      }
    ]

    mockPrisma.user.findMany.mockResolvedValue(mockCustomers)
    mockPrisma.user.count.mockResolvedValue(1)

    const request = new NextRequest('http://localhost/api/admin/customers/search?q=john')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.customers).toHaveLength(1)
    expect(data.data.customers[0].name).toBe('John Doe')
  })

  it('should filter by loyalty tier', async () => {
    mockPrisma.user.findMany.mockResolvedValue([])
    mockPrisma.user.count.mockResolvedValue(0)

    const request = new NextRequest('http://localhost/api/admin/customers/search?tier=GOLD')
    await GET(request)

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          loyaltyLevel: LoyaltyLevel.GOLD
        })
      })
    )
  })

  it('should filter by date range', async () => {
    mockPrisma.user.findMany.mockResolvedValue([])
    mockPrisma.user.count.mockResolvedValue(0)

    const from = '2024-01-01T00:00:00Z'
    const to = '2024-12-31T23:59:59Z'
    const request = new NextRequest(
      `http://localhost/api/admin/customers/search?registrationFrom=${from}&registrationTo=${to}`
    )
    await GET(request)

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: new Date(from),
            lte: new Date(to)
          }
        })
      })
    )
  })

  it('should filter by CLV range', async () => {
    mockPrisma.user.findMany.mockResolvedValue([])
    mockPrisma.user.count.mockResolvedValue(0)

    const request = new NextRequest('http://localhost/api/admin/customers/search?clvMin=100&clvMax=1000')
    await GET(request)

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          totalSpent: {
            gte: 100,
            lte: 1000
          }
        })
      })
    )
  })

  it('should handle pagination correctly', async () => {
    mockPrisma.user.findMany.mockResolvedValue([])
    mockPrisma.user.count.mockResolvedValue(100)

    const request = new NextRequest('http://localhost/api/admin/customers/search?page=3&limit=20')
    const response = await GET(request)
    const data = await response.json()

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 40, // (3-1) * 20
        take: 20
      })
    )

    expect(data.data.pagination).toEqual({
      page: 3,
      limit: 20,
      totalCount: 100,
      totalPages: 5,
      hasNextPage: true,
      hasPreviousPage: true
    })
  })

  it('should apply sorting', async () => {
    mockPrisma.user.findMany.mockResolvedValue([])
    mockPrisma.user.count.mockResolvedValue(0)

    const request = new NextRequest('http://localhost/api/admin/customers/search?sortBy=totalSpent&sortOrder=asc')
    await GET(request)

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          totalSpent: 'asc'
        }
      })
    )
  })

  it('should return proper error for database failures', async () => {
    mockPrisma.user.findMany.mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/admin/customers/search')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to search customers')
  })
})
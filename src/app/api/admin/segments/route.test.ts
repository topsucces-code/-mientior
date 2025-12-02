import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'
import { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { checkPermission } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { createSegment } from '@/lib/customer-segmentation'

// Mock dependencies
vi.mock('@/lib/auth-server', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/rbac', () => ({
  checkPermission: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    customerSegment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    keys: vi.fn(),
    del: vi.fn(),
  },
}))

vi.mock('@/lib/customer-segmentation', () => ({
  createSegment: vi.fn(),
}))

vi.mock('@/lib/audit-logger', () => ({
  logAuditEvent: vi.fn(),
}))

describe('GET /api/admin/segments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/admin/segments')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 403 if user lacks permission', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
    } as any)
    vi.mocked(checkPermission).mockResolvedValue(false)

    const request = new NextRequest('http://localhost:3000/api/admin/segments')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('Forbidden')
  })

  it('should return paginated segments from cache if available', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
    } as any)
    vi.mocked(checkPermission).mockResolvedValue(true)

    const cachedData = {
      segments: [
        { id: '1', name: 'VIP Customers', isAutomatic: true },
        { id: '2', name: 'New Customers', isAutomatic: false },
      ],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1, hasMore: false },
    }
    vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData))

    const request = new NextRequest('http://localhost:3000/api/admin/segments')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.segments).toHaveLength(2)
    expect(data.pagination.total).toBe(2)
    expect(prisma.customerSegment.findMany).not.toHaveBeenCalled()
  })

  it('should fetch segments from database if cache miss', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
    } as any)
    vi.mocked(checkPermission).mockResolvedValue(true)
    vi.mocked(redis.get).mockResolvedValue(null)

    const mockSegments = [
      {
        id: '1',
        name: 'VIP Customers',
        isAutomatic: true,
        criteria: {},
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { customers: 50 },
      },
    ]
    vi.mocked(prisma.customerSegment.findMany).mockResolvedValue(mockSegments as any)
    vi.mocked(prisma.customerSegment.count).mockResolvedValue(1)
    vi.mocked(redis.setex).mockResolvedValue('OK')

    const request = new NextRequest('http://localhost:3000/api/admin/segments')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.segments).toHaveLength(1)
    expect(data.segments[0].name).toBe('VIP Customers')
    expect(data.pagination.total).toBe(1)
    expect(redis.setex).toHaveBeenCalled()
  })

  it('should handle pagination parameters correctly', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
    } as any)
    vi.mocked(checkPermission).mockResolvedValue(true)
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(prisma.customerSegment.findMany).mockResolvedValue([])
    vi.mocked(prisma.customerSegment.count).mockResolvedValue(0)

    const request = new NextRequest(
      'http://localhost:3000/api/admin/segments?page=2&limit=10'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(prisma.customerSegment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    )
  })

  it('should filter by isAutomatic parameter', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
    } as any)
    vi.mocked(checkPermission).mockResolvedValue(true)
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(prisma.customerSegment.findMany).mockResolvedValue([])
    vi.mocked(prisma.customerSegment.count).mockResolvedValue(0)

    const request = new NextRequest(
      'http://localhost:3000/api/admin/segments?isAutomatic=true'
    )
    await GET(request)

    expect(prisma.customerSegment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isAutomatic: true,
        }),
      })
    )
  })

  it('should search by name', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
    } as any)
    vi.mocked(checkPermission).mockResolvedValue(true)
    vi.mocked(redis.get).mockResolvedValue(null)
    vi.mocked(prisma.customerSegment.findMany).mockResolvedValue([])
    vi.mocked(prisma.customerSegment.count).mockResolvedValue(0)

    const request = new NextRequest(
      'http://localhost:3000/api/admin/segments?search=VIP'
    )
    await GET(request)

    expect(prisma.customerSegment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: {
            contains: 'VIP',
            mode: 'insensitive',
          },
        }),
      })
    )
  })
})

describe('POST /api/admin/segments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/admin/segments', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 403 if user lacks permission', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
    } as any)
    vi.mocked(checkPermission).mockResolvedValue(false)

    const request = new NextRequest('http://localhost:3000/api/admin/segments', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toContain('Forbidden')
  })

  it('should return 400 for invalid input', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
    } as any)
    vi.mocked(checkPermission).mockResolvedValue(true)

    const request = new NextRequest('http://localhost:3000/api/admin/segments', {
      method: 'POST',
      body: JSON.stringify({
        name: '', // Invalid: empty name
        criteria: {},
        isAutomatic: true,
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Validation failed')
    expect(data.details).toBeDefined()
  })

  it('should create segment successfully', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
    } as any)
    vi.mocked(checkPermission).mockResolvedValue(true)

    const mockSegment = {
      id: 'segment-123',
      name: 'VIP Customers',
      criteria: { loyaltyLevel: ['GOLD', 'PLATINUM'] },
      isAutomatic: true,
      description: 'High-value customers',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(createSegment).mockResolvedValue(mockSegment as any)
    vi.mocked(redis.keys).mockResolvedValue([])

    const request = new NextRequest('http://localhost:3000/api/admin/segments', {
      method: 'POST',
      body: JSON.stringify({
        name: 'VIP Customers',
        criteria: { loyaltyLevel: ['GOLD', 'PLATINUM'] },
        isAutomatic: true,
        description: 'High-value customers',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.segment.name).toBe('VIP Customers')
    expect(createSegment).toHaveBeenCalled()
  })

  it('should return 409 for duplicate segment name', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
    } as any)
    vi.mocked(checkPermission).mockResolvedValue(true)

    const error = new Error('Unique constraint failed')
    vi.mocked(createSegment).mockRejectedValue(error)

    const request = new NextRequest('http://localhost:3000/api/admin/segments', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Existing Segment',
        criteria: {},
        isAutomatic: false,
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toContain('already exists')
  })

  it('should invalidate cache after creating segment', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com', name: 'Test' },
    } as any)
    vi.mocked(checkPermission).mockResolvedValue(true)

    const mockSegment = {
      id: 'segment-123',
      name: 'New Segment',
      criteria: {},
      isAutomatic: false,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(createSegment).mockResolvedValue(mockSegment as any)
    vi.mocked(redis.keys).mockResolvedValue(['cache:key1', 'cache:key2'])
    vi.mocked(redis.del).mockResolvedValue(2)

    const request = new NextRequest('http://localhost:3000/api/admin/segments', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Segment',
        criteria: {},
        isAutomatic: false,
      }),
    })
    await POST(request)

    expect(redis.keys).toHaveBeenCalled()
    expect(redis.del).toHaveBeenCalledWith('cache:key1', 'cache:key2')
  })
})

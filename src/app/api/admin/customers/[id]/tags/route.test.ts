import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth-server'
import { Permission } from '@/lib/permissions'
import * as fc from 'fast-check'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    customerTag: {
      findUnique: vi.fn(),
    },
    customerTagAssignment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth-server', () => ({
  requireAdminAuth: vi.fn(),
}))

vi.mock('@/lib/api-response', async () => {
  const actual = await vi.importActual('@/lib/api-response')
  return actual
})

// Shared mock admin session factory
const createMockAdminSession = (adminId = 'admin-123') => ({
  user: {
    id: adminId,
    email: 'admin@test.com',
    name: 'Admin User',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: null,
  },
  session: {
    id: 'session-123',
    userId: adminId,
    expiresAt: new Date(Date.now() + 86400000),
    token: 'token-123',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  role: 'ADMIN' as const,
  permissions: [Permission.USERS_READ, Permission.USERS_WRITE],
  adminUser: {
    id: 'admin-user-123',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN' as const,
    permissions: null,
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    authUserId: adminId,
  },
})

describe('Customer Tags API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdminAuth).mockResolvedValue(createMockAdminSession())
  })

  describe('GET /api/admin/customers/[id]/tags', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireAdminAuth).mockRejectedValue(new Error('Admin authentication required'))

      const request = new NextRequest('http://localhost:3000/api/admin/customers/user1/tags')
      const response = await GET(request, { params: { id: 'user1' } })

      expect(response.status).toBe(401)
    })

    it('should return 403 if user lacks permission', async () => {
      vi.mocked(requireAdminAuth).mockRejectedValue(new Error('Permission denied: USERS_READ'))

      const request = new NextRequest('http://localhost:3000/api/admin/customers/user1/tags')
      const response = await GET(request, { params: { id: 'user1' } })

      expect(response.status).toBe(403)
    })

    it('should return 404 if customer not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/customers/user1/tags')
      const response = await GET(request, { params: { id: 'user1' } })

      expect(response.status).toBe(404)
    })

    it('should return customer tags', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user1',
      } as any)

      const mockAssignments = [
        {
          id: 'assignment1',
          customerId: 'user1',
          tagId: 'tag1',
          assignedBy: 'admin1',
          assignedAt: new Date('2024-01-01'),
          tag: {
            id: 'tag1',
            name: 'VIP',
            color: '#FF0000',
            description: 'VIP customer',
            createdAt: new Date('2024-01-01'),
          },
        },
      ]

      vi.mocked(prisma.customerTagAssignment.findMany).mockResolvedValue(mockAssignments as any)

      const request = new NextRequest('http://localhost:3000/api/admin/customers/user1/tags')
      const response = await GET(request, { params: { id: 'user1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.tags).toHaveLength(1)
      expect(data.data.tags[0].name).toBe('VIP')
    })
  })

  describe('POST /api/admin/customers/[id]/tags', () => {
    it('should return 401 if not authenticated', async () => {
      vi.mocked(requireAdminAuth).mockRejectedValue(new Error('Admin authentication required'))

      const request = new NextRequest('http://localhost:3000/api/admin/customers/user1/tags', {
        method: 'POST',
        body: JSON.stringify({ tagId: 'tag1' }),
      })
      const response = await POST(request, { params: { id: 'user1' } })

      expect(response.status).toBe(401)
    })

    it('should return 403 if user lacks permission', async () => {
      vi.mocked(requireAdminAuth).mockRejectedValue(new Error('Permission denied: USERS_WRITE'))

      const request = new NextRequest('http://localhost:3000/api/admin/customers/user1/tags', {
        method: 'POST',
        body: JSON.stringify({ tagId: 'tag1' }),
      })
      const response = await POST(request, { params: { id: 'user1' } })

      expect(response.status).toBe(403)
    })

    it('should return 404 if customer not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/customers/user1/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: 'clx1234567890' }),
      })
      const response = await POST(request, { params: { id: 'user1' } })

      expect(response.status).toBe(404)
    })

    it('should return 404 if tag not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user1',
      } as any)
      vi.mocked(prisma.customerTag.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/customers/user1/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: 'clx1234567890' }),
      })
      const response = await POST(request, { params: { id: 'user1' } })

      expect(response.status).toBe(404)
    })

    it('should return 409 if tag already assigned', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user1',
      } as any)
      vi.mocked(prisma.customerTag.findUnique).mockResolvedValue({
        id: 'clx1234567890',
        name: 'VIP',
        color: '#FF0000',
        description: 'VIP customer',
        createdAt: new Date(),
      } as any)
      vi.mocked(prisma.customerTagAssignment.findUnique).mockResolvedValue({
        id: 'assignment1',
        customerId: 'user1',
        tagId: 'clx1234567890',
        assignedBy: 'admin1',
        assignedAt: new Date(),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/customers/user1/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: 'clx1234567890' }),
      })
      const response = await POST(request, { params: { id: 'user1' } })

      expect(response.status).toBe(409)
      const data = await response.json()
      expect(data.error.message).toContain('already assigned')
    })

    it('should successfully assign tag', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user1',
      } as any)
      vi.mocked(prisma.customerTag.findUnique).mockResolvedValue({
        id: 'clx1234567890',
        name: 'VIP',
        color: '#FF0000',
        description: 'VIP customer',
        createdAt: new Date(),
      } as any)
      vi.mocked(prisma.customerTagAssignment.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.customerTagAssignment.create).mockResolvedValue({
        id: 'assignment1',
        customerId: 'user1',
        tagId: 'clx1234567890',
        assignedBy: 'admin-123',
        assignedAt: new Date(),
        tag: {
          id: 'clx1234567890',
          name: 'VIP',
          color: '#FF0000',
          description: 'VIP customer',
          createdAt: new Date(),
        },
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/customers/user1/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: 'clx1234567890' }),
      })
      const response = await POST(request, { params: { id: 'user1' } })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.data.message).toContain('assigned successfully')
    })
  })

  /**
   * **Feature: customer-360-dashboard, Property 8: Tag uniqueness per customer**
   * 
   * Property: For any customer-tag pair, attempting to assign the same tag 
   * twice should always fail with a conflict error.
   * 
   * **Validates: Requirements 8.3, 8.4**
   */
  describe('Property 8: Tag uniqueness per customer', () => {
    it('should prevent duplicate tag assignments for any customer-tag pair', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 999999 }), // customerIndex
          fc.integer({ min: 0, max: 999999 }), // tagIndex
          fc.integer({ min: 0, max: 999999 }), // adminIndex
          async (customerIndex, tagIndex, adminIndex) => {
            // Generate valid CUID-like IDs
            const customerId = `clxcustomer${customerIndex.toString().padStart(12, '0')}`
            const tagId = `clxtag${tagIndex.toString().padStart(17, '0')}`
            const adminId = `clxadmin${adminIndex.toString().padStart(15, '0')}`
            // Setup: Mock admin session
            const adminSession = createMockAdminSession(adminId)
            vi.mocked(requireAdminAuth).mockResolvedValue(adminSession)

            // Mock customer exists
            vi.mocked(prisma.user.findUnique).mockResolvedValue({
              id: customerId,
            } as any)

            // Mock tag exists
            vi.mocked(prisma.customerTag.findUnique).mockResolvedValue({
              id: tagId,
              name: `Tag ${tagId}`,
              color: '#FF0000',
              description: null,
              createdAt: new Date(),
            } as any)

            // First assignment - should succeed (no existing assignment)
            vi.mocked(prisma.customerTagAssignment.findUnique).mockResolvedValueOnce(null)
            vi.mocked(prisma.customerTagAssignment.create).mockResolvedValueOnce({
              id: 'assignment1',
              customerId,
              tagId,
              assignedBy: adminId,
              assignedAt: new Date(),
              tag: {
                id: tagId,
                name: `Tag ${tagId}`,
                color: '#FF0000',
                description: null,
                createdAt: new Date(),
              },
            } as any)

            const request1 = new NextRequest(`http://localhost:3000/api/admin/customers/${customerId}/tags`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tagId }),
            })
            const response1 = await POST(request1, { params: { id: customerId } })
            expect(response1.status).toBe(201)

            // Second assignment - should fail with 409 (assignment already exists)
            vi.mocked(prisma.customerTagAssignment.findUnique).mockResolvedValueOnce({
              id: 'assignment1',
              customerId,
              tagId,
              assignedBy: adminId,
              assignedAt: new Date(),
            } as unknown)

            const request2 = new NextRequest(`http://localhost:3000/api/admin/customers/${customerId}/tags`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tagId }),
            })
            const response2 = await POST(request2, { params: { id: customerId } })
            
            // Property: Attempting to assign the same tag twice should always fail
            expect(response2.status).toBe(409)
            const data = await response2.json()
            expect(data.error.message).toContain('already assigned')
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

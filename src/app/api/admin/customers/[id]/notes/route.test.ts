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
    customerNote: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
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

describe('Customer Notes API - Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdminAuth).mockResolvedValue(createMockAdminSession())
  })

  /**
   * **Feature: customer-360-dashboard, Property 7: Note attribution**
   * 
   * Property: For any customer note created, the system should record 
   * the creating admin's identity and timestamp.
   * 
   * **Validates: Requirements 8.2**
   */
  it('Property 7: Note attribution - all created notes should have author attribution', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random note content
        fc.string({ minLength: 1, maxLength: 500 }),
        // Generate random customer ID
        fc.uuid(),
        // Generate random admin ID
        fc.uuid(),
        async (noteContent, customerId, adminId) => {
          // Setup: Mock admin session with the generated admin ID
          const adminSession = createMockAdminSession(adminId)
          vi.mocked(requireAdminAuth).mockResolvedValue(adminSession)

          // Mock customer exists
          vi.mocked(prisma.user.findUnique).mockResolvedValue({
            id: customerId,
            email: 'customer@test.com',
            name: 'Customer',
            emailVerified: true,
            image: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            firstName: null,
            lastName: null,
            loyaltyLevel: 'BRONZE',
            loyaltyPoints: 0,
            totalOrders: 0,
            totalSpent: 0,
            addresses: null,
            recentlyViewed: null,
            wishlist: null,
          })

          const createdAt = new Date()
          const mockNote = {
            id: 'note-123',
            customerId,
            content: noteContent,
            createdBy: adminId,
            createdAt,
            updatedAt: createdAt,
            author: {
              id: adminId,
              name: 'Admin User',
              email: 'admin@test.com',
              image: null,
            },
          }

          vi.mocked(prisma.customerNote.create).mockResolvedValue(mockNote)

          // Create the note
          const request = new NextRequest('http://localhost:3000/api/admin/customers/123/notes', {
            method: 'POST',
            body: JSON.stringify({ content: noteContent }),
          })

          const response = await POST(request, { params: { id: customerId } })
          const data = await response.json()

          // Property assertion: The created note MUST have author attribution
          // 1. The note must have a createdBy field matching the admin's ID
          expect(data.data.note.createdBy).toBe(adminId)
          
          // 2. The note must have a createdAt timestamp
          expect(data.data.note.createdAt).toBeDefined()
          expect(new Date(data.data.note.createdAt)).toBeInstanceOf(Date)
          
          // 3. The note must include author information
          expect(data.data.note.author).toBeDefined()
          expect(data.data.note.author.id).toBe(adminId)
          
          // 4. The timestamp should be recent (within last minute for this test)
          const noteTimestamp = new Date(data.data.note.createdAt).getTime()
          const now = Date.now()
          expect(noteTimestamp).toBeLessThanOrEqual(now)
          expect(noteTimestamp).toBeGreaterThan(now - 60000) // Within last minute
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    )
  })

  it('Property 7 (edge case): Empty content should be rejected before attribution', async () => {
    const customerId = 'customer-123'
    
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: customerId,
      email: 'customer@test.com',
      name: 'Customer',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName: null,
      lastName: null,
      loyaltyLevel: 'BRONZE',
      loyaltyPoints: 0,
      totalOrders: 0,
      totalSpent: 0,
      addresses: null,
      recentlyViewed: null,
      wishlist: null,
    })

    const request = new NextRequest('http://localhost:3000/api/admin/customers/123/notes', {
      method: 'POST',
      body: JSON.stringify({ content: '' }),
    })

    const response = await POST(request, { params: { id: customerId } })
    const data = await response.json()

    // Empty content should be rejected with validation error
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    
    // Note should not be created, so attribution should not occur
    expect(prisma.customerNote.create).not.toHaveBeenCalled()
  })

  it('Property 7 (edge case): Very long content should be rejected', async () => {
    const customerId = 'customer-123'
    const veryLongContent = 'a'.repeat(5001) // Exceeds 5000 char limit
    
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: customerId,
      email: 'customer@test.com',
      name: 'Customer',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName: null,
      lastName: null,
      loyaltyLevel: 'BRONZE',
      loyaltyPoints: 0,
      totalOrders: 0,
      totalSpent: 0,
      addresses: null,
      recentlyViewed: null,
      wishlist: null,
    })

    const request = new NextRequest('http://localhost:3000/api/admin/customers/123/notes', {
      method: 'POST',
      body: JSON.stringify({ content: veryLongContent }),
    })

    const response = await POST(request, { params: { id: customerId } })
    const data = await response.json()

    // Content too long should be rejected
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    
    // Note should not be created
    expect(prisma.customerNote.create).not.toHaveBeenCalled()
  })
})

describe('Customer Notes API - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(requireAdminAuth).mockResolvedValue(createMockAdminSession())
  })

  describe('POST /api/admin/customers/[id]/notes - Note Creation', () => {
    it('should create a note with correct author attribution', async () => {
      const customerId = 'customer-123'
      const noteContent = 'This is a test note'
      const adminId = 'admin-123'

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: customerId,
        email: 'customer@test.com',
        name: 'Customer',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        firstName: null,
        lastName: null,
        loyaltyLevel: 'BRONZE',
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: 0,
        addresses: null,
        recentlyViewed: null,
        wishlist: null,
      })

      const mockNote = {
        id: 'note-123',
        customerId,
        content: noteContent,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: adminId,
          name: 'Admin User',
          email: 'admin@test.com',
          image: null,
        },
      }

      vi.mocked(prisma.customerNote.create).mockResolvedValue(mockNote)

      const request = new NextRequest('http://localhost:3000/api/admin/customers/123/notes', {
        method: 'POST',
        body: JSON.stringify({ content: noteContent }),
      })

      const response = await POST(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.note.createdBy).toBe(adminId)
      expect(data.data.note.author.id).toBe(adminId)
      expect(prisma.customerNote.create).toHaveBeenCalledWith({
        data: {
          customerId,
          content: noteContent,
          createdBy: adminId,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      })
    })

    it('should reject note creation for non-existent customer', async () => {
      const customerId = 'non-existent-customer'
      const noteContent = 'This note should not be created'

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/customers/123/notes', {
        method: 'POST',
        body: JSON.stringify({ content: noteContent }),
      })

      const response = await POST(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Customer not found')
      expect(prisma.customerNote.create).not.toHaveBeenCalled()
    })
  })

  describe('POST /api/admin/customers/[id]/notes - Permission Checks', () => {
    it('should require USERS_WRITE permission to create notes', async () => {
      const customerId = 'customer-123'
      const noteContent = 'This note requires permission'

      // Mock admin without USERS_WRITE permission
      vi.mocked(requireAdminAuth).mockRejectedValue(
        new Error('Permission denied: USERS_WRITE required')
      )

      const request = new NextRequest('http://localhost:3000/api/admin/customers/123/notes', {
        method: 'POST',
        body: JSON.stringify({ content: noteContent }),
      })

      const response = await POST(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Forbidden')
      expect(prisma.customerNote.create).not.toHaveBeenCalled()
    })

    it('should require authentication to create notes', async () => {
      const customerId = 'customer-123'
      const noteContent = 'This note requires auth'

      vi.mocked(requireAdminAuth).mockRejectedValue(
        new Error('Admin authentication required')
      )

      const request = new NextRequest('http://localhost:3000/api/admin/customers/123/notes', {
        method: 'POST',
        body: JSON.stringify({ content: noteContent }),
      })

      const response = await POST(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Unauthorized')
      expect(prisma.customerNote.create).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/admin/customers/[id]/notes - Note Listing', () => {
    it('should list notes with pagination', async () => {
      const customerId = 'customer-123'
      const mockNotes = [
        {
          id: 'note-1',
          customerId,
          content: 'First note',
          createdBy: 'admin-123',
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          author: {
            id: 'admin-123',
            name: 'Admin User',
            email: 'admin@test.com',
            image: null,
          },
        },
        {
          id: 'note-2',
          customerId,
          content: 'Second note',
          createdBy: 'admin-456',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          author: {
            id: 'admin-456',
            name: 'Another Admin',
            email: 'admin2@test.com',
            image: null,
          },
        },
      ]

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: customerId,
        email: 'customer@test.com',
        name: 'Customer',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        firstName: null,
        lastName: null,
        loyaltyLevel: 'BRONZE',
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: 0,
        addresses: null,
        recentlyViewed: null,
        wishlist: null,
      })

      vi.mocked(prisma.customerNote.count).mockResolvedValue(2)
      vi.mocked(prisma.customerNote.findMany).mockResolvedValue(mockNotes)

      const request = new NextRequest('http://localhost:3000/api/admin/customers/123/notes?page=1&limit=20')

      const response = await GET(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.notes).toHaveLength(2)
      expect(data.meta.page).toBe(1)
      expect(data.meta.limit).toBe(20)
      expect(data.meta.total).toBe(2)
      expect(data.meta.hasMore).toBe(false)
    })

    it('should require USERS_READ permission to list notes', async () => {
      const customerId = 'customer-123'

      vi.mocked(requireAdminAuth).mockRejectedValue(
        new Error('Permission denied: USERS_READ required')
      )

      const request = new NextRequest('http://localhost:3000/api/admin/customers/123/notes')

      const response = await GET(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Forbidden')
    })

    it('should return 404 for non-existent customer', async () => {
      const customerId = 'non-existent-customer'

      // Reset the mock to return successful auth
      vi.mocked(requireAdminAuth).mockResolvedValue(createMockAdminSession())
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/admin/customers/123/notes?page=1&limit=20')

      const response = await GET(request, { params: { id: customerId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error.message).toBe('Customer not found')
    })
  })
})

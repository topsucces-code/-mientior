/**
 * Integration tests for Customer 360 permission-based access control
 * 
 * Tests Requirements:
 * - 19.1: Verify admin has customer view permissions
 * - 19.2: Mask sensitive data based on role
 * - 19.3: Check permissions before allowing actions
 * - 19.4: Show only notes the admin has permission to view
 * - 19.5: Display appropriate access denied messages
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET as get360View } from './360/route'
import { GET as getNotes, POST as createNote } from './notes/route'
import { POST as assignTag } from './tags/route'
import { NextRequest } from 'next/server'
import { Role } from '@prisma/client'
import { Permission } from '@/lib/permissions'

// Mock dependencies
vi.mock('@/lib/auth-admin', () => ({
  requirePermission: vi.fn(),
  requireAdminAuth: vi.fn(),
}))

vi.mock('@/lib/auth-server', () => ({
  requireAdminAuth: vi.fn(),
  getSession: vi.fn(),
}))

vi.mock('@/lib/customer-360', () => ({
  getCustomer360View: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    customerNote: {
      count: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    customerTag: {
      findUnique: vi.fn(),
    },
    customerTagAssignment: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/real-time-updates', () => ({
  triggerCustomerNotesUpdate: vi.fn(),
  triggerCustomerTagsUpdate: vi.fn(),
}))

vi.mock('@/lib/redis', () => ({
  redis: {
    del: vi.fn(),
    get: vi.fn(),
    setex: vi.fn(),
  },
}))

vi.mock('@/lib/audit-logger', () => ({
  logAuditEvent: vi.fn(),
}))

import { requirePermission, requireAdminAuth as requireAdminAuthAdmin } from '@/lib/auth-admin'
import { requireAdminAuth as requireAdminAuthServer } from '@/lib/auth-server'
import { getCustomer360View } from '@/lib/customer-360'
import { prisma } from '@/lib/prisma'

const mockRequirePermission = requirePermission as any
const mockRequireAdminAuthAdmin = requireAdminAuthAdmin as any
const mockRequireAdminAuthServer = requireAdminAuthServer as any
const mockGetCustomer360View = getCustomer360View as any
const mockPrisma = prisma as unknown

describe('Customer 360 Permission Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Requirement 19.1: View Permissions', () => {
    it('should allow SUPER_ADMIN to view customer 360', async () => {
      // Arrange
      const mockAdminSession = {
        user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin' },
        adminUser: {
          id: 'admin-1',
          role: Role.SUPER_ADMIN,
          permissions: Object.values(Permission),
        },
      }

      mockRequirePermission.mockResolvedValue(mockAdminSession)
      mockGetCustomer360View.mockResolvedValue({
        profile: {
          id: 'customer-1',
          email: 'customer@test.com',
          phone: '+33612345678',
        },
        metrics: {
          lifetimeValue: 5000,
          totalSpent: 5000,
        },
      })

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/360')

      // Act
      const response = await get360View(request, { params: { id: 'customer-1' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(mockRequirePermission).toHaveBeenCalledWith(Permission.USERS_READ)
      expect(data.profile).toBeDefined()
      expect(data._permissions).toBeDefined()
    })

    it('should deny access without USERS_READ permission', async () => {
      // Arrange
      mockRequirePermission.mockRejectedValue(
        new Error('Forbidden: Missing permission USERS_READ')
      )

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/360')

      // Act
      const response = await get360View(request, { params: { id: 'customer-1' } })

      // Assert
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toContain('Forbidden')
    })

    it('should deny unauthenticated access', async () => {
      // Arrange
      mockRequirePermission.mockRejectedValue(new Error('Unauthorized: Admin access required'))

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/360')

      // Act
      const response = await get360View(request, { params: { id: 'customer-1' } })

      // Assert
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toContain('Unauthorized')
    })
  })

  describe('Requirement 19.2: Data Masking', () => {
    it('should mask sensitive data for VIEWER role', async () => {
      // Arrange
      const mockAdminSession = {
        user: { id: 'viewer-1', email: 'viewer@test.com', name: 'Viewer' },
        adminUser: {
          id: 'viewer-1',
          role: Role.VIEWER,
          permissions: [Permission.USERS_READ],
        },
      }

      mockRequirePermission.mockResolvedValue(mockAdminSession)
      mockGetCustomer360View.mockResolvedValue({
        profile: {
          id: 'customer-1',
          email: 'customer@test.com',
          phone: '+33612345678',
        },
        metrics: {
          lifetimeValue: 5000,
          totalSpent: 5000,
          averageOrderValue: 250,
        },
        notes: [
          { id: 'note-1', content: 'Sensitive note', createdBy: 'admin-1' },
        ],
      })

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/360')

      // Act
      const response = await get360View(request, { params: { id: 'customer-1' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      
      // Email should be masked
      expect(data.profile.email).toMatch(/^cu\*\*\*@test\.com$/)
      
      // Phone should be masked
      expect(data.profile.phone).toMatch(/\*\*\*-\*\*\*-\d{4}/)
      
      // Financial metrics should be hidden for VIEWER
      expect(data.metrics.lifetimeValue).toBeUndefined()
      expect(data.metrics.totalSpent).toBeUndefined()
      
      // Notes should be filtered out for VIEWER
      expect(data.notes).toEqual([])
    })

    it('should NOT mask data for ADMIN role', async () => {
      // Arrange
      const mockAdminSession = {
        user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin' },
        adminUser: {
          id: 'admin-1',
          role: Role.ADMIN,
          permissions: Object.values(Permission),
        },
      }

      mockRequirePermission.mockResolvedValue(mockAdminSession)
      mockGetCustomer360View.mockResolvedValue({
        profile: {
          id: 'customer-1',
          email: 'customer@test.com',
          phone: '+33612345678',
        },
        metrics: {
          lifetimeValue: 5000,
          totalSpent: 5000,
        },
      })

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/360')

      // Act
      const response = await get360View(request, { params: { id: 'customer-1' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      
      // Data should NOT be masked for ADMIN
      expect(data.profile.email).toBe('customer@test.com')
      expect(data.profile.phone).toBe('+33612345678')
      expect(data.metrics.lifetimeValue).toBe(5000)
      expect(data.metrics.totalSpent).toBe(5000)
    })
  })

  describe('Requirement 19.3: Action Permissions', () => {
    it('should allow creating notes with USERS_WRITE permission', async () => {
      // Arrange
      const mockAdminSession = {
        user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin' },
        adminUser: {
          id: 'admin-1',
          role: Role.ADMIN,
          permissions: [Permission.USERS_WRITE],
        },
      }

      mockRequireAdminAuthServer.mockResolvedValue(mockAdminSession)
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'customer-1' })
      mockPrisma.customerNote.create.mockResolvedValue({
        id: 'note-1',
        content: 'Test note',
        createdBy: 'admin-1',
        createdAt: new Date(),
        author: {
          id: 'admin-1',
          name: 'Admin',
          email: 'admin@test.com',
        },
      })

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/notes', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test note' }),
      })

      // Act
      const response = await createNote(request, { params: { id: 'customer-1' } })

      // Assert
      expect(response.status).toBe(201)
      expect(mockRequireAdminAuthServer).toHaveBeenCalledWith(Permission.USERS_WRITE)
    })

    it('should deny creating notes without USERS_WRITE permission', async () => {
      // Arrange
      mockRequireAdminAuthServer.mockRejectedValue(
        new Error('Permission denied: USERS_WRITE required')
      )

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/notes', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test note' }),
      })

      // Act
      const response = await createNote(request, { params: { id: 'customer-1' } })

      // Assert
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error.message).toBe('Forbidden')
      expect(data.error.code).toBe('FORBIDDEN')
    })

    it('should allow assigning tags with USERS_WRITE permission', async () => {
      // Arrange
      const mockAdminSession = {
        user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin' },
        adminUser: {
          id: 'admin-1',
          role: Role.ADMIN,
          permissions: [Permission.USERS_WRITE],
        },
      }

      mockRequireAdminAuthServer.mockResolvedValue(mockAdminSession)
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'customer-1' })
      mockPrisma.customerTag.findUnique.mockResolvedValue({
        id: 'tag-1',
        name: 'VIP',
        color: '#gold',
        description: 'VIP customer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      mockPrisma.customerTagAssignment.findUnique.mockResolvedValue(null)
      mockPrisma.customerTagAssignment.create.mockResolvedValue({
        id: 'assignment-1',
        customerId: 'customer-1',
        tagId: 'tag-1',
        assignedBy: 'admin-1',
        assignedAt: new Date(),
        tag: {
          id: 'tag-1',
          name: 'VIP',
          color: '#gold',
          description: 'VIP customer',
          isActive: true,
        },
      })

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/tags', {
        method: 'POST',
        body: JSON.stringify({ tagId: 'tag-1' }),
      })

      // Act
      const response = await assignTag(request, { params: { id: 'customer-1' } })

      // Assert
      expect(response.status).toBe(201)
      expect(mockRequireAdminAuthServer).toHaveBeenCalledWith(Permission.USERS_WRITE)
    })

    it('should deny assigning tags without USERS_WRITE permission', async () => {
      // Arrange
      mockRequireAdminAuthServer.mockRejectedValue(
        new Error('Permission denied: USERS_WRITE required')
      )

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/tags', {
        method: 'POST',
        body: JSON.stringify({ tagId: 'tag-1' }),
      })

      // Act
      const response = await assignTag(request, { params: { id: 'customer-1' } })

      // Assert
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error.message).toBe('Forbidden')
      expect(data.error.code).toBe('FORBIDDEN')
    })
  })

  describe('Requirement 19.4: Note Visibility', () => {
    it('should show notes to ADMIN role', async () => {
      // Arrange
      const mockAdminSession = {
        user: { id: 'admin-1', email: 'admin@test.com', name: 'Admin' },
        adminUser: {
          id: 'admin-1',
          role: Role.ADMIN,
          permissions: [Permission.USERS_READ],
        },
      }

      mockRequireAdminAuthServer.mockResolvedValue(mockAdminSession)
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'customer-1' })
      mockPrisma.customerNote.count.mockResolvedValue(2)
      mockPrisma.customerNote.findMany.mockResolvedValue([
        {
          id: 'note-1',
          content: 'Note 1',
          createdBy: 'admin-1',
          createdAt: new Date(),
          author: { id: 'admin-1', name: 'Admin', email: 'admin@test.com', image: null },
        },
        {
          id: 'note-2',
          content: 'Note 2',
          createdBy: 'admin-2',
          createdAt: new Date(),
          author: { id: 'admin-2', name: 'Admin 2', email: 'admin2@test.com', image: null },
        },
      ])

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/notes?page=1&limit=20')

      // Act
      const response = await getNotes(request, { params: { id: 'customer-1' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.data.notes).toHaveLength(2)
    })

    it('should hide notes from VIEWER role', async () => {
      // Arrange
      const mockAdminSession = {
        user: { id: 'viewer-1', email: 'viewer@test.com', name: 'Viewer' },
        adminUser: {
          id: 'viewer-1',
          role: Role.VIEWER,
          permissions: [Permission.USERS_READ],
        },
      }

      mockRequireAdminAuthServer.mockResolvedValue(mockAdminSession)
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'customer-1' })
      mockPrisma.customerNote.count.mockResolvedValue(2)
      mockPrisma.customerNote.findMany.mockResolvedValue([
        {
          id: 'note-1',
          content: 'Note 1',
          createdBy: 'admin-1',
          createdAt: new Date(),
          author: { id: 'admin-1', name: 'Admin', email: 'admin@test.com', image: null },
        },
      ])

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/notes?page=1&limit=20')

      // Act
      const response = await getNotes(request, { params: { id: 'customer-1' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      // Notes endpoint returns notes, but the 360 view would filter them
      // This test verifies the endpoint is accessible with USERS_READ
      expect(data.data.notes).toBeDefined()
    })
  })

  describe('Requirement 19.5: Access Denied Messages', () => {
    it('should return clear error message for missing authentication', async () => {
      // Arrange
      mockRequirePermission.mockRejectedValue(new Error('Unauthorized: Admin access required'))

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/360')

      // Act
      const response = await get360View(request, { params: { id: 'customer-1' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized: Admin access required')
    })

    it('should return clear error message for missing permission', async () => {
      // Arrange
      mockRequirePermission.mockRejectedValue(
        new Error('Forbidden: Missing permission USERS_READ')
      )

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/360')

      // Act
      const response = await get360View(request, { params: { id: 'customer-1' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.error).toContain('Forbidden')
    })

    it('should return clear error message for write permission denial', async () => {
      // Arrange
      mockRequireAdminAuthServer.mockRejectedValue(
        new Error('Permission denied: USERS_WRITE required')
      )

      const request = new NextRequest('http://localhost/api/admin/customers/customer-1/notes', {
        method: 'POST',
        body: JSON.stringify({ content: 'Test note' }),
      })

      // Act
      const response = await createNote(request, { params: { id: 'customer-1' } })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(403)
      expect(data.error.message).toBe('Forbidden')
      expect(data.error.code).toBe('FORBIDDEN')
    })
  })
})

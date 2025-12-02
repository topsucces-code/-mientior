import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import * as authAdmin from '@/lib/auth-admin'
import { Role } from '@prisma/client'

// Mock dependencies
vi.mock('@/lib/auth-admin')

describe('POST /api/admin/check-permission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return can: true when admin has permission', async () => {
    // Mock admin session with SUPER_ADMIN role
    vi.mocked(authAdmin.getAdminSession).mockResolvedValueOnce({
      user: {
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin User',
        image: null,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: 'session-1',
        userId: 'admin-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: 'token-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'test',
      },
      adminUser: {
        id: 'admin-1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: Role.SUPER_ADMIN,
        isActive: true,
        permissions: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        authUserId: 'admin-1',
      },
    })

    const request = new NextRequest('http://localhost:3000/api/admin/check-permission', {
      method: 'POST',
      body: JSON.stringify({
        resource: 'products',
        action: 'read',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ can: true })
  })

  it('should return can: false when admin lacks permission', async () => {
    // Mock admin session with VIEWER role (limited permissions)
    vi.mocked(authAdmin.getAdminSession).mockResolvedValueOnce({
      user: {
        id: 'admin-2',
        email: 'viewer@test.com',
        name: 'Viewer User',
        image: null,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: 'session-2',
        userId: 'admin-2',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: 'token-2',
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'test',
      },
      adminUser: {
        id: 'admin-2',
        email: 'viewer@test.com',
        firstName: 'Viewer',
        lastName: 'User',
        role: Role.VIEWER,
        isActive: true,
        permissions: null,
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        authUserId: 'admin-2',
      },
    })

    const request = new NextRequest('http://localhost:3000/api/admin/check-permission', {
      method: 'POST',
      body: JSON.stringify({
        resource: 'products',
        action: 'delete', // VIEWER doesn't have delete permission
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({ can: false })
  })

  it('should return 401 when not authenticated', async () => {
    vi.mocked(authAdmin.getAdminSession).mockResolvedValueOnce(null)

    const request = new NextRequest('http://localhost:3000/api/admin/check-permission', {
      method: 'POST',
      body: JSON.stringify({
        resource: 'products',
        action: 'read',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({
      can: false,
      message: 'Not authenticated',
    })
  })

  it('should return 400 when resource is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/check-permission', {
      method: 'POST',
      body: JSON.stringify({
        action: 'read',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({
      can: false,
      message: 'Resource and action are required',
    })
  })

  it('should return 400 when action is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/admin/check-permission', {
      method: 'POST',
      body: JSON.stringify({
        resource: 'products',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({
      can: false,
      message: 'Resource and action are required',
    })
  })

  it('should handle errors gracefully', async () => {
    vi.mocked(authAdmin.getAdminSession).mockRejectedValueOnce(
      new Error('Database error')
    )

    const request = new NextRequest('http://localhost:3000/api/admin/check-permission', {
      method: 'POST',
      body: JSON.stringify({
        resource: 'products',
        action: 'read',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({
      can: false,
      message: 'Permission check failed',
    })
  })
})

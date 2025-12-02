import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { getSession } from '@/lib/auth-server'
import { getAdminSession } from '@/lib/auth-admin'
import { prisma } from '@/lib/prisma'

// Mock dependencies
vi.mock('@/lib/auth-server')
vi.mock('@/lib/auth-admin')
vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminUser: {
      findFirst: vi.fn(),
    },
  },
}))

describe('Admin Check API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when no session exists', async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({
      authenticated: false,
      message: 'No session found',
    })
  })

  it('should return 401 when admin user not found', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
      user: {
        id: 'user-1',
        email: 'user@test.com',
        name: 'Test User',
        image: null,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      session: {
        id: 'session-1',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        token: 'token-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      },
    })

    vi.mocked(prisma.adminUser.findFirst).mockResolvedValueOnce(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({
      authenticated: false,
      message: 'Admin user not found',
    })
  })

  it('should return 403 when admin user is inactive', async () => {
    vi.mocked(getSession).mockResolvedValueOnce({
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
        userAgent: 'Test Agent',
      },
    })

    vi.mocked(prisma.adminUser.findFirst).mockResolvedValueOnce({
      id: 'admin-1',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      isActive: false, // Inactive admin
      permissions: null,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      authUserId: 'admin-1',
    } as any)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data).toEqual({
      authenticated: false,
      message: 'Account is deactivated',
    })
  })

  it('should return 200 with user data when admin is active', async () => {
    const mockSession = {
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
        userAgent: 'Test Agent',
      },
    }

    const mockAdminUser = {
      id: 'admin-1',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      isActive: true,
      permissions: null,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      authUserId: 'admin-1',
    }

    vi.mocked(getSession).mockResolvedValueOnce(mockSession)
    vi.mocked(prisma.adminUser.findFirst).mockResolvedValueOnce(mockAdminUser as any)
    vi.mocked(getAdminSession).mockResolvedValueOnce({
      ...mockSession,
      adminUser: mockAdminUser as unknown,
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.authenticated).toBe(true)
    expect(data.user).toMatchObject({
      id: 'admin-1',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
    })
    // Verify permissions array exists and is not empty for SUPER_ADMIN
    expect(Array.isArray(data.user.permissions)).toBe(true)
    expect(data.user.permissions.length).toBeGreaterThan(0)
  })

  it('should handle errors gracefully', async () => {
    vi.mocked(getSession).mockRejectedValueOnce(new Error('Database error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data).toEqual({
      authenticated: false,
      message: 'Authentication check failed',
    })
  })
})

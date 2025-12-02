import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Role } from '@prisma/client'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    adminUser: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signInEmail: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}))

describe('Admin Login API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully login an active admin user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@test.com',
      name: 'Admin User',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockAdminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      isActive: true,
      authUserId: 'user-123',
      permissions: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Mock Better Auth success
    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      user: mockUser,
      token: 'test-token',
      redirect: false,
      url: undefined,
    })

    // Mock admin user lookup
    vi.mocked(prisma.adminUser.findFirst).mockResolvedValue(mockAdminUser)
    vi.mocked(prisma.adminUser.update).mockResolvedValue(mockAdminUser)

    const request = new NextRequest('http://localhost:3000/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user.email).toBe('admin@test.com')
    expect(data.user.role).toBe(Role.ADMIN)
  })

  it('should reject login for invalid credentials', async () => {
    // Mock Better Auth failure
    vi.mocked(auth.api.signInEmail).mockRejectedValue(new Error('Invalid credentials'))

    const request = new NextRequest('http://localhost:3000/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'wrongpassword',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid email or password')
  })

  it('should reject login for non-admin users', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'user@test.com',
      name: 'Regular User',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Mock Better Auth success
    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      user: mockUser,
      token: 'test-token',
      redirect: false,
      url: undefined,
    })

    // Mock no admin user found
    vi.mocked(prisma.adminUser.findFirst).mockResolvedValue(null)
    vi.mocked(auth.api.signOut).mockResolvedValue(undefined as any)

    const request = new NextRequest('http://localhost:3000/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'user@test.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Access denied. Admin privileges required.')
    expect(auth.api.signOut).toHaveBeenCalled()
  })

  it('should reject login for inactive admin users', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@test.com',
      name: 'Admin User',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockAdminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      isActive: false, // Inactive
      authUserId: 'user-123',
      permissions: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Mock Better Auth success
    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      user: mockUser,
      token: 'test-token',
      redirect: false,
      url: undefined,
    })

    // Mock admin user lookup
    vi.mocked(prisma.adminUser.findFirst).mockResolvedValue(mockAdminUser)
    vi.mocked(auth.api.signOut).mockResolvedValue(undefined as any)

    const request = new NextRequest('http://localhost:3000/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Account is deactivated. Please contact support.')
    expect(auth.api.signOut).toHaveBeenCalled()
  })

  it('should update lastLoginAt on successful login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'admin@test.com',
      name: 'Admin User',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockAdminUser = {
      id: 'admin-123',
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      isActive: true,
      authUserId: 'user-123',
      permissions: null,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Mock Better Auth success
    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      user: mockUser,
      token: 'test-token',
      redirect: false,
      url: undefined,
    })

    // Mock admin user lookup and update
    vi.mocked(prisma.adminUser.findFirst).mockResolvedValue(mockAdminUser)
    vi.mocked(prisma.adminUser.update).mockResolvedValue({
      ...mockAdminUser,
      lastLoginAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'password123',
      }),
    })

    await POST(request)

    expect(prisma.adminUser.update).toHaveBeenCalledWith({
      where: { id: 'admin-123' },
      data: { lastLoginAt: expect.any(Date) },
    })
  })
})

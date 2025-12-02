import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    better_auth_users: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    session: {
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      signInEmail: vi.fn(),
    },
  },
}))

vi.mock('@/lib/auth-rate-limit', () => ({
  checkAccountLockout: vi.fn().mockResolvedValue({ isLocked: false }),
  trackFailedLoginAttempt: vi.fn(),
  clearAccountLockout: vi.fn(),
  clearFailedLoginAttempts: vi.fn(),
}))

describe('Login Metadata Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should store IP address and user agent in session on successful login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    }

    const mockToken = 'session-token-abc'

    // Mock successful authentication
    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      user: mockUser,
      token: mockToken,
    } as any)

    // Mock email verification check
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
      emailVerified: true,
      name: mockUser.name,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Mock session update
    vi.mocked(prisma.session.update).mockResolvedValue({} as any)
    vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.45',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        rememberMe: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    // Verify successful login
    expect(response.status).toBe(200)
    expect(data.user).toEqual(mockUser)

    // Verify session was updated with metadata
    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { token: mockToken },
      data: {
        ipAddress: '203.0.113.45',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        updatedAt: expect.any(Date),
      },
    })

    // Verify user updatedAt was updated
    expect(prisma.better_auth_users.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: {
        updatedAt: expect.any(Date),
      },
    })
  })

  it('should handle x-real-ip header when x-forwarded-for is not present', async () => {
    const mockUser = {
      id: 'user-456',
      email: 'user@example.com',
      name: 'Another User',
    }

    const mockToken = 'session-token-xyz'

    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      user: mockUser,
      token: mockToken,
    } as any)

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
      emailVerified: true,
      name: mockUser.name,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.session.update).mockResolvedValue({} as any)
    vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-real-ip': '198.51.100.23',
        'user-agent': 'Chrome/91.0.4472.124',
      },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'SecurePass456!',
        rememberMe: false,
      }),
    })

    await POST(request)

    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { token: mockToken },
      data: {
        ipAddress: '198.51.100.23',
        userAgent: 'Chrome/91.0.4472.124',
        updatedAt: expect.any(Date),
      },
    })
  })

  it('should store null values when IP and user agent headers are missing', async () => {
    const mockUser = {
      id: 'user-789',
      email: 'noheaders@example.com',
      name: 'No Headers User',
    }

    const mockToken = 'session-token-noheaders'

    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      user: mockUser,
      token: mockToken,
    } as any)

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
      emailVerified: true,
      name: mockUser.name,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.session.update).mockResolvedValue({} as any)
    vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: 'noheaders@example.com',
        password: 'Password789!',
        rememberMe: false,
      }),
    })

    await POST(request)

    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { token: mockToken },
      data: {
        ipAddress: null,
        userAgent: null,
        updatedAt: expect.any(Date),
      },
    })
  })

  it('should update metadata even when rememberMe is true', async () => {
    const mockUser = {
      id: 'user-remember',
      email: 'remember@example.com',
      name: 'Remember Me User',
    }

    const mockToken = 'session-token-remember'

    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      user: mockUser,
      token: mockToken,
    } as any)

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
      emailVerified: true,
      name: mockUser.name,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.session.update).mockResolvedValue({} as any)
    vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.0.2.100',
        'user-agent': 'Safari/14.0',
      },
      body: JSON.stringify({
        email: 'remember@example.com',
        password: 'RememberPass123!',
        rememberMe: true,
      }),
    })

    await POST(request)

    // Verify metadata update was called first
    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { token: mockToken },
      data: {
        ipAddress: '192.0.2.100',
        userAgent: 'Safari/14.0',
        updatedAt: expect.any(Date),
      },
    })

    // Verify rememberMe expiry update was also called
    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { token: mockToken },
      data: {
        expiresAt: expect.any(Date),
      },
    })

    // Should be called twice: once for metadata, once for expiry
    expect(prisma.session.update).toHaveBeenCalledTimes(2)
  })

  it('should extract first IP from comma-separated x-forwarded-for list', async () => {
    const mockUser = {
      id: 'user-multi-ip',
      email: 'multiip@example.com',
      name: 'Multi IP User',
    }

    const mockToken = 'session-token-multi'

    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      user: mockUser,
      token: mockToken,
    } as any)

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
      emailVerified: true,
      name: mockUser.name,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.session.update).mockResolvedValue({} as any)
    vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.1, 198.51.100.2, 192.0.2.3',
        'user-agent': 'Firefox/89.0',
      },
      body: JSON.stringify({
        email: 'multiip@example.com',
        password: 'MultiIP123!',
        rememberMe: false,
      }),
    })

    await POST(request)

    // Should extract only the first IP (client IP)
    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { token: mockToken },
      data: {
        ipAddress: '203.0.113.1',
        userAgent: 'Firefox/89.0',
        updatedAt: expect.any(Date),
      },
    })
  })
})

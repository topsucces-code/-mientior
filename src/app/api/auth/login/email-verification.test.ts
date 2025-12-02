import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      update: vi.fn(),
    },
    better_auth_users: {
      findUnique: vi.fn(),
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

describe('POST /api/auth/login - Email Verification Check', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should prevent login when email is not verified', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'unverified@example.com',
      name: 'Unverified User',
      image: null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockToken = 'session-token-123'

    // Mock successful authentication
    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      redirect: false,
      token: mockToken,
      url: undefined,
      user: mockUser,
    })

    // Mock email verification check - user is not verified
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: 'user-123',
      email: 'unverified@example.com',
      name: 'Unverified User',
      image: null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'unverified@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    // Should return 403 with email verification error
    expect(response.status).toBe(403)
    expect(data.error).toBe('Email not verified')
    expect(data.code).toBe('EMAIL_NOT_VERIFIED')
    expect(data.email).toBe('unverified@example.com')

    // Session should not be updated
    expect(prisma.session.update).not.toHaveBeenCalled()
  })

  it('should allow login when email is verified', async () => {
    const mockUser = {
      id: 'user-456',
      email: 'verified@example.com',
      name: 'Verified User',
      image: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockToken = 'session-token-456'

    // Mock successful authentication
    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      redirect: false,
      token: mockToken,
      url: undefined,
      user: mockUser,
    })

    // Mock email verification check - user is verified
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: 'user-456',
      email: 'verified@example.com',
      name: 'Verified User',
      image: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Mock metadata update
    vi.mocked(prisma.session.update).mockResolvedValue({} as any)
    vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as unknown)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'verified@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    // Should return 200 with user data
    expect(response.status).toBe(200)
    expect(data.user.id).toBe(mockUser.id)
    expect(data.user.email).toBe(mockUser.email)
    expect(data.token).toBe(mockToken)
  })

  it('should handle missing emailVerified field gracefully', async () => {
    const mockUser = {
      id: 'user-789',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockToken = 'session-token-789'

    // Mock successful authentication
    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      redirect: false,
      token: mockToken,
      url: undefined,
      user: mockUser,
    })

    // Mock email verification check - user not found (edge case)
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    // Should return 403 when user not found in better_auth_users
    expect(response.status).toBe(403)
    expect(data.error).toBe('Email not verified')
    expect(data.code).toBe('EMAIL_NOT_VERIFIED')
  })
})

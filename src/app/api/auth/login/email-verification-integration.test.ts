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

describe('Email Verification Integration - Login Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete full flow: unverified user attempts login and gets redirected to verification prompt', async () => {
    const mockUser = {
      id: 'user-unverified',
      email: 'unverified@test.com',
      name: 'Unverified User',
      image: null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockToken = 'session-token-unverified'

    // Step 1: User attempts to login with valid credentials
    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      redirect: false,
      token: mockToken,
      url: undefined,
      user: mockUser,
    })

    // Step 2: System checks email verification status
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: 'user-unverified',
      email: 'unverified@test.com',
      name: 'Unverified User',
      image: null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'unverified@test.com',
        password: 'ValidPassword123!',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    // Step 3: Verify response indicates email not verified
    expect(response.status).toBe(403)
    expect(data.error).toBe('Email not verified')
    expect(data.code).toBe('EMAIL_NOT_VERIFIED')
    expect(data.email).toBe('unverified@test.com')

    // Step 4: Verify session was not extended (no rememberMe processing)
    expect(prisma.session.update).not.toHaveBeenCalled()
  })

  it('should allow verified user to login successfully with rememberMe', async () => {
    const mockUser = {
      id: 'user-verified',
      email: 'verified@test.com',
      name: 'Verified User',
      image: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockToken = 'session-token-verified'
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7) // Default 7 days

    // Step 1: User attempts to login with valid credentials and rememberMe
    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      redirect: false,
      token: mockToken,
      url: undefined,
      user: mockUser,
    })

    // Step 2: System checks email verification status - verified
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: 'user-verified',
      email: 'verified@test.com',
      name: 'Verified User',
      image: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Step 3: Mock session update for rememberMe and metadata
    vi.mocked(prisma.session.update).mockResolvedValue({
      id: 'session-id',
      userId: 'user-verified',
      token: mockToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'verified@test.com',
        password: 'ValidPassword123!',
        rememberMe: true,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    // Step 4: Verify successful login
    expect(response.status).toBe(200)
    expect(data.user.id).toBe(mockUser.id)
    expect(data.user.email).toBe(mockUser.email)
    expect(data.token).toBe(mockToken)

    // Step 5: Verify session was updated twice (metadata + expiry)
    expect(prisma.session.update).toHaveBeenCalledTimes(2)
    
    // First call should be for metadata
    expect(prisma.session.update).toHaveBeenNthCalledWith(1, {
      where: { token: mockToken },
      data: {
        ipAddress: null,
        userAgent: null,
        updatedAt: expect.any(Date),
      },
    })
    
    // Second call should be for 30-day expiry
    expect(prisma.session.update).toHaveBeenNthCalledWith(2, {
      where: { token: mockToken },
      data: {
        expiresAt: expect.any(Date),
      },
    })

    // Verify the expiry date is approximately 30 days from now
    const updateCall = vi.mocked(prisma.session.update).mock.calls[1][0]
    const expiresAt = updateCall.data.expiresAt as Date
    const expectedExpiry = new Date()
    expectedExpiry.setDate(expectedExpiry.getDate() + 30)
    
    // Allow 1 minute tolerance for test execution time
    const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiry.getTime())
    expect(timeDiff).toBeLessThan(60000) // Less than 1 minute difference
  })

  it('should handle edge case: user exists but emailVerified field is null', async () => {
    const mockUser = {
      id: 'user-null-verified',
      email: 'nullverified@test.com',
      name: 'Null Verified User',
      image: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockToken = 'session-token-null'

    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      redirect: false,
      token: mockToken,
      url: undefined,
      user: mockUser,
    })

    // Return user with null emailVerified (edge case)
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: 'user-null-verified',
      email: 'nullverified@test.com',
      name: 'Null Verified User',
      image: null,
      emailVerified: null as unknown, // Simulate null value
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nullverified@test.com',
        password: 'ValidPassword123!',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    // Should treat null as unverified
    expect(response.status).toBe(403)
    expect(data.error).toBe('Email not verified')
    expect(data.code).toBe('EMAIL_NOT_VERIFIED')
  })
})

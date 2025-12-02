import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import {
  checkAccountLockout,
  trackFailedLoginAttempt,
  clearAccountLockout,
  clearFailedLoginAttempts,
} from '@/lib/auth-rate-limit'

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

vi.mock('@/lib/auth-rate-limit', () => ({
  checkAccountLockout: vi.fn(),
  trackFailedLoginAttempt: vi.fn(),
  clearAccountLockout: vi.fn(),
  clearFailedLoginAttempts: vi.fn(),
}))

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return error when email or password is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email and password are required')
  })

  it('should return error when credentials are invalid', async () => {
    vi.mocked(checkAccountLockout).mockResolvedValue({
      isLocked: false,
    })

    vi.mocked(trackFailedLoginAttempt).mockResolvedValue(false)

    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      redirect: false,
      token: '',
      url: undefined,
      user: null as any,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid email or password')
  })

  it('should login successfully without rememberMe (7-day session)', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockToken = 'session-token-123'

    vi.mocked(checkAccountLockout).mockResolvedValue({
      isLocked: false,
    })

    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      redirect: false,
      token: mockToken,
      url: undefined,
      user: mockUser,
    })

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.session.update).mockResolvedValue({} as any)
    vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: false,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.id).toBe(mockUser.id)
    expect(data.user.email).toBe(mockUser.email)
    expect(data.user.name).toBe(mockUser.name)
    expect(data.token).toBe(mockToken)
    
    // Verify metadata was updated (session.update called once for metadata)
    expect(prisma.session.update).toHaveBeenCalledWith({
      where: { token: mockToken },
      data: {
        ipAddress: null,
        userAgent: null,
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

  it('should login successfully with rememberMe (30-day session)', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockToken = 'session-token-123'

    vi.mocked(checkAccountLockout).mockResolvedValue({
      isLocked: false,
    })

    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      redirect: false,
      token: mockToken,
      url: undefined,
      user: mockUser,
    })

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.session.update).mockResolvedValue({
      id: 'session-123',
      userId: 'user-123',
      token: mockToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ipAddress: null,
      userAgent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.id).toBe(mockUser.id)
    expect(data.user.email).toBe(mockUser.email)
    expect(data.user.name).toBe(mockUser.name)
    expect(data.token).toBe(mockToken)
    
    // Verify session was updated twice: once for metadata, once for expiry
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
    
    // Allow 1 second difference for test execution time
    const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiry.getTime())
    expect(timeDiff).toBeLessThan(1000)
  })

  it('should return error when email is not verified', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockToken = 'session-token-123'

    vi.mocked(checkAccountLockout).mockResolvedValue({
      isLocked: false,
    })

    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      redirect: false,
      token: mockToken,
      url: undefined,
      user: mockUser,
    })

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Email not verified')
    expect(data.code).toBe('EMAIL_NOT_VERIFIED')
    expect(data.email).toBe('test@example.com')
  })

  it('should return lockout error when account is locked', async () => {
    const lockedUntil = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now

    vi.mocked(checkAccountLockout).mockResolvedValue({
      isLocked: true,
      lockedUntil,
      remainingSeconds: 1800,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'locked@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Account temporarily locked due to too many failed attempts')
    expect(data.code).toBe('ACCOUNT_LOCKED')
    expect(data.lockedUntil).toBe(lockedUntil.toISOString())
    expect(data.remainingSeconds).toBe(1800)
    expect(auth.api.signInEmail).not.toHaveBeenCalled()
  })

  it('should track failed login attempts on invalid credentials', async () => {
    vi.mocked(checkAccountLockout).mockResolvedValue({
      isLocked: false,
    })

    vi.mocked(trackFailedLoginAttempt).mockResolvedValue(false)

    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      redirect: false,
      token: '',
      url: undefined,
      user: null as any,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid email or password')
    expect(trackFailedLoginAttempt).toHaveBeenCalledWith('test@example.com')
  })

  it('should lock account after 5th failed attempt', async () => {
    const lockedUntil = new Date(Date.now() + 30 * 60 * 1000)

    vi.mocked(checkAccountLockout).mockResolvedValueOnce({
      isLocked: false,
    }).mockResolvedValueOnce({
      isLocked: true,
      lockedUntil,
      remainingSeconds: 1800,
    })

    vi.mocked(trackFailedLoginAttempt).mockResolvedValue(true) // 5th attempt triggers lock

    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      redirect: false,
      token: '',
      url: undefined,
      user: null as any,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Account temporarily locked due to too many failed attempts')
    expect(data.code).toBe('ACCOUNT_LOCKED')
    expect(trackFailedLoginAttempt).toHaveBeenCalledWith('test@example.com')
  })

  it('should clear lockout and failed attempts on successful login', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockToken = 'session-token-123'

    vi.mocked(checkAccountLockout).mockResolvedValue({
      isLocked: false,
    })

    vi.mocked(auth.api.signInEmail).mockResolvedValue({
      redirect: false,
      token: mockToken,
      url: undefined,
      user: mockUser,
    })

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      image: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(prisma.session.update).mockResolvedValue({} as any)
    vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(clearAccountLockout).toHaveBeenCalledWith('test@example.com')
    expect(clearFailedLoginAttempts).toHaveBeenCalledWith('test@example.com')
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as verificationToken from '@/lib/verification-token'
import * as email from '@/lib/email'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    better_auth_users: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      create: vi.fn(),
    },
    account: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/verification-token', () => ({
  generateVerificationToken: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendVerificationEmail: vi.fn(),
}))

vi.mock('@/lib/password-validation', () => ({
  validatePassword: vi.fn(() => ({ isValid: true, errors: [] })),
  isPasswordBreached: vi.fn(() => Promise.resolve(false)),
}))

vi.mock('@/lib/captcha-requirement', () => ({
  isCaptchaRequired: vi.fn(() => Promise.resolve(false)),
  trackRegistration: vi.fn(() => Promise.resolve()),
  verifyCaptchaToken: vi.fn(() => Promise.resolve(true)),
}))

vi.mock('@/lib/auth-audit-logger', () => ({
  logRegistration: vi.fn(() => Promise.resolve()),
}))

describe('Registration API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully register a new user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Mock database calls
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.better_auth_users.create).mockResolvedValue(mockUser)
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: mockUser.id,
      email: mockUser.email,
      firstName: 'Test',
      lastName: 'User',
      loyaltyLevel: 'BRONZE',
      loyaltyPoints: 0,
      totalOrders: 0,
      totalSpent: 0,
      addresses: null,
      recentlyViewed: null,
      wishlist: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    vi.mocked(prisma.account.create).mockResolvedValue({
      id: 'account-123',
      userId: mockUser.id,
      accountId: mockUser.id,
      providerId: 'credential',
      password: 'hashed-password',
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      scope: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Mock token generation
    vi.mocked(verificationToken.generateVerificationToken).mockResolvedValue('test-token-123')

    // Mock email sending
    vi.mocked(email.sendVerificationEmail).mockResolvedValue({ success: true })

    // Create request
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      }),
    })

    // Call the API
    const response = await POST(request)
    const data = await response.json()

    // Assertions
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('Account created')
    expect(data.email).toBe('test@example.com')
    expect(data.requiresVerification).toBe(true)

    // Verify database calls
    expect(prisma.better_auth_users.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    })
    expect(prisma.better_auth_users.create).toHaveBeenCalled()
    expect(prisma.user.create).toHaveBeenCalled()
    expect(prisma.account.create).toHaveBeenCalled()

    // Verify token generation
    expect(verificationToken.generateVerificationToken).toHaveBeenCalledWith('test@example.com')

    // Verify email sending
    expect(email.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test User',
        email: 'test@example.com',
        expiresIn: '24 hours',
      })
    )
  })

  it('should reject duplicate email registration', async () => {
    // Mock existing user
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: 'existing-user',
      email: 'existing@example.com',
      name: 'Existing User',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toContain('already exists')
    expect(data.suggestion).toBeDefined()
  })

  it('should validate required fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        // Missing password and name
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('required')
  })

  it('should validate email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'Test User',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid email')
  })
})

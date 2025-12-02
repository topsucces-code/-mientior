import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as verificationToken from '@/lib/verification-token'
import * as email from '@/lib/email'
import * as authRateLimit from '@/lib/auth-rate-limit'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    better_auth_users: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/verification-token', () => ({
  generateVerificationToken: vi.fn(),
  invalidateVerificationTokens: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendVerificationEmail: vi.fn(),
}))

vi.mock('@/lib/auth-rate-limit', () => ({
  rateLimitAuth: vi.fn(),
}))

describe('Resend Verification API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should resend verification email for unverified user', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Mock rate limiting (allow request)
    vi.mocked(authRateLimit.rateLimitAuth).mockResolvedValue({
      allowed: true,
      remaining: 0,
      resetAt: new Date(),
      limit: 1,
    })

    // Mock database call
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)

    // Mock token operations
    vi.mocked(verificationToken.invalidateVerificationTokens).mockResolvedValue()
    vi.mocked(verificationToken.generateVerificationToken).mockResolvedValue('new-token-456')

    // Mock email sending
    vi.mocked(email.sendVerificationEmail).mockResolvedValue({ success: true })

    const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('verification link has been sent')

    // Verify old tokens were invalidated
    expect(verificationToken.invalidateVerificationTokens).toHaveBeenCalledWith('test@example.com')

    // Verify new token was generated
    expect(verificationToken.generateVerificationToken).toHaveBeenCalledWith('test@example.com')

    // Verify email was sent
    expect(email.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test User',
        email: 'test@example.com',
        expiresIn: '24 hours',
      })
    )
  })

  it('should not send email for already verified user but return success', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'verified@example.com',
      name: 'Verified User',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Mock rate limiting (allow request)
    vi.mocked(authRateLimit.rateLimitAuth).mockResolvedValue({
      allowed: true,
      remaining: 0,
      resetAt: new Date(),
      limit: 1,
    })

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({
        email: 'verified@example.com',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    // Should still return success to prevent email enumeration
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Should not send email for verified user
    expect(email.sendVerificationEmail).not.toHaveBeenCalled()
  })

  it('should return success for non-existent email to prevent enumeration', async () => {
    // Mock rate limiting (allow request)
    vi.mocked(authRateLimit.rateLimitAuth).mockResolvedValue({
      allowed: true,
      remaining: 0,
      resetAt: new Date(),
      limit: 1,
    })

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({
        email: 'nonexistent@example.com',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    // Should return success to prevent email enumeration
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Should not send email
    expect(email.sendVerificationEmail).not.toHaveBeenCalled()
  })

  it('should validate required email field', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Email is required')
  })
})

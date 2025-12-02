import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST as verifyEmailPOST } from './route'
import { POST as resendVerificationPOST } from '../resend-verification/route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as verificationToken from '@/lib/verification-token'
import * as email from '@/lib/email'
import * as authRateLimit from '@/lib/auth-rate-limit'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    verification: {
      findFirst: vi.fn(),
    },
    better_auth_users: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('@/lib/verification-token')
vi.mock('@/lib/email')
vi.mock('@/lib/auth-rate-limit')

describe('Email Verification Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should complete full verification flow: register -> verify -> welcome email', async () => {
    const mockEmail = 'newuser@example.com'
    const mockToken = 'verification-token-123'
    const mockUser = {
      id: 'user-123',
      email: mockEmail,
      name: 'New User',
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Step 1: User receives verification email (simulated by registration)
    // Token is generated and stored

    // Step 2: User clicks verification link
    vi.mocked(verificationToken.validateVerificationToken).mockResolvedValue(mockEmail)
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)
    vi.mocked(prisma.better_auth_users.update).mockResolvedValue({
      ...mockUser,
      emailVerified: true,
    })
    vi.mocked(verificationToken.deleteVerificationToken).mockResolvedValue()
    vi.mocked(email.sendWelcomeEmailAuth).mockResolvedValue({ success: true })

    const verifyRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: mockToken }),
    })

    const verifyResponse = await verifyEmailPOST(verifyRequest)
    const verifyData = await verifyResponse.json()

    // Verify the response
    expect(verifyResponse.status).toBe(200)
    expect(verifyData.success).toBe(true)
    expect(verifyData.message).toBe('Email verified successfully')

    // Verify database was updated
    expect(prisma.better_auth_users.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { emailVerified: true },
    })

    // Verify token was deleted
    expect(verificationToken.deleteVerificationToken).toHaveBeenCalledWith(mockToken)

    // Verify welcome email was sent
    expect(email.sendWelcomeEmailAuth).toHaveBeenCalledWith({
      name: mockUser.name,
      email: mockUser.email,
    })
  })

  it('should handle expired token and allow resend', async () => {
    const mockEmail = 'user@example.com'
    const mockExpiredToken = 'expired-token-123'
    const mockUser = {
      id: 'user-123',
      email: mockEmail,
      name: 'Test User',
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Step 1: User tries to verify with expired token
    vi.mocked(verificationToken.validateVerificationToken).mockResolvedValue(null)
    vi.mocked(prisma.verification.findFirst).mockResolvedValue({
      id: 'verification-123',
      identifier: mockEmail,
      value: mockExpiredToken,
      expiresAt: new Date(Date.now() - 1000), // Expired
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const verifyRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: mockExpiredToken }),
    })

    const verifyResponse = await verifyEmailPOST(verifyRequest)
    const verifyData = await verifyResponse.json()

    expect(verifyResponse.status).toBe(400)
    expect(verifyData.error).toBe('Verification link has expired')
    expect(verifyData.expired).toBe(true)

    // Step 2: User requests new verification email
    vi.mocked(authRateLimit.rateLimitAuth).mockResolvedValue({
      allowed: true,
      remaining: 0,
      resetAt: new Date(),
      limit: 1,
    })
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)
    vi.mocked(verificationToken.invalidateVerificationTokens).mockResolvedValue()
    vi.mocked(verificationToken.generateVerificationToken).mockResolvedValue('new-token-456')
    vi.mocked(email.sendVerificationEmail).mockResolvedValue({ success: true })

    const resendRequest = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: mockEmail }),
    })

    const resendResponse = await resendVerificationPOST(resendRequest)
    const resendData = await resendResponse.json()

    expect(resendResponse.status).toBe(200)
    expect(resendData.success).toBe(true)
    expect(verificationToken.invalidateVerificationTokens).toHaveBeenCalledWith(mockEmail)
    expect(verificationToken.generateVerificationToken).toHaveBeenCalledWith(mockEmail)
    expect(email.sendVerificationEmail).toHaveBeenCalled()
  })

  it('should enforce rate limiting on resend verification', async () => {
    const mockEmail = 'user@example.com'

    // Mock rate limit exceeded
    vi.mocked(authRateLimit.rateLimitAuth).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 300000), // 5 minutes from now
      limit: 1,
      retryAfter: 300,
    })

    const resendRequest = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: mockEmail }),
    })

    const resendResponse = await resendVerificationPOST(resendRequest)
    const resendData = await resendResponse.json()

    expect(resendResponse.status).toBe(429)
    expect(resendData.error).toBe('Too many requests. Please try again later.')
    expect(resendData.retryAfter).toBe(300)
    expect(resendResponse.headers.get('Retry-After')).toBe('300')
  })

  it('should handle already verified user gracefully', async () => {
    const mockEmail = 'verified@example.com'
    const mockToken = 'valid-token-123'
    const mockUser = {
      id: 'user-123',
      email: mockEmail,
      name: 'Verified User',
      emailVerified: true, // Already verified
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(verificationToken.validateVerificationToken).mockResolvedValue(mockEmail)
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)

    const verifyRequest = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: mockToken }),
    })

    const verifyResponse = await verifyEmailPOST(verifyRequest)
    const verifyData = await verifyResponse.json()

    expect(verifyResponse.status).toBe(200)
    expect(verifyData.success).toBe(true)
    expect(verifyData.message).toBe('Email already verified')
    expect(verifyData.alreadyVerified).toBe(true)

    // Should not update database or send welcome email
    expect(prisma.better_auth_users.update).not.toHaveBeenCalled()
    expect(email.sendWelcomeEmailAuth).not.toHaveBeenCalled()
  })

  it('should prevent email enumeration on resend', async () => {
    const nonExistentEmail = 'nonexistent@example.com'

    vi.mocked(authRateLimit.rateLimitAuth).mockResolvedValue({
      allowed: true,
      remaining: 0,
      resetAt: new Date(),
      limit: 1,
    })
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(null)

    const resendRequest = new NextRequest('http://localhost:3000/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: nonExistentEmail }),
    })

    const resendResponse = await resendVerificationPOST(resendRequest)
    const resendData = await resendResponse.json()

    // Should return success even though user doesn't exist
    expect(resendResponse.status).toBe(200)
    expect(resendData.success).toBe(true)
    expect(resendData.message).toContain('If an account exists')

    // Should not send email
    expect(email.sendVerificationEmail).not.toHaveBeenCalled()
  })
})

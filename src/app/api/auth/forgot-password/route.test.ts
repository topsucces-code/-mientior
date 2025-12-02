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
  generatePasswordResetToken: vi.fn(),
  invalidatePasswordResetTokens: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendPasswordResetEmail: vi.fn(),
}))

vi.mock('@/lib/auth-rate-limit', () => ({
  rateLimitPasswordReset: vi.fn(),
}))

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    vi.mocked(authRateLimit.rateLimitPasswordReset).mockResolvedValue({
      allowed: true,
      remaining: 2,
      resetAt: new Date(),
      limit: 3,
    })
    
    vi.mocked(verificationToken.invalidatePasswordResetTokens).mockResolvedValue()
    vi.mocked(verificationToken.generatePasswordResetToken).mockResolvedValue('mock-reset-token-123')
    vi.mocked(email.sendPasswordResetEmail).mockResolvedValue({ success: true })
  })

  it('should return 400 if email is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email is required')
  })

  it('should return success message for invalid email format (prevent enumeration)', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('If an account exists with this email, a password reset link has been sent.')
    expect(email.sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it('should return 429 if rate limit exceeded', async () => {
    vi.mocked(authRateLimit.rateLimitPasswordReset).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 3600000),
      limit: 3,
      retryAfter: 3600,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Too many password reset requests. Please try again later.')
    expect(data.retryAfter).toBe(3600)
    expect(response.headers.get('Retry-After')).toBe('3600')
  })

  it('should return success message for non-existent user (prevent enumeration)', async () => {
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('If an account exists with this email, a password reset link has been sent.')
    expect(email.sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it('should send password reset email for existing user', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: {
        'x-forwarded-for': '192.168.1.1',
      },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('If an account exists with this email, a password reset link has been sent.')

    // Verify token generation and email sending
    expect(verificationToken.invalidatePasswordResetTokens).toHaveBeenCalledWith('test@example.com')
    expect(verificationToken.generatePasswordResetToken).toHaveBeenCalledWith('test@example.com')
    expect(email.sendPasswordResetEmail).toHaveBeenCalledWith({
      name: 'Test User',
      email: 'test@example.com',
      resetUrl: expect.stringContaining('/reset-password?token=mock-reset-token-123'),
      expiresIn: '1 hour',
      ipAddress: '192.168.1.1',
    })
  })

  it('should extract IP address from x-real-ip header if x-forwarded-for is not present', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: {
        'x-real-ip': '10.0.0.1',
      },
    })

    await POST(request)

    expect(email.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        ipAddress: '10.0.0.1',
      })
    )
  })

  it('should use "Unknown" as IP address if no headers present', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    await POST(request)

    expect(email.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        ipAddress: 'Unknown',
      })
    )
  })

  it('should return success even if email sending fails (prevent information leakage)', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)
    vi.mocked(email.sendPasswordResetEmail).mockRejectedValue(new Error('Email service error'))

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('If an account exists with this email, a password reset link has been sent.')
  })

  it('should apply rate limiting per email address', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    await POST(request)

    expect(authRateLimit.rateLimitPasswordReset).toHaveBeenCalledWith('test@example.com')
  })

  it('should use cryptographically secure token (32 bytes = 64 hex chars)', async () => {
    const mockUser = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)
    
    // Mock a realistic 64-character hex token
    const secureToken = 'a'.repeat(64)
    vi.mocked(verificationToken.generatePasswordResetToken).mockResolvedValue(secureToken)

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    await POST(request)

    expect(verificationToken.generatePasswordResetToken).toHaveBeenCalledWith('test@example.com')
    expect(email.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        resetUrl: expect.stringContaining(secureToken),
      })
    )
  })
})

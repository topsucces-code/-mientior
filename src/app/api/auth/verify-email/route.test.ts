import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as verificationToken from '@/lib/verification-token'
import * as email from '@/lib/email'

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

vi.mock('@/lib/verification-token', () => ({
  validateVerificationToken: vi.fn(),
  deleteVerificationToken: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendWelcomeEmailAuth: vi.fn(),
}))

describe('POST /api/auth/verify-email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should verify email successfully with valid token', async () => {
    const mockEmail = 'test@example.com'
    const mockToken = 'valid-token-123'
    const mockUser = {
      id: 'user-123',
      email: mockEmail,
      name: 'Test User',
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(verificationToken.validateVerificationToken).mockResolvedValue(mockEmail)
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)
    vi.mocked(prisma.better_auth_users.update).mockResolvedValue({
      ...mockUser,
      emailVerified: true,
    })
    vi.mocked(verificationToken.deleteVerificationToken).mockResolvedValue()
    vi.mocked(email.sendWelcomeEmailAuth).mockResolvedValue({ success: true })

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: mockToken }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Email verified successfully')
    expect(verificationToken.validateVerificationToken).toHaveBeenCalledWith(mockToken)
    expect(prisma.better_auth_users.update).toHaveBeenCalledWith({
      where: { id: mockUser.id },
      data: { emailVerified: true },
    })
    expect(verificationToken.deleteVerificationToken).toHaveBeenCalledWith(mockToken)
    expect(email.sendWelcomeEmailAuth).toHaveBeenCalledWith({
      name: mockUser.name,
      email: mockUser.email,
    })
  })

  it('should return error for missing token', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid verification link')
  })

  it('should return expired error for expired token', async () => {
    const mockToken = 'expired-token-123'

    vi.mocked(verificationToken.validateVerificationToken).mockResolvedValue(null)
    vi.mocked(prisma.verification.findFirst).mockResolvedValue({
      id: 'verification-123',
      identifier: 'test@example.com',
      value: mockToken,
      expiresAt: new Date(Date.now() - 1000), // Expired
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: mockToken }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Verification link has expired')
    expect(data.expired).toBe(true)
  })

  it('should return error for invalid token', async () => {
    const mockToken = 'invalid-token-123'

    vi.mocked(verificationToken.validateVerificationToken).mockResolvedValue(null)
    vi.mocked(prisma.verification.findFirst).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: mockToken }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid verification link')
  })

  it('should return error if user not found', async () => {
    const mockEmail = 'test@example.com'
    const mockToken = 'valid-token-123'

    vi.mocked(verificationToken.validateVerificationToken).mockResolvedValue(mockEmail)
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: mockToken }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })

  it('should handle already verified email gracefully', async () => {
    const mockEmail = 'test@example.com'
    const mockToken = 'valid-token-123'
    const mockUser = {
      id: 'user-123',
      email: mockEmail,
      name: 'Test User',
      emailVerified: true, // Already verified
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(verificationToken.validateVerificationToken).mockResolvedValue(mockEmail)
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: mockToken }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Email already verified')
    expect(data.alreadyVerified).toBe(true)
    expect(prisma.better_auth_users.update).not.toHaveBeenCalled()
  })

  it('should use email prefix as name if user name is not set', async () => {
    const mockEmail = 'testuser@example.com'
    const mockToken = 'valid-token-123'
    const mockUser = {
      id: 'user-123',
      email: mockEmail,
      name: '', // Empty name
      emailVerified: false,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    vi.mocked(verificationToken.validateVerificationToken).mockResolvedValue(mockEmail)
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)
    vi.mocked(prisma.better_auth_users.update).mockResolvedValue({
      ...mockUser,
      emailVerified: true,
    })
    vi.mocked(verificationToken.deleteVerificationToken).mockResolvedValue()
    vi.mocked(email.sendWelcomeEmailAuth).mockResolvedValue({ success: true })

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: mockToken }),
    })

    await POST(request)

    expect(email.sendWelcomeEmailAuth).toHaveBeenCalledWith({
      name: 'testuser',
      email: mockEmail,
    })
  })
})

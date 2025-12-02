import { describe, it, expect, beforeEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password-validation'

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    better_auth_users: {
      findUnique: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    session: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    verification: {
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
    passwordHistory: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

// Mock Redis
vi.mock('@/lib/redis', () => ({
  redis: {
    del: vi.fn().mockResolvedValue(1),
  },
}))

// Mock password validation to avoid calling real breach API
vi.mock('@/lib/password-validation', async () => {
  const actual = await vi.importActual<typeof import('@/lib/password-validation')>('@/lib/password-validation')
  return {
    ...actual,
    isPasswordBreached: vi.fn().mockResolvedValue(false),
  }
})

// Import after mocks are set up
const { POST } = await import('./route')

describe('POST /api/auth/reset-password', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockAccount = {
    id: 'account-123',
    userId: 'user-123',
    accountId: 'test@example.com',
    providerId: 'credential',
    password: '$2a$12$oldPasswordHash',
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scope: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully reset password with valid token', async () => {
    const token = 'valid-reset-token'
    // Use a very unique password that won't be in breach databases
    const newPassword = 'MyV3ry$ecureP@ssw0rd2024!'

    // Mock token validation
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)
    
    vi.mocked(prisma.verification.findFirst).mockResolvedValue({
      id: 'verification-123',
      identifier: mockUser.email,
      value: token,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Mock user lookup
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)

    // Mock account lookup
    vi.mocked(prisma.account.findFirst).mockResolvedValue(mockAccount)

    // Mock password history check (no reuse)
    vi.mocked(prisma.passwordHistory.findMany).mockResolvedValue([])

    // Mock account update
    vi.mocked(prisma.account.updateMany).mockResolvedValue({ count: 1 })

    // Mock password history creation
    vi.mocked(prisma.passwordHistory.create).mockResolvedValue({
      id: 'history-123',
      userId: mockUser.id,
      hash: mockAccount.password,
      createdAt: new Date(),
    })

    // Mock session lookup and deletion
    vi.mocked(prisma.session.findMany).mockResolvedValue([
      { token: 'session-1' } as any,
      { token: 'session-2' } as any,
    ])
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 2 })

    // Mock token deletion
    vi.mocked(prisma.verification.deleteMany).mockResolvedValue({ count: 1 })

    const request = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        password: newPassword,
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Password has been reset successfully')

    // Verify password was updated
    expect(prisma.account.updateMany).toHaveBeenCalledWith({
      where: {
        userId: mockUser.id,
        providerId: 'credential',
      },
      data: {
        password: expect.any(String),
      },
    })

    // Verify old password was added to history
    expect(prisma.passwordHistory.create).toHaveBeenCalled()

    // Verify sessions were invalidated
    expect(prisma.session.deleteMany).toHaveBeenCalled()

    // Verify token was deleted
    expect(prisma.verification.deleteMany).toHaveBeenCalled()
  })

  it('should reject invalid or expired token', async () => {
    const token = 'invalid-token'
    const newPassword = 'NewPassword123!'

    // Mock token validation failure
    vi.mocked(prisma.verification.findFirst).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        password: newPassword,
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid or expired reset token')
    expect(data.code).toBe('TOKEN_INVALID')
  })

  it('should reject password that does not meet requirements', async () => {
    const token = 'valid-reset-token'
    const weakPassword = 'weak' // Too short, no uppercase, no numbers, no special chars

    // Mock token validation
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)
    
    vi.mocked(prisma.verification.findFirst).mockResolvedValue({
      id: 'verification-123',
      identifier: mockUser.email,
      value: token,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Mock user lookup
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)

    const request = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        password: weakPassword,
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Password does not meet requirements')
    expect(data.code).toBe('PASSWORD_INVALID')
    expect(data.details).toBeDefined()
    expect(Array.isArray(data.details)).toBe(true)
  })

  it('should reject reused password', async () => {
    const token = 'valid-reset-token'
    const reusedPassword = 'OldPassword123!'

    // Mock token validation
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)
    
    vi.mocked(prisma.verification.findFirst).mockResolvedValue({
      id: 'verification-123',
      identifier: mockUser.email,
      value: token,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Mock user lookup
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)

    // Mock password history check (password was used before)
    const oldHash = await hashPassword(reusedPassword)
    vi.mocked(prisma.passwordHistory.findMany).mockResolvedValue([
      {
        id: 'history-1',
        userId: mockUser.id,
        hash: oldHash,
        createdAt: new Date(),
      },
    ])

    const request = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        password: reusedPassword,
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Please choose a password you haven\'t used recently')
    expect(data.code).toBe('PASSWORD_REUSED')
  })

  it('should reject breached password', async () => {
    const token = 'valid-reset-token'
    const breachedPassword = 'Password123!' // Common breached password

    // Mock token validation
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)
    
    vi.mocked(prisma.verification.findFirst).mockResolvedValue({
      id: 'verification-123',
      identifier: mockUser.email,
      value: token,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Mock user lookup
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)

    // Mock password history check (no reuse)
    vi.mocked(prisma.passwordHistory.findMany).mockResolvedValue([])

    // Mock breach detection for this specific test
    const passwordValidation = await import('@/lib/password-validation')
    vi.mocked(passwordValidation.isPasswordBreached).mockResolvedValueOnce(true)

    const request = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        password: breachedPassword,
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Password does not meet requirements')
    expect(data.code).toBe('PASSWORD_INVALID')
    expect(data.details).toContain(
      'This password has been found in data breaches, please choose a different one'
    )
  })

  it('should require both token and password', async () => {
    const request = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: 'some-token',
        // Missing password
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Token and password are required')
  })

  it('should invalidate all sessions except current one', async () => {
    const token = 'valid-reset-token'
    // Use a very unique password that won't be in breach databases
    const newPassword = 'MyV3ry$ecureP@ssw0rd2024!'
    const currentSessionToken = 'current-session-token'

    // Mock token validation
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)
    
    vi.mocked(prisma.verification.findFirst).mockResolvedValue({
      id: 'verification-123',
      identifier: mockUser.email,
      value: token,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Mock user lookup
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(mockUser)

    // Mock account lookup
    vi.mocked(prisma.account.findFirst).mockResolvedValue(mockAccount)

    // Mock password history check (no reuse)
    vi.mocked(prisma.passwordHistory.findMany).mockResolvedValue([])

    // Mock account update
    vi.mocked(prisma.account.updateMany).mockResolvedValue({ count: 1 })

    // Mock password history creation
    vi.mocked(prisma.passwordHistory.create).mockResolvedValue({
      id: 'history-123',
      userId: mockUser.id,
      hash: mockAccount.password,
      createdAt: new Date(),
    })

    // Mock session lookup and deletion
    vi.mocked(prisma.session.findMany).mockResolvedValue([
      { token: 'other-session-1' } as any,
      { token: 'other-session-2' } as any,
    ])
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 2 })

    // Mock token deletion
    vi.mocked(prisma.verification.deleteMany).mockResolvedValue({ count: 1 })

    const request = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${currentSessionToken}`,
      },
      body: JSON.stringify({
        token,
        password: newPassword,
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify sessions were looked up and invalidated except current one
    expect(prisma.session.findMany).toHaveBeenCalledWith({
      where: {
        userId: mockUser.id,
        token: {
          not: currentSessionToken,
        },
      },
      select: { token: true },
    })
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: mockUser.id,
        token: {
          not: currentSessionToken,
        },
      },
    })
  })

  it('should handle user not found', async () => {
    const token = 'valid-reset-token'
    const newPassword = 'NewPassword123!'

    // Mock token validation
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)
    
    vi.mocked(prisma.verification.findFirst).mockResolvedValue({
      id: 'verification-123',
      identifier: 'nonexistent@example.com',
      value: token,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Mock user lookup failure
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        password: newPassword,
      }),
    })

    const response = await POST(request as any)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
    expect(data.code).toBe('USER_NOT_FOUND')
  })
})

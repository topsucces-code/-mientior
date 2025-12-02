import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectAndAlertNewDevice } from './new-device-detection'

// Mock dependencies
vi.mock('./prisma', () => ({
  prisma: {
    session: {
      findMany: vi.fn(),
    },
    better_auth_users: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('./email', () => ({
  sendSecurityAlertEmail: vi.fn(),
}))

vi.mock('./login-metadata', () => ({
  extractIpAddress: vi.fn(),
  extractUserAgent: vi.fn(),
}))

import { prisma } from './prisma'
import { sendSecurityAlertEmail } from './email'
import { extractIpAddress, extractUserAgent } from './login-metadata'

describe('detectAndAlertNewDevice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not send alert if IP and user agent have been seen before', async () => {
    const mockRequest = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0 Chrome',
      },
    })

    vi.mocked(extractIpAddress).mockReturnValue('192.168.1.1')
    vi.mocked(extractUserAgent).mockReturnValue('Mozilla/5.0 Chrome')

    // Mock finding previous sessions with same IP
    vi.mocked(prisma.session.findMany).mockResolvedValue([
      {
        id: 'session-1',
        token: 'old-token',
        userId: 'user-1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Chrome',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(),
      },
    ] as any)

    await detectAndAlertNewDevice('user-1', mockRequest, 'current-token')

    // Should not send email
    expect(sendSecurityAlertEmail).not.toHaveBeenCalled()
  })

  it('should send alert for new device/location', async () => {
    const mockRequest = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '10.0.0.1',
        'user-agent': 'Mozilla/5.0 Firefox',
      },
    })

    vi.mocked(extractIpAddress).mockReturnValue('10.0.0.1')
    vi.mocked(extractUserAgent).mockReturnValue('Mozilla/5.0 Firefox')

    // Mock no previous sessions found
    vi.mocked(prisma.session.findMany).mockResolvedValue([])

    // Mock user lookup
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.mocked(sendSecurityAlertEmail).mockResolvedValue({ success: true })

    await detectAndAlertNewDevice('user-1', mockRequest, 'current-token')

    // Should send email
    expect(sendSecurityAlertEmail).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john@example.com',
      deviceInfo: expect.stringContaining('Firefox'),
      location: 'IP: 10.0.0.1',
      ipAddress: '10.0.0.1',
      timestamp: expect.any(String),
    })
  })

  it('should not fail if IP or user agent is missing', async () => {
    const mockRequest = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
    })

    vi.mocked(extractIpAddress).mockReturnValue(null)
    vi.mocked(extractUserAgent).mockReturnValue(null)

    // Should not throw
    await expect(
      detectAndAlertNewDevice('user-1', mockRequest, 'current-token')
    ).resolves.not.toThrow()

    // Should not send email
    expect(sendSecurityAlertEmail).not.toHaveBeenCalled()
  })

  it('should not fail if user is not found', async () => {
    const mockRequest = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '10.0.0.1',
        'user-agent': 'Mozilla/5.0 Chrome',
      },
    })

    vi.mocked(extractIpAddress).mockReturnValue('10.0.0.1')
    vi.mocked(extractUserAgent).mockReturnValue('Mozilla/5.0 Chrome')
    vi.mocked(prisma.session.findMany).mockResolvedValue([])
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue(null)

    // Should not throw
    await expect(
      detectAndAlertNewDevice('user-1', mockRequest, 'current-token')
    ).resolves.not.toThrow()

    // Should not send email
    expect(sendSecurityAlertEmail).not.toHaveBeenCalled()
  })

  it('should handle email sending errors gracefully', async () => {
    const mockRequest = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'x-forwarded-for': '10.0.0.1',
        'user-agent': 'Mozilla/5.0 Chrome',
      },
    })

    vi.mocked(extractIpAddress).mockReturnValue('10.0.0.1')
    vi.mocked(extractUserAgent).mockReturnValue('Mozilla/5.0 Chrome')
    vi.mocked(prisma.session.findMany).mockResolvedValue([])
    vi.mocked(prisma.better_auth_users.findUnique).mockResolvedValue({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      emailVerified: true,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Mock email sending failure
    vi.mocked(sendSecurityAlertEmail).mockRejectedValue(new Error('Email service unavailable'))

    // Should not throw - errors are caught internally
    await expect(
      detectAndAlertNewDevice('user-1', mockRequest, 'current-token')
    ).resolves.not.toThrow()
  })
})

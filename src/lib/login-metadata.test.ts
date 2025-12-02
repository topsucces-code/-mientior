import { describe, it, expect, beforeEach, vi } from 'vitest'
import { extractIpAddress, extractUserAgent, updateLoginMetadata } from './login-metadata'
import { prisma } from './prisma'

// Mock prisma
vi.mock('./prisma', () => ({
  prisma: {
    session: {
      update: vi.fn(),
    },
    better_auth_users: {
      update: vi.fn(),
    },
  },
}))

describe('Login Metadata Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('extractIpAddress', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      })

      const ip = extractIpAddress(request)
      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header when x-forwarded-for is not present', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      })

      const ip = extractIpAddress(request)
      expect(ip).toBe('192.168.1.2')
    })

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2',
        },
      })

      const ip = extractIpAddress(request)
      expect(ip).toBe('192.168.1.1')
    })

    it('should return null when no IP headers are present', () => {
      const request = new Request('http://localhost')

      const ip = extractIpAddress(request)
      expect(ip).toBeNull()
    })

    it('should handle multiple IPs in x-forwarded-for and return the first one', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.0.2.1',
        },
      })

      const ip = extractIpAddress(request)
      expect(ip).toBe('203.0.113.1')
    })

    it('should trim whitespace from IP addresses', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '  192.168.1.1  , 10.0.0.1',
        },
      })

      const ip = extractIpAddress(request)
      expect(ip).toBe('192.168.1.1')
    })
  })

  describe('extractUserAgent', () => {
    it('should extract user agent from headers', () => {
      const userAgentString = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      const request = new Request('http://localhost', {
        headers: {
          'user-agent': userAgentString,
        },
      })

      const userAgent = extractUserAgent(request)
      expect(userAgent).toBe(userAgentString)
    })

    it('should return null when user agent is not present', () => {
      const request = new Request('http://localhost')

      const userAgent = extractUserAgent(request)
      expect(userAgent).toBeNull()
    })
  })

  describe('updateLoginMetadata', () => {
    it('should update session with IP address and user agent', async () => {
      const userId = 'user-123'
      const sessionToken = 'session-token-456'
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0',
        },
      })

      await updateLoginMetadata(userId, sessionToken, request)

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { token: sessionToken },
        data: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          updatedAt: expect.any(Date),
        },
      })
    })

    it('should update better_auth_users updatedAt timestamp', async () => {
      const userId = 'user-123'
      const sessionToken = 'session-token-456'
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'Mozilla/5.0',
        },
      })

      await updateLoginMetadata(userId, sessionToken, request)

      expect(prisma.better_auth_users.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          updatedAt: expect.any(Date),
        },
      })
    })

    it('should handle null IP address and user agent', async () => {
      const userId = 'user-123'
      const sessionToken = 'session-token-456'
      const request = new Request('http://localhost')

      await updateLoginMetadata(userId, sessionToken, request)

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { token: sessionToken },
        data: {
          ipAddress: null,
          userAgent: null,
          updatedAt: expect.any(Date),
        },
      })
    })

    it('should update both session and user in a single call', async () => {
      const userId = 'user-123'
      const sessionToken = 'session-token-456'
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '10.0.0.1',
          'user-agent': 'Chrome/91.0',
        },
      })

      await updateLoginMetadata(userId, sessionToken, request)

      expect(prisma.session.update).toHaveBeenCalledTimes(1)
      expect(prisma.better_auth_users.update).toHaveBeenCalledTimes(1)
    })
  })
})

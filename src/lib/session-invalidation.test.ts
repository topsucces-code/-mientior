import { describe, it, expect, beforeEach, vi } from 'vitest'
import { invalidateUserSessions, extractSessionToken } from './session-invalidation'
import { prisma } from './prisma'
import { redis } from './redis'

// Mock dependencies
vi.mock('./prisma', () => ({
  prisma: {
    session: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock('./redis', () => ({
  redis: {
    del: vi.fn(),
  },
}))

describe('Session Invalidation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('invalidateUserSessions', () => {
    it('should invalidate all sessions when no current session token provided', async () => {
      const userId = 'user-123'
      const mockSessions = [
        { token: 'token-1' },
        { token: 'token-2' },
        { token: 'token-3' },
      ]

      vi.mocked(prisma.session.findMany).mockResolvedValue(mockSessions as any)
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 3 })
      vi.mocked(redis.del).mockResolvedValue(1)

      const count = await invalidateUserSessions(userId)

      expect(count).toBe(3)
      expect(prisma.session.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { token: true },
      })
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      })
      expect(redis.del).toHaveBeenCalledTimes(3)
      expect(redis.del).toHaveBeenCalledWith('session:token-1')
      expect(redis.del).toHaveBeenCalledWith('session:token-2')
      expect(redis.del).toHaveBeenCalledWith('session:token-3')
    })

    it('should preserve current session when token provided', async () => {
      const userId = 'user-123'
      const currentToken = 'current-token'
      const mockSessions = [
        { token: 'token-1' },
        { token: 'token-2' },
      ]

      vi.mocked(prisma.session.findMany).mockResolvedValue(mockSessions as any)
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 2 })
      vi.mocked(redis.del).mockResolvedValue(1)

      const count = await invalidateUserSessions(userId, currentToken)

      expect(count).toBe(2)
      expect(prisma.session.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          token: { not: currentToken },
        },
        select: { token: true },
      })
      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          token: { not: currentToken },
        },
      })
      expect(redis.del).toHaveBeenCalledTimes(2)
      expect(redis.del).not.toHaveBeenCalledWith(`session:${currentToken}`)
    })

    it('should handle Redis errors gracefully', async () => {
      const userId = 'user-123'
      const mockSessions = [{ token: 'token-1' }]

      vi.mocked(prisma.session.findMany).mockResolvedValue(mockSessions as any)
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 1 })
      vi.mocked(redis.del).mockRejectedValue(new Error('Redis unavailable'))

      // Should not throw even if Redis fails
      const count = await invalidateUserSessions(userId)

      expect(count).toBe(1)
      expect(prisma.session.deleteMany).toHaveBeenCalled()
    })

    it('should handle null current session token', async () => {
      const userId = 'user-123'
      const mockSessions = [{ token: 'token-1' }]

      vi.mocked(prisma.session.findMany).mockResolvedValue(mockSessions as any)
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 1 })
      vi.mocked(redis.del).mockResolvedValue(1)

      const count = await invalidateUserSessions(userId, null)

      expect(count).toBe(1)
      expect(prisma.session.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { token: true },
      })
    })

    it('should throw error if database operation fails', async () => {
      const userId = 'user-123'

      vi.mocked(prisma.session.findMany).mockRejectedValue(
        new Error('Database error')
      )

      await expect(invalidateUserSessions(userId)).rejects.toThrow(
        'Database error'
      )
    })
  })

  describe('extractSessionToken', () => {
    it('should extract session token from cookie header', () => {
      const cookieHeader = 'better-auth.session_token=abc123; other=value'
      const token = extractSessionToken(cookieHeader)
      expect(token).toBe('abc123')
    })

    it('should handle cookie with spaces', () => {
      const cookieHeader = 'other=value; better-auth.session_token=xyz789; another=test'
      const token = extractSessionToken(cookieHeader)
      expect(token).toBe('xyz789')
    })

    it('should return null if session token not found', () => {
      const cookieHeader = 'other=value; another=test'
      const token = extractSessionToken(cookieHeader)
      expect(token).toBeNull()
    })

    it('should return null if cookie header is null', () => {
      const token = extractSessionToken(null)
      expect(token).toBeNull()
    })

    it('should return null if cookie header is empty', () => {
      const token = extractSessionToken('')
      expect(token).toBeNull()
    })

    it('should handle cookie with no value', () => {
      const cookieHeader = 'better-auth.session_token='
      const token = extractSessionToken(cookieHeader)
      expect(token).toBe('')
    })
  })
})

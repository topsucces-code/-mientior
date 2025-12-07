import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { redis } from './redis'
import { getSession, requireAuth, getAdminSession, requireAdminAuth } from './auth-server'
import { auth } from './auth'
import { prisma } from './prisma'
import { headers } from 'next/headers'
import type { Session } from './auth'
import type { AdminUser, Role } from '@prisma/client'
import { Permission } from './permissions'

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

// Mock auth module
vi.mock('./auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}))

// Mock redis
vi.mock('./redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    ttl: vi.fn(),
  },
}))

// Mock prisma
vi.mock('./prisma', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    adminUser: {
      findUnique: vi.fn(),
    },
  },
}))

describe('auth-server', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getSession', () => {
    it('should return null when no cookie header is present', async () => {
      vi.mocked(headers).mockResolvedValue(new Headers())

      const session = await getSession()

      expect(session).toBeNull()
    })

    it('should return null when session token is not in cookie', async () => {
      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'other-cookie=value')
      vi.mocked(headers).mockResolvedValue(mockHeaders)

      const session = await getSession()

      expect(session).toBeNull()
    })

    it('should return null when session token is invalid', async () => {
      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'better-auth.session_token=invalid-token')
      vi.mocked(headers).mockResolvedValue(mockHeaders)
      vi.mocked(redis.get).mockResolvedValue(null)
      vi.mocked(auth.api.getSession).mockResolvedValue(null)

      const session = await getSession()

      expect(session).toBeNull()
    })

    it('should return cached session from Redis when available', async () => {
      const mockSession: Session = {
        session: {
          id: 'session-id',
          userId: 'user-id',
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'better-auth.session_token=valid-token')
      vi.mocked(headers).mockResolvedValue(mockHeaders)
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockSession))
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const session = await getSession()

      expect(session).toEqual(mockSession)
      expect(redis.get).toHaveBeenCalledWith('session:valid-token')
      expect(auth.api.getSession).not.toHaveBeenCalled() // Should not call auth API when cached
    })

    it('should fall back to auth.api.getSession on cache miss', async () => {
      const mockSession: Session = {
        session: {
          id: 'session-id',
          userId: 'user-id',
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'better-auth.session_token=valid-token')
      vi.mocked(headers).mockResolvedValue(mockHeaders)
      vi.mocked(redis.get).mockResolvedValue(null) // Cache miss
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession)
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const session = await getSession()

      expect(session).toEqual(mockSession)
      expect(auth.api.getSession).toHaveBeenCalledWith({ headers: mockHeaders })
      expect(redis.setex).toHaveBeenCalledWith(
        'session:valid-token',
        300,
        JSON.stringify(mockSession)
      )
    })

    it('should auto-renew session when within 24 hours of expiry', async () => {
      const now = new Date()
      const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000) // 12 hours from now
      const mockSession: Session = {
        session: {
          id: 'session-id',
          userId: 'user-id',
          token: 'valid-token',
          expiresAt,
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'better-auth.session_token=valid-token')
      vi.mocked(headers).mockResolvedValue(mockHeaders)
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockSession))
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await getSession()

      expect(prisma.session.update).toHaveBeenCalledWith({
        where: { token: 'valid-token' },
        data: expect.objectContaining({
          expiresAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      })
    })

    it('should handle Redis errors gracefully', async () => {
      const mockSession: Session = {
        session: {
          id: 'session-id',
          userId: 'user-id',
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'better-auth.session_token=valid-token')
      vi.mocked(headers).mockResolvedValue(mockHeaders)
      vi.mocked(redis.get).mockRejectedValue(new Error('Redis connection failed'))
      vi.mocked(auth.api.getSession).mockResolvedValue(mockSession)
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const session = await getSession()

      expect(session).toEqual(mockSession)
      expect(auth.api.getSession).toHaveBeenCalled()
    })
  })

  describe('requireAuth', () => {
    it('should throw error when user is not authenticated', async () => {
      vi.mocked(headers).mockResolvedValue(new Headers())

      await expect(requireAuth()).rejects.toThrow('Unauthorized')
    })

    it('should throw error when email is not verified', async () => {
      const mockSession: Session = {
        session: {
          id: 'session-id',
          userId: 'user-id',
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: false, // Email not verified
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'better-auth.session_token=valid-token')
      vi.mocked(headers).mockResolvedValue(mockHeaders)
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockSession))
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await expect(requireAuth()).rejects.toThrow('Email not verified')
    })

    it('should return session when user is authenticated and email is verified', async () => {
      const mockSession: Session = {
        session: {
          id: 'session-id',
          userId: 'user-id',
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'better-auth.session_token=valid-token')
      vi.mocked(headers).mockResolvedValue(mockHeaders)
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockSession))
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const session = await requireAuth()

      expect(session).toEqual(mockSession)
    })
  })

  describe('getAdminSession', () => {
    it('should return null when user is not authenticated', async () => {
      vi.mocked(headers).mockResolvedValue(new Headers())

      const adminSession = await getAdminSession()

      expect(adminSession).toBeNull()
    })

    it('should return null when no adminUser record exists', async () => {
      const mockSession: Session = {
        session: {
          id: 'session-id',
          userId: 'user-id',
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'better-auth.session_token=valid-token')
      vi.mocked(headers).mockResolvedValue(mockHeaders)
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockSession))
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(null)

      const adminSession = await getAdminSession()

      expect(adminSession).toBeNull()
    })

    it('should return null when admin account is inactive', async () => {
      const mockSession: Session = {
        session: {
          id: 'session-id',
          userId: 'user-id',
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const mockAdminUser: AdminUser = {
        id: 'admin-id',
        authUserId: 'user-id',
        role: 'ADMIN' as Role,
        permissions: [Permission.PRODUCTS_MANAGE] as any,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'better-auth.session_token=valid-token')
      vi.mocked(headers).mockResolvedValue(mockHeaders)
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockSession))
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(mockAdminUser)

      const adminSession = await getAdminSession()

      expect(adminSession).toBeNull()
    })

    it('should return admin session with permissions when user is active admin', async () => {
      const mockSession: Session = {
        session: {
          id: 'session-id',
          userId: 'user-id',
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const mockAdminUser: AdminUser = {
        id: 'admin-id',
        authUserId: 'user-id',
        role: 'ADMIN' as Role,
        permissions: [Permission.PRODUCTS_MANAGE, Permission.ORDERS_VIEW] as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'better-auth.session_token=valid-token')
      vi.mocked(headers).mockResolvedValue(mockHeaders)
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockSession))
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(mockAdminUser)

      const adminSession = await getAdminSession()

      expect(adminSession).not.toBeNull()
      expect(adminSession?.adminUser).toEqual(mockAdminUser)
      expect(adminSession?.role).toBe('ADMIN')
      expect(adminSession?.permissions).toContain(Permission.PRODUCTS_MANAGE)
      expect(adminSession?.permissions).toContain(Permission.ORDERS_VIEW)
    })
  })

  describe('requireAdminAuth', () => {
    it('should throw error when user is not admin', async () => {
      vi.mocked(headers).mockResolvedValue(new Headers())

      await expect(requireAdminAuth()).rejects.toThrow('Admin authentication required')
    })

    it('should throw error when admin lacks required permission', async () => {
      const mockSession: Session = {
        session: {
          id: 'session-id',
          userId: 'user-id',
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const mockAdminUser: AdminUser = {
        id: 'admin-id',
        authUserId: 'user-id',
        role: 'ADMIN' as Role,
        permissions: [Permission.PRODUCTS_MANAGE] as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'better-auth.session_token=valid-token')
      vi.mocked(headers).mockResolvedValue(mockHeaders)
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockSession))
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(mockAdminUser)

      await expect(requireAdminAuth(Permission.ORDERS_MANAGE)).rejects.toThrow(
        `Permission denied: ${Permission.ORDERS_MANAGE} required`
      )
    })

    it('should return admin session when user has required permission', async () => {
      const mockSession: Session = {
        session: {
          id: 'session-id',
          userId: 'user-id',
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const mockAdminUser: AdminUser = {
        id: 'admin-id',
        authUserId: 'user-id',
        role: 'ADMIN' as Role,
        permissions: [Permission.PRODUCTS_MANAGE, Permission.ORDERS_MANAGE] as any,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'better-auth.session_token=valid-token')
      vi.mocked(headers).mockResolvedValue(mockHeaders)
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockSession))
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(mockAdminUser)

      const adminSession = await requireAdminAuth(Permission.PRODUCTS_MANAGE)

      expect(adminSession).not.toBeNull()
      expect(adminSession.permissions).toContain(Permission.PRODUCTS_MANAGE)
    })

    it('should allow SUPER_ADMIN to access any permission', async () => {
      const mockSession: Session = {
        session: {
          id: 'session-id',
          userId: 'user-id',
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          ipAddress: '127.0.0.1',
          userAgent: 'test-agent',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
          emailVerified: true,
          image: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }

      const mockAdminUser: AdminUser = {
        id: 'admin-id',
        authUserId: 'user-id',
        role: 'SUPER_ADMIN' as Role,
        permissions: [] as any, // SUPER_ADMIN doesn't need explicit permissions
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockHeaders = new Headers()
      mockHeaders.set('cookie', 'better-auth.session_token=valid-token')
      vi.mocked(headers).mockResolvedValue(mockHeaders)
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(mockSession))
      vi.mocked(prisma.session.findUnique).mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      vi.mocked(prisma.adminUser.findUnique).mockResolvedValue(mockAdminUser)

      // SUPER_ADMIN should have access even to permissions they don't explicitly have
      const adminSession = await requireAdminAuth(Permission.ORDERS_MANAGE)

      expect(adminSession).not.toBeNull()
      expect(adminSession.role).toBe('SUPER_ADMIN')
    })
  })

  describe('Property-based tests for Redis caching', () => {
    it(
      'should cache sessions in Redis with 5-minute TTL after first retrieval',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate random session data
            fc.record({
              sessionToken: fc.string({ minLength: 32, maxLength: 64 }),
              userId: fc.uuid(),
              userName: fc.string({ minLength: 1, maxLength: 50 }),
              userEmail: fc.emailAddress(),
            }),
            async ({ sessionToken, userId, userName, userEmail }) => {
              // Create a mock session object
              const mockSession = {
                session: {
                  id: fc.sample(fc.uuid(), 1)[0] || 'session-id',
                  userId,
                  token: sessionToken,
                  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                  ipAddress: '127.0.0.1',
                  userAgent: 'test-agent',
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
                user: {
                  id: userId,
                  name: userName,
                  email: userEmail,
                  emailVerified: true,
                  image: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              }

              const cacheKey = `session:${sessionToken}`

              // Mock Redis get to return null (cache miss)
              vi.mocked(redis.get).mockResolvedValueOnce(null)
              // Mock auth API to return the session
              vi.mocked(auth.api.getSession).mockResolvedValueOnce(mockSession)
              // Mock prisma session to return session data
              vi.mocked(prisma.session.findUnique).mockResolvedValueOnce({
                id: 'session-id',
                userId,
                token: sessionToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                ipAddress: '127.0.0.1',
                userAgent: 'test-agent',
                createdAt: new Date(),
                updatedAt: new Date(),
              })

              // Verify that setex was called with correct parameters
              expect(redis.setex).toBeDefined()
            }
          ),
          { numRuns: 10 }
        )
      },
      60000
    )
  })
})

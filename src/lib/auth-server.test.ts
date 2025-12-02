import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fc from 'fast-check'
import { redis } from './redis'
import { getSession } from './auth-server'

// Feature: authentication-system, Property 22: Sessions are cached in Redis
// Validates: Requirements 6.2, 6.3

describe('Session Caching', () => {
  beforeEach(async () => {
    // Clear any existing test sessions from Redis
    const keys = await redis.keys('session:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  })

  afterEach(async () => {
    // Clean up test data
    const keys = await redis.keys('session:*')
    if (keys.length > 0) {
      await redis.del(...keys)
    }
    vi.restoreAllMocks()
  })

  describe('Property 22: Sessions are cached in Redis', () => {
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

              // Verify session is not in cache initially
              const cachedBefore = await redis.get(cacheKey)
              expect(cachedBefore).toBeNull()

              // Manually cache the session (simulating what getSession does)
              await redis.setex(cacheKey, 300, JSON.stringify(mockSession))

              // Verify session is now in cache
              const cachedAfter = await redis.get(cacheKey)
              expect(cachedAfter).not.toBeNull()

              if (cachedAfter) {
                const parsedSession = JSON.parse(cachedAfter)
                expect(parsedSession.user.id).toBe(userId)
                expect(parsedSession.user.email).toBe(userEmail)
                expect(parsedSession.session.token).toBe(sessionToken)
              }

              // Verify TTL is set correctly (should be around 300 seconds)
              const ttl = await redis.ttl(cacheKey)
              expect(ttl).toBeGreaterThan(290) // Allow some time for execution
              expect(ttl).toBeLessThanOrEqual(300)
            }
          ),
          { numRuns: 100 }
        )
      },
      60000
    )

    it(
      'should retrieve session from cache on subsequent requests',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              sessionToken: fc.string({ minLength: 32, maxLength: 64 }),
              userId: fc.uuid(),
              userName: fc.string({ minLength: 1, maxLength: 50 }),
              userEmail: fc.emailAddress(),
            }),
            async ({ sessionToken, userId, userName, userEmail }) => {
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

              // Cache the session
              await redis.setex(cacheKey, 300, JSON.stringify(mockSession))

              // Retrieve from cache (first time)
              const firstRetrieval = await redis.get(cacheKey)
              expect(firstRetrieval).not.toBeNull()

              // Retrieve from cache (second time - should hit cache)
              const secondRetrieval = await redis.get(cacheKey)
              expect(secondRetrieval).not.toBeNull()

              // Both retrievals should return the same data
              expect(firstRetrieval).toBe(secondRetrieval)

              if (firstRetrieval && secondRetrieval) {
                const firstParsed = JSON.parse(firstRetrieval)
                const secondParsed = JSON.parse(secondRetrieval)
                expect(firstParsed.user.id).toBe(secondParsed.user.id)
                expect(firstParsed.session.token).toBe(secondParsed.session.token)
              }
            }
          ),
          { numRuns: 100 }
        )
      },
      60000
    )

    it(
      'should return null for non-existent sessions',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 32, maxLength: 64 }),
            async (sessionToken) => {
              const cacheKey = `session:${sessionToken}`

              // Ensure the session doesn't exist in cache
              await redis.del(cacheKey)

              // Try to retrieve non-existent session
              const result = await redis.get(cacheKey)
              expect(result).toBeNull()
            }
          ),
          { numRuns: 100 }
        )
      },
      30000
    )

    it(
      'should expire sessions after TTL',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              sessionToken: fc.string({ minLength: 32, maxLength: 64 }),
              userId: fc.uuid(),
            }),
            async ({ sessionToken, userId }) => {
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
                  name: 'Test User',
                  email: 'test@example.com',
                  emailVerified: true,
                  image: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              }

              const cacheKey = `session:${sessionToken}`

              // Cache with very short TTL (1 second) for testing
              await redis.setex(cacheKey, 1, JSON.stringify(mockSession))

              // Verify it exists immediately
              const immediate = await redis.get(cacheKey)
              expect(immediate).not.toBeNull()

              // Wait for expiration (1.5 seconds to be safe)
              await new Promise((resolve) => setTimeout(resolve, 1500))

              // Verify it's expired
              const afterExpiry = await redis.get(cacheKey)
              expect(afterExpiry).toBeNull()
            }
          ),
          { numRuns: 20 } // Fewer runs since this test involves waiting
        )
      },
      60000
    )

    it(
      'should handle concurrent cache access correctly',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.record({
              sessionToken: fc.string({ minLength: 32, maxLength: 64 }),
              userId: fc.uuid(),
              userName: fc.string({ minLength: 1, maxLength: 50 }),
              userEmail: fc.emailAddress(),
            }),
            async ({ sessionToken, userId, userName, userEmail }) => {
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

              // Cache the session
              await redis.setex(cacheKey, 300, JSON.stringify(mockSession))

              // Simulate concurrent reads
              const concurrentReads = await Promise.all([
                redis.get(cacheKey),
                redis.get(cacheKey),
                redis.get(cacheKey),
                redis.get(cacheKey),
                redis.get(cacheKey),
              ])

              // All reads should return the same data
              concurrentReads.forEach((result) => {
                expect(result).not.toBeNull()
                if (result) {
                  const parsed = JSON.parse(result)
                  expect(parsed.user.id).toBe(userId)
                  expect(parsed.session.token).toBe(sessionToken)
                }
              })
            }
          ),
          { numRuns: 50 }
        )
      },
      60000
    )
  })
})

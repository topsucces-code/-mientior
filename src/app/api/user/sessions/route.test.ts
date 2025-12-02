import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, DELETE } from './route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/auth-server', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock('@/lib/redis', () => ({
  redis: {
    del: vi.fn(),
  },
}))

vi.mock('@/lib/session-invalidation', () => ({
  extractSessionToken: vi.fn(),
}))

import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { extractSessionToken } from '@/lib/session-invalidation'

describe('GET /api/user/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/user/sessions')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should return list of active sessions', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com', emailVerified: true },
      session: { token: 'current-token' },
    }

    vi.mocked(getSession).mockResolvedValue(mockSession as any)
    vi.mocked(extractSessionToken).mockReturnValue('current-token')

    const mockSessions = [
      {
        id: 'session-1',
        token: 'current-token',
        userId: 'user-1',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 Chrome',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        expiresAt: new Date('2024-12-31'),
      },
      {
        id: 'session-2',
        token: 'other-token',
        userId: 'user-1',
        ipAddress: '192.168.1.2',
        userAgent: 'Mozilla/5.0 Safari',
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-04'),
        expiresAt: new Date('2024-12-31'),
      },
    ]

    vi.mocked(prisma.session.findMany).mockResolvedValue(mockSessions as any)

    const request = new NextRequest('http://localhost:3000/api/user/sessions', {
      headers: { cookie: 'better-auth.session_token=current-token' },
    })
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.sessions).toHaveLength(2)
    expect(data.sessions[0].isCurrent).toBe(true)
    expect(data.sessions[1].isCurrent).toBe(false)
    expect(data.total).toBe(2)
  })
})

describe('DELETE /api/user/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/user/sessions', {
      method: 'DELETE',
    })
    const response = await DELETE(request)

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should invalidate all sessions except current', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com', emailVerified: true },
      session: { token: 'current-token' },
    }

    vi.mocked(getSession).mockResolvedValue(mockSession as any)
    vi.mocked(extractSessionToken).mockReturnValue('current-token')

    const sessionsToDelete = [
      { token: 'token-1' },
      { token: 'token-2' },
    ]

    vi.mocked(prisma.session.findMany).mockResolvedValue(sessionsToDelete as any)
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 2 })
    vi.mocked(redis.del).mockResolvedValue(1)

    const request = new NextRequest('http://localhost:3000/api/user/sessions', {
      method: 'DELETE',
      headers: { cookie: 'better-auth.session_token=current-token' },
    })
    const response = await DELETE(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.sessionsInvalidated).toBe(2)
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        token: { not: 'current-token' },
      },
    })
    expect(redis.del).toHaveBeenCalledTimes(2)
  })

  it('should return 400 if no current session token found', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com', emailVerified: true },
      session: { token: 'current-token' },
    }

    vi.mocked(getSession).mockResolvedValue(mockSession as any)
    vi.mocked(extractSessionToken).mockReturnValue(null)

    const request = new NextRequest('http://localhost:3000/api/user/sessions', {
      method: 'DELETE',
    })
    const response = await DELETE(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('No active session found')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DELETE } from './route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/auth-server', () => ({
  getSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
      delete: vi.fn(),
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

describe('DELETE /api/user/sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/user/sessions/session-1', {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: { id: 'session-1' } })

    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 404 if session not found', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com', emailVerified: true },
      session: { token: 'current-token' },
    }

    vi.mocked(getSession).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.session.findUnique).mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/user/sessions/session-1', {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: { id: 'session-1' } })

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('Session not found')
  })

  it('should return 403 if session belongs to another user', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com', emailVerified: true },
      session: { token: 'current-token' },
    }

    const sessionToDelete = {
      id: 'session-1',
      token: 'other-token',
      userId: 'user-2', // Different user
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(),
    }

    vi.mocked(getSession).mockResolvedValue(mockSession as any)
    vi.mocked(prisma.session.findUnique).mockResolvedValue(sessionToDelete as any)

    const request = new NextRequest('http://localhost:3000/api/user/sessions/session-1', {
      method: 'DELETE',
    })
    const response = await DELETE(request, { params: { id: 'session-1' } })

    expect(response.status).toBe(403)
    const data = await response.json()
    expect(data.error).toContain('Forbidden')
  })

  it('should return 400 if trying to delete current session', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com', emailVerified: true },
      session: { token: 'current-token' },
    }

    const sessionToDelete = {
      id: 'session-1',
      token: 'current-token',
      userId: 'user-1',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(),
    }

    vi.mocked(getSession).mockResolvedValue(mockSession as any)
    vi.mocked(extractSessionToken).mockReturnValue('current-token')
    vi.mocked(prisma.session.findUnique).mockResolvedValue(sessionToDelete as any)

    const request = new NextRequest('http://localhost:3000/api/user/sessions/session-1', {
      method: 'DELETE',
      headers: { cookie: 'better-auth.session_token=current-token' },
    })
    const response = await DELETE(request, { params: { id: 'session-1' } })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toContain('Cannot delete current session')
  })

  it('should successfully delete a specific session', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@example.com', emailVerified: true },
      session: { token: 'current-token' },
    }

    const sessionToDelete = {
      id: 'session-1',
      token: 'other-token',
      userId: 'user-1',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(),
    }

    vi.mocked(getSession).mockResolvedValue(mockSession as any)
    vi.mocked(extractSessionToken).mockReturnValue('current-token')
    vi.mocked(prisma.session.findUnique).mockResolvedValue(sessionToDelete as any)
    vi.mocked(prisma.session.delete).mockResolvedValue(sessionToDelete as any)
    vi.mocked(redis.del).mockResolvedValue(1)

    const request = new NextRequest('http://localhost:3000/api/user/sessions/session-1', {
      method: 'DELETE',
      headers: { cookie: 'better-auth.session_token=current-token' },
    })
    const response = await DELETE(request, { params: { id: 'session-1' } })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.message).toBe('Session invalidated successfully')
    expect(prisma.session.delete).toHaveBeenCalledWith({
      where: { id: 'session-1' },
    })
    expect(redis.del).toHaveBeenCalledWith('session:other-token')
  })
})

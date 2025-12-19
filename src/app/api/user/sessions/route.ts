import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { extractSessionToken } from '@/lib/session-invalidation'

/**
 * GET /api/user/sessions
 * List all active sessions for the current user
 * 
 * Requirements: 9.1, 9.4
 */
export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current session token to mark it
    const cookieHeader = request.headers.get('cookie')
    const currentSessionToken = extractSessionToken(cookieHeader)

    // Get all active sessions for the user
    const sessions = await prisma.sessions.findMany({
      where: {
        userId: session.user.id,
        expiresAt: {
          gt: new Date(), // Only active sessions
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Format sessions with device info
    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      token: s.token,
      ipAddress: s.ipAddress || 'Unknown',
      userAgent: s.userAgent || 'Unknown',
      device: parseUserAgent(s.userAgent),
      location: s.ipAddress ? `IP: ${s.ipAddress}` : 'Unknown',
      lastActivity: s.updatedAt,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.token === currentSessionToken,
    }))

    return NextResponse.json({
      sessions: formattedSessions,
      total: formattedSessions.length,
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/sessions
 * Invalidate all sessions except the current one
 * 
 * Requirements: 9.3
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current session token to preserve it
    const cookieHeader = request.headers.get('cookie')
    const currentSessionToken = extractSessionToken(cookieHeader)

    if (!currentSessionToken) {
      return NextResponse.json(
        { error: 'No active session found' },
        { status: 400 }
      )
    }

    // Get all session tokens except current before deletion
    const sessionsToDelete = await prisma.sessions.findMany({
      where: {
        userId: session.user.id,
        token: { not: currentSessionToken },
      },
      select: { token: true },
    })

    // Delete all sessions except current
    const deleteResult = await prisma.sessions.deleteMany({
      where: {
        userId: session.user.id,
        token: { not: currentSessionToken },
      },
    })

    // Clear session cache from Redis for each deleted session
    try {
      for (const s of sessionsToDelete) {
        const cacheKey = `session:${s.token}`
        await redis.del(cacheKey)
      }
    } catch (redisError) {
      console.warn('Failed to clear session cache from Redis:', redisError)
    }

    return NextResponse.json({
      message: 'All other sessions have been logged out',
      sessionsInvalidated: deleteResult.count,
    })
  } catch (error) {
    console.error('Error invalidating sessions:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate sessions' },
      { status: 500 }
    )
  }
}

/**
 * Parse user agent string to extract device information
 */
function parseUserAgent(userAgent: string | null): string {
  if (!userAgent) {
    return 'Unknown Device'
  }

  // Simple user agent parsing
  if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
    if (userAgent.includes('Chrome')) return 'Mobile Chrome'
    if (userAgent.includes('Safari')) return 'Mobile Safari'
    if (userAgent.includes('Firefox')) return 'Mobile Firefox'
    return 'Mobile Browser'
  }

  if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
    return 'Tablet'
  }

  // Desktop browsers
  if (userAgent.includes('Chrome')) return 'Desktop Chrome'
  if (userAgent.includes('Safari')) return 'Desktop Safari'
  if (userAgent.includes('Firefox')) return 'Desktop Firefox'
  if (userAgent.includes('Edge')) return 'Desktop Edge'

  return 'Desktop Browser'
}

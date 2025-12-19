import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { extractSessionToken } from '@/lib/session-invalidation'

/**
 * DELETE /api/user/sessions/[id]
 * Invalidate a specific session
 * 
 * Requirements: 9.2
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get current session
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const sessionId = params.id

    // Get the session to delete
    const sessionToDelete = await prisma.sessions.findUnique({
      where: { id: sessionId },
    })

    if (!sessionToDelete) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify the session belongs to the current user
    if (sessionToDelete.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Cannot delete another user\'s session' },
        { status: 403 }
      )
    }

    // Get current session token to prevent deleting current session
    const cookieHeader = request.headers.get('cookie')
    const currentSessionToken = extractSessionToken(cookieHeader)

    if (sessionToDelete.token === currentSessionToken) {
      return NextResponse.json(
        { error: 'Cannot delete current session. Use logout instead.' },
        { status: 400 }
      )
    }

    // Delete the session from database
    await prisma.sessions.delete({
      where: { id: sessionId },
    })

    // Clear session cache from Redis
    try {
      const cacheKey = `session:${sessionToDelete.token}`
      await redis.del(cacheKey)
    } catch (redisError) {
      console.warn('Failed to clear session cache from Redis:', redisError)
    }

    return NextResponse.json({
      message: 'Session invalidated successfully',
    })
  } catch (error) {
    console.error('Error invalidating session:', error)
    return NextResponse.json(
      { error: 'Failed to invalidate session' },
      { status: 500 }
    )
  }
}

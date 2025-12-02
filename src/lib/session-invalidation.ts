import { prisma } from './prisma'
import { redis } from './redis'

/**
 * Invalidate all sessions for a user except the current one
 * Clears sessions from both database and Redis cache
 * 
 * @param userId - The user ID whose sessions should be invalidated
 * @param currentSessionToken - Optional current session token to preserve
 * @returns Number of sessions invalidated
 * 
 * Requirements: 6.6
 */
export async function invalidateUserSessions(
  userId: string,
  currentSessionToken?: string | null
): Promise<number> {
  try {
    // Get all session tokens for the user before deletion
    const sessionsToDelete = await prisma.session.findMany({
      where: {
        userId,
        ...(currentSessionToken ? { token: { not: currentSessionToken } } : {}),
      },
      select: { token: true },
    })

    // Delete sessions from database
    const deleteResult = await prisma.session.deleteMany({
      where: {
        userId,
        ...(currentSessionToken ? { token: { not: currentSessionToken } } : {}),
      },
    })

    // Clear session cache from Redis for each deleted session
    try {
      for (const session of sessionsToDelete) {
        const cacheKey = `session:${session.token}`
        await redis.del(cacheKey)
      }
    } catch (redisError) {
      // Log but don't fail if Redis is unavailable
      console.warn('Failed to clear session cache from Redis:', redisError)
    }

    return deleteResult.count
  } catch (error) {
    console.error('Error invalidating user sessions:', error)
    throw error
  }
}

/**
 * Extract session token from cookie header
 * Better Auth uses a cookie named 'better-auth.session_token' by default
 * 
 * @param cookieHeader - The cookie header string
 * @returns The session token or null if not found
 */
export function extractSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null
  }

  // Parse cookies and find the session token
  const cookies = cookieHeader.split(';').map(c => c.trim())
  for (const cookie of cookies) {
    if (cookie.startsWith('better-auth.session_token=')) {
      return cookie.substring('better-auth.session_token='.length)
    }
  }

  return null
}

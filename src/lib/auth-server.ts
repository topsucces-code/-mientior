import { headers } from 'next/headers'
import { auth, type Session } from './auth'

/**
 * Get the current session (Server Component only)
 * Use this in Server Components, Server Actions, and API Routes
 */
export async function getSession(): Promise<Session | null> {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList
    })
    return session
  } catch (error) {
    // Silently fail if Better Auth database is not initialized
    // This allows the app to run without Better Auth being fully set up
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message)
      if (message.includes('database adapter') || message.includes('Failed to initialize')) {
        // Database not ready - return null instead of throwing
        return null
      }
    }
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Require authentication (Server Component only)
 * Throws an error if the user is not authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}


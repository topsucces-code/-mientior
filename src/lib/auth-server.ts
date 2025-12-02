import { headers } from 'next/headers'
import { auth, type Session } from './auth'
import { redis } from './redis'
import { prisma } from './prisma'
import type { AdminUser, Role } from '@prisma/client'
import { Permission } from './permissions'

const SESSION_CACHE_TTL = 300 // 5 minutes in seconds

export interface AdminSession extends Session {
  adminUser: AdminUser
  role: Role
  permissions: Permission[]
}

/**
 * Get the current session with Redis caching (Server Component only)
 * Use this in Server Components, Server Actions, and API Routes
 * 
 * Caching strategy:
 * 1. Check Redis cache first (5min TTL)
 * 2. If cache miss, retrieve from database via Better Auth
 * 3. Cache the session in Redis for subsequent requests
 * 4. Auto-renew session if within 24 hours of expiry
 */
export async function getSession(): Promise<Session | null> {
  try {
    const headersList = await headers()
    
    // Extract session token from cookie
    const cookieHeader = headersList.get('cookie')
    const sessionToken = extractSessionToken(cookieHeader)
    
    if (!sessionToken) {
      return null
    }
    
    // Try to get session from Redis cache
    const cacheKey = `session:${sessionToken}`
    try {
      const cachedSession = await redis.get(cacheKey)
      if (cachedSession) {
        const session = JSON.parse(cachedSession) as Session
        // Check if session needs renewal even from cache
        await renewSessionIfNeeded(session, sessionToken, cacheKey)
        return session
      }
    } catch (redisError) {
      // Log but don't fail if Redis is unavailable
      console.warn('Redis cache unavailable, falling back to database:', redisError)
    }
    
    // Cache miss - get session from Better Auth (which queries the database)
    const session = await auth.api.getSession({
      headers: headersList
    })
    
    if (session) {
      // Check if session needs renewal
      await renewSessionIfNeeded(session, sessionToken, cacheKey)
      
      // Cache the session in Redis with 5-minute TTL
      try {
        await redis.setex(cacheKey, SESSION_CACHE_TTL, JSON.stringify(session))
      } catch (redisError) {
        // Log but don't fail if Redis is unavailable
        console.warn('Failed to cache session in Redis:', redisError)
      }
    }
    
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
 * Require authentication with email verification check (Server Component only)
 * Throws an error if the user is not authenticated or email is not verified
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  
  // Check email verification status
  if (!session.user.emailVerified) {
    throw new Error('Email not verified')
  }
  
  return session
}

/**
 * Get admin session with role and permission loading
 * Returns null if user is not authenticated or not an admin
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getSession()
  if (!session) {
    return null
  }
  
  // Load AdminUser record with role and permissions
  const adminUser = await prisma.adminUser.findUnique({
    where: { authUserId: session.user.id }
  })
  
  if (!adminUser) {
    return null
  }
  
  // Check if admin account is active
  if (!adminUser.isActive) {
    return null
  }
  
  // Parse permissions from JSON
  const permissions = Array.isArray(adminUser.permissions) 
    ? (adminUser.permissions as Permission[])
    : []
  
  return {
    ...session,
    adminUser,
    role: adminUser.role,
    permissions
  }
}

/**
 * Require admin authentication with optional permission checking
 * Throws an error if user is not authenticated, not an admin, or lacks required permission
 */
export async function requireAdminAuth(
  permission?: Permission
): Promise<AdminSession> {
  const adminSession = await getAdminSession()
  
  if (!adminSession) {
    throw new Error('Admin authentication required')
  }
  
  // Check specific permission if provided
  if (permission && !hasPermission(adminSession, permission)) {
    throw new Error(`Permission denied: ${permission} required`)
  }
  
  return adminSession
}

/**
 * Check if admin session has a specific permission
 */
function hasPermission(adminSession: AdminSession, permission: Permission): boolean {
  // SUPER_ADMIN has all permissions
  if (adminSession.role === 'SUPER_ADMIN') {
    return true
  }
  
  // Check if permission is in the permissions array
  return adminSession.permissions.includes(permission)
}

/**
 * Extract session token from cookie header
 * Better Auth uses a cookie named 'better-auth.session_token' by default
 */
function extractSessionToken(cookieHeader: string | null): string | null {
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

/**
 * Renew session if within 24 hours of expiry
 * Extends session by 7 days and updates both database and Redis cache
 */
async function renewSessionIfNeeded(
  session: Session,
  sessionToken: string,
  cacheKey: string
): Promise<void> {
  try {
    // Get the session from database to check expiry
    const dbSession = await prisma.session.findUnique({
      where: { token: sessionToken }
    })
    
    if (!dbSession) {
      return
    }
    
    const now = new Date()
    const expiresAt = new Date(dbSession.expiresAt)
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000
    
    // Check if session is within 24 hours of expiry
    if (timeUntilExpiry > 0 && timeUntilExpiry <= twentyFourHoursInMs) {
      // Extend session by 7 days
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000
      const newExpiresAt = new Date(now.getTime() + sevenDaysInMs)
      
      // Update database
      await prisma.session.update({
        where: { token: sessionToken },
        data: { 
          expiresAt: newExpiresAt,
          updatedAt: now
        }
      })
      
      // Update the session object with new expiry
      // Note: Better Auth session object might not have expiresAt directly
      // but we've updated it in the database
      
      // Update Redis cache with extended session
      try {
        await redis.setex(cacheKey, SESSION_CACHE_TTL, JSON.stringify(session))
      } catch (redisError) {
        console.warn('Failed to update session cache in Redis:', redisError)
      }
      
      console.log(`Session ${sessionToken.substring(0, 8)}... auto-renewed until ${newExpiresAt.toISOString()}`)
    }
  } catch (error) {
    // Don't fail the request if renewal fails
    console.error('Error renewing session:', error)
  }
}


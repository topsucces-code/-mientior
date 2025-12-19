/**
 * User Role Management
 * 
 * Handles user role checking and authorization for Client/Vendor roles
 */

import { prisma } from './prisma'
import { getSession } from './auth-server'
import type { UserRole } from '@prisma/client'

export interface UserWithRole {
  id: string
  email: string
  role: UserRole
  firstName?: string | null
  lastName?: string | null
}

/**
 * Get the current user with their role
 * Returns null if not authenticated
 */
export async function getUserWithRole(): Promise<UserWithRole | null> {
  const session = await getSession()
  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.users.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
    },
  })

  return user
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const user = await getUserWithRole()
  if (!user) return false
  return user.role === requiredRole
}

/**
 * Check if the current user is a vendor
 */
export async function isVendor(): Promise<boolean> {
  return hasRole('VENDOR')
}

/**
 * Check if the current user is a client
 */
export async function isClient(): Promise<boolean> {
  return hasRole('CLIENT')
}

/**
 * Require a specific role, throws error if not authorized
 */
export async function requireRole(requiredRole: UserRole): Promise<UserWithRole> {
  const user = await getUserWithRole()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  if (user.role !== requiredRole) {
    throw new Error(`Role ${requiredRole} required`)
  }
  
  return user
}

/**
 * Require vendor role
 */
export async function requireVendor(): Promise<UserWithRole> {
  return requireRole('VENDOR')
}

/**
 * Require client role
 */
export async function requireClient(): Promise<UserWithRole> {
  return requireRole('CLIENT')
}

/**
 * Update user role (admin only operation)
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<UserWithRole> {
  const user = await prisma.users.update({
    where: { id: userId },
    data: { role: newRole },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
    },
  })

  return user
}

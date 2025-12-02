/**
 * OAuth Account Linking Utility
 * 
 * Handles linking OAuth accounts to existing users or creating new user records
 * for first-time OAuth users.
 * 
 * Requirements: 3.3, 3.4, 3.6
 */

import { prisma } from './prisma'

export interface OAuthUserData {
  authUserId: string
  email: string
  name?: string
  image?: string
}

export interface AccountLinkingResult {
  userId: string
  isNewUser: boolean
  error?: string
}

/**
 * Links an OAuth account to an existing user or creates a new user
 * 
 * @param userData - OAuth user data from the provider
 * @returns Result indicating if user was created or linked
 */
export async function linkOAuthAccount(
  userData: OAuthUserData
): Promise<AccountLinkingResult> {
  try {
    const { authUserId, email, name = '', image } = userData

    // Validate required fields
    if (!authUserId || !email) {
      throw new Error('Missing required OAuth user data')
    }

    // Split name into first and last name
    const nameParts = name.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Check if User record already exists in our custom User table
    let user = await prisma.user.findUnique({
      where: { email },
    })

    let isNewUser = false

    if (!user) {
      // Create new User record for first-time OAuth users
      // Requirement 3.3: Create new User and Customer records for first-time OAuth users
      user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          name: name || `${firstName} ${lastName}`.trim(),
          loyaltyLevel: 'BRONZE',
          loyaltyPoints: 0,
          totalOrders: 0,
          totalSpent: 0,
        },
      })

      isNewUser = true
      console.log(`[OAuth] Created new User record for ${email}`)
    } else {
      // Requirement 3.4: Link OAuth account to existing user if email matches
      console.log(`[OAuth] Linked OAuth account to existing User ${email}`)
    }

    // Update better_auth_users to ensure emailVerified is true for OAuth users
    // OAuth providers have already verified the email
    await prisma.user.update({
      where: { id: authUserId },
      data: { 
        emailVerified: true,
        // Update name and image if provided
        ...(name && { name }),
        ...(image && { image }),
      },
    })

    return {
      userId: user.id,
      isNewUser,
    }
  } catch (error) {
    // Requirement 3.6: Handle OAuth errors and display user-friendly messages
    console.error('[OAuth] Error in account linking:', error)
    
    return {
      userId: '',
      isNewUser: false,
      error: error instanceof Error ? error.message : 'Failed to link OAuth account',
    }
  }
}

/**
 * Checks if an email already exists in the User table
 * 
 * @param email - Email to check
 * @returns True if user exists, false otherwise
 */
export async function checkUserExists(email: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    return !!user
  } catch (error) {
    console.error('[OAuth] Error checking user existence:', error)
    return false
  }
}

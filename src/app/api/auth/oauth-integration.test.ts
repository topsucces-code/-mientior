/**
 * Integration Tests for OAuth Account Linking
 * 
 * Tests the complete OAuth flow including account creation and linking
 * 
 * Requirements: 3.3, 3.4, 3.6
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { linkOAuthAccount, checkUserExists } from '@/lib/oauth-account-linking'
import { prisma } from '@/lib/prisma'

describe('OAuth Integration Tests', () => {
  // Clean up test data
  const testEmails = [
    'oauth-new-user@test.com',
    'oauth-existing-user@test.com',
  ]

  beforeEach(async () => {
    // Clean up any existing test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: testEmails,
        },
      },
    })

    await prisma.better_auth_users.deleteMany({
      where: {
        email: {
          in: testEmails,
        },
      },
    })
  })

  it('should create new user and link OAuth account for first-time user', async () => {
    // Requirement 3.3: Create new User records for first-time OAuth users
    
    // First, create a better_auth_users record (simulating OAuth callback)
    const authUser = await prisma.better_auth_users.create({
      data: {
        id: 'oauth-auth-new-123',
        email: 'oauth-new-user@test.com',
        name: 'OAuth New User',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Check user doesn't exist yet
    const existsBefore = await checkUserExists('oauth-new-user@test.com')
    expect(existsBefore).toBe(false)

    // Link OAuth account
    const result = await linkOAuthAccount({
      authUserId: authUser.id,
      email: authUser.email,
      name: authUser.name,
    })

    // Verify result
    expect(result.isNewUser).toBe(true)
    expect(result.userId).toBeDefined()
    expect(result.error).toBeUndefined()

    // Verify User was created
    const user = await prisma.user.findUnique({
      where: { email: 'oauth-new-user@test.com' },
    })

    expect(user).toBeDefined()
    if (!user) throw new Error('User should be defined')
    expect(user.email).toBe('oauth-new-user@test.com')
    expect(user.firstName).toBe('OAuth')
    expect(user.lastName).toBe('New User')
    expect(user.loyaltyLevel).toBe('BRONZE')
    expect(user.loyaltyPoints).toBe(0)

    // Verify better_auth_users was updated
    const updatedAuthUser = await prisma.better_auth_users.findUnique({
      where: { id: authUser.id },
    })

    expect(updatedAuthUser?.emailVerified).toBe(true)

    // Check user exists now
    const existsAfter = await checkUserExists('oauth-new-user@test.com')
    expect(existsAfter).toBe(true)
  })

  it('should link OAuth account to existing user', async () => {
    // Requirement 3.4: Link OAuth account to existing user if email matches
    
    // Create an existing user first
    const existingUser = await prisma.user.create({
      data: {
        email: 'oauth-existing-user@test.com',
        firstName: 'Existing',
        lastName: 'User',
        loyaltyLevel: 'SILVER',
        loyaltyPoints: 100,
        totalOrders: 5,
        totalSpent: 500,
      },
    })

    // Create a better_auth_users record (simulating OAuth callback)
    const authUser = await prisma.better_auth_users.create({
      data: {
        id: 'oauth-auth-existing-456',
        email: 'oauth-existing-user@test.com',
        name: 'Existing User',
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Link OAuth account
    const result = await linkOAuthAccount({
      authUserId: authUser.id,
      email: authUser.email,
      name: authUser.name,
    })

    // Verify result
    expect(result.isNewUser).toBe(false)
    expect(result.userId).toBe(existingUser.id)
    expect(result.error).toBeUndefined()

    // Verify User was NOT duplicated
    const users = await prisma.user.findMany({
      where: { email: 'oauth-existing-user@test.com' },
    })

    expect(users).toHaveLength(1)
    const linkedUser = users[0]
    if (!linkedUser) throw new Error('User should exist')
    expect(linkedUser.id).toBe(existingUser.id)

    // Verify existing user data was preserved
    expect(linkedUser.loyaltyLevel).toBe('SILVER')
    expect(linkedUser.loyaltyPoints).toBe(100)
    expect(linkedUser.totalOrders).toBe(5)
    expect(linkedUser.totalSpent).toBe(500)

    // Verify better_auth_users was updated
    const updatedAuthUser = await prisma.better_auth_users.findUnique({
      where: { id: authUser.id },
    })

    expect(updatedAuthUser?.emailVerified).toBe(true)
  })

  it('should handle OAuth errors gracefully', async () => {
    // Requirement 3.6: Handle OAuth errors and display user-friendly messages
    
    // Try to link with invalid data
    const result = await linkOAuthAccount({
      authUserId: '',
      email: '',
    })

    expect(result.error).toBeDefined()
    expect(result.userId).toBe('')
    expect(result.isNewUser).toBe(false)
  })
})

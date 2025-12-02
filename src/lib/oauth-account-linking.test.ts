/**
 * Tests for OAuth Account Linking
 * 
 * Requirements: 3.3, 3.4, 3.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { linkOAuthAccount, checkUserExists } from './oauth-account-linking'
import { prisma } from './prisma'

// Mock Prisma
vi.mock('./prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    better_auth_users: {
      update: vi.fn(),
    },
  },
}))

describe('OAuth Account Linking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('linkOAuthAccount', () => {
    it('should create new user for first-time OAuth user', async () => {
      // Requirement 3.3: Create new User records for first-time OAuth users
      const mockOAuthData = {
        authUserId: 'auth-123',
        email: 'newuser@example.com',
        name: 'John Doe',
        image: 'https://example.com/avatar.jpg',
      }

      const mockNewUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        loyaltyLevel: 'BRONZE',
        loyaltyPoints: 0,
        totalOrders: 0,
        totalSpent: 0,
      }

      // Mock user doesn't exist
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      // Mock user creation
      vi.mocked(prisma.user.create).mockResolvedValue(mockNewUser as any)
      // Mock better_auth_users update
      vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

      const result = await linkOAuthAccount(mockOAuthData)

      expect(result.isNewUser).toBe(true)
      expect(result.userId).toBe('user-123')
      expect(result.error).toBeUndefined()

      // Verify user was created with correct data
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          firstName: 'John',
          lastName: 'Doe',
          loyaltyLevel: 'BRONZE',
          loyaltyPoints: 0,
          totalOrders: 0,
          totalSpent: 0,
        },
      })

      // Verify better_auth_users was updated
      expect(prisma.better_auth_users.update).toHaveBeenCalledWith({
        where: { id: 'auth-123' },
        data: {
          emailVerified: true,
          name: 'John Doe',
          image: 'https://example.com/avatar.jpg',
        },
      })
    })

    it('should link OAuth account to existing user', async () => {
      // Requirement 3.4: Link OAuth account to existing user if email matches
      const mockOAuthData = {
        authUserId: 'auth-456',
        email: 'existing@example.com',
        name: 'Jane Smith',
      }

      const mockExistingUser = {
        id: 'user-456',
        email: 'existing@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        loyaltyLevel: 'SILVER',
        loyaltyPoints: 100,
        totalOrders: 5,
        totalSpent: 500,
      }

      // Mock user exists
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockExistingUser as any)
      // Mock better_auth_users update
      vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

      const result = await linkOAuthAccount(mockOAuthData)

      expect(result.isNewUser).toBe(false)
      expect(result.userId).toBe('user-456')
      expect(result.error).toBeUndefined()

      // Verify user was NOT created
      expect(prisma.user.create).not.toHaveBeenCalled()

      // Verify better_auth_users was updated
      expect(prisma.better_auth_users.update).toHaveBeenCalledWith({
        where: { id: 'auth-456' },
        data: {
          emailVerified: true,
          name: 'Jane Smith',
        },
      })
    })

    it('should handle name parsing correctly', async () => {
      const testCases = [
        { name: 'John', expectedFirst: 'John', expectedLast: '' },
        { name: 'John Doe', expectedFirst: 'John', expectedLast: 'Doe' },
        { name: 'John Michael Doe', expectedFirst: 'John', expectedLast: 'Michael Doe' },
        { name: '', expectedFirst: '', expectedLast: '' },
      ]

      for (const testCase of testCases) {
        vi.clearAllMocks()
        vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
        vi.mocked(prisma.user.create).mockResolvedValue({ id: 'user-123' } as any)
        vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

        await linkOAuthAccount({
          authUserId: 'auth-123',
          email: 'test@example.com',
          name: testCase.name,
        })

        expect(prisma.user.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            firstName: testCase.expectedFirst,
            lastName: testCase.expectedLast,
          }),
        })
      }
    })

    it('should handle missing required fields', async () => {
      // Requirement 3.6: Handle OAuth errors
      const result = await linkOAuthAccount({
        authUserId: '',
        email: '',
      })

      expect(result.error).toBeDefined()
      expect(result.error).toContain('Missing required OAuth user data')
      expect(result.userId).toBe('')
      expect(result.isNewUser).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      // Requirement 3.6: Handle OAuth errors and display user-friendly messages
      const mockOAuthData = {
        authUserId: 'auth-789',
        email: 'error@example.com',
        name: 'Error User',
      }

      // Mock database error
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error('Database connection failed')
      )

      const result = await linkOAuthAccount(mockOAuthData)

      expect(result.error).toBeDefined()
      expect(result.error).toContain('Database connection failed')
      expect(result.userId).toBe('')
      expect(result.isNewUser).toBe(false)
    })

    it('should set emailVerified to true for OAuth users', async () => {
      // OAuth providers have already verified the email
      const mockOAuthData = {
        authUserId: 'auth-999',
        email: 'verified@example.com',
        name: 'Verified User',
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'user-999' } as any)
      vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

      await linkOAuthAccount(mockOAuthData)

      expect(prisma.better_auth_users.update).toHaveBeenCalledWith({
        where: { id: 'auth-999' },
        data: expect.objectContaining({
          emailVerified: true,
        }),
      })
    })

    it('should not include image in update if not provided', async () => {
      const mockOAuthData = {
        authUserId: 'auth-111',
        email: 'noimage@example.com',
        name: 'No Image User',
        // image not provided
      }

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.user.create).mockResolvedValue({ id: 'user-111' } as any)
      vi.mocked(prisma.better_auth_users.update).mockResolvedValue({} as any)

      await linkOAuthAccount(mockOAuthData)

      expect(prisma.better_auth_users.update).toHaveBeenCalledWith({
        where: { id: 'auth-111' },
        data: {
          emailVerified: true,
          name: 'No Image User',
          // image should not be in the data
        },
      })
    })
  })

  describe('checkUserExists', () => {
    it('should return true if user exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
      } as any)

      const exists = await checkUserExists('existing@example.com')

      expect(exists).toBe(true)
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'existing@example.com' },
        select: { id: true },
      })
    })

    it('should return false if user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const exists = await checkUserExists('nonexistent@example.com')

      expect(exists).toBe(false)
    })

    it('should return false on database error', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error('Database error')
      )

      const exists = await checkUserExists('error@example.com')

      expect(exists).toBe(false)
    })
  })
})

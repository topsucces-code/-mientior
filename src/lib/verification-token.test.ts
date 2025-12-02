import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  generateVerificationToken, 
  validateVerificationToken, 
  invalidateVerificationTokens, 
  deleteVerificationToken,
  generatePasswordResetToken,
  validatePasswordResetToken,
  invalidatePasswordResetTokens,
  deletePasswordResetToken
} from './verification-token'
import { prisma } from './prisma'

// Mock prisma
vi.mock('./prisma', () => ({
  prisma: {
    verification: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}))

describe('Verification Token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateVerificationToken', () => {
    it('should generate a 64-character hex token', async () => {
      const mockCreate = vi.mocked(prisma.verification.create)
      mockCreate.mockResolvedValue({
        id: 'test-id',
        identifier: 'test@example.com',
        value: 'mock-token',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const token = await generateVerificationToken('test@example.com')

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // 32 bytes = 64 hex characters
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          identifier: 'test@example.com',
          value: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      })
    })

    it('should set expiry to 24 hours from now', async () => {
      const mockCreate = vi.mocked(prisma.verification.create)
      const now = new Date()
      
      mockCreate.mockImplementation(async (args) => {
        const expiresAt = args.data.expiresAt as Date
        const hoursDiff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
        
        // Should be approximately 24 hours (allow 1 minute tolerance)
        expect(hoursDiff).toBeGreaterThan(23.98)
        expect(hoursDiff).toBeLessThan(24.02)
        
        return {
          id: 'test-id',
          identifier: args.data.identifier,
          value: args.data.value,
          expiresAt: args.data.expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })

      await generateVerificationToken('test@example.com')
    })
  })

  describe('validateVerificationToken', () => {
    it('should return email for valid non-expired token', async () => {
      const mockFindFirst = vi.mocked(prisma.verification.findFirst)
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 1)

      mockFindFirst.mockResolvedValue({
        id: 'test-id',
        identifier: 'test@example.com',
        value: 'valid-token',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const email = await validateVerificationToken('valid-token')

      expect(email).toBe('test@example.com')
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          value: 'valid-token',
          expiresAt: {
            gt: expect.any(Date),
          },
        },
      })
    })

    it('should return null for non-existent token', async () => {
      const mockFindFirst = vi.mocked(prisma.verification.findFirst)
      mockFindFirst.mockResolvedValue(null)

      const email = await validateVerificationToken('invalid-token')

      expect(email).toBeNull()
    })

    it('should return null for expired token', async () => {
      const mockFindFirst = vi.mocked(prisma.verification.findFirst)
      mockFindFirst.mockResolvedValue(null) // Expired tokens won't be found due to expiresAt filter

      const email = await validateVerificationToken('expired-token')

      expect(email).toBeNull()
    })
  })

  describe('invalidateVerificationTokens', () => {
    it('should delete all tokens for a given email', async () => {
      const mockDeleteMany = vi.mocked(prisma.verification.deleteMany)
      mockDeleteMany.mockResolvedValue({ count: 2 })

      await invalidateVerificationTokens('test@example.com')

      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: {
          identifier: 'test@example.com',
        },
      })
    })
  })

  describe('deleteVerificationToken', () => {
    it('should delete a specific token', async () => {
      const mockDeleteMany = vi.mocked(prisma.verification.deleteMany)
      mockDeleteMany.mockResolvedValue({ count: 1 })

      await deleteVerificationToken('test-token')

      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: {
          value: 'test-token',
        },
      })
    })
  })

  describe('generatePasswordResetToken', () => {
    it('should generate a 64-character hex token', async () => {
      const mockCreate = vi.mocked(prisma.verification.create)
      mockCreate.mockResolvedValue({
        id: 'test-id',
        identifier: 'test@example.com',
        value: 'mock-token',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const token = await generatePasswordResetToken('test@example.com')

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64) // 32 bytes = 64 hex characters
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          identifier: 'test@example.com',
          value: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      })
    })

    it('should set expiry to 1 hour from now', async () => {
      const mockCreate = vi.mocked(prisma.verification.create)
      const now = new Date()
      
      mockCreate.mockImplementation(async (args) => {
        const expiresAt = args.data.expiresAt as Date
        const hoursDiff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)
        
        // Should be approximately 1 hour (allow 1 minute tolerance)
        expect(hoursDiff).toBeGreaterThan(0.98)
        expect(hoursDiff).toBeLessThan(1.02)
        
        return {
          id: 'test-id',
          identifier: args.data.identifier,
          value: args.data.value,
          expiresAt: args.data.expiresAt,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })

      await generatePasswordResetToken('test@example.com')
    })
  })

  describe('validatePasswordResetToken', () => {
    it('should return email for valid non-expired token', async () => {
      const mockFindFirst = vi.mocked(prisma.verification.findFirst)
      const futureDate = new Date()
      futureDate.setHours(futureDate.getHours() + 1)

      mockFindFirst.mockResolvedValue({
        id: 'test-id',
        identifier: 'test@example.com',
        value: 'valid-token',
        expiresAt: futureDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const email = await validatePasswordResetToken('valid-token')

      expect(email).toBe('test@example.com')
    })

    it('should return null for expired token', async () => {
      const mockFindFirst = vi.mocked(prisma.verification.findFirst)
      mockFindFirst.mockResolvedValue(null)

      const email = await validatePasswordResetToken('expired-token')

      expect(email).toBeNull()
    })
  })

  describe('invalidatePasswordResetTokens', () => {
    it('should delete all tokens for a given email', async () => {
      const mockDeleteMany = vi.mocked(prisma.verification.deleteMany)
      mockDeleteMany.mockResolvedValue({ count: 1 })

      await invalidatePasswordResetTokens('test@example.com')

      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: {
          identifier: 'test@example.com',
        },
      })
    })
  })

  describe('deletePasswordResetToken', () => {
    it('should delete a specific token', async () => {
      const mockDeleteMany = vi.mocked(prisma.verification.deleteMany)
      mockDeleteMany.mockResolvedValue({ count: 1 })

      await deletePasswordResetToken('test-token')

      expect(mockDeleteMany).toHaveBeenCalledWith({
        where: {
          value: 'test-token',
        },
      })
    })
  })
})

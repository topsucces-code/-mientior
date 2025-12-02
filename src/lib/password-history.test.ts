import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import bcrypt from 'bcryptjs'
import {
  isPasswordReused,
  addPasswordToHistory,
  clearPasswordHistory,
} from './password-history'

// Feature: authentication-system, Property 38: Password history prevents reuse
// Validates: Requirements 10.5

// Use lower bcrypt cost for testing to speed up tests
const TEST_BCRYPT_COST = 4

describe('Password History', () => {
  const testUserId = 'test-user-password-history'

  beforeEach(async () => {
    // Clean up any existing test data
    await clearPasswordHistory(testUserId)
  })

  afterEach(async () => {
    // Clean up test data
    await clearPasswordHistory(testUserId)
  })

  describe('Property 38: Password history prevents reuse', () => {
    it(
      'should reject passwords that match any of the last 5 password hashes',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate an array of 6 unique passwords
            fc
              .array(fc.string({ minLength: 8, maxLength: 20 }), {
                minLength: 6,
                maxLength: 6,
              })
              .filter((passwords) => {
                // Ensure all passwords are unique
                const uniquePasswords = new Set(passwords)
                return uniquePasswords.size === passwords.length
              }),
            async (passwords) => {
              // Clear history before each test iteration
              await clearPasswordHistory(testUserId)

              // Add first 5 passwords to history
              for (let i = 0; i < 5; i++) {
                const password = passwords[i]
                if (!password) continue
                const hash = await bcrypt.hash(password, TEST_BCRYPT_COST)
                await addPasswordToHistory(testUserId, hash)
              }

              // Check that all 5 passwords in history are detected as reused
              for (let i = 0; i < 5; i++) {
                const password = passwords[i]
                if (!password) continue
                const isReused = await isPasswordReused(testUserId, password)
                expect(isReused).toBe(true)
              }

              // Check that the 6th password (not in history) is not detected as reused
              const sixthPassword = passwords[5]
              if (sixthPassword) {
                const isReused = await isPasswordReused(testUserId, sixthPassword)
                expect(isReused).toBe(false)
              }
            }
          ),
          { numRuns: 100 }
        )
      },
      60000
    )

    it(
      'should only keep the last 5 passwords in history',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate an array of 7 unique passwords
            fc
              .array(fc.string({ minLength: 8, maxLength: 20 }), {
                minLength: 7,
                maxLength: 7,
              })
              .filter((passwords) => {
                const uniquePasswords = new Set(passwords)
                return uniquePasswords.size === passwords.length
              }),
            async (passwords) => {
              // Clear history before each test iteration
              await clearPasswordHistory(testUserId)

              // Add 7 passwords to history
              for (let i = 0; i < 7; i++) {
                const password = passwords[i]
                if (!password) continue
                const hash = await bcrypt.hash(password, TEST_BCRYPT_COST)
                await addPasswordToHistory(testUserId, hash)
              }

              // The first 2 passwords should no longer be in history (only last 5 kept)
              const firstPassword = passwords[0]
              const secondPassword = passwords[1]
              if (firstPassword) {
                const firstPasswordReused = await isPasswordReused(
                  testUserId,
                  firstPassword
                )
                expect(firstPasswordReused).toBe(false)
              }
              if (secondPassword) {
                const secondPasswordReused = await isPasswordReused(
                  testUserId,
                  secondPassword
                )
                expect(secondPasswordReused).toBe(false)
              }

              // The last 5 passwords should still be in history
              for (let i = 2; i < 7; i++) {
                const password = passwords[i]
                if (!password) continue
                const isReused = await isPasswordReused(testUserId, password)
                expect(isReused).toBe(true)
              }
            }
          ),
          { numRuns: 100 }
        )
      },
      60000
    )

    it(
      'should handle empty password history correctly',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 8, maxLength: 20 }),
            async (password) => {
              // Clear history before each test iteration
              await clearPasswordHistory(testUserId)

              // With empty history, no password should be detected as reused
              if (password) {
                const isReused = await isPasswordReused(testUserId, password)
                expect(isReused).toBe(false)
              }
            }
          ),
          { numRuns: 100 }
        )
      },
      30000
    )

    it(
      'should correctly compare password hashes using bcrypt',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc
              .tuple(
                fc.string({ minLength: 8, maxLength: 20 }),
                fc.string({ minLength: 8, maxLength: 20 })
              )
              .filter(([p1, p2]) => p1 !== p2), // Ensure passwords are different
            async ([password1, password2]) => {
              // Clear history before each test iteration
              await clearPasswordHistory(testUserId)

              if (!password1 || !password2) return

              // Add password1 to history
              const hash1 = await bcrypt.hash(password1, TEST_BCRYPT_COST)
              await addPasswordToHistory(testUserId, hash1)

              // password1 should be detected as reused
              const isPassword1Reused = await isPasswordReused(
                testUserId,
                password1
              )
              expect(isPassword1Reused).toBe(true)

              // password2 (different from password1) should not be detected as reused
              const isPassword2Reused = await isPasswordReused(
                testUserId,
                password2
              )
              expect(isPassword2Reused).toBe(false)
            }
          ),
          { numRuns: 100 }
        )
      },
      60000
    )
  })
})

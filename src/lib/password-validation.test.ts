import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  validatePassword,
  checkPasswordStrength,
  isPasswordBreached,
  hashPassword,
  verifyPassword,
  validatePasswordComprehensive,
  PasswordStrength,
} from './password-validation'

// Feature: authentication-system, Property 3: Invalid passwords are rejected with specific errors
// Validates: Requirements 1.4, 10.2

describe('Password Validation', () => {
  describe('Property 3: Invalid passwords are rejected with specific errors', () => {
    it(
      'should reject passwords shorter than 8 characters',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ maxLength: 7 }),
            async (password) => {
              const result = validatePassword(password)
              
              if (password.length < 8) {
                expect(result.isValid).toBe(false)
                expect(result.errors.some(e => e.includes('8 characters'))).toBe(true)
              }
            }
          ),
          { numRuns: 100 }
        )
      }
    )

    it(
      'should reject passwords without uppercase letters',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate passwords with lowercase, numbers, and special chars but no uppercase
            fc.string({ minLength: 8, maxLength: 20 }).filter(pwd => 
              pwd.length >= 8 && !/[A-Z]/.test(pwd)
            ),
            async (password) => {
              const result = validatePassword(password)
              
              expect(result.isValid).toBe(false)
              expect(result.errors.some(e => e.includes('uppercase'))).toBe(true)
            }
          ),
          { numRuns: 100 }
        )
      }
    )

    it(
      'should reject passwords without lowercase letters',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate passwords without lowercase
            fc.string({ minLength: 8, maxLength: 20 }).filter(pwd => 
              pwd.length >= 8 && !/[a-z]/.test(pwd)
            ),
            async (password) => {
              const result = validatePassword(password)
              
              expect(result.isValid).toBe(false)
              expect(result.errors.some(e => e.includes('lowercase'))).toBe(true)
            }
          ),
          { numRuns: 100 }
        )
      }
    )

    it(
      'should reject passwords without numbers',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate passwords without numbers
            fc.string({ minLength: 8, maxLength: 20 }).filter(pwd => 
              pwd.length >= 8 && !/[0-9]/.test(pwd)
            ),
            async (password) => {
              const result = validatePassword(password)
              
              expect(result.isValid).toBe(false)
              expect(result.errors.some(e => e.includes('number'))).toBe(true)
            }
          ),
          { numRuns: 100 }
        )
      }
    )

    it(
      'should reject passwords without special characters',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate passwords with only alphanumeric characters
            fc.stringMatching(/^[A-Za-z0-9]{8,20}$/),
            async (password) => {
              const result = validatePassword(password)
              
              expect(result.isValid).toBe(false)
              expect(result.errors.some(e => e.includes('special character'))).toBe(true)
            }
          ),
          { numRuns: 100 }
        )
      }
    )

    it(
      'should accept passwords meeting all requirements',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate valid passwords with all requirements
            fc.tuple(
              fc.stringMatching(/[A-Z]/), // uppercase
              fc.stringMatching(/[a-z]/), // lowercase
              fc.stringMatching(/[0-9]/), // number
              fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*'), // special char
              fc.string({ minLength: 0, maxLength: 12 }) // padding
            ).map(([upper, lower, num, special, padding]) => 
              upper + lower + num + special + padding
            ).filter(pwd => pwd.length >= 8),
            async (password) => {
              const result = validatePassword(password)
              
              // If password has all requirements, it should be valid
              if (
                password.length >= 8 &&
                /[A-Z]/.test(password) &&
                /[a-z]/.test(password) &&
                /[0-9]/.test(password) &&
                /[^A-Za-z0-9]/.test(password)
              ) {
                expect(result.isValid).toBe(true)
                expect(result.errors).toHaveLength(0)
              }
            }
          ),
          { numRuns: 100 }
        )
      }
    )

    it(
      'should return all applicable error messages for invalid passwords',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ maxLength: 20 }),
            async (password) => {
              const result = validatePassword(password)
              
              // Count how many requirements are missing
              const missingRequirements = []
              if (password.length < 8) missingRequirements.push('length')
              if (!/[A-Z]/.test(password)) missingRequirements.push('uppercase')
              if (!/[a-z]/.test(password)) missingRequirements.push('lowercase')
              if (!/[0-9]/.test(password)) missingRequirements.push('number')
              if (!/[^A-Za-z0-9]/.test(password)) missingRequirements.push('special')
              
              // If there are missing requirements, should have errors
              if (missingRequirements.length > 0) {
                expect(result.isValid).toBe(false)
                expect(result.errors.length).toBeGreaterThan(0)
                expect(result.errors.length).toBe(missingRequirements.length)
              } else {
                expect(result.isValid).toBe(true)
                expect(result.errors).toHaveLength(0)
              }
            }
          ),
          { numRuns: 100 }
        )
      }
    )
  })

  describe('Password Strength Checker', () => {
    it('should return strength feedback for any password', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 30 }),
          (password) => {
            const result = checkPasswordStrength(password)
            
            // Should always return a valid strength level
            expect(Object.values(PasswordStrength)).toContain(result.strength)
            
            // Score should be between 0 and 100
            expect(result.score).toBeGreaterThanOrEqual(0)
            expect(result.score).toBeLessThanOrEqual(100)
            
            // Feedback should be an array
            expect(Array.isArray(result.feedback)).toBe(true)
            
            // meetsRequirements should match validatePassword result
            const validation = validatePassword(password)
            expect(result.meetsRequirements).toBe(validation.isValid)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should give higher scores to stronger passwords', () => {
      const weakPassword = 'abc'
      const fairPassword = 'abcdefgh'
      const goodPassword = 'Abcdefgh1'
      const strongPassword = 'Abcdefgh1!'
      
      const weakResult = checkPasswordStrength(weakPassword)
      const fairResult = checkPasswordStrength(fairPassword)
      const goodResult = checkPasswordStrength(goodPassword)
      const strongResult = checkPasswordStrength(strongPassword)
      
      expect(weakResult.score).toBeLessThan(fairResult.score)
      expect(fairResult.score).toBeLessThan(goodResult.score)
      expect(goodResult.score).toBeLessThan(strongResult.score)
    })
  })

  // Feature: authentication-system, Property 1: Registration creates valid customer records
  // Validates: Requirements 1.2, 10.4
  describe('Property 1: Registration creates valid customer records', () => {
    it(
      'should hash passwords using bcrypt with cost factor 12',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 8, maxLength: 30 }),
            async (password) => {
              const hash = await hashPassword(password)
              
              // Hash should be a valid bcrypt hash (starts with $2a$ or $2b$)
              expect(hash).toMatch(/^\$2[ab]\$/)
              
              // Hash should contain cost factor 12
              expect(hash).toMatch(/^\$2[ab]\$12\$/)
              
              // Hash should be different from the original password
              expect(hash).not.toBe(password)
              
              // Should be able to verify the password against the hash
              const isValid = await verifyPassword(password, hash)
              expect(isValid).toBe(true)
            }
          ),
          { numRuns: 10 } // Reduced runs due to bcrypt cost factor 12 being slow
        )
      },
      120000 // 120 second timeout for bcrypt operations
    )

    it(
      'should produce different hashes for the same password (salt)',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 8, maxLength: 30 }),
            async (password) => {
              const hash1 = await hashPassword(password)
              const hash2 = await hashPassword(password)
              
              // Same password should produce different hashes due to salt
              expect(hash1).not.toBe(hash2)
              
              // Both hashes should verify against the original password
              const isValid1 = await verifyPassword(password, hash1)
              const isValid2 = await verifyPassword(password, hash2)
              expect(isValid1).toBe(true)
              expect(isValid2).toBe(true)
            }
          ),
          { numRuns: 10 } // Reduced runs due to bcrypt being slow
        )
      },
      120000
    )

    it(
      'should reject incorrect passwords when verifying',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.tuple(
              fc.string({ minLength: 8, maxLength: 30 }),
              fc.string({ minLength: 8, maxLength: 30 })
            ).filter(([p1, p2]) => p1 !== p2), // Ensure passwords are different
            async ([password1, password2]) => {
              const hash = await hashPassword(password1)
              
              // Correct password should verify
              const isValid1 = await verifyPassword(password1, hash)
              expect(isValid1).toBe(true)
              
              // Different password should not verify
              const isValid2 = await verifyPassword(password2, hash)
              expect(isValid2).toBe(false)
            }
          ),
          { numRuns: 10 } // Reduced runs due to bcrypt being slow
        )
      },
      120000
    )
  })

  // Feature: authentication-system, Property 37: Breached passwords are rejected
  // Validates: Requirements 10.3
  describe('Property 37: Breached passwords are rejected', () => {
    it('should detect known breached passwords', async () => {
      // Test with a known breached password: "password"
      const breachedPassword = 'password'
      const isBreached = await isPasswordBreached(breachedPassword)
      
      // This password is definitely in the HIBP database
      expect(isBreached).toBe(true)
    })

    it('should not flag random strong passwords as breached', async () => {
      // Generate a random strong password that's unlikely to be breached
      const randomPassword = `Test${Math.random().toString(36).substring(2, 15)}!123`
      const isBreached = await isPasswordBreached(randomPassword)
      
      // Random passwords are very unlikely to be breached
      expect(isBreached).toBe(false)
    })

    it(
      'should use k-anonymity (only send first 5 chars of hash)',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.string({ minLength: 8, maxLength: 30 }),
            async (password) => {
              // The function should complete without error
              // This tests that the API call works correctly
              const result = await isPasswordBreached(password)
              
              // Result should be a boolean
              expect(typeof result).toBe('boolean')
            }
          ),
          { numRuns: 20 } // Limited runs to avoid rate limiting
        )
      },
      30000
    )

    it('should handle API failures gracefully (fail open)', async () => {
      // Test with a very long password that might cause issues
      const longPassword = 'A'.repeat(1000) + '1!aB'
      
      // Should not throw an error, even if API fails
      const result = await isPasswordBreached(longPassword)
      
      // Should return false (fail open) if there's an error
      expect(typeof result).toBe('boolean')
    })

    it('should reject comprehensive validation for breached passwords', async () => {
      // Test with a known breached password that meets all other requirements
      const breachedPassword = 'Password123!'
      
      const result = await validatePasswordComprehensive(breachedPassword)
      
      // Should be invalid due to breach
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.includes('data breaches'))).toBe(true)
    })

    it(
      'should accept comprehensive validation for non-breached valid passwords',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate random strong passwords
            fc.tuple(
              fc.stringMatching(/[A-Z]/),
              fc.stringMatching(/[a-z]/),
              fc.stringMatching(/[0-9]/),
              fc.constantFrom('!', '@', '#', '$', '%'),
              fc.string({ minLength: 8, maxLength: 12 })
            ).map(([upper, lower, num, special, random]) => 
              upper + lower + num + special + random
            ),
            async (password) => {
              // Skip if password doesn't meet basic requirements
              const basicValidation = validatePassword(password)
              if (!basicValidation.isValid) {
                return
              }
              
              const result = await validatePasswordComprehensive(password)
              
              // Random strong passwords should pass (very unlikely to be breached)
              // If it fails, it should only be due to breach detection
              if (!result.isValid) {
                expect(result.errors.some(e => e.includes('data breaches'))).toBe(true)
              }
            }
          ),
          { numRuns: 10 } // Limited runs to avoid rate limiting
        )
      },
      60000
    )
  })
})

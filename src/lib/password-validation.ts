import { z } from 'zod'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const BCRYPT_COST_FACTOR = 12

/**
 * Password validation schema with comprehensive security requirements
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  )

/**
 * Password strength levels
 */
export enum PasswordStrength {
  WEAK = 'weak',
  FAIR = 'fair',
  GOOD = 'good',
  STRONG = 'strong',
}

/**
 * Password strength feedback
 */
export interface PasswordStrengthResult {
  strength: PasswordStrength
  score: number // 0-100
  feedback: string[]
  meetsRequirements: boolean
}

/**
 * Validate password and return detailed feedback
 */
export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const result = passwordSchema.safeParse(password)

  if (result.success) {
    return { isValid: true, errors: [] }
  }

  const errors = result.error.errors.map((err) => err.message)
  return { isValid: false, errors }
}

/**
 * Check password strength with real-time feedback
 */
export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const feedback: string[] = []
  let score = 0

  // Check length
  if (password.length >= 8) {
    score += 20
  } else {
    feedback.push('Password should be at least 8 characters')
  }

  if (password.length >= 12) {
    score += 10
  }

  if (password.length >= 16) {
    score += 10
  }

  // Check for uppercase
  if (/[A-Z]/.test(password)) {
    score += 15
  } else {
    feedback.push('Add uppercase letters')
  }

  // Check for lowercase
  if (/[a-z]/.test(password)) {
    score += 15
  } else {
    feedback.push('Add lowercase letters')
  }

  // Check for numbers
  if (/[0-9]/.test(password)) {
    score += 15
  } else {
    feedback.push('Add numbers')
  }

  // Check for special characters
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 15
  } else {
    feedback.push('Add special characters')
  }

  // Check for variety (not all same character type)
  const hasVariety =
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)

  if (hasVariety) {
    score += 10
  }

  // Determine strength level
  let strength: PasswordStrength
  if (score >= 80) {
    strength = PasswordStrength.STRONG
  } else if (score >= 60) {
    strength = PasswordStrength.GOOD
  } else if (score >= 40) {
    strength = PasswordStrength.FAIR
  } else {
    strength = PasswordStrength.WEAK
  }

  const meetsRequirements = validatePassword(password).isValid

  return {
    strength,
    score,
    feedback,
    meetsRequirements,
  }
}

/**
 * Check if password has been breached using Have I Been Pwned API
 * Uses k-anonymity model - only sends first 5 chars of SHA-1 hash
 */
export async function isPasswordBreached(password: string): Promise<boolean> {
  try {
    // Hash the password with SHA-1
    const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase()

    // Send only first 5 characters to API (k-anonymity)
    const prefix = hash.substring(0, 5)
    const suffix = hash.substring(5)

    // Query Have I Been Pwned API
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          'User-Agent': 'Mientior-Marketplace',
        },
      }
    )

    if (!response.ok) {
      // If API is unavailable, fail open (don't block user)
      console.warn('Have I Been Pwned API unavailable')
      return false
    }

    const text = await response.text()

    // Check if our hash suffix appears in the response
    const hashes = text.split('\n')
    for (const line of hashes) {
      const [hashSuffix] = line.split(':')
      if (hashSuffix === suffix) {
        return true
      }
    }

    return false
  } catch (error) {
    // If there's an error, fail open (don't block user)
    console.error('Error checking password breach:', error)
    return false
  }
}

/**
 * Hash password using bcrypt with cost factor 12
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST_FACTOR)
}

/**
 * Verify password against bcrypt hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Comprehensive password validation for registration/reset
 * Checks all requirements including breach detection
 */
export async function validatePasswordComprehensive(
  password: string
): Promise<{
  isValid: boolean
  errors: string[]
}> {
  const errors: string[] = []

  // Check basic requirements
  const basicValidation = validatePassword(password)
  if (!basicValidation.isValid) {
    errors.push(...basicValidation.errors)
  }

  // Check if password has been breached
  const breached = await isPasswordBreached(password)
  if (breached) {
    errors.push(
      'This password has been found in data breaches, please choose a different one'
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

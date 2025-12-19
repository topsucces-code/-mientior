import crypto from 'crypto'
import { prisma } from './prisma'

/**
 * Generate a cryptographically secure verification token
 * @param email - User's email address
 * @returns The generated token string
 */
export async function generateVerificationToken(email: string): Promise<string> {
  // Generate cryptographically secure random token (32 bytes)
  const token = crypto.randomBytes(32).toString('hex')
  
  // Calculate expiry time (24 hours from now)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)
  
  // Store token in verifications table
  await prisma.verifications.create({
    data: {
      id: crypto.randomUUID(),
      identifier: email,
      value: token,
      expiresAt,
      updatedAt: new Date(),
    },
  })
  
  return token
}

/**
 * Invalidate all existing verification tokens for a user
 * @param email - User's email address
 */
export async function invalidateVerificationTokens(email: string): Promise<void> {
  await prisma.verifications.deleteMany({
    where: {
      identifier: email,
    },
  })
}

/**
 * Validate a verification token
 * @param token - The token to validate
 * @returns The email associated with the token if valid, null otherwise
 */
export async function validateVerificationToken(token: string): Promise<string | null> {
  const verification = await prisma.verifications.findFirst({
    where: {
      value: token,
      expiresAt: {
        gt: new Date(), // Token must not be expired
      },
    },
  })
  
  if (!verification) {
    return null
  }
  
  return verification.identifier
}

/**
 * Delete a verification token after use
 * @param token - The token to delete
 */
export async function deleteVerificationToken(token: string): Promise<void> {
  await prisma.verifications.deleteMany({
    where: {
      value: token,
    },
  })
}

/**
 * Generate a cryptographically secure password reset token
 * @param email - User's email address
 * @returns The generated token string
 */
export async function generatePasswordResetToken(email: string): Promise<string> {
  // Generate cryptographically secure random token (32 bytes)
  const token = crypto.randomBytes(32).toString('hex')
  
  // Calculate expiry time (1 hour from now)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 1)
  
  // Store token in verifications table
  await prisma.verifications.create({
    data: {
      id: crypto.randomUUID(),
      identifier: email,
      value: token,
      expiresAt,
      updatedAt: new Date(),
    },
  })
  
  return token
}

/**
 * Invalidate all existing password reset tokens for a user
 * @param email - User's email address
 */
export async function invalidatePasswordResetTokens(email: string): Promise<void> {
  await prisma.verifications.deleteMany({
    where: {
      identifier: email,
    },
  })
}

/**
 * Validate a password reset token
 * @param token - The token to validate
 * @returns The email associated with the token if valid, null otherwise
 */
export async function validatePasswordResetToken(token: string): Promise<string | null> {
  const verification = await prisma.verifications.findFirst({
    where: {
      value: token,
      expiresAt: {
        gt: new Date(), // Token must not be expired
      },
    },
  })
  
  if (!verification) {
    return null
  }
  
  return verification.identifier
}

/**
 * Delete a password reset token after use
 * @param token - The token to delete
 */
export async function deletePasswordResetToken(token: string): Promise<void> {
  await prisma.verifications.deleteMany({
    where: {
      value: token,
    },
  })
}

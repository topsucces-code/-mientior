import { authenticator } from 'otplib'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

/**
 * Generate a new TOTP secret for 2FA setup
 */
export function generateSecret(): string {
  return authenticator.generateSecret()
}

/**
 * Generate TOTP URI for QR code generation
 * Format: otpauth://totp/Mientior:email?secret=SECRET&issuer=Mientior
 */
export function generateTOTPUri(secret: string, email: string): string {
  return authenticator.keyuri(email, 'Mientior', secret)
}

/**
 * Verify a TOTP token against a secret
 */
export function verifyTOTP(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token, secret })
  } catch (error) {
    console.error('Error verifying TOTP:', error)
    return false
  }
}

/**
 * Generate backup codes for 2FA recovery
 * Returns an array of random 8-character hex codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  )
}

/**
 * Hash a backup code with bcrypt for secure storage
 */
export async function hashBackupCode(code: string): Promise<string> {
  return bcrypt.hash(code, 10)
}

/**
 * Verify a backup code against a hashed code
 */
export async function verifyBackupCode(
  code: string,
  hashedCode: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(code, hashedCode)
  } catch (error) {
    console.error('Error verifying backup code:', error)
    return false
  }
}

/**
 * Hash multiple backup codes for storage
 */
export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => hashBackupCode(code)))
}

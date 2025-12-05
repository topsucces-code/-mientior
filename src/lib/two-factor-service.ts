import { prisma } from './prisma';
import crypto from 'crypto';

// TOTP Configuration
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30; // seconds
const TOTP_ALGORITHM = 'sha1';
const BACKUP_CODES_COUNT = 10;

/**
 * Generate a random base32 secret for TOTP
 */
export function generateTOTPSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Generate TOTP URI for QR code
 */
export function generateTOTPUri(
  secret: string,
  email: string,
  issuer: string = 'Mientior'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=${TOTP_ALGORITHM.toUpperCase()}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/**
 * Generate TOTP code for a given secret and time
 */
export function generateTOTP(secret: string, time?: number): string {
  const counter = Math.floor((time || Date.now() / 1000) / TOTP_PERIOD);
  return generateHOTP(secret, counter);
}

/**
 * Verify TOTP code with time window tolerance
 */
export function verifyTOTP(secret: string, code: string, window: number = 1): boolean {
  const now = Math.floor(Date.now() / 1000);
  
  // Check current and adjacent time windows
  for (let i = -window; i <= window; i++) {
    const time = now + (i * TOTP_PERIOD);
    const expectedCode = generateTOTP(secret, time);
    if (timingSafeEqual(code, expectedCode)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate backup codes
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Hash backup codes for storage
 */
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(code => 
    crypto.createHash('sha256').update(code.replace('-', '')).digest('hex')
  );
}

/**
 * Verify a backup code
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const hashedInput = crypto.createHash('sha256')
    .update(code.replace('-', '').toUpperCase())
    .digest('hex');
  
  return hashedCodes.findIndex(hashed => timingSafeEqual(hashedInput, hashed));
}

// ==================== DATABASE OPERATIONS ====================

/**
 * Enable 2FA for a user
 */
export async function enable2FA(userId: string): Promise<{
  secret: string;
  uri: string;
  backupCodes: string[];
}> {
  // Get user email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Generate secret and backup codes
  const secret = generateTOTPSecret();
  const backupCodes = generateBackupCodes();
  const hashedBackupCodes = hashBackupCodes(backupCodes);
  const uri = generateTOTPUri(secret, user.email);

  // Store encrypted secret (in production, use proper encryption)
  // For now, we'll store it directly - in production, encrypt with a key
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret,
      twoFactorBackupCodes: hashedBackupCodes,
      twoFactorEnabled: false, // Not enabled until verified
    },
  });

  return { secret, uri, backupCodes };
}

/**
 * Verify and activate 2FA
 */
export async function verify2FASetup(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  });

  if (!user?.twoFactorSecret) {
    throw new Error('2FA not initialized');
  }

  const isValid = verifyTOTP(user.twoFactorSecret, code);

  if (isValid) {
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  return isValid;
}

/**
 * Verify 2FA code during login
 */
export async function verify2FALogin(
  userId: string,
  code: string
): Promise<{ success: boolean; usedBackupCode?: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorSecret: true,
      twoFactorEnabled: true,
      twoFactorBackupCodes: true,
    },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: true }; // 2FA not enabled
  }

  // Try TOTP first
  if (verifyTOTP(user.twoFactorSecret, code)) {
    return { success: true };
  }

  // Try backup code
  const backupCodes = (user.twoFactorBackupCodes as string[]) || [];
  const backupCodeIndex = verifyBackupCode(code, backupCodes);

  if (backupCodeIndex !== -1) {
    // Remove used backup code
    const updatedCodes = [...backupCodes];
    updatedCodes.splice(backupCodeIndex, 1);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: updatedCodes },
    });

    return { success: true, usedBackupCode: true };
  }

  return { success: false };
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: string, code: string): Promise<boolean> {
  const result = await verify2FALogin(userId, code);

  if (!result.success) {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    },
  });

  return true;
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(
  userId: string,
  code: string
): Promise<string[] | null> {
  const result = await verify2FALogin(userId, code);

  if (!result.success) {
    return null;
  }

  const backupCodes = generateBackupCodes();
  const hashedBackupCodes = hashBackupCodes(backupCodes);

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorBackupCodes: hashedBackupCodes },
  });

  return backupCodes;
}

/**
 * Check if user has 2FA enabled
 */
export async function has2FAEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  return user?.twoFactorEnabled || false;
}

/**
 * Get remaining backup codes count
 */
export async function getBackupCodesCount(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorBackupCodes: true },
  });

  return ((user?.twoFactorBackupCodes as string[]) || []).length;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate HOTP (HMAC-based One-Time Password)
 */
function generateHOTP(secret: string, counter: number): string {
  const decodedSecret = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  
  for (let i = 7; i >= 0; i--) {
    buffer[i] = counter & 0xff;
    counter = Math.floor(counter / 256);
  }

  const hmac = crypto.createHmac(TOTP_ALGORITHM, decodedSecret);
  hmac.update(buffer);
  const hmacResult = hmac.digest();

  const offset = (hmacResult[hmacResult.length - 1] ?? 0) & 0xf;
  const code = (
    (((hmacResult[offset] ?? 0) & 0x7f) << 24) |
    (((hmacResult[offset + 1] ?? 0) & 0xff) << 16) |
    (((hmacResult[offset + 2] ?? 0) & 0xff) << 8) |
    ((hmacResult[offset + 3] ?? 0) & 0xff)
  ) % Math.pow(10, TOTP_DIGITS);

  return code.toString().padStart(TOTP_DIGITS, '0');
}

/**
 * Base32 encoding
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = '';
  let bits = 0;
  let value = 0;

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      result += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += alphabet[(value << (5 - bits)) & 31];
  }

  return result;
}

/**
 * Base32 decoding
 */
function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanedInput = encoded.toUpperCase().replace(/=+$/, '');
  
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of cleanedInput) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  return crypto.timingSafeEqual(bufA, bufB);
}

import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

const PASSWORD_HISTORY_LIMIT = 5

/**
 * Check if a password has been used recently by comparing against password history
 * @param userId - The user's ID
 * @param newPassword - The new password to check
 * @returns true if password was used recently, false otherwise
 */
export async function isPasswordReused(
  userId: string,
  newPassword: string
): Promise<boolean> {
  // Get the last 5 password hashes for this user
  const passwordHistory = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: PASSWORD_HISTORY_LIMIT,
  })

  // Check if the new password matches any of the stored hashes
  for (const record of passwordHistory) {
    const matches = await bcrypt.compare(newPassword, record.hash)
    if (matches) {
      return true
    }
  }

  return false
}

/**
 * Add a password hash to the user's password history
 * @param userId - The user's ID
 * @param passwordHash - The bcrypt hash of the password
 */
export async function addPasswordToHistory(
  userId: string,
  passwordHash: string
): Promise<void> {
  // Add the new password hash to history
  await prisma.passwordHistory.create({
    data: {
      userId,
      hash: passwordHash,
    },
  })

  // Clean up old password history entries (keep only the last 5)
  const allHistory = await prisma.passwordHistory.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  if (allHistory.length > PASSWORD_HISTORY_LIMIT) {
    const toDelete = allHistory.slice(PASSWORD_HISTORY_LIMIT)
    await prisma.passwordHistory.deleteMany({
      where: {
        id: {
          in: toDelete.map((h) => h.id),
        },
      },
    })
  }
}

/**
 * Clear all password history for a user (useful for testing or account deletion)
 * @param userId - The user's ID
 */
export async function clearPasswordHistory(userId: string): Promise<void> {
  await prisma.passwordHistory.deleteMany({
    where: { userId },
  })
}

import { NextRequest } from 'next/server'
import { validateRequest } from '@/lib/api-validation'
import { apiSuccess, apiError, ErrorCodes } from '@/lib/api-response'
import { getSession } from '@/lib/auth-server'
import { verifyPassword } from '@/lib/password-validation'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password required'),
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Type DELETE to confirm' }),
  }),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Verify session
    const session = await getSession()
    if (!session) {
      return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
    }

    // 2. Validate body
    const validation = await validateRequest(request, deleteAccountSchema)
    if (!validation.success) {
      return validation.response
    }

    const { password } = validation.data

    // 3. Verify password
    const authUser = await prisma.betterAuthUser.findUnique({
      where: { id: session.user.id },
    })

    if (!authUser?.password) {
      return apiError(
        'Password not set (OAuth user)',
        ErrorCodes.INVALID_INPUT,
        400
      )
    }

    const isValid = await verifyPassword(password, authUser.password)
    if (!isValid) {
      return apiError(
        'Incorrect password',
        ErrorCodes.INVALID_CREDENTIALS,
        401
      )
    }

    // 4. Soft delete - anonymize user data (GDPR compliant)
    const deletedEmail = `deleted_${session.user.id}@deleted.com`
    const now = new Date()

    await prisma.$transaction(async (tx) => {
      // Anonymize User record
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          email: deletedEmail,
          firstName: 'Deleted',
          lastName: 'User',
          phone: null,
          deletedAt: now,
          // Clear marketing data
          searchHistory: [],
          recentlyViewed: [],
        },
      })

      // Anonymize Better Auth user
      await tx.betterAuthUser.update({
        where: { id: session.user.id },
        data: {
          email: deletedEmail,
          emailVerified: false,
          password: null,
        },
      })

      // Delete all saved addresses
      await tx.savedAddress.deleteMany({
        where: { userId: session.user.id },
      })

      // Delete all sessions
      await tx.session.deleteMany({
        where: { userId: session.user.id },
      })

      // Note: We keep Order records for legal/accounting compliance (10 years)
      // but they're now linked to an anonymized user
    })

    // 5. No need to invalidate session cache - all sessions deleted from DB
    // Cache lookups will fail naturally when sessions don't exist

    // TODO: Send confirmation email to original email address
    // (before anonymization, store it temporarily)

    return apiSuccess({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Error deleting account:', error)
    return apiError(
      'Failed to delete account',
      ErrorCodes.INTERNAL_SERVER_ERROR,
      500
    )
  }
}

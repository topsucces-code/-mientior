import { NextRequest } from 'next/server'
import { validateRequest } from '@/lib/api-validation'
import { apiSuccess, apiError, ErrorCodes } from '@/lib/api-response'
import { getSession } from '@/lib/auth-server'
import {
  verifyPassword,
  hashPassword,
  validatePasswordComprehensive,
} from '@/lib/password-validation'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
})

function extractSessionToken(cookieHeader: string | null): string | null {
  if (!cookieHeader) {
    return null
  }

  const cookies = cookieHeader.split(';').map((c) => c.trim())
  for (const cookie of cookies) {
    if (cookie.startsWith('better-auth.session_token=')) {
      return cookie.substring('better-auth.session_token='.length)
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify session
    const session = await getSession()
    if (!session) {
      return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
    }

    // 2. Validate body
    const validation = await validateRequest(request, changePasswordSchema)
    if (!validation.success) {
      return validation.response
    }

    const { currentPassword, newPassword } = validation.data

    // 3. Get Better Auth user
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

    // 4. Verify current password
    const isValid = await verifyPassword(currentPassword, authUser.password)
    if (!isValid) {
      return apiError(
        'Current password incorrect',
        ErrorCodes.INVALID_CREDENTIALS,
        401
      )
    }

    // 5. Validate new password (with HIBP check)
    const passwordValidation = await validatePasswordComprehensive(newPassword)
    if (!passwordValidation.isValid) {
      return apiError('Invalid password', ErrorCodes.VALIDATION_ERROR, 400, {
        errors: passwordValidation.errors,
      })
    }

    // 6. Hash and save
    const hashedPassword = await hashPassword(newPassword)
    await prisma.betterAuthUser.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    })

    // 7. Invalidate all other sessions (security) - delete from DB only
    // No need to invalidate cache since deleted sessions won't be found
    const currentSessionToken = extractSessionToken(
      request.headers.get('cookie')
    )

    if (currentSessionToken) {
      await prisma.session.deleteMany({
        where: {
          userId: session.user.id,
          token: { not: currentSessionToken },
        },
      })
    }

    return apiSuccess({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Error changing password:', error)
    return apiError(
      'Failed to change password',
      ErrorCodes.INTERNAL_SERVER_ERROR,
      500
    )
  }
}

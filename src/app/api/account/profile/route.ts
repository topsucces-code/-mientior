import { NextRequest } from 'next/server'
import { validateRequest } from '@/lib/api-validation'
import { apiSuccess, apiError, ErrorCodes } from '@/lib/api-response'
import { getSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { updateProfileSchema } from '@/lib/validations/profile'
import { invalidateUserSessions } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        locale: true,
        countryCode: true,
        currency: true,
        loyaltyLevel: true,
        loyaltyPoints: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return apiError('User not found', ErrorCodes.NOT_FOUND, 404)
    }

    return apiSuccess(user)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return apiError(
      'Failed to fetch profile',
      ErrorCodes.INTERNAL_SERVER_ERROR,
      500
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
    }

    const validation = await validateRequest(request, updateProfileSchema)
    if (!validation.success) {
      return validation.response
    }

    const { firstName, lastName, phone, locale, countryCode, currency } =
      validation.data

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(phone !== undefined && { phone }),
        ...(locale !== undefined && { locale }),
        ...(countryCode !== undefined && { countryCode }),
        ...(currency !== undefined && { currency }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        locale: true,
        countryCode: true,
        currency: true,
        loyaltyLevel: true,
        loyaltyPoints: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Invalidate session cache if locale changed (affects session data)
    if (locale !== undefined) {
      await invalidateUserSessions(session.user.id)
    }

    return apiSuccess(updatedUser)
  } catch (error) {
    console.error('Error updating profile:', error)
    return apiError(
      'Failed to update profile',
      ErrorCodes.INTERNAL_SERVER_ERROR,
      500
    )
  }
}

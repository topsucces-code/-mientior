import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'
import { validateRequest } from '@/lib/api-validation'
import { apiSuccess, apiError, ErrorCodes } from '@/lib/api-response'
import { addressSchema } from '@/lib/validations/address'

// GET /api/account/addresses - List user addresses
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
    }

    const addresses = await prisma.savedAddress.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return apiSuccess(addresses)
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return apiError(
      'Failed to fetch addresses',
      ErrorCodes.INTERNAL_ERROR,
      500
    )
  }
}

// POST /api/account/addresses - Create new address
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
    }

    // Validate request body
    const validation = await validateRequest(request, addressSchema)
    if (!validation.success) {
      return validation.response
    }

    const {
      firstName,
      lastName,
      line1,
      line2,
      city,
      postalCode,
      country,
      phone,
      isDefault,
    } = validation.data

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const address = await prisma.savedAddress.create({
      data: {
        userId: session.user.id,
        firstName,
        lastName,
        line1,
        line2: line2 || null,
        city,
        postalCode,
        country,
        phone: phone ?? '',
        isDefault,
      },
    })

    return apiSuccess(address, undefined, 201)
  } catch (error) {
    console.error('Error creating address:', error)
    return apiError(
      'Failed to create address',
      ErrorCodes.INTERNAL_ERROR,
      500
    )
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'
import { validateRequest } from '@/lib/api-validation'
import { apiSuccess, apiError, ErrorCodes } from '@/lib/api-response'
import { addressSchema } from '@/lib/validations/address'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/account/addresses/[id] - Get single address
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
    }

    const { id } = await params

    const address = await prisma.savedAddress.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!address) {
      return apiError('Address not found', ErrorCodes.NOT_FOUND, 404)
    }

    return apiSuccess(address)
  } catch (error) {
    console.error('Error fetching address:', error)
    return apiError(
      'Failed to fetch address',
      ErrorCodes.INTERNAL_ERROR,
      500
    )
  }
}

// PATCH /api/account/addresses/[id] - Update address
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.savedAddress.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return apiError('Address not found', ErrorCodes.NOT_FOUND, 404)
    }

    // Validate request body with partial schema (all fields optional for PATCH)
    const validation = await validateRequest(request, addressSchema.partial())
    if (!validation.success) {
      return validation.response
    }

    // If setting as default, unset other defaults
    if (validation.data.isDefault && !existing.isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    // Construct update data object with only provided fields
    const updateData: Record<string, unknown> = {}

    if (validation.data.firstName !== undefined) updateData.firstName = validation.data.firstName
    if (validation.data.lastName !== undefined) updateData.lastName = validation.data.lastName
    if (validation.data.line1 !== undefined) updateData.line1 = validation.data.line1
    if (validation.data.line2 !== undefined) updateData.line2 = validation.data.line2 || null
    if (validation.data.city !== undefined) updateData.city = validation.data.city
    if (validation.data.postalCode !== undefined) updateData.postalCode = validation.data.postalCode
    if (validation.data.country !== undefined) updateData.country = validation.data.country
    if (validation.data.phone !== undefined) updateData.phone = validation.data.phone ?? null
    if (validation.data.isDefault !== undefined) updateData.isDefault = validation.data.isDefault

    const address = await prisma.savedAddress.update({
      where: { id },
      data: updateData,
    })

    return apiSuccess(address)
  } catch (error) {
    console.error('Error updating address:', error)
    return apiError(
      'Failed to update address',
      ErrorCodes.INTERNAL_ERROR,
      500
    )
  }
}

// DELETE /api/account/addresses/[id] - Delete address
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return apiError('Unauthorized', ErrorCodes.UNAUTHORIZED, 401)
    }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.savedAddress.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return apiError('Address not found', ErrorCodes.NOT_FOUND, 404)
    }

    await prisma.savedAddress.delete({ where: { id } })

    return apiSuccess({ success: true })
  } catch (error) {
    console.error('Error deleting address:', error)
    return apiError(
      'Failed to delete address',
      ErrorCodes.INTERNAL_ERROR,
      500
    )
  }
}

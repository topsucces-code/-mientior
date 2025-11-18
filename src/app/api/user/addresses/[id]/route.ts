/**
 * API endpoint for managing individual user addresses (PUT/DELETE)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'
import type { ApiResponse } from '@/types'
import type { SavedAddress } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const address = await prisma.savedAddress.findUnique({
      where: {
        id: params.id,
        userId,
      },
    })

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({
      data: address,
      success: true,
    })
  } catch (error: any) {
    console.error('Fetch address error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch address', success: false },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    // Check if address exists and belongs to user
    const existingAddress = await prisma.savedAddress.findUnique({
      where: {
        id: params.id,
        userId,
      },
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found', success: false },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, line1, line2, city, postalCode, country, phone, isDefault } = body

    // If setting this as default, unset other default addresses
    if (isDefault && !existingAddress.isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      })
    }

    // Update the address
    const updatedAddress = await prisma.savedAddress.update({
      where: { id: params.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(line1 && { line1 }),
        ...(line2 !== undefined && { line2: line2 || null }),
        ...(city && { city }),
        ...(postalCode && { postalCode }),
        ...(country && { country }),
        ...(phone && { phone }),
        ...(isDefault !== undefined && { isDefault }),
      },
    })

    const response: ApiResponse<SavedAddress> = {
      data: updatedAddress,
      success: true,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Update address error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update address', success: false },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    // Check if address exists and belongs to user
    const existingAddress = await prisma.savedAddress.findUnique({
      where: {
        id: params.id,
        userId,
      },
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found', success: false },
        { status: 404 }
      )
    }

    // Delete the address
    await prisma.savedAddress.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      data: { id: params.id },
      success: true,
    })
  } catch (error: any) {
    console.error('Delete address error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete address', success: false },
      { status: 500 }
    )
  }
}

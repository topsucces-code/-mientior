/**
 * API endpoint for managing user saved addresses
 * Uses the SavedAddress model for relational data management
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'
import type { ApiResponse } from '@/types'
import type { SavedAddress } from '@prisma/client'

export async function GET() {
  try {
    // Require authentication
    const session = await requireAuth()
    const userId = session.user.id

    // Fetch user's saved addresses sorted by isDefault desc, then createdAt desc
    const addresses = await prisma.savedAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({
      data: addresses,
      success: true,
    })
  } catch (error: any) {
    console.error('Fetch addresses error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch addresses', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth()
    const userId = session.user.id

    const body = await request.json()
    const { firstName, lastName, line1, line2, city, postalCode, country, phone, isDefault } = body

    // Basic validation
    if (!firstName || !lastName || !line1 || !city || !postalCode || !country || !phone) {
      return NextResponse.json(
        { error: 'Missing required address fields', success: false },
        { status: 400 }
      )
    }

    // Check if user has reached the limit (5 addresses max)
    const addressCount = await prisma.savedAddress.count({
      where: { userId },
    })

    if (addressCount >= 5) {
      return NextResponse.json(
        { error: 'Maximum 5 addresses allowed per user', success: false },
        { status: 400 }
      )
    }

    // If this address should be default, unset other default addresses
    if (isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      })
    }

    // Create the new address
    const newAddress = await prisma.savedAddress.create({
      data: {
        userId,
        firstName,
        lastName,
        line1,
        line2: line2 || null,
        city,
        postalCode,
        country: country || 'CI',
        phone,
        isDefault: isDefault || false,
      },
    })

    const response: ApiResponse<SavedAddress> = {
      data: newAddress,
      success: true,
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Save address error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to save address', success: false },
      { status: 500 }
    )
  }
}

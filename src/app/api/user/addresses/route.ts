/**
 * API endpoint for saving user addresses
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'
import type { Address, ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth()
    const userId = session.user.id

    const address: Address = await request.json()

    // Basic validation
    if (!address.firstName || !address.lastName || !address.line1 || !address.city || !address.postalCode || !address.country) {
      return NextResponse.json(
        { error: 'Missing required address fields', success: false },
        { status: 400 }
      )
    }

    // Fetch current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { addresses: true }
    })

    // Update user's addresses
    const addresses = (user?.addresses as Address[]) || []
    addresses.push(address)

    await prisma.user.update({
      where: { id: userId },
      data: { addresses }
    })

    const response: ApiResponse<Address> = {
      data: address,
      success: true,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Save address error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required', success: false }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to save address', success: false },
      { status: 500 }
    )
  }
}


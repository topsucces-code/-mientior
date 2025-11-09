/**
 * API endpoint for syncing wishlist to server
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth()
    const userId = session.user.id

    const { productIds } = await request.json()

    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'productIds must be an array', success: false },
        { status: 400 }
      )
    }

    // Update user's wishlist
    await prisma.user.update({
      where: { id: userId },
      data: { wishlist: productIds }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Wishlist sync error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required', success: false }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to sync wishlist', success: false },
      { status: 500 }
    )
  }
}


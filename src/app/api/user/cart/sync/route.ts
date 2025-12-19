/**
 * API endpoint for syncing cart to server
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'
import type { CartItem, SavedForLaterItem, CouponCode } from '@/types'

interface CartSyncPayload {
  items: CartItem[]
  savedForLater: SavedForLaterItem[]
  appliedCoupon?: CouponCode
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth()
    const userId = session.user.id

    const payload: CartSyncPayload = await request.json()

    // Validate payload structure
    if (!Array.isArray(payload.items)) {
      return NextResponse.json(
        { error: 'items must be an array', success: false },
        { status: 400 }
      )
    }

    if (!Array.isArray(payload.savedForLater)) {
      return NextResponse.json(
        { error: 'savedForLater must be an array', success: false },
        { status: 400 }
      )
    }

    // Validate that each item has required fields
    for (const item of payload.items) {
      if (!item.id || !item.productId || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
        return NextResponse.json(
          { error: 'Each cart item must have id, productId, quantity, and price', success: false },
          { status: 400 }
        )
      }
    }

    for (const item of payload.savedForLater) {
      if (!item.id || !item.productId || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
        return NextResponse.json(
          { error: 'Each saved item must have id, productId, quantity, and price', success: false },
          { status: 400 }
        )
      }
    }

    // Update user's cart in database
    await prisma.users.update({
      where: { id: userId },
      data: { cart: payload }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Cart sync error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required', success: false }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Failed to sync cart', success: false },
      { status: 500 }
    )
  }
}

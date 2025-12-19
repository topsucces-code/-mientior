/**
 * API endpoint for loading cart from server
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'
import type { CartItem, SavedForLaterItem, CouponCode } from '@/types'

interface CartData {
  items: CartItem[]
  savedForLater: SavedForLaterItem[]
  appliedCoupon?: CouponCode
}

export async function GET() {
  try {
    // Require authentication
    const session = await requireAuth()
    const userId = session.user.id

    // Fetch user's cart from database
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { cart: true }
    })

    // If cart is null or undefined, return empty cart
    if (!user?.cart) {
      return NextResponse.json({
        data: {
          items: [],
          savedForLater: [],
          appliedCoupon: undefined
        },
        success: true
      })
    }

    // Validate cart structure
    const cart = user.cart as any

    if (typeof cart !== 'object' || !Array.isArray(cart.items)) {
      // Invalid cart structure, return empty cart
      return NextResponse.json({
        data: {
          items: [],
          savedForLater: [],
          appliedCoupon: undefined
        },
        success: true
      })
    }

    // Ensure savedForLater exists and is an array
    const cartData: CartData = {
      items: cart.items || [],
      savedForLater: cart.savedForLater || [],
      appliedCoupon: cart.appliedCoupon
    }

    return NextResponse.json({
      data: cartData,
      success: true
    })
  } catch (error: any) {
    console.error('Load cart error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to load cart', success: false },
      { status: 500 }
    )
  }
}

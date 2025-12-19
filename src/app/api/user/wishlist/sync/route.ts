/**
 * API endpoint for syncing wishlist to/from server
 * Supports bidirectional synchronization
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-server'

export async function GET() {
  try {
    // Require authentication
    const session = await requireAuth()
    const userId = session.user.id

    // Fetch user's wishlist from database
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { wishlist: true }
    })

    return NextResponse.json({
      data: (user?.wishlist as string[]) || [],
      success: true
    })
  } catch (error: any) {
    console.error('Wishlist load error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to load wishlist', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth()
    const userId = session.user.id

    const { productIds, merge } = await request.json()

    if (!Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'productIds must be an array', success: false },
        { status: 400 }
      )
    }

    // Validate that productIds contains only strings
    if (productIds.some(id => typeof id !== 'string')) {
      return NextResponse.json(
        { error: 'All productIds must be strings', success: false },
        { status: 400 }
      )
    }

    // Limit wishlist size to 100 items
    if (productIds.length > 100) {
      return NextResponse.json(
        { error: 'Wishlist cannot exceed 100 items', success: false },
        { status: 400 }
      )
    }

    let finalWishlist = productIds

    // If merge is true, merge with server wishlist
    if (merge) {
      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { wishlist: true }
      })

      const serverWishlist = (user?.wishlist as string[]) || []

      // Union of both arrays, deduplicated
      finalWishlist = Array.from(new Set([...serverWishlist, ...productIds]))

      // Ensure we still respect the 100 item limit after merge
      if (finalWishlist.length > 100) {
        finalWishlist = finalWishlist.slice(0, 100)
      }
    }

    // Update user's wishlist
    await prisma.users.update({
      where: { id: userId },
      data: { wishlist: finalWishlist }
    })

    return NextResponse.json({
      data: finalWishlist,
      success: true
    })
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


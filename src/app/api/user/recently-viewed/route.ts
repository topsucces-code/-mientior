/**
 * API endpoint for adding products to recently viewed list
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    // Get session (optional - can work for guests too)
    const session = await getSession()

    if (session?.user?.id) {
      // Fetch current user
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { recentlyViewed: true }
      })

      // Update recently viewed list
      const recentlyViewed = user?.recentlyViewed || []

      // Remove product if already in list
      const filtered = recentlyViewed.filter((id: string) => id !== productId)

      // Add to beginning of list
      const updated = [productId, ...filtered].slice(0, 20) // Keep max 20 items

      await prisma.user.update({
        where: { id: session.user.id },
        data: { recentlyViewed: updated }
      })

      return NextResponse.json({ success: true })
    }

    // For guests, we could store in cookies or local storage (client-side)
    return NextResponse.json({ success: true, message: 'Guest view tracked client-side' })
  } catch (error) {
    console.error('Recently viewed error:', error)
    return NextResponse.json(
      { error: 'Failed to update recently viewed' },
      { status: 500 }
    )
  }
}


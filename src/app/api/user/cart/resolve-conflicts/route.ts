/**
 * API endpoint for resolving cart conflicts
 * Validates cart items against current database state
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import { resolveCartConflicts } from '@/lib/cart-conflict-resolver'
import type { CartItem } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()

    const { items } = await request.json()

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items must be an array', success: false },
        { status: 400 }
      )
    }

    // Validate that each item has required fields
    for (const item of items) {
      if (typeof item !== 'object' || !item.id || !item.productId || typeof item.quantity !== 'number' || typeof item.price !== 'number') {
        return NextResponse.json(
          { error: 'Each cart item must have id, productId, quantity, and price', success: false },
          { status: 400 }
        )
      }
    }

    // Resolve conflicts using the utility function
    const result = await resolveCartConflicts(items as CartItem[])

    return NextResponse.json({
      data: result,
      success: true
    })
  } catch (error: unknown) {
    console.error('Cart conflict resolution error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required', success: false },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to resolve cart conflicts', success: false },
      { status: 500 }
    )
  }
}

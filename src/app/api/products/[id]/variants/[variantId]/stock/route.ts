/**
 * API endpoint for product variant stock information
 * Used as fallback when Pusher is unavailable
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; variantId: string } }
) {
  try {
    const { id: productId, variantId } = params

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { stock: true, productId: true },
    })

    if (!variant) {
      return NextResponse.json(
        { error: 'Variant not found' },
        { status: 404 }
      )
    }

    if (variant.productId !== productId) {
      return NextResponse.json(
        { error: 'Variant does not belong to this product' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      productId,
      variantId,
      stock: variant.stock,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error('Error fetching variant stock:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stock' },
      { status: 500 }
    )
  }
}

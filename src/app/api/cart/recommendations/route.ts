/**
 * API endpoint for cart-based product recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const itemIds = searchParams.get('itemIds')?.split(',') || []
    const limit = parseInt(searchParams.get('limit') || '8')

    if (itemIds.length === 0) {
      // Return popular products if no cart items
      const products = await prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          stock: { gt: 0 }
        },
        include: {
          images: {
            take: 1,
            orderBy: { order: 'asc' }
          },
          category: true
        },
        orderBy: [
          { featured: 'desc' },
          { rating: 'desc' }
        ],
        take: limit
      })

      return NextResponse.json(products)
    }

    // Get cart items to analyze
    const cartProducts = await prisma.product.findMany({
      where: {
        id: { in: itemIds }
      },
      include: {
        category: true,
        tags: true
      }
    })

    // Extract category IDs and tag IDs
    const categoryIds = [...new Set(cartProducts.map(p => p.categoryId).filter(Boolean))] as string[]
    const tagIds = [...new Set(cartProducts.flatMap(p => p.tags.map(t => t.id)))]

    // Find related products based on categories and tags
    const recommendations = await prisma.product.findMany({
      where: {
        AND: [
          { status: 'ACTIVE' },
          { stock: { gt: 0 } },
          { id: { notIn: itemIds } }, // Exclude items already in cart
          {
            OR: [
              { categoryId: { in: categoryIds } },
              { tags: { some: { id: { in: tagIds } } } }
            ]
          }
        ]
      },
      include: {
        images: {
          take: 1,
          orderBy: { order: 'asc' }
        },
        category: true
      },
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' }
      ],
      take: limit
    })

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Cart recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}

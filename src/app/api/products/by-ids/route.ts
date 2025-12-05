import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json([])
    }

    // Limit to 50 products max
    const limitedIds = ids.slice(0, 50)

    const products = await prisma.product.findMany({
      where: {
        id: { in: limitedIds },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        rating: true,
        reviewCount: true,
        images: {
          select: { url: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    })

    // Transform to include image as string
    const result = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      rating: product.rating,
      reviewCount: product.reviewCount,
      image: product.images[0]?.url,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching products by IDs:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

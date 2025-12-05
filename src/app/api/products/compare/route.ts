import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json([])
    }

    // Limit to 4 products for comparison
    const limitedIds = ids.slice(0, 4)

    const products = await prisma.product.findMany({
      where: {
        id: { in: limitedIds },
        status: 'ACTIVE',
      },
      include: {
        category: {
          select: { name: true },
        },
        images: {
          select: { url: true },
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    })

    // Transform to include image as string and parse JSON fields
    const result = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      description: product.description,
      stock: product.stock,
      rating: product.rating,
      reviewCount: product.reviewCount,
      category: product.category,
      image: product.images[0]?.url,
      specifications: product.specifications as Record<string, string> | null,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching comparison products:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

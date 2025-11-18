import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const product = await prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            stock: true,
            priceModifier: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        rating: true,
        reviewCount: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Format response for Quick View
    const response = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      images: product.images.map((img) => ({
        url: img.url,
        alt: img.alt || product.name,
      })),
      rating: product.rating,
      reviewCount: product.reviewCount,
      inStock: product.stock > 0,
      stock: product.stock,
      variants: product.variants,
      badges: [] as Array<{ text: string; variant: string }>,
    }

    // Add badges based on product properties
    if (product.compareAtPrice && product.compareAtPrice > product.price) {
      response.badges.push({ text: 'PROMO', variant: 'sale' })
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Public product fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

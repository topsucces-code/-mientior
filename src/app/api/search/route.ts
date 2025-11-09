/**
 * API endpoint for global search (products, brands, articles)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { SearchResults } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    const page = parseInt(searchParams.get('page') || '1')

    if (!q || q.length < 2) {
      return NextResponse.json({
        products: [],
        brands: [],
        articles: [],
        videos: [],
        totalCount: 0,
      })
    }

    const results: SearchResults & { totalCount: number } = {
      products: [],
      brands: [],
      articles: [],
      videos: [],
      totalCount: 0,
    }

    // Search products
    if (type === 'all' || type === 'products') {
      const limit = type === 'products' ? 24 : 8
      const skip = type === 'products' ? (page - 1) * limit : 0

      const [products, productsCount] = await Promise.all([
        prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
          skip,
          take: limit,
          include: {
            category: true,
            images: {
              orderBy: { order: 'asc' },
            },
            variants: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        }),
        prisma.product.count({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          },
        }),
      ])

      results.products = products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compareAtPrice: product.compareAtPrice || undefined,
        images: product.images.map((img) => ({
          url: img.url,
          alt: img.alt,
          type: img.type === 'THREE_SIXTY' ? '360' : img.type.toLowerCase() as 'image' | 'video' | '360',
          thumbnail: img.thumbnail || undefined,
        })),
        variants: product.variants.map((v) => ({
          id: v.id,
          size: v.size || undefined,
          color: v.color || undefined,
          sku: v.sku,
          stock: v.stock,
          priceModifier: v.priceModifier || undefined,
          image: v.image || undefined,
        })),
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
          isActive: product.category.isActive,
        },
        tags: product.tags.map((pt) => ({
          id: pt.tag.id,
          name: pt.tag.name,
          slug: pt.tag.slug,
        })),
        rating: product.rating,
        reviewCount: product.reviewCount,
        stock: product.stock,
        badge: product.badge || undefined,
        featured: product.featured,
        onSale: !!product.compareAtPrice,
      }))

      results.totalCount += productsCount
    }

    // Search brands (using tags collection as brands)
    if (type === 'all' || type === 'brands') {
      const tags = await prisma.tag.findMany({
        where: {
          name: { contains: q, mode: 'insensitive' },
        },
        take: 5,
      })

      results.brands = tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        logo: undefined, // Could be added to tags collection
      }))

      results.totalCount += tags.length
    }

    // Articles and videos would require additional collections
    // For now, return empty arrays
    results.articles = []
    results.videos = []

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}


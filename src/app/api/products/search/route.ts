/**
 * API endpoint for product search with filters
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Product, PaginatedResponse } from '@/types'
import type { Prisma } from '@prisma/client'

interface PriceFilter {
  gte?: number
  lte?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const q = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '24')
    const sort = searchParams.get('sort') || 'relevance'

    // Parse filters
    const priceMin = searchParams.get('price_min')
    const priceMax = searchParams.get('price_max')
    const categories = searchParams.getAll('categories[]')
    const brands = searchParams.getAll('brands[]')
    const colors = searchParams.getAll('colors[]')
    const sizes = searchParams.getAll('sizes[]')
    const rating = searchParams.get('rating')
    const inStock = searchParams.get('inStock')
    const onSale = searchParams.get('onSale')

    // Build where clause for Prisma
    const andConditions: Prisma.ProductWhereInput[] = []

    // Text search
    if (q) {
      andConditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      })
    }

    // Price range filter
    if (priceMin || priceMax) {
      const priceFilter: PriceFilter = {}
      if (priceMin) priceFilter.gte = parseFloat(priceMin)
      if (priceMax) priceFilter.lte = parseFloat(priceMax)
      andConditions.push({ price: priceFilter })
    }

    // Category filter (by slug)
    if (categories.length > 0) {
      andConditions.push({
        category: {
          slug: { in: categories },
        },
      })
    }

    // Brand filter (tags contain brands)
    if (brands.length > 0) {
      andConditions.push({
        tags: {
          some: {
            tag: {
              slug: { in: brands },
            },
          },
        },
      })
    }

    // Color filter (check variants)
    if (colors.length > 0) {
      andConditions.push({
        variants: {
          some: {
            color: { in: colors },
          },
        },
      })
    }

    // Size filter (check variants)
    if (sizes.length > 0) {
      andConditions.push({
        variants: {
          some: {
            size: { in: sizes },
          },
        },
      })
    }

    // Rating filter
    if (rating) {
      andConditions.push({
        rating: { gte: parseFloat(rating) },
      })
    }

    // In stock filter
    if (inStock === 'true') {
      andConditions.push({
        stock: { gt: 0 },
      })
    }

    // On sale filter
    if (onSale === 'true') {
      andConditions.push({
        compareAtPrice: { not: null },
      })
    }

    const where: Prisma.ProductWhereInput = andConditions.length > 0 ? { AND: andConditions } : {}

    // Build orderBy clause
    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }
    switch (sort) {
      case 'price-asc':
        orderBy = { price: 'asc' }
        break
      case 'price-desc':
        orderBy = { price: 'desc' }
        break
      case 'rating':
        orderBy = { rating: 'desc' }
        break
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'bestseller':
        orderBy = { reviewCount: 'desc' }
        break
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit

    // Query products with Prisma
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
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
      prisma.product.count({ where }),
    ])

    // Transform to frontend Product type
    const transformedProducts: Product[] = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice || undefined,
      images: product.images.map((img) => ({
        url: img.url,
        alt: img.alt,
        type: img.type === 'THREE_SIXTY' ? '360' : img.type.toLowerCase() as 'image' | 'video' | '360'
      })),
      variants: product.variants.map((v) => ({
        id: v.id,
        size: v.size || undefined,
        color: v.color || undefined,
        sku: v.sku,
        stock: v.stock,
        priceModifier: v.priceModifier || undefined
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
      description: product.description || undefined,
      specifications: product.specifications as Record<string, string> | undefined,
      seo: product.seo as Product['seo'] | undefined,
    }))

    const response: PaginatedResponse<Product> = {
      data: transformedProducts,
      totalCount,
      page,
      pageSize: limit,
      hasMore: skip + limit < totalCount,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Product search error:', error)
    return NextResponse.json(
      { error: 'Failed to search products' },
      { status: 500 }
    )
  }
}


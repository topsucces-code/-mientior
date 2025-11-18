import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '12', 10)
    const skip = (page - 1) * limit

    // Parse filter parameters
    const categoryId = searchParams.get('categoryId')
    const categories = searchParams.get('categories') // CSV for multi-category
    // Note: brands filter not supported - Product model uses vendor relation
    const colors = searchParams.get('colors') // CSV for colors
    const sizes = searchParams.get('sizes') // CSV for sizes
    const minPrice = searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!, 10) : undefined
    const maxPrice = searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!, 10) : undefined
    const rating = searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined
    const inStock = searchParams.get('inStock') === 'true'
    const onSale = searchParams.get('onSale') === 'true'
    const filter = searchParams.get('filter') // e.g., 'featured'
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      status: 'ACTIVE',
    }

    // Single category filter (for compatibility)
    if (categoryId) {
      where.categoryId = categoryId
    }

    // Multi-category filter (OR condition)
    if (categories) {
      const categoryIds = categories.split(',').filter(Boolean)
      if (categoryIds.length > 0) {
        where.categoryId = { in: categoryIds }
      }
    }

    // Note: Brand filter not implemented as Product model uses vendor relation
    // If brands filter is needed, it should filter by vendorId instead
    // For now, ignoring brands parameter

    // Price range filter (assuming price is in cents)
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {}
      if (minPrice !== undefined) where.price.gte = minPrice * 100 // Convert to cents
      if (maxPrice !== undefined) where.price.lte = maxPrice * 100 // Convert to cents
    }

    // Rating filter
    if (rating !== undefined) {
      where.rating = { gte: rating }
    }

    // Stock filter
    if (inStock) {
      where.stock = { gt: 0 }
    }

    // Sale filter
    if (onSale) {
      where.onSale = true
    }

    // Filter type (featured, etc.)
    if (filter === 'featured') {
      where.featured = true
    }

    // Color and size filters (variant-based)
    // These require nested variant queries
    const variantConditions: Prisma.ProductVariantWhereInput[] = []
    
    if (colors) {
      const colorList = colors.split(',').filter(Boolean)
      if (colorList.length > 0) {
        variantConditions.push({
          color: { in: colorList }
        })
      }
    }

    if (sizes) {
      const sizeList = sizes.split(',').filter(Boolean)
      if (sizeList.length > 0) {
        variantConditions.push({
          size: { in: sizeList }
        })
      }
    }

    // Apply variant filters if any exist
    if (variantConditions.length > 0) {
      where.variants = {
        some: {
          AND: variantConditions
        }
      }
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Build orderBy clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {}
    if (sortBy === 'price') {
      orderBy.price = sortOrder
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else if (sortBy === 'rating') {
      orderBy.rating = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    // Fetch products and total count in parallel
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          rating: true,
          reviewCount: true,
          badge: true,
          images: {
            select: {
              url: true,
              alt: true,
            },
            orderBy: {
              order: 'asc',
            },
            take: 1,
          },
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ])

    const hasMore = skip + products.length < totalCount

    // Format response
    const formattedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      image: product.images[0]?.url || '/placeholder.jpg',
      category: product.category,
      rating: product.rating,
      reviewCount: product.reviewCount,
      badge: product.badge,
      inStock: product.stock > 0,
    }))

    return NextResponse.json(
      {
        products: formattedProducts,
        hasMore,
        total: totalCount,
        page,
        limit,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    console.error('Public products list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products', products: [], hasMore: false },
      { status: 500 }
    )
  }
}

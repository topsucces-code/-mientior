/**
 * REST API endpoint for products (Refine admin)
 * Supports pagination, filtering, and sorting
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import type { Product as ProductType } from '@/types'
import { withPermission } from '@/middleware/admin-auth'
import { logCreate } from '@/lib/audit-logger'
import { enqueueIndexJob } from '@/lib/search-queue'
import { ENABLE_MEILISEARCH } from '@/lib/meilisearch-client'

interface ImageInput {
  url: string
  alt: string
  type: string
  thumbnail?: string
}

interface VariantInput {
  size?: string
  color?: string
  sku: string
  stock?: number
  priceModifier?: number
  image?: string
}

interface AdminSession {
  adminUser: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  }
}

async function handleGET(request: NextRequest, { adminSession: _adminSession }: { params?: unknown; adminSession?: AdminSession }) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination parameters (Refine uses _start and _end)
    const _start = parseInt(searchParams.get('_start') || '0')
    const _end = parseInt(searchParams.get('_end') || '10')
    const skip = _start
    const take = _end - _start

    // Sorting parameters
    const _sort = searchParams.get('_sort') || 'createdAt'
    const _order = searchParams.get('_order') || 'desc'

    // Build where clause for filtering
    const where: Prisma.ProductWhereInput = {}

    // Filter by status
    const status = searchParams.get('status')
    if (status) {
      where.status = status.toUpperCase() as Prisma.EnumProductStatusFilter
    }

    // Filter by name (search)
    const name_like = searchParams.get('name_like')
    if (name_like) {
      where.name = {
        contains: name_like,
        mode: 'insensitive'
      }
    }

    // Filter by category
    const categoryId = searchParams.get('categoryId')
    if (categoryId) {
      where.categoryId = categoryId
    }

    // Filter by featured
    const featured = searchParams.get('featured')
    if (featured !== null) {
      where.featured = featured === 'true'
    }

    // Filter by onSale
    const onSale = searchParams.get('onSale')
    if (onSale !== null) {
      where.onSale = onSale === 'true'
    }

    // Build orderBy clause
    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [_sort]: _order as 'asc' | 'desc'
    }

    // Fetch products with relations
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          category: true,
          images: {
            orderBy: { order: 'asc' }
          },
          variants: true,
          tags: {
            include: {
              tag: true
            }
          },
          pimMapping: true,
          _count: {
            select: { reviews: true }
          }
        }
      }),
      prisma.product.count({ where })
    ])

    // Transform to match frontend Product type
    const transformedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || undefined,
      price: product.price,
      compareAtPrice: product.compareAtPrice || undefined,
      stock: product.stock,
      rating: product.rating,
      reviewCount: product.reviewCount,
      badge: product.badge || undefined,
      featured: product.featured,
      onSale: product.onSale,
      status: product.status,
      specifications: product.specifications as Record<string, string> | undefined,
      seo: product.seo as ProductType['seo'] | undefined,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        description: product.category.description || undefined,
        image: product.category.image || undefined,
        isActive: product.category.isActive,
        order: product.category.order
      },
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
      tags: product.tags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug
      })),
      pimMapping: product.pimMapping ? {
        akeneoProductId: product.pimMapping.akeneoProductId,
        akeneoSku: product.pimMapping.akeneoSku,
        lastSyncedAt: product.pimMapping.lastSyncedAt,
        syncStatus: product.pimMapping.syncStatus
      } : undefined,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }))

    return NextResponse.json(transformedProducts, {
      headers: {
        'X-Total-Count': totalCount.toString(),
      },
    })
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

async function handlePOST(request: NextRequest, { adminSession }: { params?: unknown; adminSession?: AdminSession }) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.slug || body.price === undefined || !body.categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, price, categoryId' },
        { status: 400 }
      )
    }

    // Create product with nested relations
    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        price: body.price,
        compareAtPrice: body.compareAtPrice,
        stock: body.stock || 0,
        badge: body.badge,
        featured: body.featured || false,
        onSale: body.onSale || false,
        status: body.status || 'ACTIVE',
        specifications: body.specifications,
        seo: body.seo,
        categoryId: body.categoryId,
        images: {
          create: (body.images as ImageInput[] || []).map((img, index: number) => ({
            url: img.url,
            alt: img.alt,
            type: img.type === '360' ? 'THREE_SIXTY' : img.type.toUpperCase(),
            order: index
          }))
        },
        variants: {
          create: (body.variants as VariantInput[] || []).map((v) => ({
            size: v.size,
            color: v.color,
            sku: v.sku,
            stock: v.stock || 0,
            priceModifier: v.priceModifier || 0
          }))
        },
        tags: {
          create: (body.tagIds || []).map((tagId: string) => ({
            tag: {
              connect: { id: tagId }
            }
          }))
        }
      },
      include: {
        category: true,
        images: true,
        variants: true,
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    // Transform to match GET response format
    const transformedProduct = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || undefined,
      price: product.price,
      compareAtPrice: product.compareAtPrice || undefined,
      stock: product.stock,
      rating: product.rating,
      reviewCount: product.reviewCount,
      badge: product.badge || undefined,
      featured: product.featured,
      onSale: product.onSale,
      status: product.status,
      specifications: product.specifications as Record<string, string> | undefined,
      seo: product.seo as Record<string, unknown> | undefined,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        description: product.category.description || undefined,
        image: product.category.image || undefined,
        isActive: product.category.isActive,
        order: product.category.order,
      },
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
      tags: product.tags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }

    // Index in MeiliSearch (non-blocking)
    if (ENABLE_MEILISEARCH) {
      enqueueIndexJob(product.id).catch((err) => {
        console.error('[MeiliSearch] Failed to enqueue product for indexing:', err)
        // Don't fail the request if indexing fails
      })
    }

    // Log product creation
    if (adminSession?.adminUser) {
      await logCreate(
        'product',
        transformedProduct,
        adminSession.adminUser as unknown as import('@prisma/client').AdminUser,
        request
      )
    }

    return NextResponse.json(transformedProduct, { status: 201 })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

// Export wrapped handlers
export const GET = withPermission(Permission.PRODUCTS_READ, handleGET)
export const POST = withPermission(Permission.PRODUCTS_WRITE, handlePOST)

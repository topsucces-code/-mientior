/**
 * REST API endpoint for individual product operations (Refine admin)
 * GET: Fetch single product by ID
 * PUT: Update product by ID
 * DELETE: Delete product by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Product as ProductType } from '@/types'

interface ImageInput {
  url: string
  alt: string
  type: string
}

interface VariantInput {
  size?: string
  color?: string
  sku: string
  stock?: number
  priceModifier?: number
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
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
        reviews: {
          where: { status: 'APPROVED' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: { reviews: true }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Transform to match frontend Product type
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
      images: product.images.map(img => ({
        url: img.url,
        alt: img.alt,
        type: img.type === 'THREE_SIXTY' ? '360' : img.type.toLowerCase() as 'image' | 'video' | '360'
      })),
      variants: product.variants.map(v => ({
        id: v.id,
        size: v.size || undefined,
        color: v.color || undefined,
        sku: v.sku,
        stock: v.stock,
        priceModifier: v.priceModifier || undefined
      })),
      tags: product.tags.map(pt => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }

    return NextResponse.json(transformedProduct)
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        images: true,
        variants: true,
        tags: true
      }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check slug uniqueness if slug is being updated
    if (body.slug && body.slug !== existing.slug) {
      const existingSlug = await prisma.product.findUnique({
        where: { slug: body.slug },
        select: { id: true },
      })

      if (existingSlug && existingSlug.id !== params.id) {
        return NextResponse.json(
          { error: `Slug "${body.slug}" is already in use by another product` },
          { status: 400 }
        )
      }
    }

    // Update product with nested updates
    const product = await prisma.$transaction(async (tx) => {
      // Delete existing images if new ones provided
      if (body.images) {
        await tx.productImage.deleteMany({
          where: { productId: params.id }
        })
      }

      // Delete existing variants if new ones provided
      if (body.variants) {
        await tx.productVariant.deleteMany({
          where: { productId: params.id }
        })
      }

      // Delete existing tags if new ones provided
      if (body.tagIds) {
        await tx.productTag.deleteMany({
          where: { productId: params.id }
        })
      }

      // Update product
      return tx.product.update({
        where: { id: params.id },
        data: {
          name: body.name,
          slug: body.slug,
          description: body.description,
          price: body.price,
          compareAtPrice: body.compareAtPrice,
          stock: body.stock,
          badge: body.badge,
          featured: body.featured,
          onSale: body.onSale,
          status: body.status,
          specifications: body.specifications,
          seo: body.seo,
          categoryId: body.categoryId,
          images: body.images ? {
            create: body.images.map((img: ImageInput, index: number) => ({
              url: img.url,
              alt: img.alt,
              type: img.type === '360' ? 'THREE_SIXTY' : img.type?.toUpperCase() || 'IMAGE',
              order: index
            }))
          } : undefined,
          variants: body.variants ? {
            create: body.variants.map((v: VariantInput) => ({
              size: v.size,
              color: v.color,
              sku: v.sku,
              stock: v.stock || 0,
              priceModifier: v.priceModifier
            }))
          } : undefined,
          tags: body.tagIds ? {
            create: body.tagIds.map((tagId: string) => ({
              tag: {
                connect: { id: tagId }
              }
            }))
          } : undefined
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
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        orderItems: {
          take: 1
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Check if product has orders
    if (product.orderItems.length > 0) {
      // Soft delete by setting status to ARCHIVED
      await prisma.product.update({
        where: { id: params.id },
        data: { status: 'ARCHIVED' }
      })
      return NextResponse.json({
        message: 'Product archived (has existing orders)',
        archived: true
      })
    }

    // Hard delete if no orders
    await prisma.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Product delete error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

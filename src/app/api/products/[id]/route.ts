
/**
 * REST API endpoint for individual product operations (Refine admin)
 * GET: Fetch single product by ID
 * PUT: Update product by ID
 * DELETE: Delete product by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import type { Product as ProductType } from '@/types'
import { withPermission } from '@/middleware/admin-auth'
import { logUpdate, logDelete } from '@/lib/audit-logger'
import { enqueueIndexJob, enqueueDeleteJob } from '@/lib/search-queue'
import { ENABLE_MEILISEARCH } from '@/lib/meilisearch-client'

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

import { type AdminSession } from '@/lib/auth-admin'

import { Prisma } from '@prisma/client'

type JsonValue = Prisma.JsonValue

// Define the exact type returned by the Prisma query
type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    category: true
    images: true
    variants: true
    productTags: {
      include: {
        tags: true
      }
    }
    pimProductMappings: true
    reviews: {
      include: {
        users: {
          select: {
            id: true
            email: true
            firstName: true
            lastName: true
          }
        }
      }
    }
    _count: {
      select: { reviews: true }
    }
  }
}>

async function handleGET(
  request: NextRequest,
  { params, adminSession: _adminSession }: { params: Record<string, string> | Promise<Record<string, string>>, adminSession: AdminSession }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const { id } = resolvedParams;
  
  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }
  
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { order: 'asc' }
        },
        variants: true,
        productTags: {
          include: {
            tags: true
          }
        },
        pimProductMappings: true,
        reviews: {
          where: { status: 'APPROVED' },
          include: {
            users: {
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
    }) as ProductWithRelations | null

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
        priceModifier: v.price_modifier || undefined
      })),
      tags: (product.productTags || []).map((pt: { tags: { id: string; name: string; slug: string } }) => ({
        id: pt.tags.id,
        name: pt.tags.name,
        slug: pt.tags.slug
      })),
      pimMapping: product.pimProductMappings ? {
        akeneoProductId: product.pimProductMappings.akeneo_product_id,
        akeneoSku: product.pimProductMappings.akeneo_sku,
        lastSyncedAt: product.pimProductMappings.last_synced_at,
        syncStatus: product.pimProductMappings.sync_status
      } : undefined,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }

    return NextResponse.json(transformedProduct)
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

async function handlePUT(
  request: NextRequest,
  { params, adminSession }: { params: Record<string, string> | Promise<Record<string, string>>, adminSession: AdminSession }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const { id } = resolvedParams;
  
  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }
  
  try {
    const body = await request.json()

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
        variants: true,
        productTags: true
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

      if (existingSlug && existingSlug.id !== id) {
        return NextResponse.json(
          { error: `Slug "${body.slug}" is already in use by another product` },
          { status: 400 }
        )
      }
    }

    // Capture before state for audit logging
    const before = existing

    // Update product with nested updates
    const product = await prisma.$transaction(async (tx) => {
      // Delete existing images if new ones provided
      if (body.images) {
        await tx.product_images.deleteMany({
          where: { product_id: id }
        })
      }

      // Delete existing variants if new ones provided
      if (body.variants) {
        await tx.product_variants.deleteMany({
          where: { product_id: id }
        })
      }

      // Delete existing tags if new ones provided
      if (body.tagIds) {
        await tx.product_tags.deleteMany({
          where: { productId: id }
        })
      }

      // Update product
      return tx.product.update({
        where: { id },
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
          productTags: body.tagIds ? {
            create: body.tagIds.map((tagId: string) => ({
              id: crypto.randomUUID(),
              tags: {
                connect: { id: tagId }
              }
            }))
          } : undefined
        },
        include: {
          category: true,
          images: true,
          variants: true,
          productTags: {
            include: {
              tags: true
            }
          },
          pimProductMappings: true
        }
      })
    })

    // Transform the updated product to match frontend Product type (same as GET)
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
        priceModifier: v.price_modifier || undefined
      })),
      tags: (product.productTags || []).map((pt: { tags: { id: string; name: string; slug: string } }) => ({
        id: pt.tags.id,
        name: pt.tags.name,
        slug: pt.tags.slug
      })),
      pimMapping: product.pimProductMappings ? {
        akeneoProductId: product.pimProductMappings.akeneo_product_id,
        akeneoSku: product.pimProductMappings.akeneo_sku,
        lastSyncedAt: product.pimProductMappings.last_synced_at,
        syncStatus: product.pimProductMappings.sync_status
      } : undefined,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }

    // Update in MeiliSearch (non-blocking)
    if (ENABLE_MEILISEARCH) {
      enqueueIndexJob(product.id).catch((err) => {
        console.error('[MeiliSearch] Failed to enqueue product for indexing:', err)
      })
    }

    // Audit log the update
    if (adminSession?.adminUser) {
      await logUpdate(
        'product',
        id,
        JSON.parse(JSON.stringify(before)) as Record<string, JsonValue>,
        JSON.parse(JSON.stringify(transformedProduct)) as Record<string, JsonValue>,
        adminSession.adminUser as unknown as import('@prisma/client').admin_users,
        request
      )
    }

    return NextResponse.json(transformedProduct)
  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

async function handleDELETE(
  request: NextRequest,
  { params, adminSession }: { params: Record<string, string> | Promise<Record<string, string>>, adminSession: AdminSession }
) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const { id } = resolvedParams;
  
  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }
  
  try {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
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
      const updatedProduct = await prisma.product.update({
        where: { id },
        data: { status: 'ARCHIVED' }
      })

      // Update in MeiliSearch to reflect archived status
      if (ENABLE_MEILISEARCH) {
        enqueueIndexJob(id).catch((err) => {
          console.error('[MeiliSearch] Failed to enqueue product for indexing:', err)
        })
      }

      // Audit log the soft delete (archive)
      if (adminSession?.adminUser) {
        await logUpdate(
          'product',
          id,
          JSON.parse(JSON.stringify(product)) as Record<string, JsonValue>,
          JSON.parse(JSON.stringify(updatedProduct)) as Record<string, JsonValue>,
          adminSession.adminUser as unknown as import('@prisma/client').admin_users,
          request
        )
      }

      return NextResponse.json({
        message: 'Product archived (has existing orders)',
        archived: true
      })
    }

    // Hard delete if no orders
    await prisma.product.delete({
      where: { id }
    })

    // Remove from MeiliSearch (non-blocking)
    if (ENABLE_MEILISEARCH) {
      enqueueDeleteJob(id).catch((err) => {
        console.error('[MeiliSearch] Failed to enqueue product for deletion:', err)
      })
    }

    // Audit log the deletion
    if (adminSession?.adminUser) {
      await logDelete(
        'product',
        id,
        JSON.parse(JSON.stringify(product)) as Record<string, JsonValue>,
        adminSession.adminUser as unknown as import('@prisma/client').admin_users,
        request
      )
    }

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Product delete error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

// Export wrapped handlers with permission checks
export const GET = withPermission(Permission.PRODUCTS_READ, handleGET)
export const PUT = withPermission(Permission.PRODUCTS_WRITE, handlePUT)
export const PATCH = withPermission(Permission.PRODUCTS_WRITE, handlePUT)
export const DELETE = withPermission(Permission.PRODUCTS_DELETE, handleDELETE)

/**
 * REST API endpoint for categories (Refine admin)
 * Supports pagination, filtering, and sorting
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma, Permission, AdminUser } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { withPermission } from '@/middleware/admin-auth'
import { logCreate } from '@/lib/audit-logger'

interface AdminSession {
  adminUser: AdminUser | null;
}

async function handleGET(request: NextRequest, { adminSession: _adminSession }: { adminSession: AdminSession }) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination parameters (Refine uses _start and _end)
    const _start = parseInt(searchParams.get('_start') || '0')
    const _end = parseInt(searchParams.get('_end') || '10')
    const skip = _start
    const take = _end - _start

    // Sorting parameters
    const _sort = searchParams.get('_sort') || 'order'
    const _order = searchParams.get('_order') || 'asc'

    // Build where clause for filtering
    const where: Prisma.CategoryWhereInput = {}

    // Filter by name (search)
    const name_like = searchParams.get('name_like')
    if (name_like) {
      where.name = {
        contains: name_like,
        mode: 'insensitive'
      }
    }

    // Filter by isActive
    const isActive = searchParams.get('isActive')
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    // Filter by parentId
    const parentId = searchParams.get('parentId')
    if (parentId) {
      where.parentId = parentId
    }

    // Build orderBy clause
    const orderBy: Prisma.CategoryOrderByWithRelationInput = {
      [_sort]: _order as 'asc' | 'desc'
    }

    // Fetch categories with relations
    const [categories, totalCount] = await Promise.all([
      prisma.category.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          parent: true,
          _count: {
            select: {
              products: true,
              children: true
            }
          }
        }
      }),
      prisma.category.count({ where })
    ])

    // Transform to match frontend Category type
    const transformedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || undefined,
      image: category.image || undefined,
      parent: category.parent ? {
        id: category.parent.id,
        name: category.parent.name,
        slug: category.parent.slug
      } : undefined,
      order: category.order,
      isActive: category.isActive,
      productCount: category._count.products,
      childrenCount: category._count.children,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }))

    return NextResponse.json(transformedCategories, {
      headers: {
        'X-Total-Count': totalCount.toString(),
      },
    })
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

async function handlePOST(request: NextRequest, { adminSession }: { adminSession: AdminSession }) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug' },
        { status: 400 }
      )
    }

    // Check slug uniqueness
    const existing = await prisma.category.findUnique({
      where: { slug: body.slug }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      )
    }

    // Create category
    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        image: body.image,
        parentId: body.parentId,
        order: body.order || 0,
        isActive: body.isActive !== undefined ? body.isActive : true
      },
      include: {
        parent: true,
        _count: {
          select: { products: true }
        }
      }
    })

    // Audit log the creation
    if (adminSession.adminUser) {
      await logCreate('category', category, adminSession.adminUser as AdminUser, request)
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Category creation error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// Export wrapped handlers with permission checks
export const GET = withPermission(Permission.CATEGORIES_READ, handleGET)
export const POST = withPermission(Permission.CATEGORIES_WRITE, handlePOST)

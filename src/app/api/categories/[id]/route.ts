/**
 * REST API endpoint for individual category operations (Refine admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { Permission } from '@/lib/permissions';
import { prisma } from '@/lib/prisma'
import { withPermission } from '@/middleware/admin-auth'
import { logUpdate, logDelete } from '@/lib/audit-logger'

async function handleGET(
  request: NextRequest,
  { params, adminSession }: { params: { id: string }, adminSession: any }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Category fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
  }
}

async function handlePUT(
  request: NextRequest,
  { params, adminSession }: { params: { id: string }, adminSession: any }
) {
  try {
    const body = await request.json()

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id: params.id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Capture before state for audit logging
    const before = existing

    // Update category
    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        image: body.image,
        parentId: body.parentId,
        order: body.order,
        isActive: body.isActive
      },
      include: {
        parent: true,
        _count: {
          select: { products: true }
        }
      }
    })

    // Audit log the update
    await logUpdate({
      resource: 'category',
      resourceId: params.id,
      before,
      after: category,
      adminUser: adminSession.adminUser,
      request
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Category update error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

async function handleDELETE(
  request: NextRequest,
  { params, adminSession }: { params: { id: string }, adminSession: any }
) {
  try {
    // Check if category exists and has products or children
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Prevent deletion if has products or child categories
    if (category._count.products > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with products' },
        { status: 400 }
      )
    }

    if (category._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with child categories' },
        { status: 400 }
      )
    }

    // Delete category
    await prisma.category.delete({
      where: { id: params.id }
    })

    // Audit log the deletion
    await logDelete({
      resource: 'category',
      resourceId: params.id,
      before: category,
      adminUser: adminSession.adminUser,
      request
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Category delete error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}

// Export wrapped handlers with permission checks
export const GET = withPermission(Permission.CATEGORIES_READ, handleGET)
export const PUT = withPermission(Permission.CATEGORIES_WRITE, handlePUT)
export const DELETE = withPermission(Permission.CATEGORIES_DELETE, handleDELETE)

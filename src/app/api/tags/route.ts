/**
 * REST API endpoint for tags (Refine admin)
 * Supports pagination, filtering, and sorting
 */

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

interface AdminSession {
  adminUser: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
  } | null
}

async function handleGET(request: NextRequest, { adminSession: _adminSession }: { adminSession?: AdminSession }) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination parameters (Refine uses _start and _end)
    const _start = parseInt(searchParams.get('_start') || '0')
    const _end = parseInt(searchParams.get('_end') || '50')
    const skip = _start
    const take = _end - _start

    // Sorting parameters
    const _sort = searchParams.get('_sort') || 'name'
    const _order = searchParams.get('_order') || 'asc'

    // Build where clause for filtering
    const where: Prisma.TagWhereInput = {}

    // Filter by name (search)
    const name_like = searchParams.get('name_like')
    if (name_like) {
      where.name = {
        contains: name_like,
        mode: 'insensitive'
      }
    }

    // Build orderBy clause
    const orderBy: Prisma.TagOrderByWithRelationInput = {
      [_sort]: _order as 'asc' | 'desc'
    }

    // Fetch tags with product count
    const [tags, totalCount] = await Promise.all([
      prisma.tag.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      }),
      prisma.tag.count({ where })
    ])

    // Transform to include product count
    const transformedTags = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      productCount: tag._count.products,
      createdAt: tag.createdAt
    }))

    return NextResponse.json(transformedTags, {
      headers: {
        'X-Total-Count': totalCount.toString(),
      },
    })
  } catch (error) {
    console.error('Tags fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}

// Export handler (tags are read-only, no permission needed for reading)
export const GET = handleGET

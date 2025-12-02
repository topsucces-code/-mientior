import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * CMS Pages API
 * GET /api/cms/pages - Fetch pages
 * POST /api/cms/pages - Create a new page
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const template = searchParams.get('template')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (template) {
      where.template = template
    }

    const [pages, total] = await Promise.all([
      prisma.cmsPage.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          blocks: {
            where: { isActive: true },
            orderBy: { order: 'asc' }
          }
        }
      }),
      prisma.cmsPage.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: pages,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + pages.length < total
      }
    })

  } catch (error) {
    console.error('[CMS Pages] Error fetching pages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      title,
      slug,
      description,
      content,
      template = 'default',
      status = 'DRAFT',
      seo,
      createdBy
    } = body

    // Validate required fields
    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: 'Title and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists
    const existing = await prisma.cmsPage.findUnique({
      where: { slug }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A page with this slug already exists' },
        { status: 409 }
      )
    }

    const page = await prisma.cmsPage.create({
      data: {
        title,
        slug,
        description,
        content,
        template,
        status: status as 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED',
        seo,
        createdBy,
        publishedAt: status === 'PUBLISHED' ? new Date() : null
      }
    })

    return NextResponse.json({
      success: true,
      data: page
    }, { status: 201 })

  } catch (error) {
    console.error('[CMS Pages] Error creating page:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create page' },
      { status: 500 }
    )
  }
}

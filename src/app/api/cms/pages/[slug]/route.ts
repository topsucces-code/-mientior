import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * CMS Page by Slug API
 * GET /api/cms/pages/[slug] - Get a single page by slug
 * PUT /api/cms/pages/[slug] - Update a page
 * DELETE /api/cms/pages/[slug] - Delete a page
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const preview = searchParams.get('preview') === 'true'

    const page = await prisma.cmsPage.findUnique({
      where: { slug },
      include: {
        blocks: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      )
    }

    // Check if page is published (unless preview mode)
    if (!preview && page.status !== 'PUBLISHED') {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: page
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    })

  } catch (error) {
    console.error('[CMS Page] Error fetching page:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()

    // Check if page exists
    const existing = await prisma.cmsPage.findUnique({
      where: { slug }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      )
    }

    // If changing slug, check for conflicts
    if (body.slug && body.slug !== slug) {
      const conflict = await prisma.cmsPage.findUnique({
        where: { slug: body.slug }
      })
      if (conflict) {
        return NextResponse.json(
          { success: false, error: 'A page with this slug already exists' },
          { status: 409 }
        )
      }
    }

    // Set publishedAt when publishing
    if (body.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      body.publishedAt = new Date()
    }

    const page = await prisma.cmsPage.update({
      where: { slug },
      data: {
        ...body,
        updatedBy: body.updatedBy
      },
      include: {
        blocks: {
          where: { isActive: true },
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: page
    })

  } catch (error) {
    console.error('[CMS Page] Error updating page:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update page' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    await prisma.cmsPage.delete({
      where: { slug }
    })

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully'
    })

  } catch (error) {
    console.error('[CMS Page] Error deleting page:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete page' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * CMS Banner by ID API
 * GET /api/cms/banners/[id] - Get a single banner
 * PUT /api/cms/banners/[id] - Update a banner
 * DELETE /api/cms/banners/[id] - Delete a banner
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const banner = await prisma.banner.findUnique({
      where: { id }
    })

    if (!banner) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: banner
    })

  } catch (error) {
    console.error('[CMS Banner] Error fetching banner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banner' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if banner exists
    const existing = await prisma.banner.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 }
      )
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: {
        ...body,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      }
    })

    return NextResponse.json({
      success: true,
      data: banner
    })

  } catch (error) {
    console.error('[CMS Banner] Error updating banner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update banner' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.banner.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully'
    })

  } catch (error) {
    console.error('[CMS Banner] Error deleting banner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete banner' },
      { status: 500 }
    )
  }
}

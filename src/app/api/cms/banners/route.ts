import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BannerPosition, ContentStatus } from '@prisma/client'

/**
 * CMS Banners API
 * GET /api/cms/banners - Fetch active banners (public)
 * POST /api/cms/banners - Create a new banner (admin only)
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const position = searchParams.get('position') as BannerPosition | null
    const includeAll = searchParams.get('all') === 'true'
    const limit = parseInt(searchParams.get('limit') || '10')

    const now = new Date()

    // Build where clause for active banners
    const whereClause = includeAll
      ? {}
      : {
          status: ContentStatus.PUBLISHED,
          OR: [
            { startDate: null },
            { startDate: { lte: now } }
          ],
          AND: [
            {
              OR: [
                { endDate: null },
                { endDate: { gte: now } }
              ]
            }
          ]
        }

    // Filter by position if provided
    if (position) {
      Object.assign(whereClause, { position })
    }

    const banners = await prisma.banner.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        backgroundColor: true,
        textColor: true,
        backgroundImage: true,
        link: true,
        linkText: true,
        position: true,
        priority: true,
        status: true,
        dismissible: true,
        showCountdown: true,
        startDate: true,
        endDate: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: banners,
      count: banners.length
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })

  } catch (error) {
    console.error('[CMS Banners] Error fetching banners:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banners' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const body = await request.json()

    const {
      title,
      message,
      backgroundColor = 'linear-gradient(to right, #2563eb, #4f46e5, #7c3aed)',
      textColor = '#ffffff',
      backgroundImage,
      link,
      linkText,
      position = 'TOP',
      priority = 0,
      status = 'DRAFT',
      dismissible = true,
      showCountdown = false,
      startDate,
      endDate,
      targetAudience
    } = body

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: 'Title and message are required' },
        { status: 400 }
      )
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        message,
        backgroundColor,
        textColor,
        backgroundImage,
        link,
        linkText,
        position: position as BannerPosition,
        priority,
        status: status as ContentStatus,
        dismissible,
        showCountdown,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        targetAudience
      }
    })

    return NextResponse.json({
      success: true,
      data: banner
    }, { status: 201 })

  } catch (error) {
    console.error('[CMS Banners] Error creating banner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create banner' },
      { status: 500 }
    )
  }
}

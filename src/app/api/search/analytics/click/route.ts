import { NextRequest, NextResponse } from 'next/server'
import { logSearchClick } from '@/lib/search-analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, productId, position, searchLogId } = body

    // Validate required fields
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid or missing query parameter' },
        { status: 400 }
      )
    }

    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid or missing productId parameter' },
        { status: 400 }
      )
    }

    if (position === undefined || position === null) {
      return NextResponse.json(
        { error: 'Missing position parameter' },
        { status: 400 }
      )
    }

    // Validate position as a finite positive number
    const positionNum = Number(position)
    if (!Number.isFinite(positionNum) || positionNum < 1) {
      return NextResponse.json(
        { error: 'Position must be a finite positive number (>= 1)' },
        { status: 400 }
      )
    }

    const sessionId = request.cookies.get('session_id')?.value
    // TODO: Get userId from session if authenticated
    const userId = undefined

    const log = await logSearchClick({
      searchLogId,
      query: query.trim(),
      productId: productId.trim(),
      position: positionNum,
      userId,
      sessionId,
    })

    return NextResponse.json({ success: true, logId: log.id })
  } catch (error) {
    console.error('Failed to log search click:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

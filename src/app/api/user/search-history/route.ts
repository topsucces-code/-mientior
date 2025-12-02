import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-server'
import {
  getSearchHistory,
  addSearchHistory,
  deleteSearchHistory,
} from '@/lib/search-history'

/**
 * GET /api/user/search-history
 * Fetch user's search history
 */
export async function GET() {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const history = await getSearchHistory(userId, 10)

    return NextResponse.json({
      data: history,
      success: true,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    console.error('Error fetching search history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch search history', success: false },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/search-history
 * Add a query to user's search history
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const body = await request.json()
    const { query } = body

    // Validate query
    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string', success: false },
        { status: 400 }
      )
    }

    await addSearchHistory(userId, query)

    return NextResponse.json(
      { success: true },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    console.error('Error adding search history:', error)
    return NextResponse.json(
      { error: 'Failed to add search history', success: false },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/search-history
 * Clear all history or remove specific query
 * Query params: ?query=... (optional)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth()
    const userId = session.user.id

    const { searchParams } = request.nextUrl
    const query = searchParams.get('query')

    await deleteSearchHistory(userId, query || undefined)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    console.error('Error deleting search history:', error)
    return NextResponse.json(
      { error: 'Failed to delete search history', success: false },
      { status: 500 }
    )
  }
}

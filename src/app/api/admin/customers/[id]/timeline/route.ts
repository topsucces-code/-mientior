import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth-admin'
import { Permission } from '@/lib/permissions'
import { timelineService } from '@/lib/timeline-service'

/**
 * GET /api/admin/customers/[id]/timeline
 * 
 * Get customer's activity timeline
 * 
 * Requirements:
 * - 7.1: Display interaction timeline with all customer activities
 * - 7.2: Include orders, support tickets, loyalty events, marketing interactions, and account changes
 * - 7.3: Show event type, description, timestamp, and relevant details
 * - 7.4: Allow filtering by event type and date range
 * - 7.5: Load events with infinite scroll or pagination
 * - 19.1: Verify admin has customer view permissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require USERS_READ permission
    await requirePermission(Permission.USERS_READ)

    const customerId = params.id

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || undefined
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : undefined
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : undefined
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get timeline events using the service
    const result = await timelineService.getCustomerTimeline(customerId, {
      type,
      from,
      to,
      limit,
      offset
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
      
      if (error.message === 'Customer not found') {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        )
      }
    }

    console.error('Error fetching customer timeline:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer timeline' },
      { status: 500 }
    )
  }
}

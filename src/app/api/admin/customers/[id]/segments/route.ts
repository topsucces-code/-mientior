/**
 * Customer Segment Assignment API
 * 
 * POST /api/admin/customers/[id]/segments - Assign a segment to a customer
 * DELETE /api/admin/customers/[id]/segments - Remove a segment from a customer
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { checkPermission } from '@/lib/rbac'
import {
  assignManualSegment,
  removeManualSegment,
  assignAutomaticSegments,
} from '@/lib/customer-segmentation'
import { invalidateCustomer360Cache } from '@/lib/customer-360'

/**
 * POST /api/admin/customers/[id]/segments
 * Assign a segment to a customer
 * 
 * Body:
 * - segmentId: string - ID of segment to assign
 * - recalculateAutomatic?: boolean - If true, recalculate automatic segments
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id

    // Check authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, 'customers:edit')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { segmentId, recalculateAutomatic } = body

    if (recalculateAutomatic) {
      // Recalculate and assign automatic segments
      await assignAutomaticSegments(customerId)
    } else {
      // Manual segment assignment
      if (!segmentId || typeof segmentId !== 'string') {
        return NextResponse.json(
          { error: 'Invalid or missing segmentId' },
          { status: 400 }
        )
      }

      await assignManualSegment(customerId, segmentId)
    }

    // Invalidate cache
    await invalidateCustomer360Cache(customerId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error assigning segment:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      if (error.message.includes('Cannot manually')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/customers/[id]/segments
 * Remove a segment from a customer
 * 
 * Query params:
 * - segmentId: string - ID of segment to remove
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id
    const { searchParams } = new URL(request.url)
    const segmentId = searchParams.get('segmentId')

    // Check authentication
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const hasPermission = await checkPermission(session.user.id, 'customers:edit')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    // Validate segmentId
    if (!segmentId) {
      return NextResponse.json(
        { error: 'Missing segmentId query parameter' },
        { status: 400 }
      )
    }

    // Remove segment
    await removeManualSegment(customerId, segmentId)

    // Invalidate cache
    await invalidateCustomer360Cache(customerId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing segment:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      if (error.message.includes('Cannot manually')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

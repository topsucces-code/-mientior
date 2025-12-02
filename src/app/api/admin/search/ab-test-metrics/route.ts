/**
 * Admin API endpoint for A/B test metrics
 *
 * GET /api/admin/search/ab-test-metrics?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Returns performance comparison between PostgreSQL FTS and MeiliSearch.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getABTestMetrics, isABTestEnabled } from '@/lib/search-ab-testing'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth()

    // Check if user is admin (based on your auth system)
    // You may need to adjust this based on how admin roles are stored
    const userRole = (session.user as any)?.role || 'user'
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Parse dates with defaults
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    // Default to last 7 days if not specified
    const endDate = endDateParam ? new Date(endDateParam) : new Date()
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Get metrics from A/B testing service
    const metrics = await getABTestMetrics(startDate, endDate)

    // Return response with metadata
    return NextResponse.json({
      period: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
      postgresql: metrics.postgresql,
      meilisearch: metrics.meilisearch,
      comparison: metrics.comparison,
      enabled: isABTestEnabled(),
    })
  } catch (error) {
    console.error('[admin-ab-metrics] Error fetching metrics:', error)

    // Check if it's an auth error
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch A/B test metrics' },
      { status: 500 }
    )
  }
}

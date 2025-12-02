import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { checkPermission } from '@/lib/rbac'
import { getCachedData } from '@/lib/redis'
import type { SearchAnalyticsReport } from '@/types'
import {
  getTopQueries,
  getZeroResultQueries,
  getClickThroughRate,
  getSearchTrends,
  getProductClickStats,
} from '@/lib/search-analytics'

// Cache duration: 10 minutes
const CACHE_TTL = 600

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasPermission = await checkPermission(session.user.id, 'dashboard:read')
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse Query Parameters
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const limitParam = searchParams.get('limit')
    const intervalParam = searchParams.get('interval')

    const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default 30 days
    const endDate = endDateParam ? new Date(endDateParam) : new Date()
    const limit = limitParam ? parseInt(limitParam, 10) : 10
    const interval = (intervalParam === 'hour' || intervalParam === 'week') ? intervalParam : 'day'

    // 3. Check Cache
    const cacheKey = `admin:search:analytics:${startDate.getTime()}:${endDate.getTime()}:${limit}:${interval}`

    const analyticsData = await getCachedData<SearchAnalyticsReport>(
      cacheKey,
      async () => {
        // 4. Fetch Data (Cache Miss)
        const [
          topQueries,
          zeroResultQueries,
          ctrStats,
          trends,
          productStats
        ] = await Promise.all([
          getTopQueries({ limit, startDate, endDate }),
          getZeroResultQueries({ limit, startDate, endDate }),
          getClickThroughRate({ startDate, endDate }),
          getSearchTrends({ interval, startDate, endDate }),
          getProductClickStats({ limit, startDate, endDate })
        ])

        const report: SearchAnalyticsReport = {
          topQueries,
          zeroResultQueries,
          overallCTR: ctrStats.ctr,
          totalSearches: ctrStats.totalSearches,
          uniqueUsers: trends.reduce((acc, curr) => acc + curr.uniqueUsers, 0), // Approximation
          avgResultCount: topQueries.reduce((acc, curr) => acc + curr.avgResultCount, 0) / (topQueries.length || 1), // Approximation based on top queries
          trends,
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          productStats
        }

        return report
      },
      CACHE_TTL
    )

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Admin search analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

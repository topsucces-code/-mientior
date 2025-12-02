import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { hasPermission } from '@/lib/rbac'
import { Permission } from '@/lib/permissions'
import type { Role } from '@prisma/client'
import { getCachedData } from '@/lib/redis'
import type { DashboardAnalyticsReport } from '@/types'
import {
  getTopQueries,
  getZeroResultQueries,
  getClickThroughRate,
  getSearchTrends,
  getProductClickStats,
  getCTRByQuery,
  getLocaleDistribution,
  getPeriodComparison,
  getUniqueUsersCount,
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

    // Get admin user role from session
    const adminUser = (session as any).adminUser
    if (!adminUser || !hasPermission(adminUser.role as Role, Permission.DASHBOARD_READ)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse Query Parameters
    const searchParams = request.nextUrl.searchParams
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const limitParam = searchParams.get('limit')
    const intervalParam = searchParams.get('interval')
    const compareWithParam = searchParams.get('compareWith')

    const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default 30 days
    const endDate = endDateParam ? new Date(endDateParam) : new Date()

    // Validate date range
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
    }

    if (startDate > endDate) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 })
    }

    // Validate and parse limit
    const parsedLimit = limitParam ? parseInt(limitParam, 10) : 10
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10

    const interval = (intervalParam === 'hour' || intervalParam === 'week') ? intervalParam : 'day'
    const compareWith = compareWithParam as 'previous-period' | 'previous-year' | null

    // 3. Check Cache
    const cacheKey = `admin:search:dashboard:${startDate.getTime()}:${endDate.getTime()}:${limit}:${interval}:${compareWith || 'none'}`

    const dashboardData = await getCachedData<DashboardAnalyticsReport>(
      cacheKey,
      async () => {
        // 4. Fetch Data (Cache Miss)
        const [
          topQueries,
          zeroResultQueries,
          ctrStats,
          trends,
          productStats,
          ctrByQuery,
          localeDistribution,
          uniqueUsers
        ] = await Promise.all([
          getTopQueries({ limit, startDate, endDate }),
          getZeroResultQueries({ limit, startDate, endDate }),
          getClickThroughRate({ startDate, endDate }),
          getSearchTrends({ interval, startDate, endDate }),
          getProductClickStats({ limit, startDate, endDate }),
          getCTRByQuery({ limit, startDate, endDate }),
          getLocaleDistribution({ startDate, endDate }),
          getUniqueUsersCount({ startDate, endDate })
        ])

        // 5. Calculate period comparison if requested
        let periodComparison = undefined
        if (compareWith) {
          const periodDuration = endDate.getTime() - startDate.getTime()
          let previousStart: Date
          let previousEnd: Date

          if (compareWith === 'previous-year') {
            previousStart = new Date(startDate.getTime() - 365 * 24 * 60 * 60 * 1000)
            previousEnd = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000)
          } else {
            // previous-period
            previousEnd = new Date(startDate.getTime() - 1) // Day before current start
            previousStart = new Date(previousEnd.getTime() - periodDuration)
          }

          periodComparison = await getPeriodComparison({
            currentStart: startDate,
            currentEnd: endDate,
            previousStart,
            previousEnd,
          })
        }

        const report: DashboardAnalyticsReport = {
          topQueries,
          zeroResultQueries,
          overallCTR: ctrStats.ctr,
          totalSearches: ctrStats.totalSearches,
          uniqueUsers, // True distinct count over the period
          avgResultCount: topQueries.reduce((acc, curr) => acc + curr.avgResultCount, 0) / (topQueries.length || 1),
          trends,
          period: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          productStats,
          ctrByQuery,
          localeDistribution,
          periodComparison,
        }

        return report
      },
      CACHE_TTL
    )

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Admin search analytics dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

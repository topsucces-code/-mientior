import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { hasPermission } from '@/lib/rbac'
import { Permission } from '@/lib/permissions'
import type { Role } from '@prisma/client'
import { format } from 'date-fns'
import {
  getTopQueries,
  getZeroResultQueries,
  getClickThroughRate,
  getSearchTrends,
  getProductClickStats,
} from '@/lib/search-analytics'

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Format a date for CSV
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy-MM-dd HH:mm:ss')
}

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

    const startDate = startDateParam ? new Date(startDateParam) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = endDateParam ? new Date(endDateParam) : new Date()

    // Validate date range
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
    }

    if (startDate > endDate) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 })
    }

    // 3. Fetch all analytics data
    const [
      topQueries,
      zeroResultQueries,
      ctrStats,
      trends,
      productStats
    ] = await Promise.all([
      getTopQueries({ limit: 100, startDate, endDate }),
      getZeroResultQueries({ limit: 100, startDate, endDate }),
      getClickThroughRate({ startDate, endDate }),
      getSearchTrends({ interval: 'day', startDate, endDate }),
      getProductClickStats({ limit: 100, startDate, endDate })
    ])

    // 4. Build CSV content
    const csvLines: string[] = []

    // Metadata Section
    csvLines.push('Search Analytics Export')
    csvLines.push(`Export Date,${formatDate(new Date())}`)
    csvLines.push(`Period,${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`)
    csvLines.push(`Total Searches,${ctrStats.totalSearches}`)
    csvLines.push(`Overall CTR,${(ctrStats.ctr * 100).toFixed(1)}%`)
    csvLines.push(`Searches with Clicks,${ctrStats.searchesWithClicks}`)
    csvLines.push('')

    // Top Queries Section
    csvLines.push('Top Queries')
    csvLines.push('Query,Search Count,Avg Results,CTR')
    topQueries.forEach(q => {
      csvLines.push([
        escapeCSV(q.query),
        q.count,
        q.avgResultCount,
        `${(q.clickThroughRate * 100).toFixed(1)}%`
      ].join(','))
    })
    csvLines.push('')

    // Zero-Result Queries Section
    csvLines.push('Zero-Result Queries')
    csvLines.push('Query,Count,Last Searched')
    zeroResultQueries.forEach(q => {
      csvLines.push([
        escapeCSV(q.query),
        q.count,
        formatDate(q.lastSearched)
      ].join(','))
    })
    csvLines.push('')

    // Search Trends Section
    csvLines.push('Search Trends (Daily)')
    csvLines.push('Date,Search Count,Unique Users')
    trends.forEach(t => {
      csvLines.push([
        format(t.timestamp, 'yyyy-MM-dd'),
        t.count,
        t.uniqueUsers
      ].join(','))
    })
    csvLines.push('')

    // Product Click Stats Section
    if (productStats && productStats.length > 0) {
      csvLines.push('Product Click Statistics')
      csvLines.push('Product ID,Clicks,Avg Position,Top Queries')
      productStats.forEach(p => {
        csvLines.push([
          escapeCSV(p.productId),
          p.clicks,
          p.avgPosition.toFixed(1),
          escapeCSV(p.queries.join('; '))
        ].join(','))
      })
    }

    const csvContent = csvLines.join('\n')

    // 5. Return CSV response
    const filename = `search-analytics-${format(startDate, 'yyyy-MM-dd')}-${format(endDate, 'yyyy-MM-dd')}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Admin search analytics export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

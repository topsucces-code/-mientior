import { prisma } from '@/lib/prisma'
import type { 
  SearchLogEntry, 
  TopQuery, 
  ZeroResultQuery, 
  SearchTrend, 
  ProductClickStats, 
  SupportedLocale
} from '@/types'
import type { Prisma } from '@prisma/client'

/**
 * Log a search query to the database
 */
// NOTE: If you see an error on the 'locale' property below, you may need to regenerate the Prisma client.
// Run 'npx prisma generate' to update the client based on the schema.
export async function logSearch(params: {
  query: string
  resultCount: number
  userId?: string
  sessionId?: string
  filters?: Record<string, unknown>
  sort?: string
  executionTime?: number
  ipAddress?: string
  userAgent?: string
  correctedFrom?: string
  locale?: SupportedLocale
}): Promise<SearchLogEntry> {
  const log = await prisma.searchLog.create({
    data: {
      query: params.query,
      resultCount: params.resultCount,
      userId: params.userId,
      sessionId: params.sessionId,
      filters: params.filters ? (params.filters as Prisma.InputJsonValue) : undefined,
      sort: params.sort,
      executionTime: params.executionTime,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      correctedFrom: params.correctedFrom,
      locale: params.locale || 'fr',
    },
  })

  return {
    ...log,
    filters: log.filters as Record<string, unknown> | null,
  }
}

/**
 * Log a search result click
 */
export async function logSearchClick(params: {
  searchLogId?: string
  query: string
  productId: string
  position: number
  userId?: string
  sessionId?: string
}): Promise<SearchLogEntry> {
  // If we have a log ID, update the existing record
  if (params.searchLogId) {
    const log = await prisma.searchLog.update({
      where: { id: params.searchLogId },
      data: {
        clickedProductId: params.productId,
        clickPosition: params.position,
        clickedAt: new Date(),
      },
    })

    return {
      ...log,
      filters: log.filters as Record<string, unknown> | null,
    }
  }

  // Otherwise create a new record (implied search)
  const log = await prisma.searchLog.create({
    data: {
      query: params.query,
      resultCount: 0, // Unknown
      userId: params.userId,
      sessionId: params.sessionId,
      clickedProductId: params.productId,
      clickPosition: params.position,
      clickedAt: new Date(),
    },
  })

  return {
    ...log,
    filters: log.filters as Record<string, unknown> | null,
  }
}

/**
 * Get top search queries
 */
export async function getTopQueries(params: {
  limit?: number
  startDate?: Date
  endDate?: Date
  minResults?: number
} = {}): Promise<TopQuery[]> {
  const { limit = 10, startDate, endDate, minResults = 0 } = params
  
  const whereClause: Prisma.SearchLogWhereInput = {
    timestamp: {
      gte: startDate,
      lte: endDate,
    },
    resultCount: {
      gte: minResults,
    },
  }

  // Aggregate queries
  const results = await prisma.searchLog.groupBy({
    by: ['query'],
    where: whereClause,
    _count: {
      query: true,
      clickedProductId: true,
    },
    _avg: {
      resultCount: true,
    },
    orderBy: {
      _count: {
        query: 'desc',
      },
    },
    take: limit,
  })

  return results.map(r => ({
    query: r.query,
    count: r._count.query,
    avgResultCount: Math.round(r._avg.resultCount || 0),
    clickThroughRate: r._count.query > 0 
      ? (r._count.clickedProductId / r._count.query) 
      : 0,
  }))
}

/**
 * Get queries with zero results
 */
export async function getZeroResultQueries(params: {
  limit?: number
  startDate?: Date
  endDate?: Date
} = {}): Promise<ZeroResultQuery[]> {
  const { limit = 10, startDate, endDate } = params

  const results = await prisma.searchLog.groupBy({
    by: ['query'],
    where: {
      resultCount: 0,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      query: true,
    },
    _max: {
      timestamp: true,
    },
    orderBy: {
      _count: {
        query: 'desc',
      },
    },
    take: limit,
  })

  return results.map(r => ({
    query: r.query,
    count: r._count.query,
    lastSearched: r._max.timestamp || new Date(),
  }))
}

/**
 * Calculate Click-Through Rate (CTR)
 */
export async function getClickThroughRate(params: {
  query?: string
  startDate?: Date
  endDate?: Date
} = {}): Promise<{
  query?: string
  ctr: number
  totalSearches: number
  searchesWithClicks: number
}> {
  const { query, startDate, endDate } = params
  
  const where: Prisma.SearchLogWhereInput = {
    timestamp: {
      gte: startDate,
      lte: endDate,
    },
    ...(query ? { query } : {}),
  }

  const [totalSearches, searchesWithClicks] = await Promise.all([
    prisma.searchLog.count({ where }),
    prisma.searchLog.count({
      where: {
        ...where,
        clickedProductId: { not: null },
      },
    }),
  ])

  return {
    query,
    ctr: totalSearches > 0 ? searchesWithClicks / totalSearches : 0,
    totalSearches,
    searchesWithClicks,
  }
}

/**
 * Get search volume trends
 */
export async function getSearchTrends(params: {
  interval: 'hour' | 'day' | 'week'
  startDate?: Date
  endDate?: Date
}): Promise<SearchTrend[]> {
  const { interval, startDate, endDate } = params
  
  // Use raw query for date truncation
  const truncUnit = interval === 'week' ? 'week' : interval === 'day' ? 'day' : 'hour'
  
  const results = await prisma.$queryRaw<Array<{
    date: Date
    count: bigint
    users: bigint
  }>>`
    SELECT 
      DATE_TRUNC(${truncUnit}, timestamp) as date,
      COUNT(*) as count,
      COUNT(DISTINCT "userId") as users
    FROM search_logs
    WHERE timestamp >= ${startDate || new Date(0)}
      AND timestamp <= ${endDate || new Date()}
    GROUP BY DATE_TRUNC(${truncUnit}, timestamp)
    ORDER BY date ASC
  `

  return results.map(r => ({
    timestamp: r.date,
    count: Number(r.count),
    uniqueUsers: Number(r.users),
  }))
}

/**
 * Get product click statistics
 */
export async function getProductClickStats(params: {
  productId?: string
  limit?: number
  startDate?: Date
  endDate?: Date
} = {}): Promise<ProductClickStats[]> {
  const { productId, limit = 10, startDate, endDate } = params

  const where: Prisma.SearchLogWhereInput = {
    clickedProductId: { not: null },
    timestamp: {
      gte: startDate,
      lte: endDate,
    },
    ...(productId ? { clickedProductId: productId } : {}),
  }

  const results = await prisma.searchLog.groupBy({
    by: ['clickedProductId'],
    where,
    _count: {
      clickedProductId: true,
    },
    _avg: {
      clickPosition: true,
    },
    orderBy: {
      _count: {
        clickedProductId: 'desc',
      },
    },
    take: limit,
  })

  // For each product, get top queries
  const stats = await Promise.all(results.map(async (r) => {
    if (!r.clickedProductId) return null
    
    const topQueries = await prisma.searchLog.groupBy({
      by: ['query'],
      where: {
        clickedProductId: r.clickedProductId,
        timestamp: { gte: startDate, lte: endDate },
      },
      _count: { query: true },
      orderBy: { _count: { query: 'desc' } },
      take: 3,
    })

    return {
      productId: r.clickedProductId,
      clicks: r._count.clickedProductId,
      avgPosition: r._avg.clickPosition || 0,
      queries: topQueries.map(q => q.query),
    }
  }))

  return stats.filter((s): s is ProductClickStats => s !== null)
}

/**
 * Get CTR breakdown for top queries
 */
export async function getCTRByQuery(params: {
  limit?: number
  startDate?: Date
  endDate?: Date
} = {}): Promise<Array<{
  query: string
  ctr: number
  searches: number
  clicks: number
}>> {
  const { limit = 10, startDate, endDate } = params
  
  // Get top queries first
  const topQueries = await getTopQueries({ limit, startDate, endDate })
  
  // For each query, get detailed CTR stats
  const ctrByQuery = await Promise.all(
    topQueries.map(async (tq) => {
      const ctrStats = await getClickThroughRate({
        query: tq.query,
        startDate,
        endDate,
      })
      
      return {
        query: tq.query,
        ctr: ctrStats.ctr,
        searches: ctrStats.totalSearches,
        clicks: ctrStats.searchesWithClicks,
      }
    })
  )
  
  return ctrByQuery
}

/**
 * Get distinct unique users count over a period
 * This returns the true count of unique users, not a sum of per-bucket counts
 */
export async function getUniqueUsersCount(params: {
  startDate?: Date
  endDate?: Date
} = {}): Promise<number> {
  const { startDate, endDate } = params
  
  const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT "userId") as count
    FROM search_logs
    WHERE timestamp >= ${startDate || new Date(0)}
      AND timestamp <= ${endDate || new Date()}
      AND "userId" IS NOT NULL
  `
  
  return Number(result[0]?.count || 0)
}

/**
 * Get search volume distribution by locale
 * Maps known locales to SupportedLocale, unknown locales to 'other'
 */
export async function getLocaleDistribution(params: {
  startDate?: Date
  endDate?: Date
} = {}): Promise<Array<{
  locale: 'fr' | 'en' | 'other'
  count: number
  percentage: number
}>> {
  const { startDate, endDate } = params
  
  // Use raw query to handle locale field which may or may not exist in schema
  const results = await prisma.$queryRaw<Array<{
    locale: string | null
    count: bigint
  }>>`
    SELECT 
      COALESCE(locale, 'fr') as locale,
      COUNT(*) as count
    FROM search_logs
    WHERE timestamp >= ${startDate || new Date(0)}
      AND timestamp <= ${endDate || new Date()}
    GROUP BY COALESCE(locale, 'fr')
    ORDER BY count DESC
  `
  
  const totalSearches = results.reduce((sum, r) => sum + Number(r.count), 0)
  
  // Known supported locales
  const supportedLocales = ['fr', 'en']
  
  type LocaleType = 'fr' | 'en' | 'other'
  
  // Map results, classifying unknown locales as 'other'
  const mapped = results.map(r => {
    const rawLocale = r.locale || 'fr'
    const locale: LocaleType = supportedLocales.includes(rawLocale) 
      ? (rawLocale as 'fr' | 'en') 
      : 'other'
    
    return {
      locale,
      count: Number(r.count),
      percentage: totalSearches > 0 ? (Number(r.count) / totalSearches) * 100 : 0,
    }
  })
  
  // Aggregate 'other' entries if multiple unknown locales exist
  const aggregated = new Map<LocaleType, { count: number; percentage: number }>()
  
  for (const item of mapped) {
    const existing = aggregated.get(item.locale)
    if (existing) {
      existing.count += item.count
      existing.percentage += item.percentage
    } else {
      aggregated.set(item.locale, { count: item.count, percentage: item.percentage })
    }
  }
  
  return Array.from(aggregated.entries())
    .map(([locale, data]) => ({ locale, ...data }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Compare current period metrics with previous period
 */
export async function getPeriodComparison(params: {
  currentStart: Date
  currentEnd: Date
  previousStart: Date
  previousEnd: Date
}): Promise<{
  current: { totalSearches: number; overallCTR: number; avgResultCount: number }
  previous: { totalSearches: number; overallCTR: number; avgResultCount: number }
  changes: { searchesChange: number; ctrChange: number; resultsChange: number }
}> {
  const { currentStart, currentEnd, previousStart, previousEnd } = params
  
  // Fetch current period stats
  const [currentCTR, currentTopQueries] = await Promise.all([
    getClickThroughRate({ startDate: currentStart, endDate: currentEnd }),
    getTopQueries({ startDate: currentStart, endDate: currentEnd, limit: 100 }),
  ])
  
  // Fetch previous period stats
  const [previousCTR, previousTopQueries] = await Promise.all([
    getClickThroughRate({ startDate: previousStart, endDate: previousEnd }),
    getTopQueries({ startDate: previousStart, endDate: previousEnd, limit: 100 }),
  ])
  
  const currentAvgResults = currentTopQueries.reduce((sum, q) => sum + q.avgResultCount, 0) / (currentTopQueries.length || 1)
  const previousAvgResults = previousTopQueries.reduce((sum, q) => sum + q.avgResultCount, 0) / (previousTopQueries.length || 1)
  
  // Calculate percentage changes
  const searchesChange = previousCTR.totalSearches > 0
    ? ((currentCTR.totalSearches - previousCTR.totalSearches) / previousCTR.totalSearches) * 100
    : 0
  
  const ctrChange = previousCTR.ctr > 0
    ? ((currentCTR.ctr - previousCTR.ctr) / previousCTR.ctr) * 100
    : 0
  
  const resultsChange = previousAvgResults > 0
    ? ((currentAvgResults - previousAvgResults) / previousAvgResults) * 100
    : 0
  
  return {
    current: {
      totalSearches: currentCTR.totalSearches,
      overallCTR: currentCTR.ctr,
      avgResultCount: currentAvgResults,
    },
    previous: {
      totalSearches: previousCTR.totalSearches,
      overallCTR: previousCTR.ctr,
      avgResultCount: previousAvgResults,
    },
    changes: {
      searchesChange,
      ctrChange,
      resultsChange,
    },
  }
}

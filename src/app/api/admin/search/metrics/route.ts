import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { hasPermission } from '@/lib/rbac'
import { Permission } from '@/lib/permissions'
import { getCachedData, redis } from '@/lib/redis'
import { SearchCache } from '@/lib/search-cache'
import type { SearchCacheMetricsResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication & Authorization
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAllowed = await hasPermission(session.user.role as any, Permission.DASHBOARD_READ)
    if (!isAllowed) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse Query Parameters
    const searchParams = request.nextUrl.searchParams
    const hoursParam = searchParams.get('hours')
    const refresh = searchParams.get('refresh') === 'true'
    const hours = Math.min(parseInt(hoursParam || '24', 10), 168)

    // 3. Cache Key
    const cacheKey = `admin:search:cache-metrics:${hours}`

    // 4. Collect or Retrieve Cached Data
    let data: SearchCacheMetricsResponse
    let cacheStatus: string

    if (refresh) {
      data = await collectMetrics(hours)
      cacheStatus = 'MISS'
    } else {
      data = await getCachedData<SearchCacheMetricsResponse>(
        cacheKey,
        () => collectMetrics(hours),
        300 // 5 minutes
      )
      cacheStatus = 'HIT'
    }

    return NextResponse.json(data, {
      headers: { 'X-Cache-Status': cacheStatus }
    })
  } catch (error) {
    console.error('Admin search cache metrics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function collectMetrics(hours: number): Promise<SearchCacheMetricsResponse> {
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000)

  // Cache tier metrics
  const { search: searchMetrics, suggestions: suggestionsMetrics, facets: facetsMetrics } = await SearchCache.getTierMetrics()

  const totalHits = suggestionsMetrics.hits + searchMetrics.hits + facetsMetrics.hits
  const totalMisses = suggestionsMetrics.misses + searchMetrics.misses + facetsMetrics.misses
  const overallHitRate = (suggestionsMetrics.totalRequests + searchMetrics.totalRequests + facetsMetrics.totalRequests) > 0 
    ? (totalHits / (suggestionsMetrics.totalRequests + searchMetrics.totalRequests + facetsMetrics.totalRequests)) * 100 
    : 0
  
  const totalRequests = suggestionsMetrics.totalRequests + searchMetrics.totalRequests + facetsMetrics.totalRequests
  const overallAvgLatency = totalRequests > 0
    ? (suggestionsMetrics.avgLatency * suggestionsMetrics.totalRequests +
       searchMetrics.avgLatency * searchMetrics.totalRequests +
       facetsMetrics.avgLatency * facetsMetrics.totalRequests) / totalRequests
    : 0

  // Redis stats
  const redisStats = await getRedisStats()

  // Top cached queries
  const topCachedQueries = await getTopCachedQueries()

  // Invalidation stats
  const invalidationStats = await getInvalidationStats()

  return {
    metrics: {
      suggestions: suggestionsMetrics,
      search: searchMetrics,
      facets: facetsMetrics,
      overall: {
        totalHits,
        totalMisses,
        overallHitRate,
        avgLatency: overallAvgLatency
      }
    },
    stats: {
      redis: redisStats,
      topCachedQueries,
      invalidationStats
    },
    period: {
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationHours: hours
    }
  }
}

async function getRedisStats(): Promise<{
  connected: boolean
  usedMemory: string
  totalKeys: number
  evictedKeys: number
}> {
  try {
    const info = await redis.info()
    const lines = info.split('\n')
    const usedMemoryLine = lines.find(l => l.startsWith('used_memory:'))
    const totalKeysLine = lines.find(l => l.startsWith('db0:keys='))
    const evictedKeysLine = lines.find(l => l.startsWith('evicted_keys:'))

    const usedMemoryBytes = usedMemoryLine ? parseInt(usedMemoryLine.split(':')[1] || '0', 10) : 0
    const usedMemory = `${(usedMemoryBytes / 1024 / 1024).toFixed(1)} MB`
    const totalKeys = totalKeysLine ? parseInt(totalKeysLine.split('=')[1]?.split(',')[0] || '0', 10) : 0
    const evictedKeys = evictedKeysLine ? parseInt(evictedKeysLine.split(':')[1] || '0', 10) : 0

    return {
      connected: true,
      usedMemory,
      totalKeys,
      evictedKeys
    }
  } catch (error) {
    console.error('Error getting Redis stats:', error)
    return {
      connected: false,
      usedMemory: '0 MB',
      totalKeys: 0,
      evictedKeys: 0
    }
  }
}

async function getTopCachedQueries(): Promise<Array<{
  query: string
  hits: number
  lastAccessed: string
}>> {
  try {
    const top = await redis.zrevrange('cache:metrics:top_queries', 0, 9, 'WITHSCORES')
    const result: Array<{ query: string; hits: number; lastAccessed: string }> = []
    for (let i = 0; i < top.length; i += 2) {
      const query = top[i]
      if (!query) continue
      const hits = parseInt(top[i + 1] || '0', 10)
      const lastAccessed = await redis.hget('cache:metrics:last_access', query) || ''
      result.push({ query, hits, lastAccessed })
    }
    return result
  } catch (error) {
    console.error('Error getting top cached queries:', error)
    return []
  }
}

async function getInvalidationStats(): Promise<{
  lastInvalidation: string | null
  totalInvalidations: number
}> {
  try {
    const last = await redis.get('cache:invalidation:last')
    const count = await redis.get('cache:invalidation:count')
    return {
      lastInvalidation: last || null,
      totalInvalidations: parseInt(count || '0')
    }
  } catch (error) {
    console.error('Error getting invalidation stats:', error)
    return { lastInvalidation: null, totalInvalidations: 0 }
  }
}
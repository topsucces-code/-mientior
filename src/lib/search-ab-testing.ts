/**
 * Search A/B Testing Infrastructure
 *
 * Provides session-based A/B testing for comparing PostgreSQL FTS vs MeiliSearch performance.
 *
 * Features:
 * - Deterministic variant assignment (50/50 split based on session ID hash)
 * - Performance tracking and metrics aggregation
 * - Redis-based storage for variant assignments and metrics
 * - Integration with search analytics
 *
 * @module search-ab-testing
 */

import { redis } from './redis'
import { logSearch } from './search-analytics'

// Environment configuration
const ENABLE_AB_TEST = process.env.ENABLE_SEARCH_AB_TEST === 'true'

/**
 * Search variant types
 */
export type SearchVariant = 'postgresql' | 'meilisearch'

/**
 * Performance data for a single search operation
 */
export interface SearchPerformanceData {
  sessionId: string
  variant: SearchVariant
  query: string
  executionTime: number
  resultCount: number
  timestamp: Date
}

/**
 * Aggregated metrics for a variant
 */
export interface VariantMetrics {
  totalSearches: number
  avgExecutionTime: number
  p50Latency: number
  p95Latency: number
  p99Latency: number
  avgResultCount: number
  zeroResultRate: number
}

/**
 * A/B test comparison metrics
 */
export interface ABTestMetrics {
  postgresql: VariantMetrics
  meilisearch: VariantMetrics
  comparison: {
    speedImprovement: number // percentage
    winner: 'postgresql' | 'meilisearch' | 'tie'
  }
}

/**
 * Check if A/B testing is enabled
 *
 * @returns true if ENABLE_SEARCH_AB_TEST is set to 'true'
 */
export function isABTestEnabled(): boolean {
  return ENABLE_AB_TEST
}

/**
 * Get search variant for a session
 *
 * Uses deterministic hash of session ID to assign variant (50/50 split).
 * Caches assignment in Redis for 24 hours.
 *
 * @param sessionId - Session ID from cookie
 * @returns 'postgresql' or 'meilisearch'
 */
export async function getSearchVariant(sessionId: string): Promise<SearchVariant> {
  const cacheKey = `ab:search:variant:${sessionId}`

  try {
    // Try to get cached variant
    const cached = await redis.get(cacheKey)
    if (cached === 'postgresql' || cached === 'meilisearch') {
      return cached as SearchVariant
    }

    // Assign variant based on deterministic hash
    // Use simple hash: first character code modulo 2
    const hash = sessionId.charCodeAt(0) % 2
    const variant: SearchVariant = hash === 0 ? 'postgresql' : 'meilisearch'

    // Cache variant for 24 hours
    await redis.setex(cacheKey, 86400, variant)

    console.log(`[ab-testing] Assigned variant '${variant}' to session ${sessionId.substring(0, 8)}...`)

    return variant
  } catch (error) {
    console.error('[ab-testing] Error getting search variant:', error)
    // Default to postgresql on error
    return 'postgresql'
  }
}

/**
 * Track search performance for A/B testing
 *
 * Stores metrics in Redis sorted set for aggregation and logs to search analytics.
 * This is a fire-and-forget operation (non-blocking).
 *
 * @param data - Performance data to track
 */
export async function trackSearchPerformance(data: SearchPerformanceData): Promise<void> {
  const { sessionId, variant, query, executionTime, resultCount, timestamp } = data

  try {
    const date = timestamp.toISOString().split('T')[0] // YYYY-MM-DD
    const metricsKey = `ab:search:metrics:${variant}:${date}`

    // Store as JSON in sorted set (score = timestamp for chronological ordering)
    const score = timestamp.getTime()
    const value = JSON.stringify({
      sessionId,
      query,
      executionTime,
      resultCount,
      timestamp: timestamp.toISOString(),
    })

    // Add to Redis sorted set
    await redis.zadd(metricsKey, score, value)

    // Set TTL to 30 days
    await redis.expire(metricsKey, 2592000)

    // Also log to search analytics with A/B test metadata
    await logSearch({
      query,
      resultCount,
      sessionId,
      executionTime,
      // Note: A/B test variant info is stored separately in Redis metrics
    })
  } catch (error) {
    // Log error but don't throw (fire-and-forget)
    console.error('[ab-testing] Error tracking search performance:', error)
  }
}

/**
 * Get A/B test metrics for a date range
 *
 * Aggregates metrics from Redis sorted sets for both variants and computes comparison.
 *
 * @param startDate - Start date for metrics
 * @param endDate - End date for metrics
 * @returns Aggregated metrics and comparison
 */
export async function getABTestMetrics(
  startDate: Date,
  endDate: Date
): Promise<ABTestMetrics> {
  try {
    // Get metrics for both variants
    const [pgMetrics, msMetrics] = await Promise.all([
      getVariantMetrics('postgresql', startDate, endDate),
      getVariantMetrics('meilisearch', startDate, endDate),
    ])

    // Calculate comparison
    const speedImprovement = pgMetrics.avgExecutionTime > 0
      ? ((pgMetrics.avgExecutionTime - msMetrics.avgExecutionTime) / pgMetrics.avgExecutionTime) * 100
      : 0

    let winner: 'postgresql' | 'meilisearch' | 'tie' = 'tie'
    if (Math.abs(speedImprovement) > 5) { // More than 5% difference
      winner = speedImprovement > 0 ? 'meilisearch' : 'postgresql'
    }

    return {
      postgresql: pgMetrics,
      meilisearch: msMetrics,
      comparison: {
        speedImprovement,
        winner,
      },
    }
  } catch (error) {
    console.error('[ab-testing] Error getting A/B test metrics:', error)
    // Return empty metrics on error
    return {
      postgresql: getEmptyVariantMetrics(),
      meilisearch: getEmptyVariantMetrics(),
      comparison: {
        speedImprovement: 0,
        winner: 'tie',
      },
    }
  }
}

/**
 * Get metrics for a single variant in a date range
 */
async function getVariantMetrics(
  variant: SearchVariant,
  startDate: Date,
  endDate: Date
): Promise<VariantMetrics> {
  try {
    // Generate list of dates in range
    const dates: string[] = []
    const current = new Date(startDate)
    while (current <= endDate) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    // Fetch metrics for all dates
    const allMetrics: Array<{ executionTime: number; resultCount: number }> = []

    for (const date of dates) {
      const metricsKey = `ab:search:metrics:${variant}:${date}`

      // Get all entries from sorted set
      const entries = await redis.zrange(metricsKey, 0, -1)

      // Parse and collect
      for (const entry of entries) {
        try {
          const data = JSON.parse(entry)
          allMetrics.push({
            executionTime: data.executionTime,
            resultCount: data.resultCount,
          })
        } catch (e) {
          // Skip invalid entries
        }
      }
    }

    // Return empty metrics if no data
    if (allMetrics.length === 0) {
      return getEmptyVariantMetrics()
    }

    // Calculate statistics
    const totalSearches = allMetrics.length

    // Sort by execution time for percentile calculations
    const sortedByTime = [...allMetrics].sort((a, b) => a.executionTime - b.executionTime)

    const avgExecutionTime = allMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalSearches
    const p50Index = Math.floor(totalSearches * 0.5)
    const p95Index = Math.floor(totalSearches * 0.95)
    const p99Index = Math.floor(totalSearches * 0.99)

    const p50Latency = sortedByTime[p50Index]?.executionTime || 0
    const p95Latency = sortedByTime[p95Index]?.executionTime || 0
    const p99Latency = sortedByTime[p99Index]?.executionTime || 0

    const avgResultCount = allMetrics.reduce((sum, m) => sum + m.resultCount, 0) / totalSearches
    const zeroResults = allMetrics.filter(m => m.resultCount === 0).length
    const zeroResultRate = (zeroResults / totalSearches) * 100

    return {
      totalSearches,
      avgExecutionTime: Math.round(avgExecutionTime),
      p50Latency: Math.round(p50Latency),
      p95Latency: Math.round(p95Latency),
      p99Latency: Math.round(p99Latency),
      avgResultCount: Math.round(avgResultCount * 10) / 10,
      zeroResultRate: Math.round(zeroResultRate * 10) / 10,
    }
  } catch (error) {
    console.error(`[ab-testing] Error getting metrics for ${variant}:`, error)
    return getEmptyVariantMetrics()
  }
}

/**
 * Get empty variant metrics (fallback)
 */
function getEmptyVariantMetrics(): VariantMetrics {
  return {
    totalSearches: 0,
    avgExecutionTime: 0,
    p50Latency: 0,
    p95Latency: 0,
    p99Latency: 0,
    avgResultCount: 0,
    zeroResultRate: 0,
  }
}

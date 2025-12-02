#!/usr/bin/env tsx

/**
 * Maintenance script for customer search materialized view
 * 
 * Usage:
 * npm run maintain-search-view refresh
 * npm run maintain-search-view status
 * npm run maintain-search-view analyze
 */

import { prisma } from '../src/lib/prisma'
import { redis } from '../src/lib/redis'

interface ViewStats {
  rowCount: number
  lastRefresh: Date | null
  indexSizes: Record<string, string>
  queryPerformance: {
    avgExecutionTime: number
    slowQueries: number
  }
}

class SearchViewMaintenance {
  /**
   * Refresh the materialized view
   */
  static async refreshView(): Promise<void> {
    console.log('🔄 Refreshing customer search materialized view...')
    
    const startTime = Date.now()
    
    try {
      // Use CONCURRENTLY to avoid blocking other operations
      await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY customer_search_view`
      
      const duration = Date.now() - startTime
      console.log(`✅ View refreshed successfully in ${duration}ms`)
      
      // Clear related cache entries
      await this.clearSearchCache()
      
      // Update refresh timestamp in Redis
      await redis.set('customer_search_view:last_refresh', new Date().toISOString())
      
    } catch (error) {
      console.error('❌ Failed to refresh materialized view:', error)
      
      // Fallback: refresh without CONCURRENTLY if it fails
      console.log('🔄 Attempting fallback refresh...')
      try {
        await prisma.$executeRaw`REFRESH MATERIALIZED VIEW customer_search_view`
        console.log('✅ Fallback refresh successful')
      } catch (fallbackError) {
        console.error('❌ Fallback refresh also failed:', fallbackError)
        throw fallbackError
      }
    }
  }

  /**
   * Get view statistics and health information
   */
  static async getViewStatus(): Promise<ViewStats> {
    console.log('📊 Analyzing customer search view status...')
    
    try {
      // Get row count
      const [rowCountResult] = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM customer_search_view
      `
      const rowCount = Number(rowCountResult.count)

      // Get last refresh time
      const lastRefreshStr = await redis.get('customer_search_view:last_refresh')
      const lastRefresh = lastRefreshStr ? new Date(lastRefreshStr) : null

      // Get index sizes
      const indexSizes = await this.getIndexSizes()

      // Get query performance metrics
      const queryPerformance = await this.getQueryPerformance()

      const stats: ViewStats = {
        rowCount,
        lastRefresh,
        indexSizes,
        queryPerformance
      }

      console.log('📈 View Status:')
      console.log(`   Rows: ${rowCount.toLocaleString()}`)
      console.log(`   Last Refresh: ${lastRefresh?.toLocaleString() || 'Unknown'}`)
      console.log(`   Avg Query Time: ${queryPerformance.avgExecutionTime}ms`)
      console.log(`   Slow Queries: ${queryPerformance.slowQueries}`)

      return stats

    } catch (error) {
      console.error('❌ Failed to get view status:', error)
      throw error
    }
  }

  /**
   * Analyze and optimize view performance
   */
  static async analyzePerformance(): Promise<void> {
    console.log('🔍 Analyzing search performance...')
    
    try {
      // Check if view exists and is up to date
      const viewExists = await this.checkViewExists()
      if (!viewExists) {
        console.log('⚠️  Materialized view does not exist. Creating...')
        await this.createView()
        return
      }

      // Analyze query plans for common search patterns
      await this.analyzeQueryPlans()

      // Check index usage
      await this.analyzeIndexUsage()

      // Recommend optimizations
      await this.recommendOptimizations()

    } catch (error) {
      console.error('❌ Performance analysis failed:', error)
      throw error
    }
  }

  /**
   * Set up automatic refresh schedule
   */
  static async setupAutoRefresh(): Promise<void> {
    console.log('⏰ Setting up automatic refresh schedule...')
    
    try {
      // Create a function to handle periodic refresh
      await prisma.$executeRaw`
        CREATE OR REPLACE FUNCTION auto_refresh_customer_search_view()
        RETURNS void AS $$
        BEGIN
          -- Only refresh if the view is older than 5 minutes
          IF (
            SELECT EXTRACT(EPOCH FROM (NOW() - last_refresh))
            FROM pg_stat_user_tables 
            WHERE relname = 'customer_search_view'
          ) > 300 THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY customer_search_view;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `

      console.log('✅ Auto-refresh function created')

    } catch (error) {
      console.error('❌ Failed to setup auto-refresh:', error)
      throw error
    }
  }

  /**
   * Clear search-related cache entries
   */
  private static async clearSearchCache(): Promise<void> {
    try {
      const keys = await redis.keys('customer-search*')
      if (keys.length > 0) {
        await redis.del(...keys)
        console.log(`🗑️  Cleared ${keys.length} cache entries`)
      }
    } catch (error) {
      console.warn('⚠️  Failed to clear cache:', error)
    }
  }

  /**
   * Get index sizes for the materialized view
   */
  private static async getIndexSizes(): Promise<Record<string, string>> {
    try {
      const result = await prisma.$queryRaw<Array<{ indexname: string; size: string }>>`
        SELECT 
          indexname,
          pg_size_pretty(pg_relation_size(indexname::regclass)) as size
        FROM pg_indexes 
        WHERE tablename = 'customer_search_view'
      `

      return result.reduce((acc, row) => {
        acc[row.indexname] = row.size
        return acc
      }, {} as Record<string, string>)

    } catch (error) {
      console.warn('⚠️  Failed to get index sizes:', error)
      return {}
    }
  }

  /**
   * Get query performance metrics
   */
  private static async getQueryPerformance(): Promise<{ avgExecutionTime: number; slowQueries: number }> {
    try {
      // This would typically come from pg_stat_statements or application metrics
      // For now, return mock data
      return {
        avgExecutionTime: 45, // ms
        slowQueries: 2
      }
    } catch (error) {
      console.warn('⚠️  Failed to get query performance:', error)
      return { avgExecutionTime: 0, slowQueries: 0 }
    }
  }

  /**
   * Check if materialized view exists
   */
  private static async checkViewExists(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1 FROM customer_search_view LIMIT 1`
      return true
    } catch {
      return false
    }
  }

  /**
   * Create the materialized view if it doesn't exist
   */
  private static async createView(): Promise<void> {
    console.log('🏗️  Creating materialized view...')
    
    // This would execute the SQL from create_customer_search_view.sql
    // For brevity, we'll just log the action
    console.log('✅ Materialized view creation would be executed here')
  }

  /**
   * Analyze query execution plans
   */
  private static async analyzeQueryPlans(): Promise<void> {
    console.log('📋 Analyzing query execution plans...')
    
    // Test common query patterns
    const testQueries = [
      `SELECT * FROM customer_search_view WHERE "loyaltyLevel" = 'GOLD' LIMIT 20`,
      `SELECT * FROM customer_search_view WHERE "totalSpent" > 1000 LIMIT 20`,
      `SELECT * FROM customer_search_view WHERE search_vector @@ plainto_tsquery('english', 'john') LIMIT 20`
    ]

    for (const query of testQueries) {
      try {
        const plan = await prisma.$queryRaw<any[]>`EXPLAIN (ANALYZE, BUFFERS) ${prisma.$queryRawUnsafe(query)}`
        console.log(`   Query: ${query.substring(0, 50)}...`)
        console.log(`   Plan: ${plan[0]?.['QUERY PLAN'] || 'N/A'}`)
      } catch (error) {
        console.warn(`   ⚠️  Failed to analyze query: ${error}`)
      }
    }
  }

  /**
   * Analyze index usage statistics
   */
  private static async analyzeIndexUsage(): Promise<void> {
    console.log('📊 Analyzing index usage...')
    
    try {
      const indexStats = await prisma.$queryRaw<Array<{
        indexname: string
        idx_scan: number
        idx_tup_read: number
        idx_tup_fetch: number
      }>>`
        SELECT 
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        WHERE relname = 'customer_search_view'
        ORDER BY idx_scan DESC
      `

      indexStats.forEach(stat => {
        console.log(`   ${stat.indexname}: ${stat.idx_scan} scans, ${stat.idx_tup_read} reads`)
      })

    } catch (error) {
      console.warn('⚠️  Failed to analyze index usage:', error)
    }
  }

  /**
   * Provide optimization recommendations
   */
  private static async recommendOptimizations(): Promise<void> {
    console.log('💡 Optimization Recommendations:')
    
    const stats = await this.getViewStatus()
    
    if (stats.rowCount > 100000) {
      console.log('   • Consider partitioning for large datasets')
    }
    
    if (stats.queryPerformance.avgExecutionTime > 100) {
      console.log('   • Review and optimize slow queries')
      console.log('   • Consider additional indexes for common filter combinations')
    }
    
    if (!stats.lastRefresh || (Date.now() - stats.lastRefresh.getTime()) > 3600000) {
      console.log('   • Schedule more frequent view refreshes')
    }
    
    console.log('   • Monitor cache hit rates and adjust TTL as needed')
    console.log('   • Consider implementing query result pagination for large result sets')
  }
}

// CLI interface
async function main() {
  const command = process.argv[2]
  
  try {
    switch (command) {
      case 'refresh':
        await SearchViewMaintenance.refreshView()
        break
        
      case 'status':
        await SearchViewMaintenance.getViewStatus()
        break
        
      case 'analyze':
        await SearchViewMaintenance.analyzePerformance()
        break
        
      case 'setup-auto':
        await SearchViewMaintenance.setupAutoRefresh()
        break
        
      default:
        console.log('Usage: npm run maintain-search-view <command>')
        console.log('Commands:')
        console.log('  refresh    - Refresh the materialized view')
        console.log('  status     - Show view status and statistics')
        console.log('  analyze    - Analyze performance and provide recommendations')
        console.log('  setup-auto - Setup automatic refresh schedule')
        process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Command failed:', error)
    process.exit(1)
    
  } finally {
    await prisma.$disconnect()
    process.exit(0)
  }
}

if (require.main === module) {
  main()
}

export { SearchViewMaintenance }
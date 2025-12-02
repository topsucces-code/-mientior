#!/usr/bin/env tsx

/**
 * Maintenance script for product search FTS
 * 
 * Usage:
 * npm run db:product-search:reindex
 * npm run db:product-search:status
 * npm run db:product-search:analyze
 * npm run db:product-search:test
 * npm run db:product-search:optimize
 * npm run db:product-search:clear-cache
 */

import { prisma } from '../src/lib/prisma'
import { redis } from '../src/lib/redis'

interface IndexStats {
  totalProducts: number
  indexedProducts: number
  coveragePercent: number
  indexSizes: Record<string, string>
  lastReindex: Date | null
}

class ProductSearchMaintenance {
  /**
   * Reindex all products by triggering the update function
   */
  static async reindexProducts(): Promise<number> {
    console.log('🔄 Reindexing all products...')
    
    const startTime = Date.now()
    
    try {
      // Update all products to trigger the search vector update
      const result = await prisma.$executeRaw`
        UPDATE products SET name = name
        WHERE status = 'ACTIVE' OR status = 'DRAFT' OR status = 'ARCHIVED'
      `
      
      const duration = Date.now() - startTime
      console.log(`✅ Reindexed ${result} products in ${duration}ms`)
      
      // Clear search cache
      await this.clearSearchCache()
      
      // Update reindex timestamp in Redis
      await redis.set('product_search:last_reindex', new Date().toISOString())
      
      return result as number
    } catch (error) {
      console.error('❌ Failed to reindex products:', error)
      throw error
    }
  }

  /**
   * Get index statistics and health information
   */
  static async getIndexStatus(): Promise<IndexStats> {
    console.log('📊 Analyzing product search index status...')
    
    try {
      // Get total product count
      const [totalResult] = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM products
      `
      const totalProducts = Number(totalResult.count)

      // Get indexed product count (products with non-null search_vector)
      const [indexedResult] = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM products
        WHERE search_vector IS NOT NULL
      `
      const indexedProducts = Number(indexedResult.count)

      // Calculate coverage
      const coveragePercent = totalProducts > 0 
        ? Math.round((indexedProducts / totalProducts) * 100) 
        : 0

      // Get index sizes
      const indexSizes = await this.getIndexSizes()

      // Get last reindex time
      const lastReindexStr = await redis.get('product_search:last_reindex')
      const lastReindex = lastReindexStr ? new Date(lastReindexStr) : null

      const stats: IndexStats = {
        totalProducts,
        indexedProducts,
        coveragePercent,
        indexSizes,
        lastReindex
      }

      console.log('📈 Index Status:')
      console.log(`   Total Products: ${totalProducts.toLocaleString()}`)
      console.log(`   Indexed Products: ${indexedProducts.toLocaleString()}`)
      console.log(`   Coverage: ${coveragePercent}%`)
      console.log(`   Last Reindex: ${lastReindex?.toLocaleString() || 'Unknown'}`)
      console.log('   Index Sizes:')
      Object.entries(indexSizes).forEach(([name, size]) => {
        console.log(`     ${name}: ${size}`)
      })

      return stats
    } catch (error) {
      console.error('❌ Failed to get index status:', error)
      throw error
    }
  }

  /**
   * Analyze search performance with test queries
   */
  static async analyzePerformance(): Promise<void> {
    console.log('🔍 Analyzing search performance...')
    
    try {
      // Test queries with different patterns
      const testQueries = [
        { query: 'smartphone', description: 'Simple single word' },
        { query: 'téléphone portable', description: 'French with accents' },
        { query: 'chaussures running', description: 'Multiple words' },
        { query: 'ordinateur portable gaming', description: 'Complex query' },
      ]

      console.log('\n📋 FTS Query Performance:')
      
      for (const test of testQueries) {
        const startTime = Date.now()
        
        try {
          const result = await prisma.$queryRaw<Array<{ id: string; name: string; score: number }>>`
            SELECT 
              id,
              name,
              ts_rank(search_vector, plainto_tsquery('french', ${test.query}), 1) as score
            FROM products
            WHERE search_vector @@ plainto_tsquery('french', ${test.query})
            ORDER BY score DESC
            LIMIT 10
          `
          
          const duration = Date.now() - startTime
          console.log(`   "${test.query}" (${test.description}):`)
          console.log(`     Time: ${duration}ms`)
          console.log(`     Results: ${result.length}`)
          if (result.length > 0) {
            console.log(`     Top result: "${result[0].name}" (score: ${result[0].score.toFixed(3)})`)
          }
        } catch (error) {
          console.error(`     ❌ Query failed: ${error}`)
        }
      }

      // Compare with contains search
      console.log('\n📋 Contains Search Performance (for comparison):')
      const compareQuery = 'smartphone'
      const startTime = Date.now()
      
      const containsResult = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: compareQuery, mode: 'insensitive' } },
            { description: { contains: compareQuery, mode: 'insensitive' } },
          ],
        },
        take: 10,
      })
      
      const duration = Date.now() - startTime
      console.log(`   "${compareQuery}":`)
      console.log(`     Time: ${duration}ms`)
      console.log(`     Results: ${containsResult.length}`)

      // Analyze query plans
      await this.analyzeQueryPlans()

    } catch (error) {
      console.error('❌ Performance analysis failed:', error)
      throw error
    }
  }

  /**
   * Test search quality with various queries
   */
  static async testSearchQuality(): Promise<void> {
    console.log('🧪 Testing search quality...')
    
    try {
      const testCases = [
        { query: 'téléphone', expectedTerms: ['telephone', 'phone'] },
        { query: 'chaussures', expectedTerms: ['chaussure', 'shoe'] },
        { query: 'ordinateurs', expectedTerms: ['ordinateur', 'computer'] },
      ]

      console.log('\n📋 Search Quality Tests:')
      
      for (const test of testCases) {
        console.log(`\n   Testing: "${test.query}"`)
        
        const result = await prisma.$queryRaw<Array<{ id: string; name: string; score: number }>>`
          SELECT 
            id,
            name,
            ts_rank(search_vector, plainto_tsquery('french', ${test.query}), 1) as score
          FROM products
          WHERE search_vector @@ plainto_tsquery('french', ${test.query})
          ORDER BY score DESC
          LIMIT 5
        `
        
        if (result.length > 0) {
          console.log(`     ✅ Found ${result.length} results`)
          result.forEach((r, i) => {
            console.log(`       ${i + 1}. "${r.name}" (score: ${r.score.toFixed(3)})`)
          })
        } else {
          console.log(`     ⚠️  No results found`)
        }
      }

      // Test edge cases
      console.log('\n📋 Edge Case Tests:')
      
      const edgeCases = [
        { query: '', description: 'Empty query' },
        { query: 'xyz123abc', description: 'Non-existent term' },
        { query: 'le la les', description: 'Stop words only' },
      ]

      for (const test of edgeCases) {
        try {
          const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
            SELECT COUNT(*) as count
            FROM products
            WHERE search_vector @@ plainto_tsquery('french', ${test.query})
          `
          
          console.log(`   "${test.query}" (${test.description}): ${Number(result[0].count)} results`)
        } catch (error) {
          console.log(`   "${test.query}" (${test.description}): Error - ${error}`)
        }
      }

    } catch (error) {
      console.error('❌ Search quality test failed:', error)
      throw error
    }
  }

  /**
   * Optimize indexes and update statistics
   */
  static async optimizeIndexes(): Promise<void> {
    console.log('⚡ Optimizing indexes...')
    
    try {
      // Run VACUUM ANALYZE on products table
      console.log('   Running VACUUM ANALYZE...')
      await prisma.$executeRaw`VACUUM ANALYZE products`
      console.log('   ✅ VACUUM ANALYZE completed')

      // Reindex GIN indexes
      console.log('   Reindexing GIN indexes...')
      await prisma.$executeRaw`REINDEX INDEX CONCURRENTLY idx_product_search_vector`
      await prisma.$executeRaw`REINDEX INDEX CONCURRENTLY idx_product_search_vector_simple`
      console.log('   ✅ Indexes rebuilt')

      // Update statistics
      console.log('   Updating statistics...')
      await prisma.$executeRaw`ANALYZE products`
      console.log('   ✅ Statistics updated')

      console.log('✅ Optimization completed successfully')

    } catch (error) {
      console.error('❌ Optimization failed:', error)
      console.log('💡 Note: REINDEX CONCURRENTLY requires PostgreSQL 12+')
      console.log('💡 If it fails, try running without CONCURRENTLY (will lock the table)')
      throw error
    }
  }

  /**
   * Clear all search-related cache entries
   */
  static async clearSearchCache(): Promise<void> {
    console.log('🗑️  Clearing search cache...')
    
    try {
      const patterns = ['search:*', 'product-search:*']
      let totalCleared = 0

      for (const pattern of patterns) {
        const keys = await redis.keys(pattern)
        if (keys.length > 0) {
          await redis.del(...keys)
          totalCleared += keys.length
        }
      }

      console.log(`✅ Cleared ${totalCleared} cache entries`)
    } catch (error) {
      console.warn('⚠️  Failed to clear cache:', error)
    }
  }

  /**
   * Get index sizes for product search indexes
   */
  private static async getIndexSizes(): Promise<Record<string, string>> {
    try {
      const result = await prisma.$queryRaw<Array<{ indexname: string; size: string }>>`
        SELECT 
          indexname,
          pg_size_pretty(pg_relation_size(indexname::regclass)) as size
        FROM pg_indexes 
        WHERE tablename = 'products'
          AND indexname LIKE '%search_vector%'
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
   * Analyze query execution plans
   */
  private static async analyzeQueryPlans(): Promise<void> {
    console.log('\n📋 Analyzing query execution plans...')
    
    try {
      const testQuery = 'smartphone'
      
      // FTS query plan
      console.log('   FTS Query Plan:')
      const ftsExplain = await prisma.$queryRawUnsafe<Array<{ 'QUERY PLAN': string }>>(
        `EXPLAIN (ANALYZE, BUFFERS) 
         SELECT id, name, ts_rank(search_vector, plainto_tsquery('french', $1), 1) as score
         FROM products
         WHERE search_vector @@ plainto_tsquery('french', $1)
         ORDER BY score DESC
         LIMIT 10`,
        testQuery
      )
      
      ftsExplain.forEach(row => {
        console.log(`     ${row['QUERY PLAN']}`)
      })

    } catch (error) {
      console.warn('⚠️  Failed to analyze query plans:', error)
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2]
  
  try {
    switch (command) {
      case 'reindex':
        await ProductSearchMaintenance.reindexProducts()
        break
        
      case 'status':
        await ProductSearchMaintenance.getIndexStatus()
        break
        
      case 'analyze':
        await ProductSearchMaintenance.analyzePerformance()
        break
        
      case 'test':
        await ProductSearchMaintenance.testSearchQuality()
        break
        
      case 'optimize':
        await ProductSearchMaintenance.optimizeIndexes()
        break
        
      case 'clear-cache':
        await ProductSearchMaintenance.clearSearchCache()
        break
        
      default:
        console.log('Usage: npm run db:product-search:<command>')
        console.log('Commands:')
        console.log('  reindex     - Reindex all products')
        console.log('  status      - Show index status and statistics')
        console.log('  analyze     - Analyze performance and query plans')
        console.log('  test        - Test search quality with various queries')
        console.log('  optimize    - Optimize indexes and update statistics')
        console.log('  clear-cache - Clear all search-related cache entries')
        process.exit(1)
    }
    
  } catch (error) {
    console.error('❌ Command failed:', error)
    process.exit(1)
    
  } finally {
    await prisma.$disconnect()
    await redis.quit()
    process.exit(0)
  }
}

if (require.main === module) {
  main()
}

export { ProductSearchMaintenance }

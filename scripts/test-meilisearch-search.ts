#!/usr/bin/env tsx
/**
 * Test MeiliSearch Search
 *
 * Verifies MeiliSearch availability and runs basic search comparisons.
 * Compares search results between MeiliSearch and PostgreSQL.
 *
 * Usage:
 *   npm run search:test-meilisearch
 */

import { searchProductsWithMeiliSearch } from '../src/lib/meilisearch-search'
import { searchProducts } from '../src/lib/product-search-service'
import { isAvailable } from '../src/lib/meilisearch-client'

interface TestQuery {
  query: string
  description: string
}

const TEST_QUERIES: TestQuery[] = [
  { query: 'laptop', description: 'Simple keyword search' },
  { query: 'smartphone camera', description: 'Multi-word search' },
  { query: 'wireles headpone', description: 'Typo tolerance test' },
  { query: 'gaming', description: 'Single broad term' },
  { query: '', description: 'Empty query (should return all)' },
]

async function testMeiliSearchSearch() {
  console.log('🔍 Testing MeiliSearch Search\n')
  console.log('=' .repeat(80))

  // Check availability
  console.log('\n📡 Checking MeiliSearch availability...')
  const available = await isAvailable()

  if (!available) {
    console.error('❌ MeiliSearch is not available')
    console.error('   Please start MeiliSearch with: npm run meilisearch:start')
    process.exit(1)
  }

  console.log('✅ MeiliSearch is available\n')

  // Run test queries
  let successCount = 0
  let failureCount = 0

  for (const { query, description } of TEST_QUERIES) {
    console.log('=' .repeat(80))
    console.log(`\n📝 Test: ${description}`)
    console.log(`   Query: "${query}"`)

    try {
      // Test MeiliSearch
      const meiliStartTime = Date.now()
      const meiliResults = await searchProductsWithMeiliSearch({
        query,
        filters: {},
        sort: 'relevance',
        page: 1,
        limit: 10,
      })
      const meiliDuration = Date.now() - meiliStartTime

      // Test PostgreSQL
      const pgStartTime = Date.now()
      const pgResults = await searchProducts({
        query,
        filters: {},
        sort: 'relevance',
        page: 1,
        limit: 10,
      })
      const pgDuration = Date.now() - pgStartTime

      // Compare results
      console.log(`\n   MeiliSearch:`)
      console.log(`     - Count: ${meiliResults.totalCount}`)
      console.log(`     - Products: ${meiliResults.products.length}`)
      console.log(`     - Duration: ${meiliDuration}ms`)

      console.log(`\n   PostgreSQL:`)
      console.log(`     - Count: ${pgResults.totalCount}`)
      console.log(`     - Products: ${pgResults.products.length}`)
      console.log(`     - Duration: ${pgDuration}ms`)

      // Performance comparison
      const speedup = pgDuration > 0 ? ((pgDuration - meiliDuration) / pgDuration * 100).toFixed(1) : 'N/A'
      const faster = meiliDuration < pgDuration ? 'MeiliSearch' : 'PostgreSQL'

      console.log(`\n   Performance:`)
      console.log(`     - Faster: ${faster}`)
      console.log(`     - Speed difference: ${speedup}%`)

      // Count comparison
      const countDiff = Math.abs(meiliResults.totalCount - pgResults.totalCount)
      if (countDiff > 0) {
        console.log(`\n   ⚠️  Count mismatch: ${countDiff} difference`)
      } else {
        console.log(`\n   ✅ Counts match`)
      }

      successCount++
    } catch (error) {
      console.error(`\n   ❌ Test failed:`, error)
      failureCount++
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 Test Summary:')
  console.log(`   ✅ Passed: ${successCount}/${TEST_QUERIES.length}`)
  console.log(`   ❌ Failed: ${failureCount}/${TEST_QUERIES.length}`)

  if (failureCount > 0) {
    console.log('\n⚠️  Some tests failed. Please review errors above.')
    process.exit(1)
  }

  console.log('\n✨ All tests passed!')
  process.exit(0)
}

// Run the tests
testMeiliSearchSearch().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})

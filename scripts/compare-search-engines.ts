#!/usr/bin/env tsx
/**
 * Compare Search Engines
 *
 * Comprehensive benchmark comparing MeiliSearch and PostgreSQL search performance.
 * Runs multiple queries with different patterns and aggregates timing statistics.
 *
 * Usage:
 *   npm run search:compare
 *   npm run search:compare -- --queries=50
 *   npm run search:compare -- --output=benchmark.json
 */

import { searchProductsWithMeiliSearch } from '../src/lib/meilisearch-search'
import { searchProducts } from '../src/lib/product-search-service'
import { getSuggestionsWithMeiliSearch } from '../src/lib/meilisearch-suggestions'
import { getSuggestions } from '../src/lib/search-suggestions-service'
import { computeFacetsWithMeiliSearch } from '../src/lib/meilisearch-facets'
import { computeFacets } from '../src/lib/facets-service'
import { isAvailable } from '../src/lib/meilisearch-client'
import * as fs from 'fs'

interface BenchmarkQuery {
  query: string
  category: string
  filters?: any
}

interface TimingStats {
  count: number
  total: number
  avg: number
  min: number
  max: number
  p50: number
  p95: number
  p99: number
}

interface EngineStats {
  search: TimingStats
  suggestions: TimingStats
  facets: TimingStats
  totalQueries: number
  failureCount: number
}

const BENCHMARK_QUERIES: BenchmarkQuery[] = [
  // Simple keywords
  { query: 'laptop', category: 'simple' },
  { query: 'smartphone', category: 'simple' },
  { query: 'headphones', category: 'simple' },
  { query: 'camera', category: 'simple' },
  { query: 'tablet', category: 'simple' },

  // Multi-word
  { query: 'gaming laptop', category: 'multi-word' },
  { query: 'wireless headphones', category: 'multi-word' },
  { query: 'smartphone camera', category: 'multi-word' },
  { query: 'portable speaker', category: 'multi-word' },

  // With filters
  { query: 'laptop', category: 'filtered', filters: { minPrice: 500, maxPrice: 2000 } },
  { query: 'smartphone', category: 'filtered', filters: { onSale: true } },
  { query: 'headphones', category: 'filtered', filters: { rating: 4 } },

  // Typos (fuzzy search test)
  { query: 'lptop', category: 'typo' },
  { query: 'smatphone', category: 'typo' },
  { query: 'headpone', category: 'typo' },
]

function calculateStats(timings: number[]): TimingStats {
  if (timings.length === 0) {
    return { count: 0, total: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 }
  }

  const sorted = [...timings].sort((a, b) => a - b)
  const total = sorted.reduce((sum, t) => sum + t, 0)

  return {
    count: timings.length,
    total,
    avg: total / timings.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  }
}

function printStats(label: string, stats: TimingStats) {
  console.log(`\n   ${label}:`)
  console.log(`     - Count: ${stats.count}`)
  console.log(`     - Avg: ${stats.avg.toFixed(2)}ms`)
  console.log(`     - Min: ${stats.min.toFixed(2)}ms`)
  console.log(`     - Max: ${stats.max.toFixed(2)}ms`)
  console.log(`     - P50: ${stats.p50.toFixed(2)}ms`)
  console.log(`     - P95: ${stats.p95.toFixed(2)}ms`)
  console.log(`     - P99: ${stats.p99.toFixed(2)}ms`)
}

async function compareBenchmark() {
  console.log('🏁 Search Engine Benchmark\n')
  console.log('=' .repeat(80))

  // Parse CLI args
  const args = process.argv.slice(2)
  const queriesArg = args.find(arg => arg.startsWith('--queries='))
  const outputArg = args.find(arg => arg.startsWith('--output='))
  const iterations = queriesArg ? parseInt(queriesArg.split('=')[1]) : BENCHMARK_QUERIES.length
  const outputFile = outputArg ? outputArg.split('=')[1] : null

  console.log(`\n📊 Configuration:`)
  console.log(`   - Queries: ${iterations}`)
  console.log(`   - Output: ${outputFile || 'console only'}`)

  // Check MeiliSearch availability
  console.log('\n📡 Checking MeiliSearch availability...')
  const available = await isAvailable()

  if (!available) {
    console.error('❌ MeiliSearch is not available')
    console.error('   Comparison will only show PostgreSQL results')
  } else {
    console.log('✅ MeiliSearch is available')
  }

  // Prepare timing arrays
  const meiliSearchTimings: number[] = []
  const meiliSuggestTimings: number[] = []
  const meiliFacetsTimings: number[] = []
  const pgSearchTimings: number[] = []
  const pgSuggestTimings: number[] = []
  const pgFacetsTimings: number[] = []

  let meiliFailures = 0
  let pgFailures = 0

  // Run benchmarks
  console.log('\n🔄 Running benchmarks...\n')

  for (let i = 0; i < iterations; i++) {
    const query = BENCHMARK_QUERIES[i % BENCHMARK_QUERIES.length]
    process.stdout.write(`\r   Progress: ${i + 1}/${iterations} (${((i + 1) / iterations * 100).toFixed(1)}%)`)

    // MeiliSearch benchmarks
    if (available) {
      try {
        // Search
        const searchStart = Date.now()
        await searchProductsWithMeiliSearch({
          query: query.query,
          filters: query.filters || {},
          sort: 'relevance',
          page: 1,
          limit: 20,
        })
        meiliSearchTimings.push(Date.now() - searchStart)

        // Suggestions
        const suggestStart = Date.now()
        await getSuggestionsWithMeiliSearch({ query: query.query, limit: 10 })
        meiliSuggestTimings.push(Date.now() - suggestStart)

        // Facets
        const facetsStart = Date.now()
        await computeFacetsWithMeiliSearch({ query: query.query, filters: query.filters })
        meiliFacetsTimings.push(Date.now() - facetsStart)
      } catch (error) {
        meiliFailures++
      }
    }

    // PostgreSQL benchmarks
    try {
      // Search
      const searchStart = Date.now()
      await searchProducts({
        query: query.query,
        filters: query.filters || {},
        sort: 'relevance',
        page: 1,
        limit: 20,
      })
      pgSearchTimings.push(Date.now() - searchStart)

      // Suggestions
      const suggestStart = Date.now()
      await getSuggestions({ query: query.query, limit: 10 })
      pgSuggestTimings.push(Date.now() - suggestStart)

      // Facets
      const facetsStart = Date.now()
      await computeFacets({ query: query.query, filters: query.filters })
      pgFacetsTimings.push(Date.now() - facetsStart)
    } catch (error) {
      pgFailures++
    }
  }

  console.log('\n\n' + '='.repeat(80))

  // Calculate statistics
  const meiliStats: EngineStats = {
    search: calculateStats(meiliSearchTimings),
    suggestions: calculateStats(meiliSuggestTimings),
    facets: calculateStats(meiliFacetsTimings),
    totalQueries: iterations,
    failureCount: meiliFailures,
  }

  const pgStats: EngineStats = {
    search: calculateStats(pgSearchTimings),
    suggestions: calculateStats(pgSuggestTimings),
    facets: calculateStats(pgFacetsTimings),
    totalQueries: iterations,
    failureCount: pgFailures,
  }

  // Print results
  console.log('\n📊 Results:\n')

  if (available) {
    console.log('🔷 MeiliSearch:')
    printStats('Search', meiliStats.search)
    printStats('Suggestions', meiliStats.suggestions)
    printStats('Facets', meiliStats.facets)
    console.log(`\n   - Failures: ${meiliFailures}/${iterations}`)
  }

  console.log('\n🔶 PostgreSQL:')
  printStats('Search', pgStats.search)
  printStats('Suggestions', pgStats.suggestions)
  printStats('Facets', pgStats.facets)
  console.log(`\n   - Failures: ${pgFailures}/${iterations}`)

  // Comparison
  if (available) {
    console.log('\n' + '='.repeat(80))
    console.log('\n🏆 Winner:')

    const searchWinner = meiliStats.search.avg < pgStats.search.avg ? 'MeiliSearch' : 'PostgreSQL'
    const searchSpeedup = ((Math.max(meiliStats.search.avg, pgStats.search.avg) - Math.min(meiliStats.search.avg, pgStats.search.avg)) / Math.max(meiliStats.search.avg, pgStats.search.avg) * 100).toFixed(1)
    console.log(`\n   Search: ${searchWinner} (${searchSpeedup}% faster)`)

    const suggestWinner = meiliStats.suggestions.avg < pgStats.suggestions.avg ? 'MeiliSearch' : 'PostgreSQL'
    const suggestSpeedup = ((Math.max(meiliStats.suggestions.avg, pgStats.suggestions.avg) - Math.min(meiliStats.suggestions.avg, pgStats.suggestions.avg)) / Math.max(meiliStats.suggestions.avg, pgStats.suggestions.avg) * 100).toFixed(1)
    console.log(`   Suggestions: ${suggestWinner} (${suggestSpeedup}% faster)`)

    const facetsWinner = meiliStats.facets.avg < pgStats.facets.avg ? 'MeiliSearch' : 'PostgreSQL'
    const facetsSpeedup = ((Math.max(meiliStats.facets.avg, pgStats.facets.avg) - Math.min(meiliStats.facets.avg, pgStats.facets.avg)) / Math.max(meiliStats.facets.avg, pgStats.facets.avg) * 100).toFixed(1)
    console.log(`   Facets: ${facetsWinner} (${facetsSpeedup}% faster)`)
  }

  // Save to file if requested
  if (outputFile) {
    const report = {
      timestamp: new Date().toISOString(),
      iterations,
      meilisearch: available ? meiliStats : null,
      postgresql: pgStats,
    }

    fs.writeFileSync(outputFile, JSON.stringify(report, null, 2))
    console.log(`\n💾 Report saved to: ${outputFile}`)
  }

  console.log('\n✨ Benchmark complete!\n')
  process.exit(0)
}

// Run the benchmark
compareBenchmark().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})

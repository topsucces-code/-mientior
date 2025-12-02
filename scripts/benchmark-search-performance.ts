/**
 * Search Performance Benchmark Script
 *
 * Comprehensive performance testing under various load conditions:
 * - Autocomplete latency (target <100ms)
 * - Search latency (target <200ms)
 * - Facets computation (target <50ms with cache)
 * - Concurrent requests handling
 * - Cache hit rates
 *
 * Outputs detailed metrics and comparison tables
 */

import { search, suggest, facets } from '../src/lib/search-service'
import { getCacheMetrics } from '../src/lib/redis'
import Table from 'cli-table3'

interface BenchmarkResult {
  operation: string
  samples: number
  min: number
  max: number
  avg: number
  median: number
  p95: number
  p99: number
  throughput?: number
}

/**
 * Calculate percentile from sorted array
 */
function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b)
  const index = Math.ceil((sorted.length * p) / 100) - 1
  return sorted[index] || 0
}

/**
 * Calculate statistics from latency array
 */
function calculateStats(latencies: number[], samples: number, duration: number): BenchmarkResult {
  const sorted = [...latencies].sort((a, b) => a - b)
  const sum = latencies.reduce((a, b) => a + b, 0)

  return {
    operation: '',
    samples,
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
    avg: sum / latencies.length,
    median: sorted[Math.floor(sorted.length / 2)] || 0,
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    throughput: (samples / duration) * 1000 // requests per second
  }
}

/**
 * Benchmark autocomplete performance
 */
async function benchmarkAutocomplete(): Promise<BenchmarkResult> {
  console.log('\n🔤 Benchmarking Autocomplete...')

  const queries = ['sm', 'sma', 'smar', 'smart', 'smartp', 'smartph', 'smartpho', 'smartphon', 'smartphone']
  const iterations = 20
  const latencies: number[] = []
  const start = Date.now()

  for (let i = 0; i < iterations; i++) {
    for (const query of queries) {
      const queryStart = Date.now()
      await suggest({ query, limit: 10 })
      latencies.push(Date.now() - queryStart)
    }
  }

  const duration = Date.now() - start
  const result = calculateStats(latencies, latencies.length, duration)
  result.operation = 'Autocomplete'

  const status = result.p95 < 100 ? '✅' : result.p95 < 150 ? '⚠️' : '❌'
  console.log(
    `${status} P95: ${Math.round(result.p95)}ms | Avg: ${Math.round(result.avg)}ms | Throughput: ${Math.round(result.throughput || 0)} req/s`
  )

  return result
}

/**
 * Benchmark search performance
 */
async function benchmarkSearch(): Promise<BenchmarkResult> {
  console.log('\n🔍 Benchmarking Search...')

  const queries = [
    { query: 'smartphone', filters: {} },
    { query: 'ordinateur portable', filters: {} },
    { query: 'chaussures', filters: { minPrice: 50, maxPrice: 200 } },
    { query: 'vêtements', filters: { categoryId: 'cat-1' } },
    { query: 'électronique', filters: {} }
  ]
  const iterations = 10
  const latencies: number[] = []
  const start = Date.now()

  for (let i = 0; i < iterations; i++) {
    for (const { query, filters } of queries) {
      const queryStart = Date.now()
      await search({ query, page: 1, limit: 20, ...filters })
      latencies.push(Date.now() - queryStart)
    }
  }

  const duration = Date.now() - start
  const result = calculateStats(latencies, latencies.length, duration)
  result.operation = 'Search'

  const status = result.p95 < 200 ? '✅' : result.p95 < 300 ? '⚠️' : '❌'
  console.log(
    `${status} P95: ${Math.round(result.p95)}ms | Avg: ${Math.round(result.avg)}ms | Throughput: ${Math.round(result.throughput || 0)} req/s`
  )

  return result
}

/**
 * Benchmark facets computation
 */
async function benchmarkFacets(): Promise<BenchmarkResult> {
  console.log('\n📊 Benchmarking Facets...')

  const queries = [
    { query: 'smartphone', filters: {} },
    { query: '', filters: { minPrice: 100, maxPrice: 500 } },
    { query: 'laptop', filters: { categoryId: 'cat-electronics' } }
  ]
  const iterations = 20
  const latencies: number[] = []
  const start = Date.now()

  for (let i = 0; i < iterations; i++) {
    for (const { query, filters } of queries) {
      const queryStart = Date.now()
      await facets({ query, filters })
      latencies.push(Date.now() - queryStart)
    }
  }

  const duration = Date.now() - start
  const result = calculateStats(latencies, latencies.length, duration)
  result.operation = 'Facets'

  const status = result.p95 < 200 ? '✅' : result.p95 < 300 ? '⚠️' : '❌'
  console.log(
    `${status} P95: ${Math.round(result.p95)}ms | Avg: ${Math.round(result.avg)}ms | Throughput: ${Math.round(result.throughput || 0)} req/s`
  )

  return result
}

/**
 * Benchmark concurrent requests
 */
async function benchmarkConcurrency(): Promise<BenchmarkResult> {
  console.log('\n⚡ Benchmarking Concurrent Requests...')

  const concurrency = 10
  const requestsPerBatch = 10
  const latencies: number[] = []
  const start = Date.now()

  for (let i = 0; i < requestsPerBatch; i++) {
    const batchStart = Date.now()
    const promises = Array(concurrency)
      .fill(null)
      .map(() => search({ query: 'test', page: 1, limit: 10 }))

    await Promise.all(promises)
    const batchLatency = Date.now() - batchStart
    latencies.push(batchLatency)
  }

  const duration = Date.now() - start
  const result = calculateStats(latencies, concurrency * requestsPerBatch, duration)
  result.operation = 'Concurrent (10 parallel)'

  console.log(
    `✅ Avg batch: ${Math.round(result.avg)}ms | Total throughput: ${Math.round(result.throughput || 0)} req/s`
  )

  return result
}

/**
 * Benchmark indexing performance
 */
async function benchmarkIndexing(): Promise<BenchmarkResult> {
  console.log('\n📇 Benchmarking Indexing...')

  const { prisma } = await import('../src/lib/prisma')
  const { indexProducts } = await import('../src/lib/search-indexer')

  const batchSize = 100
  const iterations = 3
  const latencies: number[] = []
  const perProductLatencies: number[] = []
  const start = Date.now()

  for (let iter = 0; iter < iterations; iter++) {
    // Create batch of test products
    const testProducts = []
    for (let i = 0; i < batchSize; i++) {
      testProducts.push({
        name: `Benchmark Product ${iter}-${i}`,
        slug: `benchmark-product-${iter}-${i}-${Date.now()}`,
        description: `Benchmark product for indexing performance test`,
        price: 99.99,
        stock: 10,
        status: 'ACTIVE' as const,
      })
    }

    // Create products in database
    const createdProducts = []
    for (const product of testProducts) {
      const created = await prisma.product.create({ data: product })
      createdProducts.push(created)
    }

    const productIds = createdProducts.map(p => p.id)

    // Measure indexing time for this batch
    const batchStart = Date.now()
    await indexProducts(productIds)
    const batchLatency = Date.now() - batchStart
    latencies.push(batchLatency)

    // Calculate per-product latency
    const perProductLatency = batchLatency / batchSize
    perProductLatencies.push(perProductLatency)

    // Clean up test products
    await prisma.product.deleteMany({
      where: { id: { in: productIds } }
    })
  }

  const duration = Date.now() - start
  const result = calculateStats(latencies, batchSize * iterations, duration)
  result.operation = 'Indexing'

  // Calculate per-product stats
  const avgPerProduct = perProductLatencies.reduce((a, b) => a + b, 0) / perProductLatencies.length
  const p95PerProduct = percentile(perProductLatencies, 95)

  const status = result.p95 < 5000 ? '✅' : result.p95 < 7000 ? '⚠️' : '❌'
  console.log(
    `${status} P95: ${Math.round(result.p95)}ms (batch) | Avg per product: ${Math.round(avgPerProduct)}ms | P95 per product: ${Math.round(p95PerProduct)}ms`
  )

  await prisma.$disconnect()

  return result
}

/**
 * Get cache performance metrics
 */
async function getCachePerformance(): Promise<void> {
  console.log('\n💾 Cache Performance Metrics...')

  const prefixes = ['search:products', 'search:suggestions', 'facets']

  for (const prefix of prefixes) {
    try {
      const metrics = await getCacheMetrics(prefix)
      const status = metrics.hitRate > 80 ? '✅' : metrics.hitRate > 50 ? '⚠️' : '❌'
      console.log(
        `${status} ${prefix.padEnd(20)} | Hit Rate: ${metrics.hitRate.toFixed(1)}% | Hits: ${metrics.hits} | Misses: ${metrics.misses} | Avg Latency: ${Math.round(metrics.avgLatency)}ms`
      )
    } catch (error) {
      console.log(`❌ ${prefix.padEnd(20)} | Error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }
  }
}

/**
 * Print results table
 */
function printResultsTable(results: BenchmarkResult[]): void {
  console.log('\n📊 Performance Benchmarks Summary\n')

  const table = new Table({
    head: ['Operation', 'Samples', 'Min (ms)', 'Avg (ms)', 'Median (ms)', 'P95 (ms)', 'P99 (ms)', 'Max (ms)', 'Throughput (req/s)'],
    colWidths: [20, 10, 10, 10, 12, 10, 10, 10, 20]
  })

  for (const result of results) {
    const p95Status =
      result.operation === 'Autocomplete' && result.p95 < 100 ? '✅' :
      result.operation === 'Search' && result.p95 < 200 ? '✅' :
      result.operation === 'Facets' && result.p95 < 200 ? '✅' :
      result.operation === 'Indexing' && result.p95 < 5000 ? '✅' :
      '⚠️'

    table.push([
      result.operation,
      result.samples,
      Math.round(result.min),
      Math.round(result.avg),
      Math.round(result.median),
      `${Math.round(result.p95)} ${p95Status}`,
      Math.round(result.p99),
      Math.round(result.max),
      Math.round(result.throughput || 0)
    ])
  }

  console.log(table.toString())

  console.log('\n📌 Performance Targets:')
  console.log('  • Autocomplete: P95 < 100ms')
  console.log('  • Search: P95 < 200ms')
  console.log('  • Facets: P95 < 200ms')
  console.log('  • Indexing: P95 < 5000ms (per 100 products)')
  console.log('  • Cache Hit Rate: > 80%')
}

/**
 * Main benchmark function
 */
async function main() {
  console.log('🚀 Search Performance Benchmark')
  console.log('=' .repeat(80))

  const results: BenchmarkResult[] = []

  try {
    // Run benchmarks
    results.push(await benchmarkAutocomplete())
    results.push(await benchmarkSearch())
    results.push(await benchmarkFacets())
    results.push(await benchmarkConcurrency())
    results.push(await benchmarkIndexing())

    // Get cache metrics
    await getCachePerformance()

    // Print summary
    printResultsTable(results)

    // Save results to JSON
    const fs = await import('fs/promises')
    await fs.writeFile(
      'search-benchmark-results.json',
      JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
    )
    console.log('\n💾 Results saved to search-benchmark-results.json')

    // Determine exit code
    const allPass = results.every(r => {
      if (r.operation === 'Autocomplete') return r.p95 < 100
      if (r.operation === 'Search') return r.p95 < 200
      if (r.operation === 'Facets') return r.p95 < 200
      if (r.operation === 'Indexing') return r.p95 < 5000
      return true
    })

    if (allPass) {
      console.log('\n✅ All performance benchmarks passed!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Some benchmarks did not meet targets')
      process.exit(1)
    }
  } catch (error) {
    console.error('\n❌ Benchmark failed:', error)
    process.exit(1)
  }
}

main()

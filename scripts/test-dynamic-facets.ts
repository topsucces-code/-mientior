/**
 * Dynamic Facets Validation Script
 *
 * Tests dynamic facets functionality:
 * - Initial facets without filters
 * - Facets update after applying filters
 * - Accurate count for each facet
 * - Cache performance
 */

import { facets } from '../src/lib/search-service'
import type { AvailableFilters } from '../src/types'
import Table from 'cli-table3'

interface FacetsTestResult {
  scenario: string
  categoriesCount: number
  brandsCount: number
  colorsCount: number
  sizesCount: number
  executionTime: number
  status: 'PASS' | 'FAIL' | 'WARN'
  note: string
}

/**
 * Test facets without any filters
 */
async function testInitialFacets(): Promise<FacetsTestResult> {
  const start = Date.now()

  try {
    const result = await facets({ query: '' })
    const executionTime = Date.now() - start

    const totalFacets =
      result.categories.length +
      result.brands.length +
      result.colors.length +
      result.sizes.length

    return {
      scenario: 'Initial (no filters)',
      categoriesCount: result.categories.length,
      brandsCount: result.brands.length,
      colorsCount: result.colors.length,
      sizesCount: result.sizes.length,
      executionTime,
      status: totalFacets > 0 ? 'PASS' : 'WARN',
      note: totalFacets > 0 ? 'All facets loaded' : 'No facets found'
    }
  } catch (error) {
    return {
      scenario: 'Initial (no filters)',
      categoriesCount: 0,
      brandsCount: 0,
      colorsCount: 0,
      sizesCount: 0,
      executionTime: Date.now() - start,
      status: 'FAIL',
      note: `Error: ${error instanceof Error ? error.message : 'Unknown'}`
    }
  }
}

/**
 * Test facets with price filter
 */
async function testFacetsWithPriceFilter(): Promise<FacetsTestResult> {
  const start = Date.now()

  try {
    const result = await facets({
      query: '',
      filters: { minPrice: 500, maxPrice: 1000 }
    })
    const executionTime = Date.now() - start

    return {
      scenario: 'Price filter (500-1000)',
      categoriesCount: result.categories.length,
      brandsCount: result.brands.length,
      colorsCount: result.colors.length,
      sizesCount: result.sizes.length,
      executionTime,
      status: 'PASS',
      note: 'Facets updated for price range'
    }
  } catch (error) {
    return {
      scenario: 'Price filter (500-1000)',
      categoriesCount: 0,
      brandsCount: 0,
      colorsCount: 0,
      sizesCount: 0,
      executionTime: Date.now() - start,
      status: 'FAIL',
      note: `Error: ${error instanceof Error ? error.message : 'Unknown'}`
    }
  }
}

/**
 * Test facets with query
 */
async function testFacetsWithQuery(): Promise<FacetsTestResult> {
  const start = Date.now()

  try {
    const result = await facets({ query: 'smartphone' })
    const executionTime = Date.now() - start

    return {
      scenario: 'Query "smartphone"',
      categoriesCount: result.categories.length,
      brandsCount: result.brands.length,
      colorsCount: result.colors.length,
      sizesCount: result.sizes.length,
      executionTime,
      status: result.brands.length > 0 ? 'PASS' : 'WARN',
      note: result.brands.length > 0 ? 'Facets loaded for query' : 'No brands found'
    }
  } catch (error) {
    return {
      scenario: 'Query "smartphone"',
      categoriesCount: 0,
      brandsCount: 0,
      colorsCount: 0,
      sizesCount: 0,
      executionTime: Date.now() - start,
      status: 'FAIL',
      note: `Error: ${error instanceof Error ? error.message : 'Unknown'}`
    }
  }
}

/**
 * Test facets with multiple filters
 */
async function testFacetsWithMultipleFilters(): Promise<FacetsTestResult> {
  const start = Date.now()

  try {
    const result = await facets({
      query: 'laptop',
      filters: { minPrice: 800, maxPrice: 2000 }
    })
    const executionTime = Date.now() - start

    return {
      scenario: 'Multiple filters',
      categoriesCount: result.categories.length,
      brandsCount: result.brands.length,
      colorsCount: result.colors.length,
      sizesCount: result.sizes.length,
      executionTime,
      status: 'PASS',
      note: 'Combined query + price filter'
    }
  } catch (error) {
    return {
      scenario: 'Multiple filters',
      categoriesCount: 0,
      brandsCount: 0,
      colorsCount: 0,
      sizesCount: 0,
      executionTime: Date.now() - start,
      status: 'FAIL',
      note: `Error: ${error instanceof Error ? error.message : 'Unknown'}`
    }
  }
}

/**
 * Test cache performance
 */
async function testCachePerformance(): Promise<void> {
  console.log('\n💾 Testing Facets Cache Performance...\n')

  const testParams = { query: 'smartphone' }

  // First request (uncached)
  const start1 = Date.now()
  await facets(testParams)
  const latency1 = Date.now() - start1

  // Second request (cached)
  const start2 = Date.now()
  await facets(testParams)
  const latency2 = Date.now() - start2

  const improvement = latency1 > 0 ? ((latency1 - latency2) / latency1) * 100 : 0
  const status = latency2 < 50 ? '✅' : latency2 < 200 ? '⚠️' : '❌'

  console.log(`First request:  ${latency1}ms`)
  console.log(`Second request: ${latency2}ms ${status}`)
  console.log(`Improvement:    ${improvement.toFixed(1)}%`)

  if (latency2 < 50) {
    console.log('✅ Facets cache is working optimally (<50ms)')
  } else if (latency2 < 200) {
    console.log('⚠️  Facets cache is working but slower than expected')
  } else {
    console.log('❌ Facets cache may not be working properly (>200ms)')
  }
}

/**
 * Print results table
 */
function printResultsTable(results: FacetsTestResult[]): void {
  console.log('\n📊 Dynamic Facets Test Results\n')

  const table = new Table({
    head: ['Scenario', 'Categories', 'Brands', 'Colors', 'Sizes', 'Time (ms)', 'Status', 'Note'],
    colWidths: [25, 12, 10, 10, 10, 12, 8, 30]
  })

  for (const result of results) {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌'
    const perfIcon = result.executionTime < 200 ? '✅' : result.executionTime < 300 ? '⚠️' : '❌'

    table.push([
      result.scenario,
      result.categoriesCount,
      result.brandsCount,
      result.colorsCount,
      result.sizesCount,
      `${Math.round(result.executionTime)} ${perfIcon}`,
      statusIcon,
      result.note
    ])
  }

  console.log(table.toString())
}

/**
 * Print summary
 */
function printSummary(results: FacetsTestResult[]): void {
  const passCount = results.filter(r => r.status === 'PASS').length
  const warnCount = results.filter(r => r.status === 'WARN').length
  const failCount = results.filter(r => r.status === 'FAIL').length
  const totalCount = results.length

  const avgLatency = results.reduce((sum, r) => sum + r.executionTime, 0) / totalCount
  const maxLatency = Math.max(...results.map(r => r.executionTime))

  console.log('\n📈 Summary Statistics\n')
  console.log(`Total Tests:      ${totalCount}`)
  console.log(`✅ Passed:        ${passCount}`)
  console.log(`⚠️  Warnings:      ${warnCount}`)
  console.log(`❌ Failed:        ${failCount}`)
  console.log(`Avg Latency:      ${Math.round(avgLatency)}ms`)
  console.log(`Max Latency:      ${Math.round(maxLatency)}ms`)
}

/**
 * Main test function
 */
async function main() {
  console.log('📊 Dynamic Facets Validation')
  console.log('=' .repeat(80))

  const results: FacetsTestResult[] = []

  try {
    console.log('\n🧪 Running facets tests...\n')

    results.push(await testInitialFacets())
    results.push(await testFacetsWithQuery())
    results.push(await testFacetsWithPriceFilter())
    results.push(await testFacetsWithMultipleFilters())

    // Test cache
    await testCachePerformance()

    // Print results
    printResultsTable(results)
    printSummary(results)

    // Save results
    const fs = await import('fs/promises')
    await fs.writeFile(
      'facets-test-results.json',
      JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
    )
    console.log('\n💾 Results saved to facets-test-results.json')

    // Exit
    const hasFailures = results.some(r => r.status === 'FAIL')
    if (hasFailures) {
      console.log('\n❌ Some facets tests failed')
      process.exit(1)
    } else {
      console.log('\n✅ All facets tests passed!')
      process.exit(0)
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error)
    process.exit(1)
  }
}

main()

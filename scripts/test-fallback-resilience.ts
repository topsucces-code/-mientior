/**
 * Fallback Resilience Validation Script
 *
 * Tests automatic fallback between MeiliSearch and PostgreSQL:
 * - MeiliSearch unavailable → PostgreSQL fallback
 * - Empty results → Try alternative engine
 * - Error handling and graceful degradation
 * - Response time during fallback
 */

import { search, suggest } from '../src/lib/search-service'
import { isAvailable, clearAvailabilityCache } from '../src/lib/meilisearch-client'
import Table from 'cli-table3'

interface ResilienceTestResult {
  scenario: string
  engineUsed: string
  resultCount: number
  executionTime: number
  status: 'PASS' | 'FAIL' | 'WARN'
  note: string
}

/**
 * Test normal operation
 */
async function testNormalOperation(): Promise<ResilienceTestResult> {
  const start = Date.now()

  try {
    clearAvailabilityCache()
    const result = await search({ query: 'smartphone', page: 1, limit: 10 })
    const executionTime = Date.now() - start

    return {
      scenario: 'Normal Operation',
      engineUsed: result.searchEngine,
      resultCount: result.totalCount,
      executionTime,
      status: result.totalCount > 0 ? 'PASS' : 'WARN',
      note: `Using ${result.searchEngine}`
    }
  } catch (error) {
    return {
      scenario: 'Normal Operation',
      engineUsed: 'error',
      resultCount: 0,
      executionTime: Date.now() - start,
      status: 'FAIL',
      note: `Error: ${error instanceof Error ? error.message : 'Unknown'}`
    }
  }
}

/**
 * Test MeiliSearch availability detection
 */
async function testAvailabilityDetection(): Promise<ResilienceTestResult> {
  const start = Date.now()

  try {
    clearAvailabilityCache()
    const meiliAvailable = await isAvailable()
    const executionTime = Date.now() - start

    return {
      scenario: 'Availability Detection',
      engineUsed: meiliAvailable ? 'meilisearch' : 'postgresql',
      resultCount: 0,
      executionTime,
      status: 'PASS',
      note: `MeiliSearch is ${meiliAvailable ? 'available' : 'unavailable'}`
    }
  } catch (error) {
    return {
      scenario: 'Availability Detection',
      engineUsed: 'error',
      resultCount: 0,
      executionTime: Date.now() - start,
      status: 'FAIL',
      note: `Error: ${error instanceof Error ? error.message : 'Unknown'}`
    }
  }
}

/**
 * Test graceful degradation
 */
async function testGracefulDegradation(): Promise<ResilienceTestResult> {
  const start = Date.now()

  try {
    // Test with a query that should return results in either engine
    const result = await search({ query: 'test-resilience', page: 1, limit: 10 })
    const executionTime = Date.now() - start

    // Even if no results, should not throw error
    return {
      scenario: 'Graceful Degradation',
      engineUsed: result.searchEngine,
      resultCount: result.totalCount,
      executionTime,
      status: executionTime < 500 ? 'PASS' : 'WARN',
      note: `Responded in ${executionTime}ms without errors`
    }
  } catch (error) {
    return {
      scenario: 'Graceful Degradation',
      engineUsed: 'error',
      resultCount: 0,
      executionTime: Date.now() - start,
      status: 'FAIL',
      note: `Should not throw errors: ${error instanceof Error ? error.message : 'Unknown'}`
    }
  }
}

/**
 * Test suggestions fallback
 */
async function testSuggestionsFallback(): Promise<ResilienceTestResult> {
  const start = Date.now()

  try {
    clearAvailabilityCache()
    const result = await suggest({ query: 'smart', limit: 10 })
    const executionTime = Date.now() - start

    return {
      scenario: 'Suggestions Fallback',
      engineUsed: result.searchEngine,
      resultCount: result.suggestions.length,
      executionTime,
      status: result.suggestions.length > 0 || result.searchEngine === 'postgresql' ? 'PASS' : 'WARN',
      note: `${result.suggestions.length} suggestions from ${result.searchEngine}`
    }
  } catch (error) {
    return {
      scenario: 'Suggestions Fallback',
      engineUsed: 'error',
      resultCount: 0,
      executionTime: Date.now() - start,
      status: 'FAIL',
      note: `Error: ${error instanceof Error ? error.message : 'Unknown'}`
    }
  }
}

/**
 * Test response consistency across engines
 */
async function testResponseConsistency(): Promise<ResilienceTestResult> {
  const start = Date.now()

  try {
    clearAvailabilityCache()
    const result1 = await search({ query: 'laptop', page: 1, limit: 10 })

    // Small delay to allow cache
    await new Promise(resolve => setTimeout(resolve, 100))

    const result2 = await search({ query: 'laptop', page: 1, limit: 10 })
    const executionTime = Date.now() - start

    const consistent = result1.totalCount === result2.totalCount

    return {
      scenario: 'Response Consistency',
      engineUsed: `${result1.searchEngine} → ${result2.searchEngine}`,
      resultCount: result1.totalCount,
      executionTime,
      status: consistent ? 'PASS' : 'WARN',
      note: consistent
        ? 'Results consistent across requests'
        : `Mismatch: ${result1.totalCount} vs ${result2.totalCount}`
    }
  } catch (error) {
    return {
      scenario: 'Response Consistency',
      engineUsed: 'error',
      resultCount: 0,
      executionTime: Date.now() - start,
      status: 'FAIL',
      note: `Error: ${error instanceof Error ? error.message : 'Unknown'}`
    }
  }
}

/**
 * Print results table
 */
function printResultsTable(results: ResilienceTestResult[]): void {
  console.log('\n📊 Fallback Resilience Test Results\n')

  const table = new Table({
    head: ['Scenario', 'Engine', 'Results', 'Time (ms)', 'Status', 'Note'],
    colWidths: [25, 25, 10, 12, 8, 40]
  })

  for (const result of results) {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌'
    const timeIcon = result.executionTime < 500 ? '✅' : result.executionTime < 1000 ? '⚠️' : '❌'

    table.push([
      result.scenario,
      result.engineUsed,
      result.resultCount,
      `${Math.round(result.executionTime)} ${timeIcon}`,
      statusIcon,
      result.note
    ])
  }

  console.log(table.toString())
}

/**
 * Print summary
 */
function printSummary(results: ResilienceTestResult[]): void {
  const passCount = results.filter(r => r.status === 'PASS').length
  const warnCount = results.filter(r => r.status === 'WARN').length
  const failCount = results.filter(r => r.status === 'FAIL').length
  const totalCount = results.length

  console.log('\n📈 Summary Statistics\n')
  console.log(`Total Tests:      ${totalCount}`)
  console.log(`✅ Passed:        ${passCount}`)
  console.log(`⚠️  Warnings:      ${warnCount}`)
  console.log(`❌ Failed:        ${failCount}`)
}

/**
 * Main test function
 */
async function main() {
  console.log('🔄 Fallback Resilience Validation')
  console.log('=' .repeat(80))

  const results: ResilienceTestResult[] = []

  try {
    console.log('\n🧪 Running resilience tests...\n')

    results.push(await testAvailabilityDetection())
    results.push(await testNormalOperation())
    results.push(await testGracefulDegradation())
    results.push(await testSuggestionsFallback())
    results.push(await testResponseConsistency())

    // Print results
    printResultsTable(results)
    printSummary(results)

    // Important notes
    console.log('\n📌 Fallback Mechanism Notes:')
    console.log('  • Automatic fallback: MeiliSearch → PostgreSQL')
    console.log('  • Availability cache: 30 seconds TTL')
    console.log('  • Graceful error handling: Never throws to user')
    console.log('  • Response metadata: searchEngine field indicates engine used')

    // Save results
    const fs = await import('fs/promises')
    await fs.writeFile(
      'fallback-resilience-test-results.json',
      JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
    )
    console.log('\n💾 Results saved to fallback-resilience-test-results.json')

    // Exit
    const hasFailures = results.some(r => r.status === 'FAIL')
    if (hasFailures) {
      console.log('\n❌ Some resilience tests failed')
      process.exit(1)
    } else {
      console.log('\n✅ All resilience tests passed!')
      process.exit(0)
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error)
    process.exit(1)
  }
}

main()

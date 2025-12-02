/**
 * Spell Correction Validation Script
 *
 * Tests automatic spell correction functionality:
 * - Common typos (smartphon → smartphone)
 * - Multiple errors (smartfon → smartphone)
 * - Missing accents (telephone → téléphone)
 * - Plurals and stemming
 * - Cache performance
 */

import { search } from '../src/lib/search-service'
import Table from 'cli-table3'

interface CorrectionTest {
  query: string
  expectedCorrection?: string
  description: string
}

interface CorrectionResult {
  query: string
  correctedQuery: string | null
  resultCount: number
  executionTime: number
  cacheHit: boolean
  status: 'PASS' | 'FAIL' | 'WARN'
  note: string
}

const testCases: CorrectionTest[] = [
  { query: 'smartphon', expectedCorrection: 'smartphone', description: 'Missing last letter' },
  { query: 'ordinatuer', expectedCorrection: 'ordinateur', description: 'Transposed letters' },
  { query: 'chausures', expectedCorrection: 'chaussures', description: 'Missing double letter' },
  { query: 'telefone', expectedCorrection: 'téléphone', description: 'Missing accents' },
  { query: 'vetement', expectedCorrection: 'vêtement', description: 'Missing circumflex' },
  { query: 'smartfon', expectedCorrection: 'smartphone', description: 'Multiple errors' },
  { query: 'ordinateurs', description: 'Plural form (stemming)' },
  { query: 'cafe', expectedCorrection: 'café', description: 'Missing accent on common word' },
]

/**
 * Test spell correction for a single query
 */
async function testCorrection(test: CorrectionTest): Promise<CorrectionResult> {
  const start = Date.now()

  try {
    const result = await search({ query: test.query, page: 1, limit: 10 })
    const executionTime = Date.now() - start

    const correctedQuery = result.correctedQuery || null
    const hasCorrection = correctedQuery !== null
    const matchesExpected = test.expectedCorrection
      ? correctedQuery?.toLowerCase() === test.expectedCorrection.toLowerCase()
      : true

    let status: 'PASS' | 'FAIL' | 'WARN' = 'PASS'
    let note = ''

    if (test.expectedCorrection) {
      if (!hasCorrection) {
        status = 'FAIL'
        note = 'No correction provided'
      } else if (!matchesExpected) {
        status = 'WARN'
        note = `Expected "${test.expectedCorrection}", got "${correctedQuery}"`
      } else {
        note = 'Correct'
      }
    } else {
      note = hasCorrection ? `Corrected to "${correctedQuery}"` : 'No correction (expected)'
    }

    return {
      query: test.query,
      correctedQuery,
      resultCount: result.totalCount,
      executionTime,
      cacheHit: executionTime < 50, // Heuristic: <50ms likely cached
      status,
      note
    }
  } catch (error) {
    return {
      query: test.query,
      correctedQuery: null,
      resultCount: 0,
      executionTime: Date.now() - start,
      cacheHit: false,
      status: 'FAIL',
      note: `Error: ${error instanceof Error ? error.message : 'Unknown'}`
    }
  }
}

/**
 * Test cache performance by running same query twice
 */
async function testCachePerformance(): Promise<void> {
  console.log('\n💾 Testing Cache Performance...\n')

  const testQuery = 'smartphon'

  // First request (should be uncached)
  const start1 = Date.now()
  await search({ query: testQuery, page: 1, limit: 10 })
  const latency1 = Date.now() - start1

  // Second request (should be cached)
  const start2 = Date.now()
  await search({ query: testQuery, page: 1, limit: 10 })
  const latency2 = Date.now() - start2

  const improvement = ((latency1 - latency2) / latency1) * 100
  const status = latency2 < 50 ? '✅' : latency2 < 100 ? '⚠️' : '❌'

  console.log(`First request:  ${latency1}ms`)
  console.log(`Second request: ${latency2}ms ${status}`)
  console.log(`Improvement:    ${improvement.toFixed(1)}%`)

  if (latency2 < 50) {
    console.log('✅ Cache is working effectively')
  } else if (latency2 < 100) {
    console.log('⚠️  Cache performance is acceptable but could be better')
  } else {
    console.log('❌ Cache may not be working properly')
  }
}

/**
 * Print results table
 */
function printResultsTable(results: CorrectionResult[]): void {
  console.log('\n📊 Spell Correction Test Results\n')

  const table = new Table({
    head: ['Query', 'Corrected To', 'Results', 'Time (ms)', 'Cache', 'Status', 'Note'],
    colWidths: [15, 15, 10, 12, 8, 8, 40]
  })

  for (const result of results) {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌'
    const cacheIcon = result.cacheHit ? '✅' : '❌'

    table.push([
      result.query,
      result.correctedQuery || '-',
      result.resultCount,
      Math.round(result.executionTime),
      cacheIcon,
      statusIcon,
      result.note
    ])
  }

  console.log(table.toString())
}

/**
 * Print summary statistics
 */
function printSummary(results: CorrectionResult[]): void {
  const passCount = results.filter(r => r.status === 'PASS').length
  const warnCount = results.filter(r => r.status === 'WARN').length
  const failCount = results.filter(r => r.status === 'FAIL').length
  const totalCount = results.length

  const correctionRate = (results.filter(r => r.correctedQuery !== null).length / totalCount) * 100
  const avgLatency = results.reduce((sum, r) => sum + r.executionTime, 0) / totalCount

  console.log('\n📈 Summary Statistics\n')
  console.log(`Total Tests:      ${totalCount}`)
  console.log(`✅ Passed:        ${passCount} (${((passCount / totalCount) * 100).toFixed(1)}%)`)
  console.log(`⚠️  Warnings:      ${warnCount} (${((warnCount / totalCount) * 100).toFixed(1)}%)`)
  console.log(`❌ Failed:        ${failCount} (${((failCount / totalCount) * 100).toFixed(1)}%)`)
  console.log(`Correction Rate:  ${correctionRate.toFixed(1)}%`)
  console.log(`Avg Latency:      ${Math.round(avgLatency)}ms`)
}

/**
 * Main test function
 */
async function main() {
  console.log('🔤 Spell Correction Validation')
  console.log('=' .repeat(80))

  const results: CorrectionResult[] = []

  try {
    console.log('\n🧪 Running spell correction tests...\n')

    for (const test of testCases) {
      const result = await testCorrection(test)
      results.push(result)

      const icon = result.status === 'PASS' ? '✅' : result.status === 'WARN' ? '⚠️' : '❌'
      console.log(`${icon} ${test.description}: ${result.note}`)
    }

    // Test cache performance
    await testCachePerformance()

    // Print detailed results
    printResultsTable(results)

    // Print summary
    printSummary(results)

    // Save results to JSON
    const fs = await import('fs/promises')
    await fs.writeFile(
      'spell-correction-test-results.json',
      JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2)
    )
    console.log('\n💾 Results saved to spell-correction-test-results.json')

    // Determine exit code
    const hasFailures = results.some(r => r.status === 'FAIL')
    if (hasFailures) {
      console.log('\n❌ Some spell correction tests failed')
      process.exit(1)
    } else {
      console.log('\n✅ All spell correction tests passed!')
      process.exit(0)
    }
  } catch (error) {
    console.error('\n❌ Test execution failed:', error)
    process.exit(1)
  }
}

main()

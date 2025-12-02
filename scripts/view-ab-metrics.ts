#!/usr/bin/env tsx
/**
 * View A/B Test Metrics
 *
 * Displays A/B test comparison metrics between PostgreSQL and MeiliSearch search engines.
 * Shows performance statistics, latency percentiles, and result quality metrics.
 *
 * Usage:
 *   npm run search:ab-metrics
 *   npm run search:ab-metrics -- --start=2025-01-01 --end=2025-01-31
 *   npm run search:ab-metrics -- --days=7
 */

import { getABTestMetrics, isABTestEnabled } from '../src/lib/search-ab-testing'

interface CliArgs {
  startDate: Date
  endDate: Date
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2)

  // Check for --days argument
  const daysArg = args.find(arg => arg.startsWith('--days='))
  if (daysArg) {
    const days = parseInt(daysArg.split('=')[1])
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    return { startDate, endDate }
  }

  // Check for --start and --end arguments
  const startArg = args.find(arg => arg.startsWith('--start='))
  const endArg = args.find(arg => arg.startsWith('--end='))

  const startDate = startArg ? new Date(startArg.split('=')[1]) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Default: 7 days ago
  const endDate = endArg ? new Date(endArg.split('=')[1]) : new Date() // Default: today

  return { startDate, endDate }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function printMetricsTable(label: string, pgValue: string | number, msValue: string | number, unit: string = '') {
  const pgStr = String(pgValue).padEnd(12)
  const msStr = String(msValue).padEnd(12)
  console.log(`   ${label.padEnd(20)} ${pgStr} ${msStr}`)
}

function printSeparator() {
  console.log('   ' + '-'.repeat(60))
}

async function viewABMetrics() {
  console.log('📊 A/B Test Metrics Dashboard\n')
  console.log('=' .repeat(80))

  // Check if A/B testing is enabled
  if (!isABTestEnabled()) {
    console.log('\n⚠️  A/B testing is not enabled')
    console.log('   Set ENABLE_SEARCH_AB_TEST=true in .env to enable A/B testing')
    process.exit(1)
  }

  console.log('✅ A/B testing is enabled\n')

  // Parse CLI arguments
  const { startDate, endDate } = parseArgs()

  console.log(`📅 Date Range:`)
  console.log(`   Start: ${formatDate(startDate)}`)
  console.log(`   End:   ${formatDate(endDate)}`)
  console.log(`   Days:  ${Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))}`)

  console.log('\n🔄 Fetching metrics...\n')

  // Fetch metrics
  const metrics = await getABTestMetrics(startDate, endDate)

  // Display results
  console.log('=' .repeat(80))
  console.log('\n📈 Performance Metrics:\n')

  console.log('   ' + 'Metric'.padEnd(20) + ' PostgreSQL'.padEnd(14) + ' MeiliSearch')
  printSeparator()

  printMetricsTable('Total Searches', metrics.postgresql.totalSearches, metrics.meilisearch.totalSearches)
  printSeparator()

  printMetricsTable('Avg Latency', `${metrics.postgresql.avgExecutionTime}ms`, `${metrics.meilisearch.avgExecutionTime}ms`)
  printMetricsTable('P50 Latency', `${metrics.postgresql.p50Latency}ms`, `${metrics.meilisearch.p50Latency}ms`)
  printMetricsTable('P95 Latency', `${metrics.postgresql.p95Latency}ms`, `${metrics.meilisearch.p95Latency}ms`)
  printMetricsTable('P99 Latency', `${metrics.postgresql.p99Latency}ms`, `${metrics.meilisearch.p99Latency}ms`)
  printSeparator()

  printMetricsTable('Avg Results', metrics.postgresql.avgResultCount.toFixed(1), metrics.meilisearch.avgResultCount.toFixed(1))
  printMetricsTable('Zero Result Rate', `${metrics.postgresql.zeroResultRate.toFixed(1)}%`, `${metrics.meilisearch.zeroResultRate.toFixed(1)}%`)

  console.log('\n' + '='.repeat(80))
  console.log('\n🏆 Comparison:\n')

  const speedImprovementAbs = Math.abs(metrics.comparison.speedImprovement)
  const speedDirection = metrics.comparison.speedImprovement > 0 ? 'faster' : 'slower'

  console.log(`   Speed Improvement: ${speedImprovementAbs.toFixed(1)}% ${speedDirection}`)
  console.log(`   Winner: ${metrics.comparison.winner.toUpperCase()}`)

  // Recommendations
  console.log('\n' + '='.repeat(80))
  console.log('\n💡 Recommendations:\n')

  if (metrics.postgresql.totalSearches === 0 && metrics.meilisearch.totalSearches === 0) {
    console.log('   ⚠️  No search data found for the specified period')
    console.log('   - Ensure searches are being performed with the A/B test enabled')
    console.log('   - Check that session cookies are being set correctly')
  } else if (metrics.postgresql.totalSearches === 0) {
    console.log('   ⚠️  No PostgreSQL search data found')
    console.log('   - All users may be assigned to MeiliSearch variant')
  } else if (metrics.meilisearch.totalSearches === 0) {
    console.log('   ⚠️  No MeiliSearch search data found')
    console.log('   - All users may be assigned to PostgreSQL variant')
    console.log('   - Check that MeiliSearch is running and accessible')
  } else {
    // Provide actionable recommendations
    if (metrics.comparison.winner === 'meilisearch') {
      console.log('   ✅ MeiliSearch is performing better')
      console.log('   - Consider rolling out MeiliSearch to 100% of users')
      console.log('   - Monitor for edge cases and quality differences')
    } else if (metrics.comparison.winner === 'postgresql') {
      console.log('   ⚠️  PostgreSQL is performing better')
      console.log('   - Review MeiliSearch configuration and indexing')
      console.log('   - Check if data is properly synced between systems')
    } else {
      console.log('   ℹ️  Performance is roughly equal (< 5% difference)')
      console.log('   - Consider other factors: result quality, maintenance, cost')
      console.log('   - Run test for longer period to gather more data')
    }

    // Check for quality issues
    if (metrics.meilisearch.zeroResultRate > metrics.postgresql.zeroResultRate * 1.2) {
      console.log('\n   ⚠️  MeiliSearch has higher zero-result rate')
      console.log('   - Verify index completeness and mapping accuracy')
    }

    if (metrics.meilisearch.avgResultCount < metrics.postgresql.avgResultCount * 0.8) {
      console.log('\n   ⚠️  MeiliSearch returns fewer results on average')
      console.log('   - Check relevance scoring and filtering logic')
    }

    // Sample size warnings
    const minSampleSize = 100
    if (metrics.postgresql.totalSearches < minSampleSize || metrics.meilisearch.totalSearches < minSampleSize) {
      console.log('\n   ⚠️  Small sample size (< 100 searches per variant)')
      console.log('   - Results may not be statistically significant')
      console.log('   - Run test for longer period or with more traffic')
    }
  }

  console.log('\n✨ Metrics displayed successfully!\n')
  process.exit(0)
}

// Run the script
viewABMetrics().catch((error) => {
  console.error('\n💥 Fatal error:', error)
  process.exit(1)
})

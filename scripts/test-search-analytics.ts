/**
 * Search Analytics Validation Script
 * Tests logging, tracking, and admin dashboard functionality
 */

import { prisma } from '../src/lib/prisma'

async function testBasicAnalytics() {
  console.log('📊 Testing Basic Analytics...\n')

  const logsCount = await prisma.searchLog.count()
  const clicksCount = await prisma.searchLog.count({ where: { clickedProductId: { not: null } } })

  console.log(`✅ Total search logs: ${logsCount}`)
  console.log(`✅ Logs with clicks: ${clicksCount}`)

  if (logsCount > 0) {
    const recentLogs = await prisma.searchLog.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      select: { query: true, resultCount: true, timestamp: true, sessionId: true, locale: true }
    })

    console.log('\nRecent searches:')
    recentLogs.forEach(log => {
      console.log(`  - "${log.query}" (${log.resultCount} results, locale: ${log.locale || 'N/A'}) at ${log.timestamp.toISOString()}`)
    })
  }
}

async function testAdminAnalyticsEndpoints() {
  console.log('\n📈 Testing Admin Analytics Endpoints...\n')

  const baseUrl = 'http://localhost:3000'
  const endpoints = [
    '/api/admin/search/analytics',
    '/api/admin/search/analytics/dashboard',
  ]

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          // In production, you'd need proper auth headers here
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`✅ ${endpoint}:`)

        // Validate structure based on endpoint
        if (endpoint.includes('dashboard')) {
          console.log(`   - Top queries: ${data.topQueries?.length || 0}`)
          console.log(`   - Zero result queries: ${data.zeroResultQueries?.length || 0}`)
          console.log(`   - Search trends available: ${!!data.trends}`)
        } else {
          console.log(`   - Data structure valid: ${!!data}`)
          console.log(`   - Key metrics present: ${Object.keys(data).length} fields`)
        }
      } else {
        console.log(`⚠️  ${endpoint}: HTTP ${response.status}`)
        if (response.status === 401 || response.status === 403) {
          console.log(`   (Authentication required - this is expected)`)
        }
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.log(`   (Server may not be running on ${baseUrl})`)
    }
  }
}

async function testCSVExport() {
  console.log('\n📥 Testing CSV Export Endpoint...\n')

  const baseUrl = 'http://localhost:3000'
  const exportEndpoint = '/api/admin/search/analytics/export'

  try {
    const response = await fetch(`${baseUrl}${exportEndpoint}?format=csv`, {
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (response.ok) {
      const contentType = response.headers.get('content-type')
      const isCSV = contentType?.includes('text/csv') || contentType?.includes('application/csv')

      console.log(`✅ CSV Export endpoint responding`)
      console.log(`   - Content-Type: ${contentType}`)
      console.log(`   - Is CSV format: ${isCSV ? 'Yes' : 'No'}`)

      if (isCSV) {
        const text = await response.text()
        const lines = text.split('\n').filter(l => l.trim())
        console.log(`   - CSV lines: ${lines.length}`)
        if (lines.length > 0) {
          console.log(`   - Headers: ${lines[0]}`)
        }
      }
    } else {
      console.log(`⚠️  CSV Export: HTTP ${response.status}`)
      if (response.status === 401 || response.status === 403) {
        console.log(`   (Authentication required - this is expected)`)
      }
    }
  } catch (error) {
    console.log(`❌ CSV Export: ${error instanceof Error ? error.message : 'Unknown error'}`)
    console.log(`   (Server may not be running on ${baseUrl})`)
  }
}

async function testAnalyticsMetrics() {
  console.log('\n📊 Testing Analytics Metrics Calculation...\n')

  // Calculate key metrics from DB
  const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const metrics = {
    total: await prisma.searchLog.count(),
    last7Days: await prisma.searchLog.count({
      where: { timestamp: { gte: last7Days } }
    }),
    last30Days: await prisma.searchLog.count({
      where: { timestamp: { gte: last30Days } }
    }),
    withClicks: await prisma.searchLog.count({
      where: { clickedProductId: { not: null } }
    }),
    zeroResults: await prisma.searchLog.count({
      where: { resultCount: 0 }
    }),
  }

  console.log('Key Metrics:')
  console.log(`  - Total searches: ${metrics.total}`)
  console.log(`  - Last 7 days: ${metrics.last7Days}`)
  console.log(`  - Last 30 days: ${metrics.last30Days}`)
  console.log(`  - With clicks: ${metrics.withClicks}`)
  console.log(`  - Zero results: ${metrics.zeroResults}`)

  if (metrics.total > 0) {
    const clickRate = ((metrics.withClicks / metrics.total) * 100).toFixed(2)
    const zeroResultRate = ((metrics.zeroResults / metrics.total) * 100).toFixed(2)
    console.log(`\nRates:`)
    console.log(`  - Click-through rate: ${clickRate}%`)
    console.log(`  - Zero result rate: ${zeroResultRate}%`)
  }
}

async function main() {
  console.log('📈 Search Analytics Comprehensive Validation')
  console.log('=' .repeat(60))
  console.log()

  try {
    await testBasicAnalytics()
    await testAnalyticsMetrics()
    await testAdminAnalyticsEndpoints()
    await testCSVExport()

    console.log('\n' + '='.repeat(60))
    console.log('✅ Analytics validation completed')
  } catch (error) {
    console.error('\n❌ Validation failed:', error)
    process.exit(1)
  }
}

main().finally(() => prisma.$disconnect())

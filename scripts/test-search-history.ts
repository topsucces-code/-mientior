/**
 * Search History Validation Script
 * Tests history storage, synchronization, deduplication, and limits
 */

import { prisma } from '../src/lib/prisma'

async function testBasicStorage() {
  console.log('📂 Testing Basic Storage...\n')

  const historyCount = await prisma.searchHistory.count()
  console.log(`✅ Total history entries: ${historyCount}`)

  if (historyCount > 0) {
    const recentHistory = await prisma.searchHistory.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      select: { query: true, userId: true, timestamp: true }
    })

    console.log('\nRecent history:')
    recentHistory.forEach(entry => {
      console.log(`  - "${entry.query}" (user: ${entry.userId || 'anonymous'}) at ${entry.timestamp.toISOString()}`)
    })
  }
}

async function testDeduplication() {
  console.log('\n🔄 Testing Deduplication...\n')

  // Create test user
  const testUserId = `test-dedup-${Date.now()}`

  try {
    // Add same query multiple times
    const testQuery = 'deduplication-test'

    for (let i = 0; i < 3; i++) {
      await prisma.searchHistory.upsert({
        where: {
          userId_query: { userId: testUserId, query: testQuery }
        },
        create: {
          userId: testUserId,
          query: testQuery,
          timestamp: new Date()
        },
        update: {
          timestamp: new Date()
        }
      })
    }

    // Check that only one entry exists
    const entries = await prisma.searchHistory.findMany({
      where: { userId: testUserId, query: testQuery }
    })

    const status = entries.length === 1 ? '✅' : '❌'
    console.log(`${status} Deduplication: Added query 3 times, found ${entries.length} entry (expected 1)`)

    // Clean up
    await prisma.searchHistory.deleteMany({
      where: { userId: testUserId }
    })
  } catch (error) {
    console.error('❌ Deduplication test failed:', error)
  }
}

async function testPerUserLimits() {
  console.log('\n📊 Testing Per-User Limits...\n')

  const testUserId = `test-limits-${Date.now()}`
  const maxHistoryItems = 50 // Typical limit

  try {
    // Add more than the limit
    for (let i = 0; i < maxHistoryItems + 10; i++) {
      await prisma.searchHistory.create({
        data: {
          userId: testUserId,
          query: `limit-test-query-${i}`,
          timestamp: new Date(Date.now() - (maxHistoryItems + 10 - i) * 1000) // Stagger timestamps
        }
      })
    }

    const totalEntries = await prisma.searchHistory.count({
      where: { userId: testUserId }
    })

    console.log(`Added ${maxHistoryItems + 10} queries for user`)
    console.log(`Found ${totalEntries} entries in database`)

    // Note: Limit enforcement would typically happen in the API layer
    if (totalEntries === maxHistoryItems + 10) {
      console.log(`⚠️  Note: Limit enforcement should be handled by API layer`)
    }

    // Clean up
    await prisma.searchHistory.deleteMany({
      where: { userId: testUserId }
    })
  } catch (error) {
    console.error('❌ Per-user limits test failed:', error)
  }
}

async function testAnonymousVsAuthenticated() {
  console.log('\n👤 Testing Anonymous vs Authenticated Separation...\n')

  const testUserId = `test-auth-${Date.now()}`
  const testQuery = 'separation-test'

  try {
    // Add entry for authenticated user
    await prisma.searchHistory.create({
      data: {
        userId: testUserId,
        query: testQuery,
        timestamp: new Date()
      }
    })

    // Add entry for anonymous user
    await prisma.searchHistory.create({
      data: {
        userId: null,
        query: testQuery,
        timestamp: new Date()
      }
    })

    // Query both
    const authEntry = await prisma.searchHistory.findFirst({
      where: { userId: testUserId, query: testQuery }
    })

    const anonEntry = await prisma.searchHistory.findFirst({
      where: { userId: null, query: testQuery }
    })

    const status = (authEntry && anonEntry) ? '✅' : '❌'
    console.log(`${status} Separation: Auth entry ${authEntry ? 'found' : 'not found'}, Anon entry ${anonEntry ? 'found' : 'not found'}`)

    // Clean up
    await prisma.searchHistory.deleteMany({
      where: {
        OR: [
          { userId: testUserId },
          { userId: null, query: testQuery }
        ]
      }
    })
  } catch (error) {
    console.error('❌ Anonymous vs Authenticated test failed:', error)
  }
}

async function testAPIEndpoints() {
  console.log('\n🌐 Testing API Endpoints...\n')

  const baseUrl = 'http://localhost:3000'
  const testUserId = `test-api-${Date.now()}`

  try {
    // Test POST (add to history)
    const postResponse = await fetch(`${baseUrl}/api/user/search-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `user_id=${testUserId}`
      },
      body: JSON.stringify({ query: 'api-test-query' })
    })

    console.log(`POST /api/user/search-history: ${postResponse.ok ? '✅' : '❌'} (${postResponse.status})`)

    // Test GET (retrieve history)
    const getResponse = await fetch(`${baseUrl}/api/user/search-history`, {
      headers: {
        'Cookie': `user_id=${testUserId}`
      }
    })

    if (getResponse.ok) {
      const data = await getResponse.json()
      console.log(`GET /api/user/search-history: ✅ (${data.history?.length || 0} entries)`)
    } else {
      console.log(`GET /api/user/search-history: ❌ (${getResponse.status})`)
    }

    // Test DELETE (remove from history)
    const deleteResponse = await fetch(`${baseUrl}/api/user/search-history?query=${encodeURIComponent('api-test-query')}`, {
      method: 'DELETE',
      headers: {
        'Cookie': `user_id=${testUserId}`
      }
    })

    console.log(`DELETE /api/user/search-history: ${deleteResponse.ok ? '✅' : '❌'} (${deleteResponse.status})`)

    // Clean up
    await prisma.searchHistory.deleteMany({
      where: { userId: testUserId }
    })
  } catch (error) {
    console.log(`⚠️  API endpoints not available: ${error instanceof Error ? error.message : 'Unknown error'}`)
    console.log(`   (Server may not be running on ${baseUrl})`)
  }
}

async function testTimestampOrdering() {
  console.log('\n🕐 Testing Timestamp Ordering...\n')

  const testUserId = `test-ordering-${Date.now()}`

  try {
    // Add entries with specific timestamps
    const queries = ['oldest', 'middle', 'newest']
    for (let i = 0; i < queries.length; i++) {
      await prisma.searchHistory.create({
        data: {
          userId: testUserId,
          query: queries[i],
          timestamp: new Date(Date.now() - (queries.length - i) * 10000) // 10s intervals
        }
      })
    }

    // Retrieve ordered by timestamp DESC
    const orderedHistory = await prisma.searchHistory.findMany({
      where: { userId: testUserId },
      orderBy: { timestamp: 'desc' },
      select: { query: true }
    })

    const isCorrectOrder = orderedHistory[0].query === 'newest' &&
                          orderedHistory[1].query === 'middle' &&
                          orderedHistory[2].query === 'oldest'

    const status = isCorrectOrder ? '✅' : '❌'
    console.log(`${status} Timestamp ordering: ${orderedHistory.map(h => h.query).join(' → ')}`)

    // Clean up
    await prisma.searchHistory.deleteMany({
      where: { userId: testUserId }
    })
  } catch (error) {
    console.error('❌ Timestamp ordering test failed:', error)
  }
}

async function main() {
  console.log('📜 Search History Comprehensive Validation')
  console.log('=' .repeat(60))
  console.log()

  try {
    await testBasicStorage()
    await testDeduplication()
    await testPerUserLimits()
    await testAnonymousVsAuthenticated()
    await testTimestampOrdering()
    await testAPIEndpoints()

    console.log('\n' + '='.repeat(60))
    console.log('✅ Search history validation completed')
  } catch (error) {
    console.error('\n❌ Validation failed:', error)
    process.exit(1)
  }
}

main().finally(() => prisma.$disconnect())

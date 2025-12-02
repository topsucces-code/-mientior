#!/usr/bin/env tsx

/**
 * Search History Statistics Script
 *
 * Displays analytics about search history data:
 * - Total entries
 * - Unique users with history
 * - Average entries per user
 * - Top 10 most common queries
 * - Users with most entries
 * - Date range (oldest to newest)
 *
 * Usage:
 *   npm run db:search-history:stats
 *   npm run db:search-history:stats -- --json
 */

import { prisma } from '../src/lib/prisma'

interface Stats {
  totalEntries: number
  uniqueUsers: number
  averageEntriesPerUser: number
  topQueries: Array<{ query: string; count: number }>
  topUsers: Array<{ userId: string; email: string; count: number }>
  dateRange: {
    oldest: Date | null
    newest: Date | null
  }
}

async function getStats(): Promise<Stats> {
  // Total entries
  const totalEntries = await prisma.searchHistory.count()

  // Unique users
  const uniqueUsersResult = await prisma.searchHistory.groupBy({
    by: ['userId'],
  })
  const uniqueUsers = uniqueUsersResult.length

  // Average entries per user
  const averageEntriesPerUser = uniqueUsers > 0
    ? Math.round((totalEntries / uniqueUsers) * 100) / 100
    : 0

  // Top 10 most common queries (across all users)
  const topQueriesRaw = await prisma.searchHistory.groupBy({
    by: ['query'],
    _count: {
      query: true,
    },
    orderBy: {
      _count: {
        query: 'desc',
      },
    },
    take: 10,
  })

  const topQueries = topQueriesRaw.map(item => ({
    query: item.query,
    count: item._count.query,
  }))

  // Top 5 users with most entries
  const topUsersRaw = await prisma.searchHistory.groupBy({
    by: ['userId'],
    _count: {
      userId: true,
    },
    orderBy: {
      _count: {
        userId: 'desc',
      },
    },
    take: 5,
  })

  const topUsers = await Promise.all(
    topUsersRaw.map(async (item) => {
      const user = await prisma.user.findUnique({
        where: { id: item.userId },
        select: { email: true },
      })
      return {
        userId: item.userId,
        email: user?.email || 'Unknown',
        count: item._count.userId,
      }
    })
  )

  // Date range
  const oldestEntry = await prisma.searchHistory.findFirst({
    orderBy: { timestamp: 'asc' },
    select: { timestamp: true },
  })

  const newestEntry = await prisma.searchHistory.findFirst({
    orderBy: { timestamp: 'desc' },
    select: { timestamp: true },
  })

  const dateRange = {
    oldest: oldestEntry?.timestamp || null,
    newest: newestEntry?.timestamp || null,
  }

  return {
    totalEntries,
    uniqueUsers,
    averageEntriesPerUser,
    topQueries,
    topUsers,
    dateRange,
  }
}

function formatTable(stats: Stats) {
  console.log('\n========================================')
  console.log('      SEARCH HISTORY STATISTICS')
  console.log('========================================\n')

  console.log('📊 Overview:')
  console.log(`   Total entries:         ${stats.totalEntries.toLocaleString()}`)
  console.log(`   Unique users:          ${stats.uniqueUsers.toLocaleString()}`)
  console.log(`   Avg entries per user:  ${stats.averageEntriesPerUser}`)

  if (stats.dateRange.oldest && stats.dateRange.newest) {
    console.log('\n📅 Date Range:')
    console.log(`   Oldest entry:  ${stats.dateRange.oldest.toISOString()}`)
    console.log(`   Newest entry:  ${stats.dateRange.newest.toISOString()}`)
  }

  if (stats.topQueries.length > 0) {
    console.log('\n🔥 Top 10 Most Common Queries:')
    console.log('   Rank  Count   Query')
    console.log('   ────  ─────   ─────')
    stats.topQueries.forEach((item, index) => {
      const rank = (index + 1).toString().padStart(4)
      const count = item.count.toString().padStart(5)
      console.log(`   ${rank}  ${count}   ${item.query}`)
    })
  }

  if (stats.topUsers.length > 0) {
    console.log('\n👥 Top 5 Users with Most Entries:')
    console.log('   Rank  Count   Email')
    console.log('   ────  ─────   ─────')
    stats.topUsers.forEach((item, index) => {
      const rank = (index + 1).toString().padStart(4)
      const count = item.count.toString().padStart(5)
      console.log(`   ${rank}  ${count}   ${item.email}`)
    })
  }

  console.log('\n========================================\n')
}

async function main() {
  const args = process.argv.slice(2)
  const jsonOutput = args.includes('--json')

  const stats = await getStats()

  if (jsonOutput) {
    // JSON output for machine processing
    console.log(JSON.stringify(stats, null, 2))
  } else {
    // Formatted table output for humans
    formatTable(stats)
  }

  await prisma.$disconnect()
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

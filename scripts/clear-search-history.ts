#!/usr/bin/env tsx

/**
 * Clear Search History Script
 *
 * Usage:
 *   npm run db:search-history:clear -- --user-id=USER_ID
 *   npm run db:search-history:clear -- --confirm
 *
 * Examples:
 *   # Clear specific user's history
 *   npm run db:search-history:clear -- --user-id=abc123
 *
 *   # Clear ALL search history (dangerous!)
 *   npm run db:search-history:clear -- --confirm
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  const args = process.argv.slice(2)

  // Parse arguments
  const userIdArg = args.find(arg => arg.startsWith('--user-id='))
  const confirmFlag = args.includes('--confirm')

  if (!userIdArg && !confirmFlag) {
    console.error('Error: Missing required argument')
    console.log('\nUsage:')
    console.log('  npm run db:search-history:clear -- --user-id=USER_ID')
    console.log('  npm run db:search-history:clear -- --confirm')
    console.log('\nExamples:')
    console.log('  # Clear specific user\'s history')
    console.log('  npm run db:search-history:clear -- --user-id=abc123')
    console.log('\n  # Clear ALL search history (dangerous!)')
    console.log('  npm run db:search-history:clear -- --confirm')
    process.exit(1)
  }

  if (userIdArg) {
    // Clear specific user's history
    const userId = userIdArg.split('=')[1]

    if (!userId) {
      console.error('Error: Invalid user-id format')
      console.log('Expected: --user-id=USER_ID')
      process.exit(1)
    }

    console.log(`Clearing search history for user: ${userId}`)

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    })

    if (!user) {
      console.error(`Error: User with ID "${userId}" not found`)
      process.exit(1)
    }

    console.log(`User found: ${user.email}`)

    // Count entries before deletion
    const countBefore = await prisma.searchHistory.count({
      where: { userId },
    })

    console.log(`Found ${countBefore} search history entries`)

    if (countBefore === 0) {
      console.log('No history to delete')
      process.exit(0)
    }

    // Delete entries
    const result = await prisma.searchHistory.deleteMany({
      where: { userId },
    })

    console.log(`✅ Successfully deleted ${result.count} entries`)
  } else if (confirmFlag) {
    // Clear ALL history (dangerous!)
    console.log('⚠️  WARNING: You are about to delete ALL search history from the database!')
    console.log('This action cannot be undone.')

    // Count total entries
    const totalCount = await prisma.searchHistory.count()
    console.log(`\nTotal entries to delete: ${totalCount}`)

    if (totalCount === 0) {
      console.log('No history to delete')
      process.exit(0)
    }

    // Require explicit confirmation in production
    if (process.env.NODE_ENV === 'production') {
      console.error('\nError: Bulk deletion is disabled in production environment')
      console.error('Please use --user-id to delete specific user history')
      process.exit(1)
    }

    console.log('\nProceeding with deletion in 3 seconds...')
    console.log('Press Ctrl+C to cancel')

    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Delete all entries
    const result = await prisma.searchHistory.deleteMany()

    console.log(`\n✅ Successfully deleted ${result.count} entries`)
    console.log('All search history has been cleared')
  }

  await prisma.$disconnect()
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })

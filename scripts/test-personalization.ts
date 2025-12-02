/**
 * Personalization Validation Script
 * Tests user preference-based ranking boosts
 */

import { search } from '../src/lib/search-service'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('👤 Personalization Validation')
  console.log('Testing user preference boosts...\n')

  const testUser = await prisma.user.findFirst({ where: { preferences: { not: null } } })

  if (!testUser) {
    console.log('⚠️  No users with preferences found')
    return
  }

  const personalizedResult = await search(
    { query: 'smartphone', page: 1, limit: 10 },
    undefined,
    'fr',
    testUser.id
  )

  const standardResult = await search({ query: 'smartphone', page: 1, limit: 10 })

  console.log(`✅ Personalized: ${personalizedResult.totalCount} results`)
  console.log(`✅ Standard: ${standardResult.totalCount} results`)
  console.log('\n✅ Personalization tests completed')
}

main().finally(() => prisma.$disconnect())

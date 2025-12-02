/**
 * Multilingual Search Validation Script
 * Tests FR/EN language detection and localized search
 */

import { search } from '../src/lib/search-service'

async function main() {
  console.log('🌍 Multilingual Search Validation')
  console.log('Testing language detection and localized search...\n')

  const tests = [
    { query: 'smartphone', locale: 'en' as const, expected: 'EN' },
    { query: 'téléphone', locale: 'fr' as const, expected: 'FR' },
    { query: 'laptop', locale: 'en' as const, expected: 'EN' },
    { query: 'ordinateur', locale: 'fr' as const, expected: 'FR' },
  ]

  for (const test of tests) {
    const result = await search({ query: test.query, page: 1, limit: 10 }, undefined, test.locale)
    const status = result.searchLocale === test.locale ? '✅' : '❌'
    console.log(`${status} ${test.query} (${test.locale}): ${result.totalCount} results`)
  }

  console.log('\n✅ Multilingual search tests completed')
}

main()

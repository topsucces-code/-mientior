import { getIndex, isAvailable } from '../src/lib/meilisearch-client'
import { getSynonyms } from '../src/lib/synonyms-manager'
import { prisma } from '../src/lib/prisma'

/**
 * Test synonym functionality
 */
async function testSynonyms() {
  console.log('🧪 Testing MeiliSearch Synonyms')
  console.log('='.repeat(50))

  // Step 1: Check MeiliSearch availability
  console.log('\n📡 Checking MeiliSearch...')
  const available = await isAvailable()
  if (!available) {
    console.error('❌ MeiliSearch is not available')
    process.exit(1)
  }
  console.log('✅ MeiliSearch is available')

  // Step 2: Load synonyms
  console.log('\n📋 Loading synonyms...')
  const synonyms = await getSynonyms()
  const synonymCount = Object.keys(synonyms).length
  console.log(`✅ Loaded ${synonymCount} synonym groups`)

  // Step 3: Test each synonym group
  console.log('\n🔍 Testing synonym searches...')
  const index = getIndex('products')

  for (const [key, terms] of Object.entries(synonyms)) {
    console.log(`\n  Testing: "${key}" → [${terms.join(', ')}]`)

    // Search for the key
    const keyResults = await index.search(key, { limit: 5 })
    console.log(`    - Search "${key}": ${keyResults.estimatedTotalHits} results`)

    // Search for first synonym term
    if (terms.length > 0) {
      const termResults = await index.search(terms[0], { limit: 5 })
      console.log(`    - Search "${terms[0]}": ${termResults.estimatedTotalHits} results`)

      // Check if results overlap (synonym working)
      const keyIds = new Set(keyResults.hits.map((h: any) => h.id))
      const termIds = new Set(termResults.hits.map((h: any) => h.id))
      const overlap = [...keyIds].filter((id) => termIds.has(id)).length

      if (overlap > 0) {
        console.log(`    ✅ Synonym working: ${overlap} overlapping results`)
      } else if (
        keyResults.estimatedTotalHits === 0 &&
        termResults.estimatedTotalHits === 0
      ) {
        console.log(
          `    ⚠️  No products found for either term (expected if catalog empty)`
        )
      } else {
        console.log(`    ❌ Synonym not working: No overlapping results`)
      }
    }
  }

  // Step 4: Specific test cases
  console.log('\n🎯 Specific Test Cases:')

  // Test 1: "téléphone" should return "smartphone" products
  console.log('\n  Test 1: "téléphone" → "smartphone"')
  const phoneResults = await index.search('téléphone', { limit: 10 })
  const smartphoneResults = await index.search('smartphone', { limit: 10 })

  console.log(`    - "téléphone": ${phoneResults.estimatedTotalHits} results`)
  console.log(`    - "smartphone": ${smartphoneResults.estimatedTotalHits} results`)

  if (
    phoneResults.estimatedTotalHits > 0 &&
    smartphoneResults.estimatedTotalHits > 0
  ) {
    const phoneIds = new Set(phoneResults.hits.map((h: any) => h.id))
    const smartphoneIds = new Set(smartphoneResults.hits.map((h: any) => h.id))
    const overlap = [...phoneIds].filter((id) => smartphoneIds.has(id)).length

    if (overlap > 0) {
      console.log(`    ✅ PASS: ${overlap} overlapping results`)
    } else {
      console.log(`    ❌ FAIL: No overlapping results`)
    }
  } else {
    console.log(`    ⚠️  SKIP: No products found (catalog may be empty)`)
  }

  // Test 2: "ordinateur" should return "laptop" products
  console.log('\n  Test 2: "ordinateur" → "laptop"')
  const ordinateurResults = await index.search('ordinateur', { limit: 10 })
  const laptopResults = await index.search('laptop', { limit: 10 })

  console.log(`    - "ordinateur": ${ordinateurResults.estimatedTotalHits} results`)
  console.log(`    - "laptop": ${laptopResults.estimatedTotalHits} results`)

  if (
    ordinateurResults.estimatedTotalHits > 0 &&
    laptopResults.estimatedTotalHits > 0
  ) {
    const ordinateurIds = new Set(ordinateurResults.hits.map((h: any) => h.id))
    const laptopIds = new Set(laptopResults.hits.map((h: any) => h.id))
    const overlap = [...ordinateurIds].filter((id) => laptopIds.has(id)).length

    if (overlap > 0) {
      console.log(`    ✅ PASS: ${overlap} overlapping results`)
    } else {
      console.log(`    ❌ FAIL: No overlapping results`)
    }
  } else {
    console.log(`    ⚠️  SKIP: No products found (catalog may be empty)`)
  }

  console.log('\n✅ Synonym tests completed!')
  console.log('\n📝 Notes:')
  console.log('   - If tests show "No products found", seed the database first')
  console.log('   - Run: npm run seed')
  console.log('   - Then reindex: npm run search:reindex')
}

// CLI execution
if (require.main === module) {
  testSynonyms()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Test failed:', err)
      process.exit(1)
    })
}

export { testSynonyms }

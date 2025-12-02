import { MeiliSearch } from 'meilisearch'

const client = new MeiliSearch({
  host: 'http://localhost:7700',
  apiKey: '5v601eGf8uor8gjVFhZEeH5kp6JTJU2jM0H3jm6Drzs=',
})

async function testMeiliSearch() {
  console.log('🔍 Testing MeiliSearch Direct Query...')
  
  try {
    const index = client.index('mientior_products')
    
    // 1. Check stats
    const stats = await index.getStats()
    console.log('📊 Index Stats:', stats)
    
    // 2. Get a document to see structure
    const docs = await index.getDocuments({ limit: 1 })
    console.log('📄 Sample Document:', JSON.stringify(docs.results[0], null, 2))
    
    // 3. Search for "Sony"
    console.log('\n🔎 Searching for "Sony"...')
    const searchResult = await index.search('Sony', {
      limit: 5,
      attributesToHighlight: ['name'],
    })
    
    console.log(`✅ Found ${searchResult.hits.length} hits (Total: ${searchResult.estimatedTotalHits})`)
    searchResult.hits.forEach(hit => {
      console.log(`   - [${hit.id}] ${hit.name}`)
    })
    
    // 4. Search for "Sony" with filters (status=ACTIVE AND approvalStatus=APPROVED)
    console.log('\n🔎 Searching for "Sony" with FULL filters (status=ACTIVE AND approvalStatus=APPROVED)...')
    try {
      const filteredResult = await index.search('Sony', {
        filter: ['status = "ACTIVE"', 'approvalStatus = "APPROVED"'],
        limit: 5
      })
      console.log(`✅ Found ${filteredResult.hits.length} hits with full filters`)
    } catch (e: any) {
      console.error('❌ Filter search failed:', e.message)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testMeiliSearch()

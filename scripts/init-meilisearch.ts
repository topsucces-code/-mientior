import {
  meilisearchClient,
  isAvailable,
  createIndexIfNotExists,
  updateIndexSettings,
  getStats,
} from '../src/lib/meilisearch-client'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

interface MeiliSearchConfigFile {
  indexes: Record<string, any>
}

interface InitOptions {
  force?: boolean
  dryRun?: boolean
}

/**
 * Initialize MeiliSearch indexes with configuration
 */
async function initializeMeiliSearch(options: InitOptions = {}): Promise<void> {
  const { force = false, dryRun = false } = options

  console.log('🚀 MeiliSearch Initialization')
  console.log('=' .repeat(50))

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be applied')
  }

  // Step 1: Check availability
  console.log('\n📡 Checking MeiliSearch availability...')
  const available = await isAvailable()

  if (!available) {
    console.error('❌ MeiliSearch is not available')
    console.error('   Please ensure MeiliSearch is running:')
    console.error('   - Run: npm run meilisearch:start')
    console.error('   - Or: docker compose up -d meilisearch')
    process.exit(1)
  }

  console.log('✅ MeiliSearch is available')

  // Step 2: Load configuration
  console.log('\n📋 Loading configuration...')
  let config: MeiliSearchConfigFile

  try {
    const configPath = join(process.cwd(), 'meilisearch.config.json')
    const configFile = readFileSync(configPath, 'utf-8')
    config = JSON.parse(configFile)

    if (!config.indexes || typeof config.indexes !== 'object') {
      throw new Error('Invalid configuration: missing "indexes" object')
    }

    console.log(`✅ Configuration loaded (${Object.keys(config.indexes).length} indexes)`)
  } catch (error: any) {
    console.error('❌ Error loading configuration:', error.message)
    console.error('   Please ensure meilisearch.config.json exists in the project root')
    process.exit(1)
  }

  // Step 3: Create/verify indexes
  console.log('\n🔨 Creating indexes...')
  const indexNames = Object.keys(config.indexes)

  for (const indexName of indexNames) {
    try {
      if (dryRun) {
        console.log(`   [DRY RUN] Would create/verify index: ${indexName}`)
        continue
      }

      await createIndexIfNotExists(indexName, 'id')
      console.log(`✅ Index verified: ${indexName}`)
    } catch (error: any) {
      console.error(`❌ Error creating index ${indexName}:`, error.message)
      throw error
    }
  }

  // Step 4: Apply settings
  console.log('\n⚙️  Applying settings...')

  for (const indexName of indexNames) {
    const settings = config.indexes[indexName]

    // Merge synonyms if this is the products index
    if (indexName === 'products' && settings.synonyms) {
      settings.synonyms = loadSynonyms(settings.synonyms)
    }

    try {
      if (dryRun) {
        console.log(`   [DRY RUN] Would apply settings to: ${indexName}`)
        console.log(`   - searchableAttributes: ${settings.searchableAttributes?.length || 0}`)
        console.log(`   - filterableAttributes: ${settings.filterableAttributes?.length || 0}`)
        console.log(`   - sortableAttributes: ${settings.sortableAttributes?.length || 0}`)
        console.log(`   - rankingRules: ${settings.rankingRules?.length || 0}`)
        console.log(`   - stopWords: ${settings.stopWords?.length || 0}`)
        console.log(`   - synonyms: ${Object.keys(settings.synonyms || {}).length}`)
        continue
      }

      await updateIndexSettings(indexName, settings)
      console.log(`✅ Settings applied: ${indexName}`)
    } catch (error: any) {
      console.error(`❌ Error applying settings to ${indexName}:`, error.message)
      throw error
    }
  }

  // Step 5: Display statistics
  if (!dryRun) {
    console.log('\n📊 MeiliSearch Statistics:')
    try {
      const stats = await getStats()
      console.log(`   Database size: ${formatBytes(stats.databaseSize)}`)
      console.log(`   Indexes: ${Object.keys(stats.indexes).length}`)

      for (const [indexName, indexStats] of Object.entries(stats.indexes)) {
        const typedStats = indexStats as any
        console.log(
          `   - ${indexName}: ${typedStats.numberOfDocuments} documents${typedStats.isIndexing ? ' (indexing...)' : ''}`
        )
      }
    } catch (error: any) {
      console.error('   Warning: Could not retrieve statistics:', error.message)
    }
  }

  console.log('\n✅ MeiliSearch initialized successfully!')

  if (!dryRun) {
    console.log('\n📝 Next steps:')
    console.log('   1. Index your data (see documentation)')
    console.log('   2. Test search: npm run meilisearch:status')
    console.log('   3. Open dashboard: npm run meilisearch:dashboard')
  }
}

/**
 * Load and merge synonyms from config and synonyms.json
 */
function loadSynonyms(configSynonyms: Record<string, string[]>): Record<string, string[]> {
  try {
    const synonymsPath = join(process.cwd(), 'synonyms.json')

    if (!existsSync(synonymsPath)) {
      console.log('   No synonyms.json found, using config only')
      return configSynonyms
    }

    const synonymsFile = readFileSync(synonymsPath, 'utf-8')
    const { synonyms } = JSON.parse(synonymsFile)

    // Merge: synonyms.json takes precedence over config
    const merged = { ...configSynonyms, ...synonyms }

    console.log(`   Loaded ${Object.keys(synonyms).length} synonyms from synonyms.json`)
    console.log(`   Total synonyms: ${Object.keys(merged).length}`)

    return merged
  } catch (error: any) {
    console.error('   Warning: Failed to load synonyms.json:', error.message)
    console.log('   Falling back to config synonyms only')
    return configSynonyms
  }
}

/**
 * Reset MeiliSearch by deleting and recreating all indexes
 */
async function resetMeiliSearch(): Promise<void> {
  console.log('🔄 MeiliSearch Reset')
  console.log('=' .repeat(50))
  console.log('⚠️  WARNING: This will delete all indexes and data!')

  // Check availability
  const available = await isAvailable()
  if (!available) {
    console.error('❌ MeiliSearch is not available')
    process.exit(1)
  }

  // Load configuration
  const configPath = join(process.cwd(), 'meilisearch.config.json')
  const configFile = readFileSync(configPath, 'utf-8')
  const config: MeiliSearchConfigFile = JSON.parse(configFile)

  // Delete all indexes
  console.log('\n🗑️  Deleting indexes...')
  const indexNames = Object.keys(config.indexes)

  for (const indexName of indexNames) {
    try {
      const { deleteIndex } = await import('../src/lib/meilisearch-client')
      await deleteIndex(indexName)
      console.log(`✅ Deleted: ${indexName}`)
    } catch (error: any) {
      if (error.code === 'index_not_found') {
        console.log(`   Index ${indexName} does not exist (skipped)`)
      } else {
        console.error(`❌ Error deleting ${indexName}:`, error.message)
      }
    }
  }

  // Reinitialize
  console.log('\n🔨 Recreating indexes...')
  await initializeMeiliSearch({ force: true })
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

import { fileURLToPath } from 'url'

// CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  const force = args.includes('--force')
  const dryRun = args.includes('--dry-run')

  if (force) {
    resetMeiliSearch()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('❌ Reset failed:', err)
        process.exit(1)
      })
  } else {
    initializeMeiliSearch({ dryRun })
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('❌ Initialization failed:', err)
        process.exit(1)
      })
  }
}

export { initializeMeiliSearch, resetMeiliSearch }

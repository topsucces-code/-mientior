/**
 * Update MeiliSearch Ranking Rules Script
 *
 * Updates MeiliSearch ranking rules from meilisearch.config.json
 * Specifically applies the new popularity-based ranking rules
 */

import {
  meilisearchClient,
  isAvailable,
  getIndex,
  updateIndexSettings,
} from '../src/lib/meilisearch-client'
import { readFileSync } from 'fs'
import { join } from 'path'

interface MeiliSearchConfigFile {
  indexes: Record<string, any>
}

interface UpdateOptions {
  dryRun?: boolean
  indexName?: string
}

/**
 * Parse command line arguments
 */
function parseArgs(): UpdateOptions {
  const args = process.argv.slice(2)
  const options: UpdateOptions = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      options.dryRun = true
    } else if (args[i] === '--index' && args[i + 1]) {
      options.indexName = args[i + 1]
      i++
    } else if (args[i] === '--help') {
      console.log(`
Usage: npm run ranking:update-meilisearch [options]

Update MeiliSearch ranking rules from meilisearch.config.json

Options:
  --dry-run          Show what would be updated without applying changes
  --index <name>     Update only the specified index (default: products)
  --help             Show this help message

Examples:
  npm run ranking:update-meilisearch
  npm run ranking:update-meilisearch -- --dry-run
  npm run ranking:update-meilisearch -- --index products
      `)
      process.exit(0)
    }
  }

  return options
}

/**
 * Update MeiliSearch ranking rules
 */
async function updateRankingRules(options: UpdateOptions = {}): Promise<void> {
  const { dryRun = false, indexName = 'products' } = options

  console.log('🚀 Update MeiliSearch Ranking Rules')
  console.log('=' .repeat(60))

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be applied\n')
  }

  // Step 1: Check availability
  console.log('📡 Checking MeiliSearch availability...')
  const available = await isAvailable()

  if (!available) {
    console.error('❌ MeiliSearch is not available')
    console.error('   Please ensure MeiliSearch is running:')
    console.error('   - Run: npm run meilisearch:start')
    console.error('   - Or: docker compose up -d meilisearch')
    process.exit(1)
  }

  console.log('✅ MeiliSearch is available\n')

  // Step 2: Load configuration
  console.log('📋 Loading configuration from meilisearch.config.json...')
  let config: MeiliSearchConfigFile

  try {
    const configPath = join(process.cwd(), 'meilisearch.config.json')
    const configFile = readFileSync(configPath, 'utf-8')
    config = JSON.parse(configFile)

    if (!config.indexes || typeof config.indexes !== 'object') {
      throw new Error('Invalid configuration: missing "indexes" object')
    }

    console.log(`✅ Configuration loaded\n`)
  } catch (error: any) {
    console.error('❌ Error loading configuration:', error.message)
    console.error('   Please ensure meilisearch.config.json exists in the project root')
    process.exit(1)
  }

  // Step 3: Verify index exists in config
  const indexConfig = config.indexes[indexName]
  if (!indexConfig) {
    console.error(`❌ Index "${indexName}" not found in configuration`)
    console.error(`   Available indexes: ${Object.keys(config.indexes).join(', ')}`)
    process.exit(1)
  }

  // Step 4: Show current and new ranking rules
  console.log(`📊 Updating index: ${indexName}`)
  console.log('-'.repeat(60))

  try {
    const index = getIndex(indexName)
    const currentSettings = await index.getSettings()

    console.log('\nCurrent Ranking Rules:')
    if (currentSettings.rankingRules) {
      currentSettings.rankingRules.forEach((rule, i) => {
        console.log(`  ${i + 1}. ${rule}`)
      })
    } else {
      console.log('  (none)')
    }

    console.log('\nNew Ranking Rules:')
    if (indexConfig.rankingRules) {
      indexConfig.rankingRules.forEach((rule: string, i: number) => {
        const isNew = !currentSettings.rankingRules?.includes(rule)
        const prefix = isNew ? '  ✨' : '   '
        console.log(`${prefix}${i + 1}. ${rule}`)
      })
    }

    console.log('\nNew Sortable Attributes:')
    if (indexConfig.sortableAttributes) {
      indexConfig.sortableAttributes.forEach((attr: string) => {
        const isNew = !currentSettings.sortableAttributes?.includes(attr)
        const prefix = isNew ? '  ✨' : '   '
        console.log(`${prefix}- ${attr}`)
      })
    }

    console.log('\nNew Filterable Attributes:')
    if (indexConfig.filterableAttributes) {
      indexConfig.filterableAttributes.forEach((attr: string) => {
        const isNew = !currentSettings.filterableAttributes?.includes(attr)
        const prefix = isNew ? '  ✨' : '   '
        console.log(`${prefix}- ${attr}`)
      })
    }

    console.log()

    // Step 5: Apply updates
    if (dryRun) {
      console.log('✅ Dry run complete - no changes applied')
      console.log('\nTo apply changes, run without --dry-run flag')
    } else {
      console.log('📦 Applying updates...')

      const updatePayload: any = {}
      if (indexConfig.rankingRules) updatePayload.rankingRules = indexConfig.rankingRules
      if (indexConfig.sortableAttributes) updatePayload.sortableAttributes = indexConfig.sortableAttributes
      if (indexConfig.filterableAttributes) updatePayload.filterableAttributes = indexConfig.filterableAttributes

      const task = await index.updateSettings(updatePayload)
      console.log(`   Task UID: ${task.taskUid}`)

      // Wait for task completion
      console.log('⏳ Waiting for task to complete...')
      await index.waitForTask(task.taskUid)

      console.log('✅ Ranking rules updated successfully!\n')

      // Verify update
      const updatedSettings = await index.getSettings()
      console.log('✓ Verified new ranking rules:')
      updatedSettings.rankingRules?.forEach((rule, i) => {
        console.log(`  ${i + 1}. ${rule}`)
      })

      console.log('\n📋 Next Steps:')
      console.log('  1. Reindex products: npm run search:reindex')
      console.log('  2. Or run full sync: npm run ranking:sync')
      console.log()
    }
  } catch (error: any) {
    console.error('❌ Error updating ranking rules:', error.message)
    if (error.cause) {
      console.error('   Cause:', error.cause)
    }
    process.exit(1)
  }
}

// Main execution
const options = parseArgs()
updateRankingRules(options)
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

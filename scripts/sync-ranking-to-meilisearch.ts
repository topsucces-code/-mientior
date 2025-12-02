/**
 * Sync Ranking to MeiliSearch Script
 *
 * Combines popularity calculation, MeiliSearch ranking update, and reindexing
 * into a single workflow for convenience
 */

import { batchUpdatePopularity, getRankingStatistics } from '../src/lib/ranking-service'
import { reindexAll } from '../src/lib/search-indexer'
import {
  meilisearchClient,
  isAvailable,
  getIndex,
} from '../src/lib/meilisearch-client'
import { readFileSync } from 'fs'
import { join } from 'path'
import cliProgress from 'cli-progress'

interface SyncOptions {
  skipPopularity?: boolean
  skipReindex?: boolean
  dryRun?: boolean
  batchSize?: number
}

interface MeiliSearchConfigFile {
  indexes: Record<string, any>
}

/**
 * Parse command line arguments
 */
function parseArgs(): SyncOptions {
  const args = process.argv.slice(2)
  const options: SyncOptions = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--skip-popularity') {
      options.skipPopularity = true
    } else if (arg === '--skip-reindex') {
      options.skipReindex = true
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--batch-size' && args[i + 1]) {
      options.batchSize = parseInt(args[i + 1], 10)
      i++
    } else if (arg === '--help') {
      showHelp()
      process.exit(0)
    }
  }

  return options
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
Usage: npm run ranking:sync [options]

Complete ranking sync workflow:
  1. Calculate popularity scores for all products
  2. Update MeiliSearch ranking rules
  3. Reindex all products in MeiliSearch

Options:
  --dry-run            Show what would happen without making changes
  --skip-popularity    Skip popularity calculation (only update MeiliSearch)
  --skip-reindex       Skip reindexing (only update scores and rules)
  --batch-size <n>     Batch size for processing (default: 100)
  --help               Show this help message

Examples:
  # Full sync (recommended)
  npm run ranking:sync

  # Preview changes without applying
  npm run ranking:sync -- --dry-run

  # Only update MeiliSearch ranking rules and reindex
  npm run ranking:sync -- --skip-popularity

  # Only calculate popularity and update rules
  npm run ranking:sync -- --skip-reindex
  `)
}

/**
 * Update MeiliSearch ranking rules
 */
async function updateMeiliSearchRanking(dryRun: boolean): Promise<void> {
  console.log('\n📊 Step 2: Updating MeiliSearch Ranking Rules')
  console.log('-'.repeat(60))

  // Load configuration
  const configPath = join(process.cwd(), 'meilisearch.config.json')
  const configFile = readFileSync(configPath, 'utf-8')
  const config: MeiliSearchConfigFile = JSON.parse(configFile)

  const indexConfig = config.indexes.products
  if (!indexConfig) {
    throw new Error('Products index not found in meilisearch.config.json')
  }

  const index = getIndex('products')

  if (dryRun) {
    console.log('\nNew Ranking Rules:')
    indexConfig.rankingRules.forEach((rule: string, i: number) => {
      console.log(`  ${i + 1}. ${rule}`)
    })
    console.log('\n✅ [DRY RUN] Would update ranking rules')
    return
  }

  const updatePayload: any = {}
  if (indexConfig.rankingRules) updatePayload.rankingRules = indexConfig.rankingRules
  if (indexConfig.sortableAttributes) updatePayload.sortableAttributes = indexConfig.sortableAttributes
  if (indexConfig.filterableAttributes) updatePayload.filterableAttributes = indexConfig.filterableAttributes

  console.log('   Applying updates...')
  const task = await index.updateSettings(updatePayload)
  console.log(`   Task UID: ${task.taskUid}`)

  console.log('   Waiting for completion...')
  await index.waitForTask(task.taskUid)

  console.log('✅ Ranking rules updated')
}

/**
 * Main sync function
 */
async function syncRanking(options: SyncOptions): Promise<void> {
  const {
    skipPopularity = false,
    skipReindex = false,
    dryRun = false,
    batchSize = 100,
  } = options

  const overallStartTime = Date.now()

  console.log('🚀 Sync Product Ranking to MeiliSearch')
  console.log('=' .repeat(60))

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be applied')
  }

  console.log()
  console.log('Workflow:')
  if (!skipPopularity) console.log('  ✓ Step 1: Calculate popularity scores')
  if (!skipPopularity) console.log('  ✓ Step 2: Update MeiliSearch ranking rules')
  if (!skipReindex) console.log('  ✓ Step 3: Reindex products')
  console.log()

  // Check MeiliSearch availability
  console.log('📡 Checking MeiliSearch availability...')
  const available = await isAvailable()

  if (!available) {
    console.error('❌ MeiliSearch is not available')
    console.error('   Please ensure MeiliSearch is running')
    process.exit(1)
  }

  console.log('✅ MeiliSearch is available')

  // Step 1: Calculate popularity
  if (!skipPopularity) {
    console.log('\n📈 Step 1: Calculating Popularity Scores')
    console.log('-'.repeat(60))

    if (dryRun) {
      console.log('✅ [DRY RUN] Would calculate popularity for all active products')
    } else {
      const progressBar = new cliProgress.SingleBar({
        format: 'Progress |{bar}| {percentage}% | {value}/{total} Products',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
      })

      let progressStarted = false
      let progressTotal = 0

      const progressCallback = (processed: number, total: number) => {
        if (!progressStarted) {
          progressBar.start(total, 0)
          progressTotal = total
          progressStarted = true
        }
        progressBar.update(processed)
      }

      const result = await batchUpdatePopularity({
        batchSize,
        onProgress: progressCallback,
      })

      if (progressStarted) {
        progressBar.update(progressTotal)
        progressBar.stop()
      }

      console.log(`\n✅ Popularity calculated: ${result.updated}/${result.total} products`)
      if (result.failed > 0) {
        console.log(`⚠️  ${result.failed} products failed`)
      }
    }
  }

  // Step 2: Update MeiliSearch ranking
  await updateMeiliSearchRanking(dryRun)

  // Step 3: Reindex products
  if (!skipReindex) {
    console.log('\n🔄 Step 3: Reindexing Products')
    console.log('-'.repeat(60))

    if (dryRun) {
      console.log('✅ [DRY RUN] Would reindex all products in MeiliSearch')
    } else {
      const progressBar = new cliProgress.SingleBar({
        format: 'Progress |{bar}| {percentage}% | {value}/{total} Products',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
      })

      let progressStarted = false

      const result = await reindexAll({
        batchSize,
        onProgress: (progress) => {
          if (!progressStarted) {
            progressBar.start(progress.total, 0)
            progressStarted = true
          }
          progressBar.update(progress.indexed)
        },
      })

      if (progressStarted) {
        progressBar.update(result.total)
        progressBar.stop()
      }

      console.log(`\n✅ Reindexed: ${result.indexed}/${result.total} products`)
      if (result.failed > 0) {
        console.log(`⚠️  ${result.failed} products failed`)
      }
    }
  }

  // Final statistics
  const totalDuration = Date.now() - overallStartTime

  console.log()
  console.log('=' .repeat(60))
  console.log('✅ Ranking Sync Complete')
  console.log('=' .repeat(60))
  console.log()
  console.log(`⏱️  Total Time: ${(totalDuration / 1000).toFixed(2)}s`)

  if (!dryRun && !skipPopularity) {
    console.log()
    console.log('📊 Updated Statistics:')
    try {
      const stats = await getRankingStatistics()
      console.log(`   Total Products: ${stats.totalProducts}`)
      console.log(`   Average Popularity: ${stats.averagePopularity}`)
      console.log(`   Max Popularity: ${stats.maxPopularity}`)
      console.log(`   Featured: ${stats.featuredCount} (${stats.featuredPercentage}%)`)
      console.log(`   In Stock: ${stats.inStockCount} (${stats.inStockPercentage}%)`)
    } catch (error) {
      console.log('   (Statistics unavailable)')
    }
  }

  console.log()
  console.log('📋 Search is now optimized with:')
  console.log('   ✓ Popularity-based ranking')
  console.log('   ✓ In-stock prioritization')
  console.log('   ✓ Featured product boost')
  console.log('   ✓ Rating-based scoring')
  console.log()

  if (dryRun) {
    console.log('To apply changes, run without --dry-run flag')
    console.log()
  }
}

// Main execution
const options = parseArgs()
syncRanking(options)
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal Error:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  })

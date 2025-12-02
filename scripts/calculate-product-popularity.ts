/**
 * Calculate Product Popularity Script
 *
 * CLI tool to calculate and update popularity scores for all products
 */

import { batchUpdatePopularity, getRankingStatistics } from '../src/lib/ranking-service'
import type { BatchUpdateOptions } from '../src/types/ranking'
import cliProgress from 'cli-progress'
import { writeFileSync } from 'fs'
import { join } from 'path'

interface CliOptions extends BatchUpdateOptions {
  dryRun?: boolean
  help?: boolean
}

/**
 * Parse command line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const options: CliOptions = {}

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--batch-size' && args[i + 1]) {
      options.batchSize = parseInt(args[i + 1], 10)
      i++
    } else if (arg === '--category' && args[i + 1]) {
      options.categoryId = args[i + 1]
      i++
    } else if (arg === '--vendor' && args[i + 1]) {
      options.vendorId = args[i + 1]
      i++
    } else if (arg === '--status' && args[i + 1]) {
      options.status = args[i + 1] as any
      i++
    } else if (arg === '--only-uninitialized') {
      options.onlyUninitialized = true
    }
  }

  return options
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
Usage: npm run ranking:calculate [options]

Calculate and update popularity scores for products based on views and sales.

Options:
  --help, -h              Show this help message
  --dry-run               Show calculations without updating database
  --batch-size <number>   Number of products to process per batch (default: 100)
  --category <id>         Filter by category ID
  --vendor <id>           Filter by vendor ID
  --status <status>       Filter by status (ACTIVE, DRAFT, ARCHIVED - default: ACTIVE)
  --only-uninitialized    Only update products with popularity = 0

Examples:
  # Calculate for all active products
  npm run ranking:calculate

  # Dry run to preview changes
  npm run ranking:calculate -- --dry-run

  # Calculate for specific category
  npm run ranking:calculate -- --category clx123456

  # Calculate for specific vendor with custom batch size
  npm run ranking:calculate -- --vendor clx789012 --batch-size 50

  # Only update products that haven't been initialized
  npm run ranking:calculate -- --only-uninitialized

Environment Variables:
  RANKING_POPULARITY_VIEWS_WEIGHT    Weight for product views (default: 0.3)
  RANKING_POPULARITY_SALES_WEIGHT    Weight for sales (default: 0.7)
  `)
}

/**
 * Main execution function
 */
async function main() {
  const options = parseArgs()

  if (options.help) {
    showHelp()
    process.exit(0)
  }

  console.log('🚀 Product Popularity Calculator')
  console.log('=' .repeat(60))
  console.log()

  if (options.dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be applied\n')
  }

  // Show configuration
  console.log('⚙️  Configuration:')
  console.log(`   Batch Size: ${options.batchSize || 100}`)
  if (options.categoryId) console.log(`   Category ID: ${options.categoryId}`)
  if (options.vendorId) console.log(`   Vendor ID: ${options.vendorId}`)
  console.log(`   Status: ${options.status || 'ACTIVE'}`)
  if (options.onlyUninitialized) console.log(`   Mode: Only uninitialized products`)
  console.log()

  // Show current statistics
  console.log('📊 Current Statistics:')
  try {
    const stats = await getRankingStatistics()
    console.log(`   Total Products: ${stats.totalProducts}`)
    console.log(`   Average Popularity: ${stats.averagePopularity}`)
    console.log(`   Max Popularity: ${stats.maxPopularity}`)
    console.log(`   Featured Products: ${stats.featuredCount} (${stats.featuredPercentage}%)`)
    console.log(`   In Stock Products: ${stats.inStockCount} (${stats.inStockPercentage}%)`)
    console.log()
  } catch (error) {
    console.error('   Failed to fetch current statistics')
    console.log()
  }

  if (options.dryRun) {
    console.log('✅ Dry run complete')
    console.log('\nTo apply changes, run without --dry-run flag')
    process.exit(0)
  }

  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: 'Progress |{bar}| {percentage}% | {value}/{total} Products | Elapsed: {duration}s',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  })

  console.log('📦 Processing products...\n')

  let progressTotal = 0
  let progressStarted = false

  const progressCallback = (processed: number, total: number) => {
    if (!progressStarted) {
      progressBar.start(total, 0)
      progressTotal = total
      progressStarted = true
    }
    progressBar.update(processed)
  }

  const startTime = Date.now()

  try {
    // Run batch update
    const result = await batchUpdatePopularity({
      ...options,
      onProgress: progressCallback,
    })

    if (progressStarted) {
      progressBar.update(progressTotal)
      progressBar.stop()
    }

    console.log()
    console.log('=' .repeat(60))
    console.log('✅ Popularity Calculation Complete')
    console.log('=' .repeat(60))
    console.log()
    console.log('📊 Results:')
    console.log(`   Total Products: ${result.total}`)
    console.log(`   Successfully Updated: ${result.updated}`)
    console.log(`   Failed: ${result.failed}`)
    console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`)

    if (result.averagePopularity !== undefined) {
      console.log()
      console.log('📈 Popularity Statistics:')
      console.log(`   Average: ${result.averagePopularity}`)
      console.log(`   Maximum: ${result.maxPopularity}`)
      console.log(`   Minimum: ${result.minPopularity}`)
    }

    // Log errors if any
    if (result.errors.length > 0) {
      console.log()
      console.log(`⚠️  Errors (${result.errors.length}):`)

      const errorLogPath = join(process.cwd(), 'popularity-update-errors.log')
      const errorLog = result.errors
        .map((e) => `[${new Date().toISOString()}] Product: ${e.productName || e.productId}\n  Error: ${e.error}`)
        .join('\n\n')

      writeFileSync(errorLogPath, errorLog, 'utf-8')
      console.log(`   Errors saved to: ${errorLogPath}`)

      // Show first 3 errors
      result.errors.slice(0, 3).forEach((e) => {
        console.log(`   - ${e.productName || e.productId}: ${e.error}`)
      })

      if (result.errors.length > 3) {
        console.log(`   ... and ${result.errors.length - 3} more (see log file)`)
      }
    }

    console.log()
    console.log('📋 Next Steps:')
    console.log('  1. Update MeiliSearch ranking: npm run ranking:update-meilisearch')
    console.log('  2. Reindex products: npm run search:reindex')
    console.log('  3. Or run full sync: npm run ranking:sync')
    console.log()

    process.exit(result.failed > 0 ? 1 : 0)
  } catch (error) {
    if (progressStarted) {
      progressBar.stop()
    }

    console.error()
    console.error('❌ Fatal Error:', error instanceof Error ? error.message : error)
    console.error()
    process.exit(1)
  }
}

// Execute
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

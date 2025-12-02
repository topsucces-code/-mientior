/**
 * Calculate User Preferences Script
 *
 * CLI tool to calculate and update user preferences for personalized search.
 * Analyzes user behavior (searches, views, purchases) to identify favorite
 * categories and brands, then stores weighted scores for search boosting.
 */

import { batchCalculatePreferences, getPreferenceStatistics, getPersonalizationConfig } from '../src/lib/personalization-service'
import type { BatchCalculateOptions } from '../src/types/personalization'
import { writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Simple progress bar implementation
 */
class SimpleProgressBar {
  private total = 0
  private current = 0
  private barWidth = 40

  start(total: number, initial: number) {
    this.total = total
    this.current = initial
    this.render()
  }

  update(value: number) {
    this.current = value
    this.render()
  }

  stop() {
    console.log() // New line after progress bar
  }

  private render() {
    const percentage = this.total > 0 ? Math.round((this.current / this.total) * 100) : 0
    const filled = Math.round((this.current / this.total) * this.barWidth)
    const empty = this.barWidth - filled
    const bar = '█'.repeat(filled) + '░'.repeat(empty)
    const eta = this.current > 0 ? Math.round(((this.total - this.current) / this.current) * 2) : 0
    
    process.stdout.write(`\r   Progress |${bar}| ${percentage}% | ${this.current}/${this.total} users | ETA: ${eta}s`)
  }
}

interface CliOptions extends BatchCalculateOptions {
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
    } else if (arg === '--user-id' && args[i + 1]) {
      options.userId = args[i + 1]
      i++
    } else if (arg === '--only-uninitialized') {
      options.onlyUninitialized = true
    } else if (arg === '--min-interactions' && args[i + 1]) {
      options.minInteractions = parseInt(args[i + 1], 10)
      i++
    }
  }

  return options
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
Usage: npm run personalization:calculate [options]

Calculate and update user preferences for personalized search results.
Analyzes user behavior (searches, views, purchases) to identify favorite
categories and brands with weighted scores.

Options:
  --help, -h              Show this help message
  --dry-run               Calculate preferences without saving to database
  --batch-size <number>   Number of users to process per batch (default: 50)
  --user-id <id>          Calculate for a specific user only
  --only-uninitialized    Only calculate for users with null preferences
  --min-interactions <n>  Minimum interactions required (default: 3)

Examples:
  # Calculate for all users
  npm run personalization:calculate

  # Dry run to preview calculations
  npm run personalization:calculate -- --dry-run

  # Calculate for specific user
  npm run personalization:calculate -- --user-id clx123456

  # Only calculate for users without preferences
  npm run personalization:calculate -- --only-uninitialized

  # Calculate with custom batch size
  npm run personalization:calculate -- --batch-size 100

Environment Variables:
  PERSONALIZATION_PURCHASES_WEIGHT    Weight for purchases (default: 0.5)
  PERSONALIZATION_SEARCHES_WEIGHT     Weight for searches (default: 0.3)
  PERSONALIZATION_VIEWS_WEIGHT        Weight for views (default: 0.2)
  PERSONALIZATION_CATEGORY_BOOST      Category boost % (default: 15)
  PERSONALIZATION_BRAND_BOOST         Brand boost % (default: 10)
  PERSONALIZATION_MIN_INTERACTIONS    Min interactions (default: 3)
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

  console.log('\n🎯 User Preferences Calculator\n')
  console.log('='.repeat(50))

  // Show configuration
  const config = getPersonalizationConfig()
  console.log('\n📋 Configuration:')
  console.log(`   Purchases Weight: ${config.purchasesWeight}`)
  console.log(`   Searches Weight:  ${config.searchesWeight}`)
  console.log(`   Views Weight:     ${config.viewsWeight}`)
  console.log(`   Category Boost:   ${config.categoryBoost}%`)
  console.log(`   Brand Boost:      ${config.brandBoost}%`)
  console.log(`   Min Interactions: ${options.minInteractions || config.minInteractions}`)
  console.log(`   Batch Size:       ${options.batchSize || 50}`)

  if (options.dryRun) {
    console.log('\n⚠️  DRY RUN MODE - No changes will be saved\n')
  }

  // Show current statistics
  console.log('\n📊 Current Statistics:')
  try {
    const stats = await getPreferenceStatistics()
    console.log(`   Total Users:              ${stats.totalUsers}`)
    console.log(`   Users with Preferences:   ${stats.usersWithPreferences} (${stats.coveragePercentage.toFixed(1)}%)`)
    console.log(`   Avg Categories per User:  ${stats.avgCategoriesPerUser.toFixed(1)}`)
    console.log(`   Avg Brands per User:      ${stats.avgBrandsPerUser.toFixed(1)}`)
    console.log(`   Needing Recalculation:    ${stats.usersNeedingRecalculation}`)
    if (stats.lastCalculation) {
      console.log(`   Last Calculation:         ${new Date(stats.lastCalculation).toLocaleString()}`)
    }
  } catch (error) {
    console.log('   Unable to fetch current statistics')
  }

  console.log('\n' + '='.repeat(50))
  console.log('\n🚀 Starting preference calculation...\n')

  // Create progress bar
  const progressBar = new SimpleProgressBar()

  let progressStarted = false

  try {
    const result = await batchCalculatePreferences({
      batchSize: options.batchSize,
      userId: options.userId,
      onlyUninitialized: options.onlyUninitialized,
      minInteractions: options.minInteractions,
      dryRun: options.dryRun,
      onProgress: (processed: number, total: number) => {
        if (!progressStarted) {
          progressBar.start(total, 0)
          progressStarted = true
        }
        progressBar.update(processed)
      },
    })

    if (progressStarted) {
      progressBar.stop()
    }

    // Display results
    console.log('\n' + '='.repeat(50))
    console.log('\n✅ Calculation Complete!\n')
    console.log('📈 Results:')
    console.log(`   Total Processed:    ${result.total}`)
    console.log(`   Successfully Updated: ${result.updated}`)
    console.log(`   Skipped (no data):    ${result.skipped}`)
    console.log(`   Failed:               ${result.failed}`)
    console.log(`   Duration:             ${(result.duration / 1000).toFixed(2)}s`)

    if (result.updated > 0) {
      console.log('\n📊 Statistics:')
      console.log(`   Avg Categories per User: ${result.statistics.avgCategoriesPerUser.toFixed(1)}`)
      console.log(`   Avg Brands per User:     ${result.statistics.avgBrandsPerUser.toFixed(1)}`)
      console.log(`   Avg Preference Score:    ${result.statistics.avgScore.toFixed(1)}`)
    }

    // Write errors to log file if any
    if (result.errors.length > 0) {
      const errorLogPath = join(process.cwd(), 'preferences-calculation-errors.log')
      const errorContent = result.errors
        .map((e: { userId: string; error: string }) => `[${new Date().toISOString()}] User ${e.userId}: ${e.error}`)
        .join('\n')
      writeFileSync(errorLogPath, errorContent)
      console.log(`\n⚠️  ${result.errors.length} errors occurred. See ${errorLogPath} for details.`)
    }

    // Suggest next steps
    console.log('\n📝 Next Steps:')
    if (options.dryRun) {
      console.log('   1. Run without --dry-run to save preferences')
    } else {
      console.log('   1. Verify preferences in admin dashboard')
      console.log('   2. Test personalized search with a user ID')
      console.log('   3. Set up daily cron job for automatic recalculation')
    }

    console.log('\n')
    process.exit(result.failed > 0 ? 1 : 0)
  } catch (error) {
    if (progressStarted) {
      progressBar.stop()
    }
    console.error('\n❌ Calculation failed:', error)
    process.exit(1)
  }
}

// Run main function
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

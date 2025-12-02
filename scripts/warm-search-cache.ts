/**
 * Warm Search Cache Script
 *
 * CLI tool to pre-populate Redis cache with results for popular search queries
 */

import { warmAllCaches, getPopularQueries } from '../src/lib/search-cache-warmer'
import cliProgress from 'cli-progress'
import { writeFileSync } from 'fs'
import { join } from 'path'

interface CliOptions {
  topQueries?: number
  periodDays?: number
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
    } else if (arg === '--top-queries' && args[i + 1]) {
      options.topQueries = parseInt(args[i + 1], 10)
      i++
    } else if (arg === '--period-days' && args[i + 1]) {
      options.periodDays = parseInt(args[i + 1], 10)
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
Usage: npm run search:warm-cache [options]

Pre-populate Redis cache with results for popular search queries.

Options:
  --help, -h              Show this help message
  --dry-run               Show queries without warming cache
  --top-queries <number>  Number of queries to warm (default: 50)
  --period-days <number>  Days of history for analysis (default: 7)

Examples:
  # Warm cache for top 50 queries from last 7 days
  npm run search:warm-cache

  # Dry run to preview queries
  npm run search:warm-cache -- --dry-run

  # Warm top 100 queries from last 30 days
  npm run search:warm-cache -- --top-queries 100 --period-days 30

Environment Variables:
  CACHE_WARMING_TOP_QUERIES      Number of top queries to warm (default: 50)
  CACHE_WARMING_PERIOD_DAYS      Days of history for analysis (default: 7)
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

  console.log('🚀 Search Cache Warmer')
  console.log('='.repeat(60))
  console.log()

  if (options.dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be applied\n')
  }

  // Read configuration from environment with defaults
  const defaultTopQueries = parseInt(process.env.CACHE_WARMING_TOP_QUERIES || '50', 10)
  const defaultPeriodDays = parseInt(process.env.CACHE_WARMING_PERIOD_DAYS || '7', 10)

  const topQueries = options.topQueries || defaultTopQueries
  const periodDays = options.periodDays || defaultPeriodDays

  // Show configuration
  console.log('⚙️  Configuration:')
  console.log(`   Top Queries: ${topQueries}`)
  console.log(`   Period Days: ${periodDays}`)
  console.log()

  // Get popular queries
  console.log('🔍 Analyzing popular queries...')
  const popularQueries = await getPopularQueries({ limit: topQueries, periodDays })
  console.log(`   Found ${popularQueries.length} popular queries\n`)

  // Display popular queries
  if (popularQueries.length > 0) {
    console.log('📋 Popular Queries:')
    popularQueries.forEach((item, index) => {
      console.log(`   ${index + 1}. "${item.query}" (${item.count} searches)`)
    })
    console.log()
  } else {
    console.log('📋 No popular queries found\n')
  }

  if (options.dryRun) {
    console.log('✅ Dry run complete')
    console.log('\nTo warm the cache, run without --dry-run flag')
    process.exit(0)
  }

  if (popularQueries.length === 0) {
    console.log('✅ No queries to warm')
    process.exit(0)
  }

  // Create progress bar
  const progressBar = new cliProgress.SingleBar({
    format: 'Progress |{bar}| {percentage}% | {value}/{total} Queries | Elapsed: {duration}s',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true,
  })

  console.log('🔥 Warming cache...\n')

  let progressTotal = popularQueries.length
  let progressStarted = false

  const progressCallback = (processed: number, total: number) => {
    if (!progressStarted) {
      progressBar.start(total, 0)
      progressStarted = true
    }
    progressBar.update(processed)
  }

  const startTime = Date.now()

  try {
    // Run cache warming
    const result = await warmAllCaches({
      topQueries,
      periodDays,
      onProgress: progressCallback,
    })

    if (progressStarted) {
      progressBar.update(progressTotal)
      progressBar.stop()
    }

    console.log()
    console.log('='.repeat(60))
    console.log('✅ Cache Warming Complete')
    console.log('='.repeat(60))
    console.log()
    console.log('📊 Results:')
    console.log(`   Total Queries: ${result.total}`)
    console.log(`   Successfully Warmed: ${result.warmed}`)
    console.log(`   Failed: ${result.failed}`)
    console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`)

    // Log errors if any
    if (result.errors.length > 0) {
      console.log()
      console.log(`⚠️  Errors (${result.errors.length}):`)

      const errorLogPath = join(process.cwd(), 'cache-warming-errors.log')
      const errorLog = result.errors
        .map((e) => `[${new Date().toISOString()}] Query: "${e.query}"\n  Error: ${e.error}`)
        .join('\n\n')

      writeFileSync(errorLogPath, errorLog, 'utf-8')
      console.log(`   Errors saved to: ${errorLogPath}`)

      // Show first 3 errors
      result.errors.slice(0, 3).forEach((e) => {
        console.log(`   - "${e.query}": ${e.error}`)
      })

      if (result.errors.length > 3) {
        console.log(`   ... and ${result.errors.length - 3} more (see log file)`)
      }
    }

    console.log()
    console.log('📋 Next Steps:')
    console.log('  1. Check cache metrics: npm run search:cache-metrics')
    console.log('  2. Monitor performance improvements')
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
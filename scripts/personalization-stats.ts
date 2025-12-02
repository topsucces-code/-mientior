/**
 * Personalization Statistics Script
 *
 * CLI tool to display current personalization statistics without recalculating.
 * Provides insights into user preference coverage and distribution.
 */

import { getPreferenceStatistics, getPersonalizationConfig } from '../src/lib/personalization-service'

interface CliOptions {
  json?: boolean
  help?: boolean
}

/**
 * Parse command line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2)
  const options: CliOptions = {}

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--json') {
      options.json = true
    }
  }

  return options
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
Usage: npm run personalization:stats [options]

Display current personalization statistics without recalculating.

Options:
  --help, -h    Show this help message
  --json        Output raw JSON for scripting/monitoring

Examples:
  # Display formatted statistics
  npm run personalization:stats

  # Output JSON for monitoring
  npm run personalization:stats -- --json
  `)
}

/**
 * Format percentage with color
 */
function formatPercentage(value: number): string {
  const formatted = `${value.toFixed(1)}%`
  if (value >= 80) return `\x1b[32m${formatted}\x1b[0m` // Green
  if (value >= 50) return `\x1b[33m${formatted}\x1b[0m` // Yellow
  return `\x1b[31m${formatted}\x1b[0m` // Red
}

/**
 * Format number with color based on threshold
 */
function formatNumber(value: number, goodThreshold: number, warnThreshold: number): string {
  const formatted = value.toLocaleString()
  if (value >= goodThreshold) return `\x1b[32m${formatted}\x1b[0m` // Green
  if (value >= warnThreshold) return `\x1b[33m${formatted}\x1b[0m` // Yellow
  return `\x1b[31m${formatted}\x1b[0m` // Red
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

  try {
    const stats = await getPreferenceStatistics()
    const config = getPersonalizationConfig()

    if (options.json) {
      console.log(JSON.stringify({ stats, config }, null, 2))
      process.exit(0)
    }

    console.log('\n📊 Personalization Statistics\n')
    console.log('='.repeat(50))

    // User Coverage
    console.log('\n👥 User Coverage:')
    console.log(`   Total Users:              ${stats.totalUsers.toLocaleString()}`)
    console.log(`   Users with Preferences:   ${formatNumber(stats.usersWithPreferences, stats.totalUsers * 0.5, stats.totalUsers * 0.2)}`)
    console.log(`   Coverage:                 ${formatPercentage(stats.coveragePercentage)}`)

    // Preference Quality
    console.log('\n📈 Preference Quality:')
    console.log(`   Avg Categories per User:  ${stats.avgCategoriesPerUser.toFixed(1)}`)
    console.log(`   Avg Brands per User:      ${stats.avgBrandsPerUser.toFixed(1)}`)

    // Calculation Status
    console.log('\n⏰ Calculation Status:')
    if (stats.lastCalculation) {
      const lastCalc = new Date(stats.lastCalculation)
      const daysSince = Math.floor((Date.now() - lastCalc.getTime()) / (1000 * 60 * 60 * 24))
      const color = daysSince <= 1 ? '\x1b[32m' : daysSince <= 7 ? '\x1b[33m' : '\x1b[31m'
      console.log(`   Last Calculation:         ${color}${lastCalc.toLocaleString()}\x1b[0m (${daysSince} days ago)`)
    } else {
      console.log(`   Last Calculation:         \x1b[31mNever\x1b[0m`)
    }
    if (stats.oldestCalculation) {
      console.log(`   Oldest Calculation:       ${new Date(stats.oldestCalculation).toLocaleString()}`)
    }
    console.log(`   Needing Recalculation:    ${formatNumber(stats.usersNeedingRecalculation, 0, stats.usersWithPreferences * 0.1)} (>7 days old)`)

    // Top Categories
    if (stats.topCategories.length > 0) {
      console.log('\n🏷️  Top Favorite Categories:')
      stats.topCategories.forEach((cat: { id: string; name: string; userCount: number }, i: number) => {
        console.log(`   ${i + 1}. ${cat.name} (${cat.userCount} users)`)
      })
    }

    // Top Brands
    if (stats.topBrands.length > 0) {
      console.log('\n🏪 Top Favorite Brands:')
      stats.topBrands.forEach((brand: { id: string; name: string; userCount: number }, i: number) => {
        console.log(`   ${i + 1}. ${brand.name} (${brand.userCount} users)`)
      })
    }

    // Current Configuration
    console.log('\n⚙️  Current Configuration:')
    console.log(`   Purchases Weight:         ${config.purchasesWeight}`)
    console.log(`   Searches Weight:          ${config.searchesWeight}`)
    console.log(`   Views Weight:             ${config.viewsWeight}`)
    console.log(`   Category Boost:           ${config.categoryBoost}%`)
    console.log(`   Brand Boost:              ${config.brandBoost}%`)
    console.log(`   Min Interactions:         ${config.minInteractions}`)

    // Recommendations
    console.log('\n💡 Recommendations:')
    if (stats.coveragePercentage < 50) {
      console.log('   ⚠️  Low coverage - run: npm run personalization:calculate')
    }
    if (stats.usersNeedingRecalculation > stats.usersWithPreferences * 0.2) {
      console.log('   ⚠️  Many stale preferences - consider recalculating')
    }
    if (stats.avgCategoriesPerUser < 2) {
      console.log('   ⚠️  Low category diversity - consider lowering MIN_INTERACTIONS')
    }
    if (stats.coveragePercentage >= 80 && stats.usersNeedingRecalculation === 0) {
      console.log('   ✅ Personalization is healthy!')
    }

    console.log('\n')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Failed to fetch statistics:', error)
    process.exit(1)
  }
}

// Run main function
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

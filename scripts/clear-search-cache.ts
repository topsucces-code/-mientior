#!/usr/bin/env tsx

/**
 * Clear Search Cache Script
 *
 * Usage:
 *   npm run search:clear-cache [options]
 *
 * Examples:
 *   # Clear all search caches (with confirmation)
 *   npm run search:clear-cache
 *
 *   # Clear only suggestions cache
 *   npm run search:clear-cache -- --tier suggestions
 *
 *   # Clear search caches matching pattern
 *   npm run search:clear-cache -- --tier search --pattern *phone*
 *
 *   # Dry run to preview
 *   npm run search:clear-cache -- --dry-run
 *
 *   # Force clear without confirmation
 *   npm run search:clear-cache -- --force
 */

import { createInterface } from 'readline'
import { redis, invalidateSearchCache, invalidateSuggestionsCache, invalidateFacetsCache } from '../src/lib/redis'

interface ClearOptions {
  tier: 'suggestions' | 'search' | 'facets' | 'all'
  pattern: string
  dryRun: boolean
  force: boolean
}

async function parseArgs(): Promise<ClearOptions> {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    showHelp()
    process.exit(0)
  }

  const tierArg = args.find(arg => arg.startsWith('--tier='))
  const patternArg = args.find(arg => arg.startsWith('--pattern='))
  const dryRun = args.includes('--dry-run')
  const force = args.includes('--force')

  const tier = (tierArg ? tierArg.split('=')[1] : 'all') as ClearOptions['tier']
  const pattern = patternArg ? patternArg.split('=')[1] : '*'

  if (!['suggestions', 'search', 'facets', 'all'].includes(tier)) {
    console.error(`Error: Invalid tier "${tier}". Must be one of: suggestions, search, facets, all`)
    process.exit(1)
  }

  return { tier, pattern, dryRun, force }
}

function showHelp() {
  console.log(`
Usage: npm run search:clear-cache [options]

Clear search-related caches in Redis.

Options:
  --help, -h              Show this help message
  --tier <tier>           Cache tier to clear: suggestions, search, facets, all (default: all)
  --pattern <pattern>     Redis pattern for selective clearing (e.g., *phone*)
  --dry-run               Show keys without deleting
  --force                 Skip confirmation prompt

Examples:
  # Clear all search caches (with confirmation)
  npm run search:clear-cache

  # Clear only suggestions cache
  npm run search:clear-cache -- --tier suggestions

  # Clear search caches matching pattern
  npm run search:clear-cache -- --tier search --pattern *phone*

  # Dry run to preview
  npm run search:clear-cache -- --dry-run

  # Force clear without confirmation
  npm run search:clear-cache -- --force
`)
}

async function scanKeys(pattern: string): Promise<string[]> {
  const keys: string[] = []
  let cursor = '0'

  do {
    const [nextCursor, matchedKeys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
    cursor = nextCursor
    keys.push(...matchedKeys)
  } while (cursor !== '0')

  return keys
}

async function clearCache(tier: string, pattern: string, dryRun: boolean): Promise<{ found: number; deleted: number }> {
  let fullPattern: string
  switch (tier) {
    case 'suggestions':
      fullPattern = `search:suggestions:${pattern}`
      break
    case 'search':
      fullPattern = `search:products:${pattern}`
      break
    case 'facets':
      fullPattern = `facets:${pattern}`
      break
    default:
      throw new Error(`Invalid tier: ${tier}`)
  }

  const keys = await scanKeys(fullPattern)
  const found = keys.length

  if (dryRun) {
    console.log(`\nTier: ${tier}`)
    console.log(`Pattern: ${fullPattern}`)
    console.log(`Keys found: ${found}`)
    if (found > 0) {
      console.log('Keys to be deleted:')
      keys.forEach(key => console.log(`  - ${key}`))
    }
    return { found, deleted: 0 }
  }

  if (found > 0) {
    await redis.del(...keys)
    console.log(`Deleted ${found} keys for tier ${tier}`)
  }

  return { found, deleted: found }
}

async function confirmDeletion(totalKeys: number): Promise<boolean> {
  if (totalKeys === 0) return true

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(`\nFound ${totalKeys} keys to delete. Are you sure? [y/N] `, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

async function main() {
  const options = await parseArgs()
  const startTime = Date.now()

  console.log('Clearing search caches...')
  console.log(`Tier: ${options.tier}`)
  console.log(`Pattern: ${options.pattern}`)
  console.log(`Dry run: ${options.dryRun}`)
  console.log(`Force: ${options.force}`)

  const tiers = options.tier === 'all' ? ['suggestions', 'search', 'facets'] : [options.tier]

  let totalFound = 0
  let totalDeleted = 0

  for (const tier of tiers) {
    const { found, deleted } = await clearCache(tier, options.pattern, options.dryRun)
    totalFound += found
    totalDeleted += deleted
  }

  if (options.dryRun) {
    console.log(`\nDry run complete. Total keys found: ${totalFound}`)
  } else {
    if (!options.force && totalFound > 0) {
      const confirmed = await confirmDeletion(totalFound)
      if (!confirmed) {
        console.log('Operation cancelled.')
        process.exit(0)
      }
      // Re-run without dry-run since confirmed
      totalFound = 0
      totalDeleted = 0
      for (const tier of tiers) {
        const { found, deleted } = await clearCache(tier, options.pattern, false)
        totalFound += found
        totalDeleted += deleted
      }
    }

    const duration = Date.now() - startTime
    console.log(`\n✅ Cache clearing complete.`)
    console.log(`Keys found: ${totalFound}`)
    console.log(`Keys deleted: ${totalDeleted}`)
    console.log(`Time taken: ${duration}ms`)

    // Log for audit
    console.log(`Audit: Cleared ${totalDeleted} cache keys at ${new Date().toISOString()}`)
  }

  await redis.disconnect()
}

main().catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})
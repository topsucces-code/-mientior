import { redis } from '../src/lib/redis'
import chalk from 'chalk'
import Table from 'cli-table3'
import minimist from 'minimist'

const args = minimist(process.argv.slice(2))

if (args.help || args.h) {
  console.log(`Usage: npm run search:cache-metrics [options]

View cache performance metrics and statistics.

Options:
  --help, -h         Show this help message
  --hours <number>   Hours of metrics to display (default: 24)
  --json             Output raw JSON
  --watch            Refresh metrics every 10 seconds

Examples:
  # View last 24 hours of metrics
  npm run search:cache-metrics

  # View last 7 days
  npm run search:cache-metrics -- --hours 168

  # Output JSON for monitoring
  npm run search:cache-metrics -- --json`)
  process.exit(0)
}

const hours = args.hours || 24
const json = !!args.json
const watch = !!args.watch

async function getTierMetrics(tier: string) {
  const tierMapping: Record<string, string> = {
    suggestions: 'search:suggestions',
    search: 'search:products',
    facets: 'facets'
  }
  const prefix = tierMapping[tier] || tier

  const hits = parseInt((await redis.get(`cache:metrics:hits:${prefix}`)) || '0', 10)
  const misses = parseInt((await redis.get(`cache:metrics:misses:${prefix}`)) || '0', 10)
  const latencies = await redis.lrange(`cache:metrics:latency:${prefix}`, 0, -1)
  const latencyValues = latencies.map(l => parseInt(l, 10)).filter(l => !isNaN(l))
  const avgLatency = latencyValues.length > 0 ? latencyValues.reduce((a, b) => a + b, 0) / latencyValues.length : 0

  const hitRate = (hits + misses) > 0 ? (hits / (hits + misses)) * 100 : 0

  return { hits, misses, hitRate, avgLatency }
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

async function getRedisStatus() {
  try {
    const info = await redis.info()
    const lines = info.split('\n')
    const usedMemoryLine = lines.find(l => l.startsWith('used_memory:'))
    const usedMemory = usedMemoryLine ? parseInt(usedMemoryLine.split(':')[1], 10) : 0
    const dbLine = lines.find(l => l.startsWith('db0:keys='))
    const totalKeys = dbLine ? parseInt(dbLine.split('=')[1].split(',')[0], 10) : 0
    const evictedKeysLine = lines.find(l => l.startsWith('evicted_keys:'))
    const evictedKeys = evictedKeysLine ? parseInt(evictedKeysLine.split(':')[1], 10) : 0

    return {
      connected: true,
      usedMemory: formatBytes(usedMemory),
      totalKeys,
      evictedKeys
    }
  } catch (err) {
    console.warn('Redis status error:', err)
    return { connected: false, usedMemory: 'unknown', totalKeys: 0, evictedKeys: 0 }
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

async function getTopCachedQueries() {
  const hitsKeys = await scanKeys('cache:metrics:hits:search:products:*')
  const queries = []

  for (const key of hitsKeys) {
    const hits = parseInt((await redis.get(key)) || '0', 10)
    // Extract query from key (assuming key format: cache:metrics:hits:search:products:{query})
    const query = key.replace('cache:metrics:hits:search:products:', '').substring(0, 50)
    // Placeholder for last accessed (could be improved with TTL or separate tracking)
    const lastAccessed = new Date().toISOString()
    queries.push({ query, hits, lastAccessed })
  }

  return queries.sort((a, b) => b.hits - a.hits).slice(0, 10)
}

async function displayMetrics() {
  const tiers = ['suggestions', 'search', 'facets']
  const tierData = []

  for (const tier of tiers) {
    const metrics = await getTierMetrics(tier)
    tierData.push({
      tier,
      hits: metrics.hits,
      misses: metrics.misses,
      hitRate: `${metrics.hitRate.toFixed(1)}%`,
      avgLatency: `${metrics.avgLatency.toFixed(0)}ms`
    })
  }

  const redisStatus = await getRedisStatus()
  const topQueries = await getTopCachedQueries()

  if (json) {
    console.log(JSON.stringify({
      period: { hours },
      tiers: tierData,
      redis: redisStatus,
      topQueries
    }, null, 2))
    return
  }

  // Clear console for watch mode
  if (watch) {
    console.clear()
  }

  console.log(chalk.bold('📊 Cache Performance Metrics'))
  console.log('='.repeat(50))
  console.log(`Period: Last ${hours} hours\n`)

  // Cache Tier Performance Table
  const table = new Table({
    head: ['Tier', 'Hits', 'Misses', 'Hit Rate', 'Avg Latency'],
    colWidths: [15, 10, 10, 10, 15]
  })

  for (const data of tierData) {
    const hitRateNum = parseFloat(data.hitRate)
    const hitRateColor = hitRateNum > 80 ? 'green' : hitRateNum > 60 ? 'yellow' : 'red'
    table.push([
      data.tier,
      data.hits.toLocaleString(),
      data.misses.toLocaleString(),
      chalk[hitRateColor](data.hitRate),
      data.avgLatency
    ])
  }

  console.log(table.toString())
  console.log()

  // Redis Status
  console.log(chalk.bold('🔴 Redis Status'))
  console.log(`Connected: ${redisStatus.connected ? chalk.green('✅ Yes') : chalk.red('❌ No')}`)
  console.log(`Used Memory: ${redisStatus.usedMemory}`)
  console.log(`Total Keys: ${redisStatus.totalKeys.toLocaleString()}`)
  console.log(`Evicted Keys: ${redisStatus.evictedKeys.toLocaleString()} ${redisStatus.evictedKeys > 0 ? chalk.yellow('(warning)') : ''}`)
  console.log()

  // Top Cached Queries
  console.log(chalk.bold('🔝 Top Cached Queries'))
  if (topQueries.length === 0) {
    console.log('No cached queries found')
  } else {
    const qTable = new Table({
      head: ['Query', 'Hits', 'Last Accessed'],
      colWidths: [50, 10, 20]
    })
    for (const q of topQueries) {
      qTable.push([q.query, q.hits.toLocaleString(), new Date(q.lastAccessed).toLocaleString()])
    }
    console.log(qTable.toString())
  }
  console.log()

  // Recommendations
  console.log(chalk.bold('💡 Recommendations'))
  const lowHitRate = tierData.some(t => parseFloat(t.hitRate) < 70)
  if (lowHitRate) {
    console.log('- Consider increasing TTL if hit rate is low')
  }
  const highMisses = tierData.some(t => t.misses > t.hits)
  if (highMisses) {
    console.log('- Consider cache warming for popular queries')
  }
  if (redisStatus.evictedKeys > 0) {
    console.log('- Redis memory is high, consider increasing memory or reducing cache size')
  }
  if (!lowHitRate && !highMisses && redisStatus.evictedKeys === 0) {
    console.log('- Cache performance looks good!')
  }
}

async function main() {
  await displayMetrics()
  if (watch) {
    setInterval(displayMetrics, 10000)
  }
}

import { fileURLToPath } from 'url'

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })
}
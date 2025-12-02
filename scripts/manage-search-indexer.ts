#!/usr/bin/env tsx
/**
 * CLI tool for managing MeiliSearch indexer and queue
 *
 * Usage:
 *   tsx scripts/manage-search-indexer.ts <command> [options]
 *
 * Commands:
 *   status          - Show queue statistics and MeiliSearch status
 *   reindex         - Trigger full or partial reindex
 *   clear-queue     - Clear specified queue
 *   retry-failed    - Retry all failed jobs
 *   test [id]       - Test indexing a single product
 *   worker          - Start the worker process
 */

import {
  getQueueStats,
  clearQueue,
  retryFailedJobs,
  startWorker,
} from '@/lib/search-queue'
import { indexProduct, reindexAll } from '@/lib/search-indexer'
import { isAvailable, getIndex } from '@/lib/meilisearch-client'
import { prisma } from '@/lib/prisma'

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function showStatus() {
  log('\n📊 MeiliSearch Indexer Status\n', 'cyan')

  // Check MeiliSearch availability
  const available = await isAvailable()
  if (available) {
    log('✅ MeiliSearch: Available', 'green')
  } else {
    log('❌ MeiliSearch: Not Available', 'red')
  }

  // Get queue statistics
  const stats = await getQueueStats()
  log('\n📦 Queue Statistics:', 'cyan')
  log(`   Main Queue:       ${stats.mainQueue} jobs`)
  log(`   Processing:       ${stats.processingQueue} jobs`)
  log(`   Failed:           ${stats.failedQueue} jobs`)

  // Get MeiliSearch index stats
  if (available) {
    try {
      const index = getIndex('products')
      const indexStats = await index.getStats()
      log('\n🔍 MeiliSearch Index:', 'cyan')
      log(`   Documents:        ${indexStats.numberOfDocuments.toLocaleString()}`)
      log(`   Indexing:         ${indexStats.isIndexing ? 'Yes' : 'No'}`)
    } catch (error) {
      log('   Failed to fetch index stats', 'red')
    }
  }

  log('')
}

async function runReindex() {
  log('\n🔄 Starting Full Reindex\n', 'cyan')

  // Parse filters from command line arguments
  const args = process.argv.slice(3)
  const filters: any = {}

  for (const arg of args) {
    if (arg.startsWith('--category=')) {
      filters.categoryId = arg.split('=')[1]
    } else if (arg.startsWith('--vendor=')) {
      filters.vendorId = arg.split('=')[1]
    } else if (arg.startsWith('--status=')) {
      filters.status = arg.split('=')[1]
    }
  }

  if (Object.keys(filters).length > 0) {
    log(`📋 Filters: ${JSON.stringify(filters)}`, 'blue')
  }

  const startTime = Date.now()
  let lastProgress = { total: 0, indexed: 0, failed: 0 }

  const result = await reindexAll({
    filters,
    onProgress: (progress) => {
      lastProgress = progress
      const percent = Math.round((progress.indexed / progress.total) * 100)
      process.stdout.write(
        `\r⏳ Progress: ${progress.indexed}/${progress.total} (${percent}%) - Failed: ${progress.failed}`
      )
    },
  })

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)

  log(`\n\n✅ Reindex Complete!`, 'green')
  log(`   Total:            ${result.total.toLocaleString()}`)
  log(`   Indexed:          ${result.indexed.toLocaleString()}`, 'green')
  log(`   Failed:           ${result.failed}`, result.failed > 0 ? 'red' : 'green')
  log(`   Duration:         ${duration}s`)
  log(`   Speed:            ${(result.indexed / Number(duration)).toFixed(0)} products/sec\n`)

  if (result.errors.length > 0) {
    log('❌ Errors:', 'red')
    result.errors.slice(0, 5).forEach((err) => {
      log(`   ${err.productId}: ${err.error}`, 'red')
    })
    if (result.errors.length > 5) {
      log(`   ... and ${result.errors.length - 5} more`, 'yellow')
    }
  }
}

async function clearQueueCmd() {
  const queueName = (process.argv[3] || 'main') as 'main' | 'processing' | 'failed'

  log(`\n🗑️  Clearing ${queueName} queue...\n`, 'yellow')

  // Confirm with user
  process.stdout.write('Are you sure? (y/n): ')
  process.stdin.once('data', async (data) => {
    const answer = data.toString().trim().toLowerCase()
    if (answer === 'y' || answer === 'yes') {
      const count = await clearQueue(queueName)
      log(`✅ Cleared ${count} jobs from ${queueName} queue\n`, 'green')
      process.exit(0)
    } else {
      log('❌ Cancelled\n', 'red')
      process.exit(0)
    }
  })
}

async function retryFailedCmd() {
  log('\n🔄 Retrying Failed Jobs...\n', 'cyan')

  const count = await retryFailedJobs()
  log(`✅ Moved ${count} jobs back to main queue\n`, 'green')
}

async function testIndexing() {
  const productId = process.argv[3]

  log('\n🧪 Testing Product Indexing\n', 'cyan')

  let testProductId = productId

  // If no product ID provided, find first ACTIVE product
  if (!testProductId) {
    log('No product ID provided, finding first ACTIVE product...')
    const product = await prisma.product.findFirst({
      where: { status: 'ACTIVE' },
    })
    if (!product) {
      log('❌ No ACTIVE products found\n', 'red')
      process.exit(1)
    }
    testProductId = product.id
    log(`Found product: ${product.name} (${testProductId})`, 'blue')
  }

  // Index the product
  log(`\n⏳ Indexing product ${testProductId}...`)
  const result = await indexProduct(testProductId)

  if (result.success) {
    log(`✅ Successfully indexed!`, 'green')
    log(`   Product ID:       ${result.productId}`)
    log(`   Task UID:         ${result.taskUid}`)
    log(`   Duration:         ${result.duration}ms`)

    // Verify in MeiliSearch
    log(`\n🔍 Verifying in MeiliSearch...`)
    const index = getIndex('products')
    const doc = await index.getDocument(testProductId)
    log(`✅ Document found in index:`, 'green')
    log(`   Name:             ${doc.name}`)
    log(`   Status:           ${doc.status}`)
    log(`   Stock:            ${doc.stock}`)
    log(`   In Stock:         ${doc.inStock ? 'Yes' : 'No'}`)
  } else {
    log(`❌ Failed to index:`, 'red')
    log(`   Error:            ${result.error}`, 'red')
  }

  log('')
}

function showHelp() {
  log('\n📖 MeiliSearch Indexer Management\n', 'cyan')
  log('Usage:')
  log('  tsx scripts/manage-search-indexer.ts <command> [options]\n')
  log('Commands:')
  log('  status                    Show queue statistics and MeiliSearch status')
  log('  reindex                   Trigger full reindex')
  log('  reindex --category=ID     Reindex products in category')
  log('  reindex --vendor=ID       Reindex products from vendor')
  log('  reindex --status=STATUS   Reindex products with status (ACTIVE/DRAFT/ARCHIVED)')
  log('  clear-queue [name]        Clear queue (main/processing/failed)')
  log('  retry-failed              Retry all failed jobs')
  log('  test [productId]          Test indexing a single product')
  log('  worker                    Start the worker process')
  log('  help                      Show this help message\n')
}

async function main() {
  const command = process.argv[2]

  if (!command || command === 'help' || command === '--help') {
    showHelp()
    process.exit(0)
  }

  try {
    switch (command) {
      case 'status':
        await showStatus()
        break

      case 'reindex':
        await runReindex()
        break

      case 'clear-queue':
        await clearQueueCmd()
        return // Don't exit immediately (waiting for user input)

      case 'retry-failed':
        await retryFailedCmd()
        break

      case 'test':
        await testIndexing()
        break

      case 'worker':
        await startWorker()
        break

      default:
        log(`❌ Unknown command: ${command}\n`, 'red')
        showHelp()
        process.exit(1)
    }

    process.exit(0)
  } catch (error) {
    log(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`, 'red')
    process.exit(1)
  }
}

main()

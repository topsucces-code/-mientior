#!/usr/bin/env tsx
/**
 * MeiliSearch Indexer Worker
 *
 * Standalone background process that consumes indexing jobs from Redis queue.
 * Run with: npm run search:worker
 */

import { startWorker, getWorkerConfig } from '../src/lib/search-queue'
import { isAvailable } from '../src/lib/meilisearch-client'
import { redis } from '../src/lib/redis'

async function main() {
  // Check if indexer is enabled
  const config = getWorkerConfig()
  if (!config.enabled) {
    console.log('❌ Indexer disabled by SEARCH_INDEXER_ENABLED=false')
    process.exit(0)
  }

  console.log('🚀 Starting MeiliSearch Indexer Worker...')

  try {
    // Check MeiliSearch availability
    const available = await isAvailable()
    if (!available) {
      console.error('❌ MeiliSearch is not available. Exiting.')
      process.exit(1)
    }

    console.log('✅ MeiliSearch is available')

    // Check Redis connection
    try {
      await redis.ping()
      console.log('✅ Redis connected')
    } catch (error) {
      console.error('❌ Redis is not available:', error)
      process.exit(1)
    }

    console.log('⏳ Waiting for jobs...\n')

    // Start worker loop
    await startWorker()
  } catch (error) {
    console.error('❌ Worker error:', error)
    process.exit(1)
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error)
  process.exit(1)
})

// Start the worker
main()

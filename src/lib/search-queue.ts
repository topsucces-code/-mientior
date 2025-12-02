/**
 * Redis-based Job Queue for MeiliSearch Indexing
 *
 * Lightweight queue system using Redis lists for asynchronous product indexing.
 */

import { redis } from '@/lib/redis'
import { indexProduct, deleteProduct, indexProducts, reindexAll } from '@/lib/search-indexer'
import type { IndexJob, QueueStats, WorkerConfig } from '@/types/search-indexer'
import { createId } from '@paralleldrive/cuid2'

// Configuration
const QUEUE_PREFIX = 'search:queue:'
const MAIN_QUEUE = `${QUEUE_PREFIX}jobs`
const PROCESSING_QUEUE = `${QUEUE_PREFIX}processing`
const FAILED_QUEUE = `${QUEUE_PREFIX}failed`

const MAX_RETRIES = Number(process.env.SEARCH_INDEXER_MAX_RETRIES) || 3
const POLL_INTERVAL = Number(process.env.SEARCH_INDEXER_POLL_INTERVAL) || 1000
const BACKOFF_BASE = Number(process.env.SEARCH_INDEXER_BACKOFF_BASE) || 2

// Worker control
let shouldStop = false
let isProcessing = false

/**
 * Enqueue a single product index job
 */
export async function enqueueIndexJob(productId: string): Promise<string> {
  const job: IndexJob = {
    id: createId(),
    type: 'index',
    productId,
    attempts: 0,
    createdAt: Date.now(),
  }

  await redis.lpush(MAIN_QUEUE, JSON.stringify(job))
  return job.id
}

/**
 * Enqueue a product delete job
 */
export async function enqueueDeleteJob(productId: string): Promise<string> {
  const job: IndexJob = {
    id: createId(),
    type: 'delete',
    productId,
    attempts: 0,
    createdAt: Date.now(),
  }

  await redis.lpush(MAIN_QUEUE, JSON.stringify(job))
  return job.id
}

/**
 * Enqueue a batch index job
 */
export async function enqueueBatchIndexJob(productIds: string[]): Promise<string> {
  const job: IndexJob = {
    id: createId(),
    type: 'update',
    productIds,
    attempts: 0,
    createdAt: Date.now(),
  }

  await redis.lpush(MAIN_QUEUE, JSON.stringify(job))
  return job.id
}

/**
 * Enqueue a full reindex job
 */
export async function enqueueReindexJob(filters?: IndexJob['filters']): Promise<string> {
  const job: IndexJob = {
    id: createId(),
    type: 'reindex-all',
    filters,
    attempts: 0,
    createdAt: Date.now(),
  }

  await redis.lpush(MAIN_QUEUE, JSON.stringify(job))
  return job.id
}

/**
 * Dequeue a job from the main queue (move to processing)
 */
export async function dequeueJob(): Promise<IndexJob | null> {
  try {
    // Pop from main queue
    const jobString = await redis.rpop(MAIN_QUEUE)
    if (!jobString) return null

    const job = JSON.parse(jobString) as IndexJob

    // Move to processing queue
    await redis.lpush(PROCESSING_QUEUE, JSON.stringify(job))

    return job
  } catch (error) {
    console.error('[Queue] Failed to dequeue job:', error)
    return null
  }
}

/**
 * Complete a job (remove from processing queue)
 */
export async function completeJob(jobId: string): Promise<void> {
  try {
    // Get all jobs from processing queue
    const jobs = await redis.lrange(PROCESSING_QUEUE, 0, -1)

    // Find and remove the completed job
    for (const jobString of jobs) {
      const job = JSON.parse(jobString) as IndexJob
      if (job.id === jobId) {
        await redis.lrem(PROCESSING_QUEUE, 1, jobString)
        break
      }
    }
  } catch (error) {
    console.error('[Queue] Failed to complete job:', error)
  }
}

/**
 * Fail a job (retry or move to failed queue)
 */
export async function failJob(jobId: string, error: string): Promise<void> {
  try {
    // Get all jobs from processing queue
    const jobs = await redis.lrange(PROCESSING_QUEUE, 0, -1)

    // Find the failed job
    for (const jobString of jobs) {
      const job = JSON.parse(jobString) as IndexJob
      if (job.id === jobId) {
        // Remove from processing queue
        await redis.lrem(PROCESSING_QUEUE, 1, jobString)

        // Update job with error and increment attempts
        job.attempts += 1
        job.error = error

        if (job.attempts < MAX_RETRIES) {
          // Retry with exponential backoff
          const delay = Math.pow(BACKOFF_BASE, job.attempts) * 1000
          console.log(`[Queue] Retrying job ${jobId} in ${delay}ms (attempt ${job.attempts}/${MAX_RETRIES})`)

          // Re-queue after delay
          setTimeout(async () => {
            await redis.lpush(MAIN_QUEUE, JSON.stringify(job))
          }, delay)
        } else {
          // Move to failed queue (max retries exceeded)
          console.error(`[Queue] Job ${jobId} failed after ${MAX_RETRIES} attempts:`, error)
          await redis.lpush(FAILED_QUEUE, JSON.stringify(job))
        }
        break
      }
    }
  } catch (error) {
    console.error('[Queue] Failed to handle job failure:', error)
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<QueueStats> {
  try {
    const [mainQueue, processingQueue, failedQueue] = await Promise.all([
      redis.llen(MAIN_QUEUE),
      redis.llen(PROCESSING_QUEUE),
      redis.llen(FAILED_QUEUE),
    ])

    return {
      mainQueue,
      processingQueue,
      failedQueue,
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error('[Queue] Failed to get queue stats:', error)
    return {
      mainQueue: 0,
      processingQueue: 0,
      failedQueue: 0,
      timestamp: Date.now(),
    }
  }
}

/**
 * Clear a queue
 */
export async function clearQueue(queueName: 'main' | 'processing' | 'failed'): Promise<number> {
  try {
    let key: string
    switch (queueName) {
      case 'main':
        key = MAIN_QUEUE
        break
      case 'processing':
        key = PROCESSING_QUEUE
        break
      case 'failed':
        key = FAILED_QUEUE
        break
    }

    const count = await redis.llen(key)
    await redis.del(key)
    return count
  } catch (error) {
    console.error(`[Queue] Failed to clear ${queueName} queue:`, error)
    return 0
  }
}

/**
 * Retry all failed jobs
 */
export async function retryFailedJobs(): Promise<number> {
  try {
    const jobs = await redis.lrange(FAILED_QUEUE, 0, -1)

    for (const jobString of jobs) {
      const job = JSON.parse(jobString) as IndexJob
      // Reset attempts
      job.attempts = 0
      delete job.error
      // Move back to main queue
      await redis.lpush(MAIN_QUEUE, JSON.stringify(job))
    }

    // Clear failed queue
    const count = jobs.length
    await redis.del(FAILED_QUEUE)

    return count
  } catch (error) {
    console.error('[Queue] Failed to retry failed jobs:', error)
    return 0
  }
}

/**
 * Process a single job
 */
async function processJob(job: IndexJob): Promise<void> {
  console.log(`[Worker] Processing ${job.type} job ${job.id}`)

  try {
    switch (job.type) {
      case 'index':
      case 'update':
        if (job.productId) {
          const result = await indexProduct(job.productId)
          if (!result.success) {
            throw new Error(result.error || 'Failed to index product')
          }
        } else if (job.productIds) {
          const result = await indexProducts(job.productIds)
          if (result.failed > 0) {
            throw new Error(`Failed to index ${result.failed}/${result.total} products`)
          }
        }
        break

      case 'delete':
        if (job.productId) {
          const result = await deleteProduct(job.productId)
          if (!result.success) {
            throw new Error(result.error || 'Failed to delete product')
          }
        }
        break

      case 'reindex-all':
        const config = getWorkerConfig()
        const result = await reindexAll({
          filters: job.filters,
          batchSize: config.batchSize,
          onProgress: (progress) => {
            console.log(`[Worker] Reindex progress: ${progress.indexed}/${progress.total} (${progress.failed} failed)`)
          }
        })
        if (result.failed > 0) {
          console.warn(`[Worker] Reindex completed with ${result.failed} failures`)
        }
        break
    }

    await completeJob(job.id)
    console.log(`[Worker] Completed ${job.type} job ${job.id}`)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Worker] Job ${job.id} failed:`, errorMessage)
    await failJob(job.id, errorMessage)
  }
}

/**
 * Start the worker process
 */
export async function startWorker(): Promise<void> {
  const config = getWorkerConfig()
  if (!config.enabled) {
    console.log('[Worker] Disabled by SEARCH_INDEXER_ENABLED=false')
    return
  }

  console.log('[Worker] Starting MeiliSearch indexer worker...')
  shouldStop = false

  // Graceful shutdown handlers
  const shutdown = () => {
    console.log('\n[Worker] Shutdown signal received')
    shouldStop = true
    if (!isProcessing) {
      console.log('[Worker] No job in progress, exiting immediately')
      process.exit(0)
    } else {
      console.log('[Worker] Waiting for current job to complete...')
    }
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  // Worker loop
  while (!shouldStop) {
    try {
      // Get next job
      const job = await dequeueJob()

      if (job) {
        isProcessing = true
        await processJob(job)
        isProcessing = false
      } else {
        // No jobs available, wait before polling again
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
      }
    } catch (error) {
      console.error('[Worker] Error in worker loop:', error)
      isProcessing = false
      // Brief pause before continuing to avoid tight error loops
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
  }

  console.log('[Worker] Worker stopped gracefully')
  process.exit(0)
}

/**
 * Get worker configuration
 */
export function getWorkerConfig(): WorkerConfig {
  return {
    pollInterval: POLL_INTERVAL,
    maxRetries: MAX_RETRIES,
    backoffBase: BACKOFF_BASE,
    batchSize: Number(process.env.SEARCH_INDEXER_BATCH_SIZE) || 1000,
    enabled: process.env.SEARCH_INDEXER_ENABLED !== 'false',
  }
}

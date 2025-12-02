/**
 * Redis-based Job Queue for PIM Synchronization
 *
 * Lightweight queue system using Redis lists for asynchronous product synchronization
 * from Akeneo PIM to Mientior. This module handles queue management (enqueue, dequeue,
 * complete, fail, stats) but does NOT include worker logic for processing jobs.
 *
 * Architecture:
 * - Uses Redis lists with LPUSH/RPOP pattern for FIFO queue behavior
 * - Three queues: main (pending), processing (active), failed (exhausted retries)
 * - Implements exponential backoff retry logic with configurable max retries
 * - Similar pattern to src/lib/search-queue.ts but for PIM sync operations
 *
 * @see src/lib/search-queue.ts - Search indexer queue (similar pattern)
 * @see src/types/akeneo.ts - PimSyncJob, PimSyncQueueStats types
 * @see src/lib/pim-sync-worker.ts - Worker implementation (to be created by another engineer)
 */

import { redis } from '@/lib/redis'
import type { PimSyncJob, PimSyncQueueStats, PimSyncOperation } from '@/types/akeneo'
import { createId } from '@paralleldrive/cuid2'

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

/**
 * Base prefix for all PIM sync queue Redis keys.
 * All queue keys are namespaced under this prefix to avoid collisions.
 */
const QUEUE_PREFIX = 'pim:sync:queue:'

/**
 * Main queue key for pending jobs.
 * Jobs are pushed to the left (LPUSH) and popped from the right (RPOP) for FIFO.
 */
const MAIN_QUEUE = `${QUEUE_PREFIX}jobs`

/**
 * Processing queue key for active jobs.
 * Jobs move here when dequeued and are removed when completed or failed.
 */
const PROCESSING_QUEUE = `${QUEUE_PREFIX}processing`

/**
 * Failed queue key for jobs that exhausted retries.
 * Jobs move here after MAX_RETRIES attempts and require manual intervention.
 */
const FAILED_QUEUE = `${QUEUE_PREFIX}failed`

/**
 * Maximum number of retry attempts before moving job to failed queue.
 * Configurable via PIM_SYNC_MAX_RETRIES environment variable.
 * Default: 3 attempts
 *
 * Note: This represents the total number of processing attempts (initial + retries).
 * With MAX_RETRIES=3, a job will be:
 * - Processed initially (attempt 0)
 * - Retried on first failure (attempt 1)
 * - Retried on second failure (attempt 2)
 * - Moved to failed queue on third failure (attempt 3 reached)
 * So the job gets MAX_RETRIES-1 retries after the initial failure.
 */
const MAX_RETRIES = Number(process.env.PIM_SYNC_MAX_RETRIES) || 3

/**
 * Base for exponential backoff calculation.
 * Delay between retries = BACKOFF_BASE^attempts * 1000 milliseconds.
 * Configurable via PIM_SYNC_BACKOFF_BASE environment variable.
 * Default: 2 (delays: 2s, 4s, 8s for 3 retries)
 */
const BACKOFF_BASE = Number(process.env.PIM_SYNC_BACKOFF_BASE) || 2

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get PIM sync queue configuration.
 *
 * Returns the current queue configuration values for use by consumers
 * and monitoring tools. This provides a centralized access point for
 * queue settings, similar to getWorkerConfig() in search-queue.ts.
 *
 * @returns Object containing queue configuration settings
 *
 * @example
 * const config = getPimQueueConfig()
 * console.log(`Max retries: ${config.maxRetries}`)
 * console.log(`Backoff base: ${config.backoffBase}`)
 *
 * @see src/lib/search-queue.ts - getWorkerConfig() for comparison
 */
export function getPimQueueConfig() {
  return {
    maxRetries: MAX_RETRIES,
    backoffBase: BACKOFF_BASE,
  }
}

// ============================================================================
// QUEUE MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Enqueue a PIM sync job to the main queue.
 *
 * Creates a new job with unique ID and pushes it to the main queue for processing.
 * The job will be picked up by a worker process via dequeuePimSyncJob().
 *
 * @param akeneoProductId - Akeneo product identifier/SKU to synchronize
 * @param operation - Type of operation (CREATE, UPDATE, or DELETE)
 * @param metadata - Optional metadata for debugging (e.g., webhook event ID, author info)
 * @returns Promise resolving to the unique job ID
 *
 * @example
 * // Enqueue a product update from webhook
 * const jobId = await enqueuePimSyncJob(
 *   'nike_air_max_90',
 *   'UPDATE',
 *   { webhookEventId: '550e8400-e29b-41d4-a716-446655440000' }
 * )
 * console.log(`Job ${jobId} enqueued`)
 *
 * @example
 * // Enqueue a product deletion
 * const jobId = await enqueuePimSyncJob('discontinued_sku', 'DELETE')
 */
export async function enqueuePimSyncJob(
  akeneoProductId: string,
  operation: PimSyncOperation,
  metadata?: Record<string, unknown>
): Promise<string> {
  const job: PimSyncJob = {
    id: createId(),
    type: operation,
    akeneoProductId,
    operation,
    attempts: 0,
    createdAt: Date.now(),
    ...(metadata && { metadata }),
  }

  await redis.lpush(MAIN_QUEUE, JSON.stringify(job))
  console.log(`[PIM Queue] Job ${job.id} enqueued: ${operation} ${akeneoProductId}`)

  return job.id
}

/**
 * Dequeue the next PIM sync job from the main queue.
 *
 * Pops a job from the right side of the main queue (FIFO) and moves it to the
 * processing queue. Returns null if no jobs are available.
 *
 * Workers should call this function in a loop with appropriate polling interval.
 *
 * @returns Promise resolving to the next job or null if queue is empty
 *
 * @example
 * // Worker polling loop
 * while (true) {
 *   const job = await dequeuePimSyncJob()
 *   if (job) {
 *     await processJob(job)
 *   } else {
 *     await sleep(1000) // No jobs, wait before polling again
 *   }
 * }
 */
export async function dequeuePimSyncJob(): Promise<PimSyncJob | null> {
  try {
    // Pop job from right side of main queue (FIFO)
    const jobString = await redis.rpop(MAIN_QUEUE)
    if (!jobString) return null

    const job = JSON.parse(jobString) as PimSyncJob

    // Move to processing queue
    await redis.lpush(PROCESSING_QUEUE, JSON.stringify(job))

    return job
  } catch (error) {
    console.error('[PIM Queue] Failed to dequeue job:', error)
    return null
  }
}

/**
 * Mark a job as completed and remove it from the processing queue.
 *
 * Should be called by workers after successfully processing a job.
 * This permanently removes the job from the queue system.
 *
 * @param jobId - Unique identifier of the job to complete
 * @returns Promise that resolves when job is removed
 *
 * @example
 * const job = await dequeuePimSyncJob()
 * if (job) {
 *   try {
 *     await syncProductFromAkeneo(job.akeneoProductId, job.operation)
 *     await completePimSyncJob(job.id)
 *     console.log(`Job ${job.id} completed successfully`)
 *   } catch (error) {
 *     await failPimSyncJob(job.id, error.message)
 *   }
 * }
 */
export async function completePimSyncJob(jobId: string): Promise<void> {
  try {
    // Get all jobs from processing queue
    const jobs = await redis.lrange(PROCESSING_QUEUE, 0, -1)

    // Find and remove the completed job
    for (const jobString of jobs) {
      const job = JSON.parse(jobString) as PimSyncJob
      if (job.id === jobId) {
        await redis.lrem(PROCESSING_QUEUE, 1, jobString)
        console.log(`[PIM Queue] Job ${jobId} completed`)
        break
      }
    }
  } catch (error) {
    console.error('[PIM Queue] Failed to complete job:', error)
  }
}

/**
 * Mark a job as failed with retry logic or move to failed queue.
 *
 * Implements exponential backoff retry strategy:
 * - If attempts < MAX_RETRIES: Re-queue job after calculated delay
 * - If attempts >= MAX_RETRIES: Move job to failed queue
 *
 * Delay calculation: Math.pow(BACKOFF_BASE, attempts) * 1000 milliseconds
 * Example with BACKOFF_BASE=2: 2s, 4s, 8s for retries 1, 2, 3
 *
 * @param jobId - Unique identifier of the job that failed
 * @param error - Error message describing why the job failed
 * @returns Promise that resolves when job is handled
 *
 * @example
 * const job = await dequeuePimSyncJob()
 * if (job) {
 *   try {
 *     await syncProductFromAkeneo(job.akeneoProductId, job.operation)
 *     await completePimSyncJob(job.id)
 *   } catch (error) {
 *     await failPimSyncJob(job.id, error.message)
 *     // Job will be retried with exponential backoff or moved to failed queue
 *   }
 * }
 */
export async function failPimSyncJob(jobId: string, error: string): Promise<void> {
  try {
    // Get all jobs from processing queue
    const jobs = await redis.lrange(PROCESSING_QUEUE, 0, -1)

    // Find the failed job
    for (const jobString of jobs) {
      const job = JSON.parse(jobString) as PimSyncJob
      if (job.id === jobId) {
        // Remove from processing queue
        await redis.lrem(PROCESSING_QUEUE, 1, jobString)

        // Update job with error and increment attempts
        job.attempts += 1
        job.error = error

        if (job.attempts < MAX_RETRIES) {
          // Retry with exponential backoff
          const delay = Math.pow(BACKOFF_BASE, job.attempts) * 1000
          console.log(
            `[PIM Queue] Retrying job ${jobId} in ${delay}ms (attempt ${job.attempts}/${MAX_RETRIES}): ${error}`
          )

          // Re-queue after delay
          setTimeout(async () => {
            try {
              await redis.lpush(MAIN_QUEUE, JSON.stringify(job))
            } catch (err) {
              console.error(
                `[PIM Queue] Failed to re-enqueue job ${job.id} after delay:`,
                err
              )
            }
          }, delay)
        } else {
          // Move to failed queue (max retries exceeded)
          console.error(
            `[PIM Queue] Job ${jobId} failed after ${MAX_RETRIES} attempts: ${error}`
          )
          await redis.lpush(FAILED_QUEUE, JSON.stringify(job))
        }
        break
      }
    }
  } catch (error) {
    console.error('[PIM Queue] Failed to handle job failure:', error)
  }
}

/**
 * Get current statistics for all PIM sync queues.
 *
 * Returns counts of jobs in each queue state. Useful for monitoring
 * queue health and identifying bottlenecks.
 *
 * @returns Promise resolving to queue statistics
 *
 * @example
 * const stats = await getPimSyncStats()
 * console.log(`Pending: ${stats.mainQueue}`)
 * console.log(`Processing: ${stats.processingQueue}`)
 * console.log(`Failed: ${stats.failedQueue}`)
 *
 * @example
 * // Monitor queue in a dashboard
 * setInterval(async () => {
 *   const stats = await getPimSyncStats()
 *   if (stats.failedQueue > 10) {
 *     alertOps('PIM sync has many failed jobs')
 *   }
 * }, 60000) // Check every minute
 */
export async function getPimSyncStats(): Promise<PimSyncQueueStats> {
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
    console.error('[PIM Queue] Failed to get queue stats:', error)
    return {
      mainQueue: 0,
      processingQueue: 0,
      failedQueue: 0,
      timestamp: Date.now(),
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clear a specific queue (for maintenance/testing).
 *
 * WARNING: This permanently deletes all jobs in the specified queue.
 * Use with caution - typically only for testing or emergency maintenance.
 *
 * @param queueName - Name of queue to clear ('main', 'processing', or 'failed')
 * @returns Promise resolving to number of jobs deleted
 *
 * @example
 * // Clear failed queue after fixing issues
 * const count = await clearPimSyncQueue('failed')
 * console.log(`Cleared ${count} failed jobs`)
 *
 * @example
 * // Clear all queues for testing
 * await clearPimSyncQueue('main')
 * await clearPimSyncQueue('processing')
 * await clearPimSyncQueue('failed')
 */
export async function clearPimSyncQueue(
  queueName: 'main' | 'processing' | 'failed'
): Promise<number> {
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
    console.log(`[PIM Queue] Cleared ${count} jobs from ${queueName} queue`)
    return count
  } catch (error) {
    console.error(`[PIM Queue] Failed to clear ${queueName} queue:`, error)
    return 0
  }
}

/**
 * Retry all failed jobs by moving them back to the main queue.
 *
 * Resets the attempts counter to 0 and clears error messages, giving
 * failed jobs a fresh start. Useful after fixing issues that caused failures.
 *
 * @returns Promise resolving to number of jobs retried
 *
 * @example
 * // Retry failed jobs after fixing Akeneo API credentials
 * const count = await retryFailedPimSyncJobs()
 * console.log(`Retrying ${count} failed jobs`)
 *
 * @example
 * // Check failed jobs before retrying
 * const stats = await getPimSyncStats()
 * if (stats.failedQueue > 0) {
 *   console.log(`Found ${stats.failedQueue} failed jobs`)
 *   const retried = await retryFailedPimSyncJobs()
 *   console.log(`Retried ${retried} jobs`)
 * }
 */
export async function retryFailedPimSyncJobs(): Promise<number> {
  try {
    const jobs = await redis.lrange(FAILED_QUEUE, 0, -1)

    for (const jobString of jobs) {
      const job = JSON.parse(jobString) as PimSyncJob
      // Reset attempts and clear error
      job.attempts = 0
      delete job.error
      // Move back to main queue
      await redis.lpush(MAIN_QUEUE, JSON.stringify(job))
    }

    // Clear failed queue
    const count = jobs.length
    await redis.del(FAILED_QUEUE)

    console.log(`[PIM Queue] Retrying ${count} failed jobs`)
    return count
  } catch (error) {
    console.error('[PIM Queue] Failed to retry failed jobs:', error)
    return 0
  }
}

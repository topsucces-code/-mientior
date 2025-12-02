import { MeiliSearch, Index, Settings, SearchParams, SearchResponse } from 'meilisearch'

// Configuration
const MEILISEARCH_URL = process.env.MEILISEARCH_URL || 'http://localhost:7700'
const MEILISEARCH_MASTER_KEY = process.env.MEILISEARCH_MASTER_KEY || ''
const INDEX_PREFIX = process.env.MEILISEARCH_INDEX_PREFIX || 'mientior_'
export const ENABLE_MEILISEARCH = process.env.ENABLE_MEILISEARCH === 'true'

// Types
export interface MeiliSearchConfig {
  url: string
  masterKey: string
  indexPrefix: string
  enabled: boolean
}

export interface IndexStats {
  numberOfDocuments: number
  isIndexing: boolean
  fieldDistribution: Record<string, number>
}

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * ========================================
 * FUNCTION USAGE GUIDE
 * ========================================
 *
 * This file contains two types of functions:
 *
 * 1. CLI/ADMINISTRATION FUNCTIONS (throw on failure):
 *    - getIndex()
 *    - waitForTask()
 *    - updateIndexSettings()
 *    - createIndexIfNotExists()
 *    - deleteIndex()
 *    - getStats()
 *
 *    These functions throw errors on failure and are intended for:
 *    - CLI scripts (init-meilisearch.ts, meilisearch-status.ts)
 *    - Administration tasks
 *    - Build-time operations
 *    - Development tools
 *
 * 2. RUNTIME/API FUNCTIONS (never throw, return safe defaults):
 *    - safeGetStats()
 *    - safeCreateIndexIfNotExists()
 *    - safeUpdateIndexSettings()
 *    - safeWaitForTask()
 *
 *    These functions never throw and return null/defaults on failure.
 *    They are intended for:
 *    - API routes
 *    - Server components
 *    - Production runtime code
 *    - User-facing features
 *
 * Usage recommendation:
 * - In API routes → Use safe* variants to prevent crashes
 * - In scripts → Use throwing variants to catch issues early
 * - When in doubt → Use safe* variants for production code
 *
 * ========================================
 */

// Client Singleton
export const meilisearchClient = new MeiliSearch({
  host: MEILISEARCH_URL,
  apiKey: MEILISEARCH_MASTER_KEY,
})

// Availability cache
let availabilityCache: { value: boolean; timestamp: number } | null = null
const AVAILABILITY_CACHE_TTL = 30000 // 30 seconds

/**
 * Get an index with automatic prefix
 */
export function getIndex(indexName: string): Index {
  try {
    const prefixedName = `${INDEX_PREFIX}${indexName}`
    return meilisearchClient.index(prefixedName)
  } catch (error) {
    console.error(`Error getting MeiliSearch index ${indexName}:`, error)
    throw error
  }
}

/**
 * Check if MeiliSearch is available
 */
export async function isAvailable(): Promise<boolean> {
  try {
    // Check cache
    if (availabilityCache) {
      const now = Date.now()
      if (now - availabilityCache.timestamp < AVAILABILITY_CACHE_TTL) {
        return availabilityCache.value
      }
    }

    // Check health endpoint
    const health = await meilisearchClient.health()
    const isHealthy = health.status === 'available'

    // Update cache
    availabilityCache = {
      value: isHealthy,
      timestamp: Date.now(),
    }

    return isHealthy
  } catch (error) {
    console.error('MeiliSearch availability check failed:', error)

    // Update cache with false
    availabilityCache = {
      value: false,
      timestamp: Date.now(),
    }

    return false
  }
}

/**
 * Wait for a task to complete
 */
export async function waitForTask(taskUid: number, timeout = 5000): Promise<any> {
  try {
    const task = await meilisearchClient.waitForTask(taskUid, {
      timeOutMs: timeout,
    })

    if (task.status === 'failed') {
      console.error('MeiliSearch task failed:', task)
      throw new Error(`Task ${taskUid} failed: ${task.error?.message || 'Unknown error'}`)
    }

    return task
  } catch (error) {
    console.error(`Error waiting for MeiliSearch task ${taskUid}:`, error)
    throw error
  }
}

/**
 * Update index settings
 */
export async function updateIndexSettings(
  indexName: string,
  settings: Settings
): Promise<void> {
  try {
    const index = getIndex(indexName)
    const task = await index.updateSettings(settings)
    await waitForTask(task.taskUid)
    console.log(`Settings updated for index ${indexName}`)
  } catch (error) {
    console.error(`Error updating settings for index ${indexName}:`, error)
    throw error
  }
}

/**
 * Create an index if it doesn't exist
 */
export async function createIndexIfNotExists(
  indexName: string,
  primaryKey = 'id'
): Promise<Index> {
  try {
    const prefixedName = `${INDEX_PREFIX}${indexName}`

    // Try to get the index
    try {
      const existingIndex = await meilisearchClient.getIndex(prefixedName)
      console.log(`Index ${prefixedName} already exists`)
      return existingIndex
    } catch (error: any) {
      // Index doesn't exist, create it
      if (error.code === 'index_not_found' || error.cause?.code === 'index_not_found') {
        console.log(`Creating index ${prefixedName}...`)
        const task = await meilisearchClient.createIndex(prefixedName, { primaryKey })
        await waitForTask(task.taskUid)
        const newIndex = await meilisearchClient.getIndex(prefixedName)
        console.log(`Index ${prefixedName} created successfully`)
        return newIndex
      }
      throw error
    }
  } catch (error) {
    console.error(`Error creating index ${indexName}:`, error)
    throw error
  }
}

/**
 * Delete an index
 */
export async function deleteIndex(indexName: string): Promise<void> {
  try {
    const prefixedName = `${INDEX_PREFIX}${indexName}`
    const task = await meilisearchClient.deleteIndex(prefixedName)
    await waitForTask(task.taskUid)
    console.log(`Index ${prefixedName} deleted successfully`)
  } catch (error) {
    console.error(`Error deleting index ${indexName}:`, error)
    throw error
  }
}

/**
 * Get MeiliSearch statistics
 */
export async function getStats(): Promise<any> {
  try {
    const stats = await meilisearchClient.getStats()
    return stats
  } catch (error) {
    console.error('Error getting MeiliSearch stats:', error)
    throw error
  }
}

/**
 * Get configuration
 */
export function getConfig(): MeiliSearchConfig {
  return {
    url: MEILISEARCH_URL,
    masterKey: MEILISEARCH_MASTER_KEY ? '***hidden***' : '',
    indexPrefix: INDEX_PREFIX,
    enabled: ENABLE_MEILISEARCH,
  }
}

/**
 * Clear availability cache (useful for testing)
 */
export function clearAvailabilityCache(): void {
  availabilityCache = null
}

// ========================================
// SAFE RUNTIME WRAPPERS (never throw)
// ========================================

/**
 * Safe wrapper for getStats() - returns null on failure
 * @returns Stats object or null if MeiliSearch is unavailable
 */
export async function safeGetStats(): Promise<any | null> {
  try {
    return await getStats()
  } catch (error) {
    console.error('safeGetStats failed:', error)
    return null
  }
}

/**
 * Safe wrapper for createIndexIfNotExists() - returns null on failure
 * @param indexName The name of the index to create
 * @param primaryKey The primary key field (default: 'id')
 * @returns Index object or null if creation failed
 */
export async function safeCreateIndexIfNotExists(
  indexName: string,
  primaryKey = 'id'
): Promise<Index | null> {
  try {
    return await createIndexIfNotExists(indexName, primaryKey)
  } catch (error) {
    console.error(`safeCreateIndexIfNotExists failed for ${indexName}:`, error)
    return null
  }
}

/**
 * Safe wrapper for updateIndexSettings() - returns boolean success status
 * @param indexName The name of the index
 * @param settings The settings to apply
 * @returns true if successful, false otherwise
 */
export async function safeUpdateIndexSettings(
  indexName: string,
  settings: Settings
): Promise<boolean> {
  try {
    await updateIndexSettings(indexName, settings)
    return true
  } catch (error) {
    console.error(`safeUpdateIndexSettings failed for ${indexName}:`, error)
    return false
  }
}

/**
 * Safe wrapper for waitForTask() - returns null on failure
 * @param taskUid The task UID to wait for
 * @param timeout Timeout in milliseconds (default: 5000)
 * @returns Task object or null if task failed or timed out
 */
export async function safeWaitForTask(taskUid: number, timeout = 5000): Promise<any | null> {
  try {
    return await waitForTask(taskUid, timeout)
  } catch (error) {
    console.error(`safeWaitForTask failed for task ${taskUid}:`, error)
    return null
  }
}

/**
 * Safe wrapper for deleteIndex() - returns boolean success status
 * @param indexName The name of the index to delete
 * @returns true if successful, false otherwise
 */
export async function safeDeleteIndex(indexName: string): Promise<boolean> {
  try {
    await deleteIndex(indexName)
    return true
  } catch (error) {
    console.error(`safeDeleteIndex failed for ${indexName}:`, error)
    return false
  }
}

/**
 * Safe wrapper using Result type for more detailed error handling
 * @param indexName The name of the index to create
 * @param primaryKey The primary key field (default: 'id')
 * @returns Result object with success/error information
 */
export async function safeCreateIndexResult(
  indexName: string,
  primaryKey = 'id'
): Promise<Result<Index, string>> {
  try {
    const index = await createIndexIfNotExists(indexName, primaryKey)
    return { success: true, data: index }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`safeCreateIndexResult failed for ${indexName}:`, error)
    return { success: false, error: errorMessage }
  }
}

/**
 * Safe wrapper using Result type for stats retrieval
 * @returns Result object with success/error information
 */
export async function safeGetStatsResult(): Promise<Result<any, string>> {
  try {
    const stats = await getStats()
    return { success: true, data: stats }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('safeGetStatsResult failed:', error)
    return { success: false, error: errorMessage }
  }
}

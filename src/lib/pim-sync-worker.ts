/**
 * PIM Sync Worker
 *
 * Processes jobs from the Redis queue to synchronize products between Akeneo PIM
 * and Mientior's database. Handles CREATE, UPDATE, and DELETE operations with
 * full audit logging and transaction support.
 *
 * Architecture:
 * - Worker loop with polling interval (similar to search-queue.ts pattern)
 * - Job processing with atomic Prisma transactions
 * - Graceful shutdown with SIGTERM/SIGINT handlers
 * - Comprehensive error handling and retry mechanism
 * - Audit trail via PimSyncLog and bidirectional mapping via PimProductMapping
 *
 * Integration Points:
 * - Redis Queue: src/lib/pim-sync-queue.ts for job management
 * - Akeneo Transformer: src/lib/akeneo-transformer.ts for data transformation
 * - Akeneo Client: src/lib/akeneo-client.ts (to be created in subsequent phase)
 * - Database: Prisma for atomic operations with PimSyncLog and PimProductMapping
 *
 * @module pim-sync-worker
 */

import { prisma } from './prisma';
import {
  dequeuePimSyncJob,
  completePimSyncJob,
  failPimSyncJob,
  getPimQueueConfig,
} from './pim-sync-queue';
import { transformAkeneoProduct } from './akeneo-transformer';
import type {
  PimSyncJob,
  PimSyncResult,
  AkeneoProduct,
} from '@/types/akeneo';
import { PimSyncStatus, PimSyncOperation } from '@prisma/client';

// ============================================================================
// Configuration
// ============================================================================

const POLL_INTERVAL =
  parseInt(process.env.PIM_SYNC_WORKER_POLL_INTERVAL || '5000', 10);
const WORKER_ENABLED =
  process.env.PIM_SYNC_WORKER_ENABLED === 'true';

// Worker control flags
let shouldStop = false;
let isProcessing = false;

// ============================================================================
// Placeholder Akeneo API Functions
// ============================================================================

/**
 * Fetches a product from Akeneo PIM by identifier.
 *
 * **PLACEHOLDER**: This function will be replaced when src/lib/akeneo-client.ts
 * is created by another engineer in a subsequent phase. The Akeneo client will
 * handle authentication, rate limiting, and API communication.
 *
 * TODO: Replace this placeholder with actual Akeneo API client implementation
 * from src/lib/akeneo-client.ts when available.
 *
 * @param identifier - The Akeneo product identifier (SKU)
 * @returns Promise resolving to the Akeneo product data
 * @throws Error indicating the Akeneo client is not yet implemented
 */
async function fetchAkeneoProduct(
  identifier: string
): Promise<AkeneoProduct> {
  // Placeholder implementation - throws until real client is created
  throw new Error(
    `Akeneo client not implemented. Cannot fetch product: ${identifier}. ` +
      'TODO: Implement src/lib/akeneo-client.ts with fetchProduct() method.'
  );
}

/**
 * Deletes or marks a product reference in Akeneo PIM.
 *
 * **PLACEHOLDER**: This function is a placeholder for DELETE operations.
 * In most cases, DELETE operations only require local cleanup (removing from
 * Mientior database and mapping table). However, if bidirectional sync or
 * reference cleanup is needed, this function can be implemented in the
 * akeneo-client.ts module.
 *
 * TODO: Implement in src/lib/akeneo-client.ts if bidirectional DELETE sync
 * is required in your architecture.
 *
 * @param identifier - The Akeneo product identifier (SKU)
 * @returns Promise resolving when the reference is deleted
 */
async function deleteAkeneoProductReference(
  identifier: string
): Promise<void> {
  // Placeholder - may not be needed for one-way sync (Akeneo -> Mientior)
  console.log(
    `DELETE operation for Akeneo product ${identifier} - local cleanup only`
  );
}

// ============================================================================
// Core Processing Functions
// ============================================================================

/**
 * Main job processor that routes to appropriate handler based on operation type.
 *
 * Processes a PimSyncJob from the queue, routing to the appropriate handler
 * (CREATE/UPDATE/DELETE), and manages job completion/failure in the queue.
 *
 * @param job - The PIM sync job to process
 * @returns Promise that resolves when the job is complete
 */
async function processPimSyncJob(job: PimSyncJob): Promise<void> {
  const startTime = Date.now();
  console.log(
    `[PIM Worker] Starting job ${job.id}: ${job.operation} for product ${job.akeneoProductId}`
  );

  try {
    let result: PimSyncResult;

    switch (job.operation) {
      case PimSyncOperation.CREATE:
      case PimSyncOperation.UPDATE:
        result = await syncProductFromAkeneo(
          job.akeneoProductId,
          job.operation
        );
        break;
      case PimSyncOperation.DELETE:
        result = await deleteProductFromMientior(job.akeneoProductId);
        break;
      default:
        throw new Error(`Unknown operation type: ${job.operation}`);
    }

    const duration = Date.now() - startTime;
    console.log(
      `[PIM Worker] Completed job ${job.id} in ${duration}ms: ${result.success ? 'SUCCESS' : 'FAILED'}`
    );

    if (result.success) {
      await completePimSyncJob(job.id);
    } else {
      await failPimSyncJob(
        job.id,
        result.error || 'Unknown error'
      );
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(
      `[PIM Worker] Job ${job.id} failed after ${duration}ms:`,
      errorMessage
    );
    await failPimSyncJob(job.id, error as Error);
  }
}

/**
 * Synchronizes a product from Akeneo PIM to Mientior database.
 *
 * Orchestrates the complete sync process:
 * 1. Fetches product from Akeneo API (placeholder until client is ready)
 * 2. Transforms Akeneo data to Prisma format
 * 3. Atomically upserts product and maintains mapping table
 * 4. Creates audit log entry
 *
 * Handles both CREATE and UPDATE operations using upsert logic based on
 * the existence of a PimProductMapping entry.
 *
 * @param akeneoProductId - The Akeneo product identifier (SKU)
 * @param operation - The operation type (CREATE or UPDATE)
 * @returns Promise resolving to the sync result with success status and metadata
 */
async function syncProductFromAkeneo(
  akeneoProductId: string,
  operation: PimSyncOperation
): Promise<PimSyncResult> {
  const startTime = Date.now();

  try {
    // Step 1: Fetch product from Akeneo
    // This will throw until src/lib/akeneo-client.ts is implemented
    const akeneoProduct = await fetchAkeneoProduct(akeneoProductId);

    // Step 2: Transform Akeneo product to Prisma format
    const productData = await transformAkeneoProduct(akeneoProduct);

    // Step 3: Atomic transaction to upsert product and maintain mappings
    const result = await prisma.$transaction(async (tx) => {
      // Check if mapping exists to determine CREATE vs UPDATE
      const existingMapping = await tx.pimProductMapping.findUnique({
        where: { akeneoSku: akeneoProductId },
      });

      let mientiorProduct;

      if (existingMapping) {
        // UPDATE: Product already exists in Mientior
        mientiorProduct = await tx.product.update({
          where: { id: existingMapping.mientiorProductId },
          data: productData,
        });
      } else {
        // CREATE: New product in Mientior
        mientiorProduct = await tx.product.create({
          data: productData,
        });
      }

      // Upsert mapping table for bidirectional tracking
      await tx.pimProductMapping.upsert({
        where: { akeneoSku: akeneoProductId },
        create: {
          akeneoProductId: akeneoProductId,
          akeneoSku: akeneoProductId,
          mientiorProductId: mientiorProduct.id,
          lastSyncedAt: new Date(),
          syncStatus: PimSyncStatus.SUCCESS,
        },
        update: {
          lastSyncedAt: new Date(),
          syncStatus: PimSyncStatus.SUCCESS,
        },
      });

      // Create audit log entry
      const duration = Date.now() - startTime;
      await tx.pimSyncLog.create({
        data: {
          source: 'akeneo',
          operation: operation,
          productId: mientiorProduct.id,
          status: PimSyncStatus.SUCCESS,
          metadata: {
            akeneoProductId: akeneoProductId,
            mientiorProductId: mientiorProduct.id,
            operationType: operation,
          },
          duration: duration,
        },
      });

      return {
        productId: mientiorProduct.id,
        akeneoProductId: akeneoProductId,
      };
    });

    const duration = Date.now() - startTime;
    return {
      success: true,
      productId: result.productId,
      akeneoProductId: result.akeneoProductId,
      operation: operation,
      duration: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Log failure to database (fire-and-forget)
    createSyncLog({
      source: 'akeneo',
      operation: operation,
      status: PimSyncStatus.FAILED,
      error: errorMessage,
      metadata: {
        akeneoProductId: akeneoProductId,
      },
      duration: duration,
    });

    return {
      success: false,
      akeneoProductId: akeneoProductId,
      operation: operation,
      duration: duration,
      error: errorMessage,
    };
  }
}

/**
 * Deletes a product from Mientior database based on Akeneo identifier.
 *
 * Handles DELETE operations by:
 * 1. Finding the product via PimProductMapping
 * 2. Deleting the product (cascade will handle relations)
 * 3. Removing the mapping entry completely
 * 4. Creating audit log
 *
 * If the product doesn't exist (already deleted), logs a PARTIAL status
 * and returns success (idempotent operation).
 *
 * Convention: DELETE operations completely remove the PimProductMapping entry.
 * This approach is chosen to maintain a clean mapping table that only contains
 * currently synced products. Deleted products are tracked exclusively via
 * PimSyncLog for audit purposes. This ensures that mapping lookups only return
 * active product associations and prevents confusion about product existence.
 *
 * Alternative convention (not implemented): If the requirement changes to preserve
 * mapping history for deleted products, update this function to use
 * `tx.pimProductMapping.update()` to set syncStatus to a new status (e.g., DELETED)
 * instead of deleting the mapping entry. In that case, add a DELETED enum value to
 * PimSyncStatus in the Prisma schema.
 *
 * @param akeneoProductId - The Akeneo product identifier (SKU)
 * @returns Promise resolving to the sync result with success status
 */
async function deleteProductFromMientior(
  akeneoProductId: string
): Promise<PimSyncResult> {
  const startTime = Date.now();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find the mapping to get Mientior product ID
      const mapping = await tx.pimProductMapping.findUnique({
        where: { akeneoSku: akeneoProductId },
      });

      let productId: string | undefined;
      let status: PimSyncStatus = PimSyncStatus.SUCCESS;

      if (mapping) {
        // Product exists - delete it (cascade will handle relations)
        await tx.product.delete({
          where: { id: mapping.mientiorProductId },
        });

        productId = mapping.mientiorProductId;

        // Delete the mapping entry (see function JSDoc for convention explanation)
        // Convention: We delete the mapping entirely rather than updating syncStatus.
        // This keeps the mapping table clean and limited to active products only.
        // Deleted products are tracked exclusively via PimSyncLog for audit purposes.
        await tx.pimProductMapping.delete({
          where: { akeneoSku: akeneoProductId },
        });
      } else {
        // Product not found - already deleted or never existed
        console.warn(
          `[PIM Worker] Product ${akeneoProductId} not found in mapping table - already deleted or never synced`
        );
        status = PimSyncStatus.PARTIAL;
      }

      // Create audit log entry
      const duration = Date.now() - startTime;
      await tx.pimSyncLog.create({
        data: {
          source: 'akeneo',
          operation: PimSyncOperation.DELETE,
          productId: productId,
          status: status,
          metadata: {
            akeneoProductId: akeneoProductId,
            found: !!mapping,
          },
          duration: duration,
        },
      });

      return { productId, status };
    });

    const duration = Date.now() - startTime;
    return {
      success: true,
      productId: result.productId,
      akeneoProductId: akeneoProductId,
      operation: PimSyncOperation.DELETE,
      duration: duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Log failure to database (fire-and-forget)
    createSyncLog({
      source: 'akeneo',
      operation: PimSyncOperation.DELETE,
      status: PimSyncStatus.FAILED,
      error: errorMessage,
      metadata: {
        akeneoProductId: akeneoProductId,
      },
      duration: duration,
    });

    return {
      success: false,
      akeneoProductId: akeneoProductId,
      operation: PimSyncOperation.DELETE,
      duration: duration,
      error: errorMessage,
    };
  }
}

// ============================================================================
// Logging Helper Functions
// ============================================================================

/**
 * Creates a PimSyncLog entry for audit trail.
 *
 * Fire-and-forget async operation - logs errors but doesn't throw.
 * Defaults source to 'akeneo' if not provided.
 *
 * Note: operation and status are required fields to ensure data integrity
 * and prevent silent errors from non-null assertions.
 *
 * @param data - PimSyncLog data to create (operation and status required)
 * @returns Promise that resolves when log is created (not awaited by caller)
 */
async function createSyncLog(data: {
  source?: string;
  operation: PimSyncOperation;
  productId?: string;
  status: PimSyncStatus;
  metadata?: any;
  error?: string;
  duration?: number;
}): Promise<void> {
  try {
    await prisma.pimSyncLog.create({
      data: {
        source: data.source || 'akeneo',
        operation: data.operation,
        productId: data.productId,
        status: data.status,
        metadata: data.metadata || {},
        error: data.error,
        duration: data.duration,
      },
    });
  } catch (error) {
    // Fire-and-forget - log error but don't throw
    console.error('[PIM Worker] Failed to create sync log:', error);
  }
}

// ============================================================================
// Worker Lifecycle Functions
// ============================================================================

/**
 * Main worker entry point.
 *
 * Initializes the PIM sync worker and runs the main processing loop:
 * 1. Checks if worker is enabled
 * 2. Registers graceful shutdown handlers
 * 3. Continuously polls Redis queue for jobs
 * 4. Processes jobs with error handling
 * 5. Handles graceful shutdown on SIGTERM/SIGINT
 *
 * Pattern follows src/lib/search-queue.ts worker implementation.
 *
 * @returns Promise that runs until worker is stopped
 */
export async function startPimSyncWorker(): Promise<void> {
  // Check if worker is enabled
  if (!WORKER_ENABLED) {
    console.log(
      '[PIM Worker] Worker is disabled (PIM_SYNC_WORKER_ENABLED=false). Exiting.'
    );
    process.exit(0);
  }

  console.log('[PIM Worker] Starting PIM sync worker...');
  console.log(
    `[PIM Worker] Configuration: pollInterval=${POLL_INTERVAL}ms, enabled=${WORKER_ENABLED}`
  );

  // Initialize worker state
  shouldStop = false;
  isProcessing = false;

  // Register graceful shutdown handlers
  const shutdownHandler = () => {
    console.log(
      '[PIM Worker] Shutdown signal received. Stopping worker gracefully...'
    );
    shouldStop = true;

    if (isProcessing) {
      console.log(
        '[PIM Worker] Waiting for current job to complete before exiting...'
      );
    } else {
      console.log(
        '[PIM Worker] No job in progress, exiting immediately.'
      );
      process.exit(0);
    }
  };

  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);

  // Main worker loop
  while (!shouldStop) {
    try {
      // Dequeue next job from Redis
      const job = await dequeuePimSyncJob();

      if (job) {
        // Process the job
        isProcessing = true;
        await processPimSyncJob(job);
        isProcessing = false;
      } else {
        // No job available - sleep before polling again
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      }
    } catch (error) {
      // Catch-all error handler for worker loop
      console.error('[PIM Worker] Error in worker loop:', error);
      isProcessing = false;

      // Brief pause before continuing to avoid tight error loops
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  // Wait for any in-progress job to complete
  while (isProcessing) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('[PIM Worker] Worker stopped gracefully.');
  process.exit(0);
}

/**
 * Returns the current worker configuration.
 *
 * Merges worker-specific settings with PIM queue configuration to provide
 * a complete view of all configuration parameters. This ensures consistency
 * with the queue's retry and backoff settings.
 *
 * Configuration sources:
 * - Worker environment variables (poll interval, enabled flag)
 * - PIM queue configuration (max retries, backoff base)
 *
 * @returns Worker configuration object with all settings
 *
 * @see getPimQueueConfig - Queue configuration source
 * @see src/lib/search-queue.ts - Similar pattern for search indexer worker
 */
export function getWorkerConfig() {
  const queueConfig = getPimQueueConfig();

  return {
    pollInterval: POLL_INTERVAL,
    enabled: WORKER_ENABLED,
    source: 'akeneo',
    maxRetries: queueConfig.maxRetries,
    backoffBase: queueConfig.backoffBase,
  };
}

// ============================================================================
// Entry Point (if run directly)
// ============================================================================

// Start worker if this file is executed directly
if (require.main === module) {
  startPimSyncWorker().catch((error) => {
    console.error('[PIM Worker] Fatal error:', error);
    process.exit(1);
  });
}

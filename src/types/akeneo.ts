/**
 * Type definitions for Akeneo PIM integration
 *
 * This file contains all TypeScript types for integrating with Akeneo PIM API.
 * Types follow Akeneo's official REST API structure (v1) and CloudEvents specification for webhooks.
 *
 * References:
 * - Akeneo REST API: https://api.akeneo.com/documentation/products.html
 * - CloudEvents Spec: https://cloudevents.io/
 * - HAL Format: http://stateless.co/hal_specification.html
 */

// ============================================================================
// AKENEO PRODUCT STRUCTURE TYPES
// ============================================================================

/**
 * Represents an attribute value in Akeneo PIM.
 *
 * Attribute values can be localized (locale) and channel-specific (scope).
 * The data field contains the actual value which can be of various types.
 *
 * @example
 * // Simple text attribute
 * { data: "Product Name", locale: "en_US", scope: null }
 *
 * @example
 * // Number attribute
 * { data: 99.99, locale: null, scope: "ecommerce" }
 *
 * @example
 * // Multi-select attribute
 * { data: ["color_red", "color_blue"], locale: null, scope: null }
 */
export interface AkeneoAttributeValue {
  /** The actual value - can be string, number, boolean, array of strings, or null */
  data: string | number | boolean | string[] | null
  /** Locale code (e.g., "en_US", "fr_FR") for localized attributes, null for non-localized */
  locale: string | null
  /** Channel/scope code (e.g., "ecommerce", "mobile") for channel-specific attributes, null for global */
  scope: string | null
}

/**
 * Product associations in Akeneo PIM.
 *
 * Used for simple associations like upsell, cross-sell, etc.
 * Associates products and/or groups with the current product.
 *
 * @see https://api.akeneo.com/documentation/products.html#associations
 */
export interface AkeneoProductAssociation {
  /** Array of product identifiers associated with this product */
  products: string[]
  /** Array of product group codes associated with this product */
  groups: string[]
}

/**
 * Quantified product associations in Akeneo PIM.
 *
 * Similar to regular associations but includes quantity information.
 * Useful for bundles, kits, or products that require specific quantities.
 *
 * @example
 * {
 *   products: [
 *     { identifier: "cable_usb", quantity: 2 },
 *     { identifier: "adapter_eu", quantity: 1 }
 *   ]
 * }
 */
export interface AkeneoQuantifiedAssociation {
  /** Array of products with quantities */
  products: Array<{
    /** Product identifier/SKU */
    identifier: string
    /** Quantity of this product in the association */
    quantity: number
  }>
}

/**
 * Main Akeneo Product structure matching their REST API v1.
 *
 * This represents a complete product as returned by Akeneo PIM API.
 * Note: Akeneo uses "identifier" instead of "id" for the product SKU.
 *
 * @see https://api.akeneo.com/documentation/products.html#get-a-product
 *
 * @example
 * {
 *   identifier: "nike_air_max_90",
 *   enabled: true,
 *   family: "shoes",
 *   categories: ["winter_collection", "sneakers"],
 *   groups: [],
 *   parent: null,
 *   values: {
 *     name: [{ data: "Nike Air Max 90", locale: "en_US", scope: null }],
 *     price: [{ data: 120.00, locale: null, scope: "ecommerce" }],
 *     description: [{ data: "Classic sneaker...", locale: "en_US", scope: "ecommerce" }]
 *   },
 *   associations: {},
 *   quantified_associations: {},
 *   created: "2024-01-15T10:30:00+00:00",
 *   updated: "2024-01-20T14:45:00+00:00",
 *   metadata: {}
 * }
 */
export interface AkeneoProduct {
  /** Unique product identifier/SKU (not a numeric ID) */
  identifier: string
  /** Whether the product is active/published */
  enabled: boolean
  /** Product family code (defines which attributes are available) */
  family: string | null
  /** Array of category codes this product belongs to */
  categories: string[]
  /** Array of product group codes */
  groups: string[]
  /** Parent product identifier for product variants (null for standalone products) */
  parent: string | null
  /**
   * Product attribute values indexed by attribute code.
   * Each attribute can have multiple values for different locales/scopes.
   *
   * @example
   * {
   *   name: [
   *     { data: "Product Name", locale: "en_US", scope: null },
   *     { data: "Nom du produit", locale: "fr_FR", scope: null }
   *   ],
   *   price: [{ data: 99.99, locale: null, scope: "ecommerce" }]
   * }
   */
  values: Record<string, AkeneoAttributeValue[]>
  /**
   * Product associations indexed by association type.
   * Common types: "upsell", "cross-sell", "substitution", "pack"
   */
  associations: Record<string, AkeneoProductAssociation>
  /** Quantified associations indexed by association type */
  quantified_associations: Record<string, AkeneoQuantifiedAssociation>
  /** ISO 8601 timestamp of product creation */
  created: string
  /** ISO 8601 timestamp of last product update */
  updated: string
  /** Additional metadata (rarely used, mainly for internal Akeneo data) */
  metadata: Record<string, unknown>
}

// ============================================================================
// AKENEO WEBHOOK TYPES (CloudEvents Specification)
// ============================================================================

/**
 * Akeneo webhook event types following CloudEvents v1.0 specification.
 *
 * Events are namespaced with "com.akeneo.pim.v1" prefix.
 *
 * @see https://help.akeneo.com/pim/serenity/articles/manage-event-subscription.html
 */
export type AkeneoWebhookEventType =
  | 'com.akeneo.pim.v1.product.created'
  | 'com.akeneo.pim.v1.product.updated'
  | 'com.akeneo.pim.v1.product.deleted'

/**
 * Author information in webhook events.
 *
 * Identifies who/what triggered the change in Akeneo.
 */
export interface AkeneoWebhookAuthor {
  /** Username, API client name, or job code */
  identifier: string
  /** Type of author: api (REST API), ui (web interface), or job (import/export) */
  type: 'api' | 'ui' | 'job'
}

/**
 * Data payload inside webhook events.
 *
 * Contains minimal product information - use the API to fetch full product details.
 */
export interface AkeneoWebhookData {
  /** Product information */
  product: {
    /** Product UUID (internal Akeneo identifier) */
    uuid: string
    /** Product identifier/SKU (may be undefined for deleted products) */
    identifier?: string
  }
  /** Information about who triggered the event */
  author: AkeneoWebhookAuthor
}

/**
 * Complete Akeneo webhook payload following CloudEvents v1.0 specification.
 *
 * Akeneo sends webhooks in CloudEvents format for standardization.
 * The payload contains minimal product info - fetch full product via API using the identifier.
 *
 * @see https://cloudevents.io/
 * @see https://help.akeneo.com/pim/serenity/articles/manage-event-subscription.html
 *
 * @example
 * {
 *   specversion: "1.0",
 *   id: "550e8400-e29b-41d4-a716-446655440000",
 *   source: "pim",
 *   type: "com.akeneo.pim.v1.product.updated",
 *   subject: "12345-subscription-id",
 *   datacontenttype: "application/json",
 *   dataschema: "https://api.akeneo.com/events/product-updated.json",
 *   time: "2024-01-20T14:45:30+00:00",
 *   data: {
 *     product: {
 *       uuid: "12345678-1234-1234-1234-123456789abc",
 *       identifier: "nike_air_max_90"
 *     },
 *     author: {
 *       identifier: "api_client_name",
 *       type: "api"
 *     }
 *   }
 * }
 */
export interface AkeneoWebhookPayload {
  /** CloudEvents specification version (always "1.0") */
  specversion: '1.0'
  /** Unique event UUID */
  id: string
  /** Event source (always "pim" for Akeneo) */
  source: 'pim'
  /** Event type indicating what happened */
  type: AkeneoWebhookEventType
  /** Webhook subscription ID that received this event */
  subject: string
  /** Content type of the data field (always "application/json") */
  datacontenttype: 'application/json'
  /** URL to the JSON schema for the data field */
  dataschema: string
  /** ISO 8601 timestamp when the event occurred */
  time: string
  /** Event data payload */
  data: AkeneoWebhookData
}

/**
 * Normalized webhook event with convenience aliases over CloudEvents payload.
 *
 * This interface flattens commonly-accessed fields from AkeneoWebhookPayload
 * to provide a cleaner API for internal webhook consumers. Instead of accessing
 * nested properties like `payload.data.product.identifier` and `payload.time`,
 * consumers can use the flattened `productIdentifier` and `updatedAt` fields.
 *
 * **Note**: This is a convenience interface for internal use. The actual webhook
 * payload received from Akeneo follows the CloudEvents specification format as
 * defined in AkeneoWebhookPayload.
 *
 * @example
 * // Convert CloudEvents payload to normalized event
 * const normalizedEvent: AkeneoWebhookEvent = {
 *   event: payload.type,
 *   productIdentifier: payload.data.product.identifier || 'unknown',
 *   updatedAt: payload.time
 * }
 *
 * @example
 * // Usage in webhook handler
 * function handleWebhook(event: AkeneoWebhookEvent) {
 *   console.log(`Product ${event.productIdentifier} was ${event.event}`);
 *   console.log(`Event occurred at ${event.updatedAt}`);
 * }
 */
export interface AkeneoWebhookEvent {
  /**
   * Event type indicating the operation performed.
   * Convenience alias for `AkeneoWebhookPayload.type`.
   *
   * Maps directly to the CloudEvents `type` field which follows the format:
   * "com.akeneo.pim.v1.product.{created|updated|deleted}"
   */
  event: AkeneoWebhookEventType
  /**
   * Product identifier/SKU affected by this event.
   * Convenience alias for `AkeneoWebhookPayload.data.product.identifier`.
   *
   * Note: This field may be 'unknown' or missing for deleted products
   * where Akeneo doesn't include the identifier in the webhook payload.
   */
  productIdentifier: string
  /**
   * ISO 8601 timestamp when the event occurred.
   * Convenience alias for `AkeneoWebhookPayload.time`.
   *
   * This represents when the event was generated in Akeneo, which may
   * differ slightly from when it was received by the webhook endpoint.
   */
  updatedAt: string
}

// ============================================================================
// AKENEO API RESPONSE TYPES (HAL Format)
// ============================================================================

/**
 * HAL navigation links used in Akeneo API responses.
 *
 * HAL (Hypertext Application Language) provides hypermedia links for API navigation.
 * These links allow pagination through large result sets.
 *
 * @see http://stateless.co/hal_specification.html
 */
export interface AkeneoApiLinks {
  /** Link to current resource/page */
  self: {
    href: string
  }
  /** Link to first page */
  first: {
    href: string
  }
  /** Link to previous page (undefined on first page) */
  previous?: {
    href: string
  }
  /** Link to next page (undefined on last page) */
  next?: {
    href: string
  }
}

/**
 * Generic Akeneo API response with HAL-style pagination.
 *
 * Akeneo uses HAL format for all list endpoints, embedding items in an "_embedded" field.
 * This differs from Mientior's internal pagination format (page/totalCount).
 *
 * @template T - The type of items in the response (e.g., AkeneoProduct)
 *
 * @see https://api.akeneo.com/documentation/pagination.html
 *
 * @example
 * // Response from GET /api/rest/v1/products?limit=10
 * {
 *   _links: {
 *     self: { href: "/api/rest/v1/products?page=2&limit=10" },
 *     first: { href: "/api/rest/v1/products?page=1&limit=10" },
 *     previous: { href: "/api/rest/v1/products?page=1&limit=10" },
 *     next: { href: "/api/rest/v1/products?page=3&limit=10" }
 *   },
 *   _embedded: {
 *     items: [ { identifier: "prod_1", ... }, { identifier: "prod_2", ... } ]
 *   },
 *   current_page: 2,
 *   items_count: 10,
 *   total_items: 1250
 * }
 */
export interface AkeneoApiResponse<T> {
  /** HAL navigation links for pagination */
  _links: AkeneoApiLinks
  /** Embedded items array */
  _embedded: {
    items: T[]
  }
  /** Current page number (1-indexed, may be undefined in some responses) */
  current_page?: number
  /** Number of items in current page (may be undefined) */
  items_count?: number
  /** Total number of items across all pages (may be undefined) */
  total_items?: number
}

// ============================================================================
// PIM SYNC RESULT TYPES
// ============================================================================

/**
 * PIM sync operations matching Prisma enum.
 *
 * These represent the type of operation performed during product sync.
 */
export type PimSyncOperation = 'CREATE' | 'UPDATE' | 'DELETE'

/**
 * Error information for failed PIM sync operations.
 *
 * This shared type provides consistent error reporting across both individual
 * and batch sync operations. It includes both internal (Mientior) and external
 * (Akeneo) identifiers to help with debugging and correlation.
 *
 * @see PimSyncResult - Used for individual operation results
 * @see BatchPimSyncResult - Used for aggregate batch operation results
 *
 * @example
 * {
 *   productId: "clx123abc",
 *   akeneoProductId: "nike_air_max_90",
 *   operation: "UPDATE",
 *   error: "Invalid price value: must be a positive number"
 * }
 */
export interface PimSyncError {
  /**
   * Mientior internal product ID (UUID from database).
   * Present when the product exists in Mientior's database.
   * May be undefined for CREATE operations or when product lookup fails.
   */
  productId?: string
  /**
   * Akeneo product identifier/SKU.
   * Present when the error is associated with a specific Akeneo product.
   * May be undefined in rare cases of malformed webhook payloads.
   */
  akeneoProductId?: string
  /** Type of operation that failed (CREATE, UPDATE, or DELETE) */
  operation: PimSyncOperation
  /** Human-readable error message describing why the operation failed */
  error: string
}

/**
 * Result of a single PIM sync operation.
 *
 * Similar to IndexResult in search-indexer.ts but for PIM sync operations.
 * Tracks success/failure, identifiers, and performance metrics.
 *
 * @see src/types/search-indexer.ts - IndexResult
 */
export interface PimSyncResult {
  /** Whether the sync operation succeeded */
  success: boolean
  /** Mientior product ID (if product exists in database) */
  productId?: string
  /** Akeneo product identifier/SKU */
  akeneoProductId?: string
  /** Type of operation performed */
  operation: PimSyncOperation
  /** Error message if operation failed */
  error?: string
  /** Duration of the operation in milliseconds */
  duration?: number
}

/**
 * Result of a batch PIM sync operation.
 *
 * Similar to BatchIndexResult in search-indexer.ts but for PIM sync operations.
 * Provides aggregate statistics and detailed error information. This type follows
 * consistent patterns with the search indexer for "processed/success/failed" metrics.
 *
 * The counters follow this relationship:
 * - `total` = `processed` = number of products attempted
 * - `success` = `created` + `updated` + `deleted` = all successful operations
 * - `failed` = number of failed operations
 * - `total` = `success` + `failed`
 *
 * @see src/types/search-indexer.ts - BatchIndexResult
 * @see PimSyncError - Shared error type used in the errors array
 *
 * @example
 * {
 *   total: 100,
 *   processed: 100,
 *   success: 97,
 *   created: 20,
 *   updated: 75,
 *   deleted: 2,
 *   failed: 3,
 *   errors: [
 *     {
 *       productId: "clx123abc",
 *       akeneoProductId: "prod_123",
 *       operation: "UPDATE",
 *       error: "Invalid price value: must be a positive number"
 *     },
 *     {
 *       akeneoProductId: "prod_456",
 *       operation: "CREATE",
 *       error: "Missing required field: name"
 *     }
 *   ],
 *   duration: 45000
 * }
 */
export interface BatchPimSyncResult {
  /**
   * Total number of products in the batch.
   * Equal to `processed` - represents the size of the batch.
   */
  total: number
  /**
   * Number of products processed (attempted).
   * Always equal to `total` - provided for consistency with search indexer metrics.
   */
  processed: number
  /**
   * Number of operations that succeeded.
   * Equal to `created + updated + deleted`.
   */
  success: number
  /** Number of products successfully created */
  created: number
  /** Number of products successfully updated */
  updated: number
  /** Number of products successfully deleted */
  deleted: number
  /**
   * Number of operations that failed.
   * Equal to `total - success`.
   */
  failed: number
  /**
   * Detailed error information for failed operations.
   * Uses the shared PimSyncError type for consistency.
   */
  errors: PimSyncError[]
  /** Total duration of batch operation in milliseconds */
  duration: number
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Type alias for Akeneo product list API response.
 *
 * Used when fetching multiple products from Akeneo API.
 */
export type AkeneoProductListResponse = AkeneoApiResponse<AkeneoProduct>

/**
 * PIM sync status matching Prisma enum.
 *
 * Represents the overall status of a sync operation.
 * - PENDING: Sync is queued but not started
 * - SUCCESS: All products synced successfully
 * - FAILED: Sync failed completely (no products synced)
 * - PARTIAL: Some products synced, but some failed
 */
export type PimSyncStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'PARTIAL'

// ============================================================================
// PIM SYNC QUEUE TYPES
// ============================================================================

/**
 * Job types for PIM sync queue operations.
 *
 * This is an alias of PimSyncOperation to ensure consistency and avoid duplication.
 * Both types represent the same set of operations: CREATE, UPDATE, DELETE.
 *
 * Similar to JobType in search-indexer.ts but specifically for PIM operations.
 *
 * @see PimSyncOperation - The underlying operation enum
 * @see src/types/search-indexer.ts - JobType for comparison
 */
export type PimSyncJobType = PimSyncOperation

/**
 * PIM sync job structure for Redis queue.
 *
 * Represents a queued job for synchronizing a product from Akeneo PIM to Mientior.
 * Each job corresponds to a single product operation (create, update, or delete).
 *
 * The queue system uses Redis lists (LPUSH/RPOP pattern) with three queues:
 * - Main queue: Pending jobs waiting to be processed
 * - Processing queue: Jobs currently being executed
 * - Failed queue: Jobs that exhausted all retry attempts
 *
 * Similar to IndexJob in search-indexer.ts but for PIM sync operations.
 *
 * @see src/types/search-indexer.ts - IndexJob
 * @see src/lib/pim-sync-queue.ts - Queue implementation
 *
 * @example
 * {
 *   id: "clx123abc456",
 *   type: "UPDATE",
 *   akeneoProductId: "nike_air_max_90",
 *   operation: "UPDATE",
 *   attempts: 0,
 *   createdAt: 1704984530000,
 *   metadata: { webhookEventId: "550e8400-e29b-41d4-a716-446655440000" }
 * }
 */
export interface PimSyncJob {
  /**
   * Unique job identifier (CUID).
   * Generated by the queue system for tracking and idempotency.
   */
  id: string
  /**
   * Type of sync operation to perform.
   * Matches the operation field but typed as PimSyncJobType.
   */
  type: PimSyncJobType
  /**
   * Akeneo product identifier/SKU to synchronize.
   * This is the key used to fetch product data from Akeneo API.
   */
  akeneoProductId: string
  /**
   * Explicit operation enum value.
   * Redundant with type but provided for logging and audit trail.
   */
  operation: PimSyncOperation
  /**
   * Number of times this job has been attempted.
   * Starts at 0, increments on each retry after failure.
   * Job moves to failed queue when attempts >= MAX_RETRIES.
   */
  attempts: number
  /**
   * Unix timestamp (milliseconds) when job was created.
   * Used for job age tracking and debugging.
   */
  createdAt: number
  /**
   * Error message from the last failed attempt.
   * Only present after first failure, updated on each retry.
   */
  error?: string
  /**
   * Optional metadata for debugging and audit trail.
   * Can include webhook event ID, author info, or other context.
   *
   * @example
   * { webhookEventId: "550e8400-e29b-41d4-a716-446655440000", author: "api_client" }
   */
  metadata?: Record<string, unknown>
}

/**
 * Statistics for PIM sync queues.
 *
 * Provides real-time counts of jobs in each queue state.
 * Used for monitoring queue health and identifying bottlenecks.
 *
 * Similar to QueueStats in search-indexer.ts.
 *
 * @see src/types/search-indexer.ts - QueueStats
 * @see src/lib/pim-sync-queue.ts - getPimSyncStats()
 *
 * @example
 * {
 *   mainQueue: 15,       // 15 jobs waiting to be processed
 *   processingQueue: 2,   // 2 jobs currently being executed
 *   failedQueue: 3,       // 3 jobs that exhausted retries
 *   timestamp: 1704984530000
 * }
 */
export interface PimSyncQueueStats {
  /**
   * Number of pending jobs in the main queue.
   * These jobs are waiting to be picked up by a worker.
   */
  mainQueue: number
  /**
   * Number of jobs currently being processed.
   * These jobs are actively being executed by workers.
   */
  processingQueue: number
  /**
   * Number of jobs that failed after exhausting all retries.
   * These jobs require manual intervention or investigation.
   */
  failedQueue: number
  /**
   * Unix timestamp (milliseconds) when stats were collected.
   * Used for time-series monitoring and alerting.
   */
  timestamp: number
}

// ============================================================================
// PIM ALERTING TYPES
// ============================================================================

/**
 * Types of PIM sync alerts that can be triggered.
 *
 * Used by the PIM alerting system to categorize health issues:
 * - sync_failed_threshold: High failure rate detected (> configured %)
 * - sync_delayed: No sync activity for extended period (> configured time)
 * - akeneo_unreachable: Multiple consecutive connection errors to Akeneo
 *
 * @see src/lib/pim-alerts.ts - Alert implementation
 *
 * @example
 * const alertType: PimAlertType = 'sync_failed_threshold';
 */
export type PimAlertType = 'sync_failed_threshold' | 'sync_delayed' | 'akeneo_unreachable'

/**
 * Severity levels for PIM alerts.
 *
 * Maps to notification types in the admin dashboard:
 * - urgent: Requires immediate attention (red badge)
 * - attention: Should be reviewed soon (yellow badge)
 * - info: Informational, no immediate action needed (blue badge)
 */
export type PimAlertSeverity = 'urgent' | 'attention' | 'info'

/**
 * Metadata included with PIM alerts.
 *
 * Provides contextual information about the alert condition
 * to help admins diagnose and resolve issues.
 *
 * @example
 * {
 *   failureRate: 15.3,
 *   lastSyncAt: new Date('2025-12-03T10:30:00Z'),
 *   consecutiveFailures: 5,
 *   errorPattern: 'ECONNREFUSED',
 *   affectedProducts: 127
 * }
 */
export interface PimAlertMetadata {
  /** Percentage of failed syncs (for sync_failed_threshold alerts) */
  failureRate?: number
  /** Timestamp of last successful sync (for sync_delayed alerts) */
  lastSyncAt?: Date
  /** Number of consecutive connection failures (for akeneo_unreachable alerts) */
  consecutiveFailures?: number
  /** Pattern of connection error detected (e.g., 'ECONNREFUSED', 'ETIMEDOUT') */
  errorPattern?: string
  /** Number of products affected by sync issues */
  affectedProducts?: number
}

/**
 * Health status of PIM synchronization system with metrics and alerts.
 *
 * Returned by health check functions to provide comprehensive status
 * including any detected issues and performance metrics.
 *
 * @see src/lib/pim-alerts.ts - checkPimSyncHealth()
 *
 * @example
 * // Healthy system
 * {
 *   isHealthy: true,
 *   alerts: [],
 *   metrics: {
 *     totalSyncs: 1000,
 *     failedSyncs: 5,
 *     successRate: 99.5,
 *     lastSyncAt: new Date('2025-12-03T14:30:00Z'),
 *     avgDuration: 1250
 *   }
 * }
 *
 * @example
 * // Unhealthy system with alert
 * {
 *   isHealthy: false,
 *   alerts: [
 *     {
 *       type: 'sync_failed_threshold',
 *       severity: 'attention',
 *       message: 'PIM sync failure rate is 15.3% (threshold: 10%)',
 *       data: { failureRate: 15.3, failedCount: 153, totalCount: 1000 }
 *     }
 *   ],
 *   metrics: {
 *     totalSyncs: 1000,
 *     failedSyncs: 153,
 *     successRate: 84.7,
 *     lastSyncAt: new Date('2025-12-03T14:30:00Z'),
 *     avgDuration: 1450
 *   }
 * }
 */
export interface PimHealthStatus {
  /** Whether the PIM sync system is operating within acceptable parameters */
  isHealthy: boolean
  /** Array of detected health issues (empty if healthy) */
  alerts: Array<{
    /** Type of alert condition detected */
    type: PimAlertType
    /** Severity level of the alert */
    severity: PimAlertSeverity
    /** Human-readable description of the issue */
    message: string
    /** Additional context and metrics related to the alert */
    data?: any
  }>
  /** Performance and reliability metrics for the sync system */
  metrics: {
    /** Total number of sync operations in the monitoring window */
    totalSyncs: number
    /** Number of failed sync operations */
    failedSyncs: number
    /** Percentage of successful syncs (0-100) */
    successRate: number
    /** Timestamp of most recent sync operation (null if no syncs) */
    lastSyncAt: Date | null
    /** Average duration of sync operations in milliseconds (null if no syncs) */
    avgDuration: number | null
  }
}

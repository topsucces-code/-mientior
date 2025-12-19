/**
 * Akeneo PIM Webhook Handler
 *
 * This endpoint receives webhook events from Akeneo PIM following the CloudEvents v1.0 specification.
 * It validates webhook signatures using HMAC SHA256, checks for idempotency to prevent duplicate
 * processing, and enqueues product sync jobs to Redis for asynchronous processing by a worker.
 *
 * CloudEvents Specification: https://cloudevents.io/
 * Akeneo Webhooks: https://help.akeneo.com/pim/serenity/articles/manage-event-subscription.html
 *
 * Architecture:
 * 1. Webhook signature validation (HMAC SHA256 with AKENEO_WEBHOOK_SECRET)
 * 2. CloudEvents payload parsing and validation
 * 3. Idempotency check via AuditLog (prevents duplicate processing on retries)
 * 4. Event type mapping to PimSyncOperation (created→CREATE, updated→UPDATE, deleted→DELETE)
 * 5. Job enqueueing to Redis queue for async processing
 * 6. Audit trail logging (fire-and-forget to avoid blocking response)
 *
 * Example CloudEvents webhook payload:
 * {
 *   "specversion": "1.0",
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "source": "pim",
 *   "type": "com.akeneo.pim.v1.product.updated",
 *   "subject": "12345-subscription-id",
 *   "datacontenttype": "application/json",
 *   "dataschema": "https://api.akeneo.com/events/product-updated.json",
 *   "time": "2024-01-20T14:45:30+00:00",
 *   "data": {
 *     "product": {
 *       "uuid": "12345678-1234-1234-1234-123456789abc",
 *       "identifier": "nike_air_max_90"
 *     },
 *     "author": {
 *       "identifier": "api_client_name",
 *       "type": "api"
 *     }
 *   }
 * }
 *
 * @see src/app/api/webhooks/paystack/route.ts - Similar webhook pattern for Paystack
 * @see src/lib/pim-sync-queue.ts - Job enqueueing and queue management
 * @see src/types/akeneo.ts - CloudEvents payload types and PimSyncOperation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { enqueuePimSyncJob } from '@/lib/pim-sync-queue'
import type { AkeneoWebhookPayload, AkeneoWebhookEventType, PimSyncOperation } from '@/types/akeneo'

/**
 * Validates Akeneo webhook signature using HMAC SHA256.
 *
 * Akeneo signs webhooks using HMAC SHA256 with the shared secret configured in the webhook subscription.
 * The signature is sent in the 'x-akeneo-request-signature' header as a hex-encoded string.
 *
 * Security: This prevents unauthorized parties from sending fake webhooks to the endpoint.
 * Uses timingSafeEqual for constant-time comparison to prevent timing attacks.
 *
 * @param body - Raw request body (must not be parsed yet)
 * @param signature - Signature from 'x-akeneo-request-signature' header
 * @returns True if signature is valid, false otherwise
 *
 * @see src/lib/paystack.ts - Similar signature validation for Paystack (uses SHA512)
 */
function validateAkeneoWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.AKENEO_WEBHOOK_SECRET

  if (!secret) {
    console.error('[Akeneo Webhook] AKENEO_WEBHOOK_SECRET not configured')
    throw new Error('Akeneo webhook secret not configured')
  }

  // Generate HMAC SHA256 signature
  const expectedSignature = createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  // Convert both signatures to buffers for constant-time comparison
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')
  const signatureBuffer = Buffer.from(signature, 'hex')

  // Verify lengths match before comparison (timingSafeEqual requires equal-length buffers)
  if (expectedBuffer.length !== signatureBuffer.length) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(expectedBuffer, signatureBuffer)
}

/**
 * Maps CloudEvents event types to internal PimSyncOperation enum.
 *
 * CloudEvents uses namespaced event types like "com.akeneo.pim.v1.product.updated".
 * We extract the operation (created/updated/deleted) and map to our internal enum.
 *
 * @param eventType - CloudEvents event type from webhook payload
 * @returns PimSyncOperation ('CREATE', 'UPDATE', or 'DELETE')
 * @throws Error if event type is not supported
 */
function mapEventTypeToOperation(eventType: AkeneoWebhookEventType): PimSyncOperation {
  // Extract operation from event type (e.g., "com.akeneo.pim.v1.product.updated" → "updated")
  const eventMap: Record<AkeneoWebhookEventType, PimSyncOperation> = {
    'com.akeneo.pim.v1.product.created': 'CREATE',
    'com.akeneo.pim.v1.product.updated': 'UPDATE',
    'com.akeneo.pim.v1.product.deleted': 'DELETE',
  }

  const operation = eventMap[eventType]

  if (!operation) {
    throw new Error(`Unsupported event type: ${eventType}`)
  }

  return operation
}

/**
 * POST handler for Akeneo PIM webhooks.
 *
 * Receives CloudEvents-formatted webhook payloads from Akeneo PIM, validates signatures,
 * checks idempotency, and enqueues product sync jobs for async processing.
 *
 * Response codes:
 * - 200 OK: Webhook received and queued successfully (or already processed)
 * - 400 Bad Request: Malformed payload or unsupported event type
 * - 401 Unauthorized: Invalid webhook signature
 * - 500 Internal Server Error: Unexpected processing error
 *
 * @param request - Next.js request object
 * @returns JSON response indicating success or failure
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body and signature header (required for HMAC validation)
    const body = await request.text()
    const signature = request.headers.get('x-akeneo-request-signature') || ''

    // 2. Validate webhook signature
    if (!validateAkeneoWebhookSignature(body, signature)) {
      console.error('[Akeneo Webhook] Invalid signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // 3. Parse CloudEvents payload
    let payload: AkeneoWebhookPayload
    try {
      payload = JSON.parse(body) as AkeneoWebhookPayload
    } catch (error) {
      console.error('[Akeneo Webhook] Failed to parse JSON:', error)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // 4. Validate payload structure before accessing nested properties
    if (!payload.data) {
      console.error('[Akeneo Webhook] Missing data property in payload:', { eventId: payload.id, eventType: payload.type })
      return NextResponse.json(
        { error: 'Invalid Akeneo payload: missing data property' },
        { status: 400 }
      )
    }

    if (!payload.data.product) {
      console.error('[Akeneo Webhook] Missing data.product property in payload:', { eventId: payload.id, eventType: payload.type })
      return NextResponse.json(
        { error: 'Invalid Akeneo payload: missing data.product property' },
        { status: 400 }
      )
    }

    if (!payload.data.author) {
      console.error('[Akeneo Webhook] Missing data.author property in payload:', { eventId: payload.id, eventType: payload.type })
      return NextResponse.json(
        { error: 'Invalid Akeneo payload: missing data.author property' },
        { status: 400 }
      )
    }

    // 5. Extract event details (now safe after validation)
    const eventId = payload.id
    const eventType = payload.type
    const eventTime = payload.time
    const productIdentifier = payload.data.product.identifier
    const productUuid = payload.data.product.uuid
    const author = payload.data.author

    console.log(`[Akeneo Webhook] Received event ${eventType} for product ${productIdentifier || productUuid} (event ID: ${eventId})`)

    // 6. Create idempotency record first (transactional approach)
    // This ensures we reliably track the event before processing it.
    // Failure to create this record will abort processing to maintain idempotency guarantees.
    //
    // Idempotency lookup: We use a structured pattern in metadata.
    // Format: metadata JSON always has eventId as first key with format "IDEMPOTENCY_KEY:eventId:<uuid>"
    // This provides a stable, predictable pattern for string_contains matching.
    // Future improvement: Add a dedicated eventId column for direct querying.
    let auditLog
    try {
      // Check if event already exists using structured pattern
      // We search for a specific prefix pattern to minimize false positives
      const idempotencyKey = `IDEMPOTENCY_KEY:eventId:${eventId}`
      const existingAuditLog = await prisma.audit_logs.findFirst({
        where: {
          action: 'webhook_akeneo_received',
          metadata: {
            string_contains: idempotencyKey, // Structured pattern for reliable matching
          },
        },
      })

      if (existingAuditLog) {
        console.log(`[Akeneo Webhook] Event ${eventId} already processed, skipping duplicate`)
        return NextResponse.json({
          success: true,
          message: 'Already processed',
        })
      }

      // Create idempotency record immediately (awaited to ensure it's written)
      // If this fails, we abort to prevent duplicate processing
      // Place idempotency key as first field for consistent structure
      auditLog = await prisma.audit_logs.create({
        data: {
          action: 'webhook_akeneo_received',
          resource: 'PRODUCT',
          resourceId: productIdentifier || productUuid || 'unknown',
          metadata: JSON.stringify({
            // IMPORTANT: Idempotency key must be first and follow this exact format
            idempotencyKey: `IDEMPOTENCY_KEY:eventId:${eventId}`,
            eventId,
            eventType,
            productIdentifier: productIdentifier || 'unknown',
            akeneoUuid: productUuid,
            timestamp: eventTime,
            receivedAt: new Date().toISOString(),
            status: 'received',
          }),
        },
      })
    } catch (error) {
      // If we can't record the event, fail the webhook to prevent duplicate processing
      console.error('[Akeneo Webhook] Failed to create idempotency record:', error)
      return NextResponse.json(
        { error: 'Failed to record webhook event', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }

    // 7. Map event type to operation
    let operation: PimSyncOperation
    try {
      operation = mapEventTypeToOperation(eventType)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Akeneo Webhook] Unsupported event type:', errorMessage)
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    // 8. Handle edge case: deleted products may not have identifier
    // For DELETE operations, use UUID as fallback if identifier is missing
    const productId = productIdentifier || productUuid

    if (!productId) {
      console.error('[Akeneo Webhook] Missing product identifier and UUID in event:', eventId)
      return NextResponse.json(
        { error: 'Missing product identifier' },
        { status: 400 }
      )
    }

    // 9. Enqueue sync job to Redis queue for async processing
    try {
      const jobId = await enqueuePimSyncJob(
        productId,
        operation,
        {
          webhookEventId: eventId,
          akeneoUuid: productUuid,
          author: author.identifier,
          authorType: author.type,
          eventTime: eventTime,
        }
      )

      console.log(`[Akeneo Webhook] Enqueued job ${jobId} for ${operation} ${productId}`)

      // Update audit log with job details (fire-and-forget to avoid blocking response)
      prisma.audit_logs.update({
        where: { id: auditLog.id },
        data: {
          metadata: JSON.stringify({
            // IMPORTANT: Idempotency key must be first and follow this exact format
            idempotencyKey: `IDEMPOTENCY_KEY:eventId:${eventId}`,
            eventId,
            eventType,
            productIdentifier: productIdentifier || 'unknown',
            akeneoUuid: productUuid,
            author: author.identifier,
            authorType: author.type,
            timestamp: eventTime,
            receivedAt: new Date().toISOString(),
            status: 'queued',
            jobId,
          }),
        },
      }).catch((error) => {
        // Non-critical: audit log already created for idempotency
        console.error('[Akeneo Webhook] Failed to update audit log with job details (non-critical):', error)
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Akeneo Webhook] Failed to enqueue job:', errorMessage)

      // Update audit log with failure status (fire-and-forget)
      prisma.audit_logs.update({
        where: { id: auditLog.id },
        data: {
          metadata: JSON.stringify({
            // IMPORTANT: Idempotency key must be first and follow this exact format
            idempotencyKey: `IDEMPOTENCY_KEY:eventId:${eventId}`,
            eventId,
            eventType,
            productIdentifier: productIdentifier || 'unknown',
            akeneoUuid: productUuid,
            timestamp: eventTime,
            receivedAt: new Date().toISOString(),
            status: 'failed',
            error: errorMessage,
          }),
        },
      }).catch(() => {
        // Ignore update failures
      })

      return NextResponse.json(
        { error: 'Failed to enqueue sync job', details: errorMessage },
        { status: 500 }
      )
    }

    // 10. Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook received and queued',
    })

  } catch (error: unknown) {
    // Catch-all error handler for unexpected errors
    console.error('[Akeneo Webhook] Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Webhook processing failed', details: errorMessage },
      { status: 500 }
    )
  }
}

# MeiliSearch Product Indexer

Automatic synchronization system between PostgreSQL and MeiliSearch for real-time product search.

## Table of Contents

- [Introduction](#introduction)
- [How It Works](#how-it-works)
- [Installation & Setup](#installation--setup)
- [Usage](#usage)
- [API Reference](#api-reference)
- [CLI Commands](#cli-commands)
- [Architecture Details](#architecture-details)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)
- [Maintenance](#maintenance)
- [FAQ](#faq)

## Introduction

The MeiliSearch Product Indexer provides automatic, asynchronous synchronization between PostgreSQL (source of truth) and MeiliSearch (fast search index). This ensures that product data is always up-to-date in the search index without blocking API requests.

### Why Synchronization?

- **PostgreSQL**: Source of truth with strong consistency, ACID transactions, and complex relations
- **MeiliSearch**: Fast full-text search with typo tolerance, facets, and instant results
- **Best of Both**: Transactional integrity + lightning-fast search

### Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Admin UI   │────▶│  API Routes  │────▶│   Prisma    │────▶│  PostgreSQL  │
└──────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
                              │                   │
                              │                   │ Middleware
                              │                   ▼
                              │            ┌─────────────┐
                              └───────────▶│ Redis Queue │
                                           └─────────────┘
                                                  │
                                                  │ Async
                                                  ▼
                                           ┌─────────────┐
                                           │   Worker    │
                                           └─────────────┘
                                                  │
                                                  ▼
                                           ┌─────────────┐
                                           │ MeiliSearch │
                                           └─────────────┘
```

## How It Works

### Automatic Indexing Flow

1. **Product Change**: Admin creates/updates/deletes a product via API
2. **Prisma Transaction**: Changes saved to PostgreSQL
3. **Middleware Trigger**: Prisma middleware detects the change
4. **Job Enqueued**: Indexing job added to Redis queue (non-blocking)
5. **API Returns**: User gets immediate response (< 100ms)
6. **Worker Processes**: Background worker picks up job from queue
7. **Product Fetched**: Worker loads product with all relations from PostgreSQL
8. **Document Transformed**: Nested data flattened to MeiliSearch format
9. **Index Updated**: Document sent to MeiliSearch
10. **Job Completed**: Job removed from queue

### Job Types

- **`index`**: Index a single product (create/update)
- **`delete`**: Remove a product from index
- **`update`**: Batch update multiple products
- **`reindex-all`**: Full reindex with optional filters

### Retry Mechanism

Failed jobs are automatically retried with exponential backoff:
- **Attempt 1**: Immediate retry after 2 seconds
- **Attempt 2**: Retry after 4 seconds
- **Attempt 3**: Retry after 8 seconds
- **After 3 failures**: Move to dead letter queue

## Installation & Setup

### Prerequisites

1. **MeiliSearch Running**
   ```bash
   npm run meilisearch:start
   ```

2. **Redis Available**
   ```bash
   # Check Redis connection
   redis-cli ping
   # Should return: PONG
   ```

### Environment Configuration

Add to `.env`:

```env
# Enable MeiliSearch
ENABLE_MEILISEARCH=true

# Search Indexer Configuration
SEARCH_INDEXER_ENABLED=true                    # Enable automatic indexing
SEARCH_INDEXER_BATCH_SIZE=1000                 # Batch size for bulk operations
SEARCH_INDEXER_MAX_RETRIES=3                   # Max retry attempts
SEARCH_INDEXER_POLL_INTERVAL=1000              # Worker poll interval (ms)
SEARCH_INDEXER_BACKOFF_BASE=2                  # Exponential backoff base
```

### Start the Worker

The indexer worker must run as a separate process:

```bash
# Development
npm run search:worker

# Production (with PM2)
pm2 start "npm run search:worker" --name meilisearch-worker

# Production (with systemd)
sudo systemctl start meilisearch-indexer
```

### Verify Setup

```bash
# Check status
npm run search:status

# Should show:
# ✅ MeiliSearch: Available
# ✅ Redis connected
# Queue Statistics: 0 jobs
```

## Usage

### Automatic Indexing

Once enabled, indexing happens automatically:

```typescript
// Create product via API
POST /api/products
{
  "name": "Wireless Headphones",
  "price": 99.99,
  // ... other fields
}

// Product saved to PostgreSQL ✅
// Job queued for indexing ✅
// API returns immediately ✅
// Worker indexes in background ✅
```

### Manual Reindexing

#### Via CLI

```bash
# Full reindex
npm run search:reindex

# Reindex specific category
npm run search:reindex -- --category=cat_electronics

# Reindex by vendor
npm run search:reindex -- --vendor=vendor_123

# Reindex by status
npm run search:reindex -- --status=ACTIVE

# Dry run (count only)
tsx scripts/manage-search-indexer.ts reindex --dry-run
```

#### Via API

```bash
# Full reindex
curl -X POST http://localhost:3000/api/admin/search/reindex \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Reindex with filters
curl -X POST http://localhost:3000/api/admin/search/reindex \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "filters": {
      "categoryId": "cat_electronics",
      "status": "ACTIVE"
    }
  }'

# Dry run
curl -X POST http://localhost:3000/api/admin/search/reindex \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{"dryRun": true}'
```

### Monitoring Queue

```bash
# Check queue status
npm run search:status

# Output:
# 📊 MeiliSearch Indexer Status
#
# ✅ MeiliSearch: Available
#
# 📦 Queue Statistics:
#    Main Queue:       12 jobs
#    Processing:       1 jobs
#    Failed:           0 jobs
#
# 🔍 MeiliSearch Index:
#    Documents:        1,234
#    Indexing:         No
```

## API Reference

### POST `/api/admin/search/reindex`

Trigger a manual reindex of products.

**Authentication**: Requires admin session with `PRODUCTS_READ` permission.

**Request Body**:
```typescript
{
  filters?: {
    categoryId?: string
    vendorId?: string
    status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED'
  }
  dryRun?: boolean
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Reindex job queued for 1,234 products",
  "jobId": "reindex_abc123",
  "estimatedProducts": 1234,
  "filters": { "status": "ACTIVE" },
  "queuedAt": "2025-11-30T10:30:00Z"
}
```

**Response** (Dry Run):
```json
{
  "success": true,
  "message": "Dry run - no indexing performed",
  "estimatedProducts": 1234,
  "filters": {}
}
```

**Error Responses**:
- `400`: MeiliSearch disabled
- `503`: MeiliSearch unavailable
- `500`: Internal server error

## CLI Commands

### `npm run search:worker`

Start the indexer worker process.

```bash
npm run search:worker

# Output:
# 🚀 Starting MeiliSearch Indexer Worker...
# ✅ MeiliSearch is available
# ✅ Redis connected
# ⏳ Waiting for jobs...
```

**Production**: Run with PM2 or systemd (see [Production Deployment](#production-deployment))

### `npm run search:status`

Show queue statistics and MeiliSearch status.

```bash
npm run search:status
```

### `npm run search:reindex`

Trigger a full reindex of all products.

```bash
# Full reindex
npm run search:reindex

# With filters
npm run search:reindex -- --category=cat_123
npm run search:reindex -- --status=ACTIVE
npm run search:reindex -- --vendor=vendor_456
```

### `npm run search:clear-queue`

Clear the job queue (useful for development/testing).

```bash
npm run search:clear-queue
# Prompts: Are you sure? (y/n)
```

### `npm run search:retry-failed`

Retry all jobs in the failed queue.

```bash
npm run search:retry-failed

# Output:
# ✅ Moved 5 jobs back to main queue
```

### `npm run search:test`

Test indexing a single product.

```bash
# Index first ACTIVE product
npm run search:test

# Index specific product
npm run search:test prod_abc123

# Output:
# 🧪 Testing Product Indexing
#
# ✅ Successfully indexed!
#    Product ID:       prod_abc123
#    Task UID:         12345
#    Duration:         45ms
#
# 🔍 Verifying in MeiliSearch...
# ✅ Document found in index:
#    Name:             Wireless Headphones
#    Status:           ACTIVE
#    Stock:            25
#    In Stock:         Yes
```

## Architecture Details

### Queue Structure (Redis Lists)

The queue system uses three Redis lists:

1. **`search:queue:jobs`** - Main job queue
   - Jobs added via `LPUSH` (left push)
   - Jobs consumed via `RPOP` (right pop) - FIFO order

2. **`search:queue:processing`** - Jobs currently being processed
   - Jobs moved here during processing
   - Removed on completion or failure

3. **`search:queue:failed`** - Dead letter queue
   - Jobs that failed after max retries
   - Can be retried manually via `npm run search:retry-failed`

### Job Format

Jobs are stored as JSON strings:

```typescript
{
  id: "job_abc123",              // Unique job ID (cuid)
  type: "index",                 // Job type
  productId: "prod_xyz789",      // Product to index
  attempts: 0,                   // Retry count
  createdAt: 1701234567890,      // Timestamp
  error?: "Error message"        // Last error (if any)
}
```

### Document Transformation

Prisma Product model (nested) → MeiliSearch Document (flat):

**Before (Prisma)**:
```typescript
{
  id: "prod_123",
  name: "Wireless Headphones",
  price: Decimal(99.99),
  category: {
    id: "cat_123",
    name: "Electronics"
  },
  tags: [
    { tag: { name: "wireless" } },
    { tag: { name: "bluetooth" } }
  ],
  variants: [
    { color: "black", size: null },
    { color: "white", size: null }
  ]
}
```

**After (MeiliSearch)**:
```typescript
{
  id: "prod_123",
  name: "Wireless Headphones",
  price: 99.99,
  categoryId: "cat_123",
  categoryName: "Electronics",
  tags: ["wireless", "bluetooth"],
  colors: ["black", "white"],
  sizes: [],
  inStock: true,
  createdAt: 1701234567890,
  updatedAt: 1701234567890
}
```

### Error Handling

The system implements graceful degradation:

1. **MeiliSearch Disabled**: Indexing silently skipped
2. **MeiliSearch Unavailable**: Jobs queued but not processed (worker retries)
3. **Queue Failure**: Logged but doesn't block API requests
4. **Job Processing Error**: Retried with exponential backoff
5. **Max Retries Exceeded**: Moved to failed queue for manual inspection

## Performance

### Indexing Speed

- **Single product**: 20-50ms (network + transformation + indexing)
- **Batch (1000 products)**: 2-5 seconds (~200-500 products/sec)
- **Full reindex (10K products)**: 20-50 seconds

### Queue Throughput

- **Worker poll interval**: 1 second (configurable)
- **Concurrent jobs**: 1 per worker (sequential processing)
- **Job latency**: < 5 seconds (typical)

### Memory Usage

- **Worker process**: ~100-200 MB (Node.js baseline + Prisma)
- **Peak during batch**: +50 MB per 1000 products (temporary)

### Optimization Tips

1. **Increase Batch Size** (for faster reindexing):
   ```env
   SEARCH_INDEXER_BATCH_SIZE=2000
   ```

2. **Run Multiple Workers** (for higher throughput):
   ```bash
   pm2 start "npm run search:worker" --name worker-1
   pm2 start "npm run search:worker" --name worker-2
   ```

3. **Reduce Poll Interval** (for lower latency):
   ```env
   SEARCH_INDEXER_POLL_INTERVAL=500  # 500ms
   ```

## Troubleshooting

### Worker Not Processing Jobs

**Symptoms**: Jobs accumulate in main queue, worker shows "Waiting for jobs..."

**Causes & Solutions**:

1. **Worker not running**
   ```bash
   # Check if worker is running
   pm2 list
   # Start if needed
   npm run search:worker
   ```

2. **Redis connection issue**
   ```bash
   # Test Redis
   redis-cli ping
   # Check REDIS_URL in .env
   ```

3. **MeiliSearch unavailable**
   ```bash
   # Check MeiliSearch status
   npm run meilisearch:status
   # Start if needed
   npm run meilisearch:start
   ```

### Jobs Stuck in Processing Queue

**Symptoms**: Jobs in processing queue don't complete

**Cause**: Worker crashed during job processing

**Solution**:
```bash
# Move jobs back to main queue
npm run search:clear-queue processing
# Restart worker
npm run search:worker
```

### Failed Jobs Accumulating

**Symptoms**: High number of jobs in failed queue

**Investigation**:
```bash
# Check failed jobs
redis-cli lrange search:queue:failed 0 -1
```

**Common Errors**:

1. **Product not found**: Product was deleted from PostgreSQL before indexing
   - **Solution**: Clear failed queue (these jobs can't succeed)

2. **MeiliSearch timeout**: Slow network or overloaded MeiliSearch
   - **Solution**: Increase timeout or scale MeiliSearch

3. **Invalid data**: Product has missing required fields
   - **Solution**: Fix data in PostgreSQL and retry

**Retry Failed Jobs**:
```bash
npm run search:retry-failed
```

### MeiliSearch Out of Sync

**Symptoms**: Products in PostgreSQL not appearing in search results

**Investigation**:
```bash
# Check document count
npm run search:status

# Search for specific product in MeiliSearch
curl http://localhost:7700/indexes/products/documents/prod_123 \
  -H "Authorization: Bearer YOUR_MASTER_KEY"
```

**Solution**:
```bash
# Full reindex
npm run search:reindex
```

### Performance Issues

**Symptoms**: Worker consuming high CPU/memory

**Causes & Solutions**:

1. **Large batch size**
   ```env
   # Reduce batch size
   SEARCH_INDEXER_BATCH_SIZE=500
   ```

2. **Too many workers**
   - Stop extra workers, keep 1-2 workers per server

3. **Slow Prisma queries**
   - Check PostgreSQL indexes
   - Review query performance with `EXPLAIN ANALYZE`

## Production Deployment

### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'meilisearch-indexer',
      script: 'npm',
      args: 'run search:worker',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M',
      error_file: './logs/indexer-error.log',
      out_file: './logs/indexer-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
}
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Auto-start on server reboot
```

### Systemd Service

Create `/etc/systemd/system/meilisearch-indexer.service`:

```ini
[Unit]
Description=MeiliSearch Indexer Worker
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/mientior
ExecStart=/usr/bin/npm run search:worker
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=meilisearch-indexer

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable meilisearch-indexer
sudo systemctl start meilisearch-indexer
sudo systemctl status meilisearch-indexer
```

### Docker Deployment

Add to `docker-compose.yml`:

```yaml
services:
  indexer-worker:
    build: .
    command: npm run search:worker
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - MEILISEARCH_URL=http://meilisearch:7700
    depends_on:
      - postgres
      - redis
      - meilisearch
    restart: always
```

### Monitoring & Alerting

**Health Check Endpoint** (add to your app):

```typescript
// src/app/api/admin/search/health/route.ts
export async function GET() {
  const stats = await getQueueStats()
  const available = await isAvailable()

  const healthy =
    available &&
    stats.processingQueue < 10 &&
    stats.failedQueue < 100

  return NextResponse.json({
    healthy,
    meilisearch: available ? 'up' : 'down',
    queue: stats,
  }, { status: healthy ? 200 : 503 })
}
```

**Prometheus Metrics** (optional):
- Export queue depth metrics
- Track job processing time
- Monitor failure rate

**Alerting Rules**:
- Alert if failed queue > 100 jobs
- Alert if processing queue stuck for > 5 minutes
- Alert if MeiliSearch unavailable for > 1 minute

## Maintenance

### When to Reindex

Trigger a full reindex when:

1. **After schema changes**: Modified MeiliSearch index settings
2. **After data migration**: Bulk imported products
3. **Sync issues detected**: MeiliSearch out of sync with PostgreSQL
4. **Index corruption**: MeiliSearch data corrupted

### Clearing Old Failed Jobs

```bash
# Review failed jobs first
redis-cli lrange search:queue:failed 0 -1

# Clear if they can't be fixed
npm run search:clear-queue failed
```

### Monitoring Queue Depth

Set up alerts for:
- Main queue > 1000 jobs (backlog building)
- Processing queue > 10 jobs (worker stuck)
- Failed queue > 100 jobs (systemic issue)

### Backup and Restore

**Queue State**:
```bash
# Backup queue (dump Redis)
redis-cli --rdb /backup/redis-dump.rdb

# Restore
redis-cli --pipe < /backup/redis-dump.rdb
```

**MeiliSearch Index**:
```bash
# Backup (dump to JSON)
curl http://localhost:7700/dumps -X POST \
  -H "Authorization: Bearer YOUR_MASTER_KEY"

# Restore
# Re-run full reindex
npm run search:reindex
```

## FAQ

### Why use a queue instead of direct indexing?

**Asynchronous processing** prevents API timeouts. Product creation/update operations can return immediately (< 100ms) while indexing happens in the background. Direct indexing would add 50-200ms to every API request.

### What happens if MeiliSearch is down?

**Graceful degradation**:
1. API requests continue to work (PostgreSQL is source of truth)
2. Indexing jobs queue up in Redis
3. Worker retries connection every poll interval
4. Once MeiliSearch is back up, worker processes backlog
5. Search falls back to PostgreSQL FTS (if configured)

### How long does a full reindex take?

**Depends on product count**:
- 1K products: ~5 seconds
- 10K products: ~30-60 seconds
- 100K products: ~5-10 minutes
- 1M products: ~30-60 minutes

**Optimization**: Run during low-traffic periods, use larger batch size.

### Can I run multiple workers?

**Yes**, for higher throughput:
```bash
pm2 start "npm run search:worker" --name worker-1 --instances 2
```

**Note**: Workers coordinate via Redis queue, so they won't process the same job twice.

### How to handle schema changes?

**MeiliSearch Index Changes**:
1. Update index settings in MeiliSearch
2. Run full reindex: `npm run search:reindex`

**Prisma Model Changes**:
1. Update transformation logic in `src/lib/search-indexer.ts`
2. Run full reindex: `npm run search:reindex`

### What about database migrations?

**For large migrations**:
1. Disable indexer: `SEARCH_INDEXER_ENABLED=false`
2. Run migration
3. Re-enable indexer
4. Run full reindex

**For small migrations**: Indexer handles incremental changes automatically.

---

## Related Documentation

- [README_MEILISEARCH.md](./README_MEILISEARCH.md) - MeiliSearch setup and configuration
- [README_PRODUCT_FTS.md](./README_PRODUCT_FTS.md) - PostgreSQL full-text search
- [README_FACETS.md](./README_FACETS.md) - Faceted search implementation

## Support

For issues or questions:
1. Check this documentation
2. Review [Troubleshooting](#troubleshooting) section
3. Check queue status: `npm run search:status`
4. Review worker logs
5. Open an issue on GitHub

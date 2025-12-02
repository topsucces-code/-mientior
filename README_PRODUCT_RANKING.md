# Product Ranking System Documentation

Complete guide to the product popularity and ranking system for Mientior marketplace.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Setup](#setup)
- [Usage](#usage)
- [Configuration](#configuration)
- [Maintenance](#maintenance)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Performance](#performance)

---

## Overview

The Product Ranking System calculates engagement-based popularity scores for products and integrates them with MeiliSearch's ranking algorithm to surface the most relevant products in search results.

### Key Features

- **Popularity Calculation**: Weighted formula combining views and sales
- **Configurable Boosts**: In-stock (+10%), featured (+20%), rating-based (+rating*5%)
- **MeiliSearch Integration**: Native ranking rules for optimal search performance
- **Auto-Update**: Optional real-time popularity updates on orders
- **Batch Processing**: Efficient bulk recalculation with progress tracking
- **Admin API**: Trigger recalculations via admin dashboard

### How It Works

1. **Popularity Score** = (views × viewsWeight) + (sales × salesWeight)
2. **Boost Factors**:
   - In Stock: +10% (configurable via `RANKING_BOOST_IN_STOCK`)
   - Featured: +20% (configurable via `RANKING_BOOST_FEATURED`)
   - Rating: +rating×5% (configurable via `RANKING_BOOST_RATING_MULTIPLIER`)
3. **Final Score** = popularity × (1 + totalBoostPercentage/100)
   - Applied during MeiliSearch indexing for optimal search performance
4. **MeiliSearch Ranking**: Custom `finalScore:desc` rule prioritizes products by their boosted scores
5. **Search Results**: Users see the most relevant products first based on engagement and boost factors

---

## Architecture

### Database Schema

```sql
-- Added to products table
ALTER TABLE products ADD COLUMN popularity INTEGER DEFAULT 0 NOT NULL;
CREATE INDEX idx_products_popularity ON products(popularity);
```

**Field**: `popularity` (INT, default: 0)
**Purpose**: Stores calculated engagement score
**Updated By**: `ranking:calculate` script or Prisma middleware

### Ranking Service

**Location**: `src/lib/ranking-service.ts`

**Core Functions**:

```typescript
// Calculate base popularity from views and sales
calculatePopularity(views: number, sales: number): number

// Calculate boost factors for a product
calculateBoostFactors(product: {...}): BoostFactors

// Update single product popularity
updateProductPopularity(productId: string): Promise<void>

// Batch update all products
batchUpdatePopularity(options?: BatchUpdateOptions): Promise<BatchUpdateResult>

// Get ranking statistics
getRankingStatistics(): Promise<{...}>
```

### MeiliSearch Integration

**Config File**: `meilisearch.config.json`

**Ranking Rules** (in priority order):
1. `words` - Matching words in query
2. `typo` - Typo tolerance
3. `proximity` - Word proximity
4. `attribute` - Attribute importance
5. `sort` - Custom sorting
6. `exactness` - Exact matches
7. `finalScore:desc` - Prioritize by boosted popularity score ✨ NEW
   - Combines popularity, in-stock status, featured status, and rating
   - Automatically calculated during indexing

**Sortable/Filterable Attributes**:
- Added `popularity` and `finalScore` to both arrays

### Auto-Update Middleware

**Location**: `src/lib/prisma.ts`

Automatically increments popularity when orders are created:

```typescript
// When OrderItem is created
popularity += Math.round(RANKING_POPULARITY_SALES_WEIGHT)
// Example: With default salesWeight=0.7, each sale increments popularity by 1
```

**Control**: Set `RANKING_AUTO_UPDATE_ENABLED=false` to disable

---

## Setup

### 1. Run Database Migration

```bash
# Apply migration (creates popularity column and index)
bash scripts/apply-product-popularity-migration.sh

# Follow prompts to confirm and optionally create backup
```

**What it does**:
- Adds `popularity` column to `products` table
- Creates index on `popularity` for efficient sorting
- Validates migration success

### 2. Configure Environment Variables

Add to `.env.local`:

```bash
# Product Ranking Configuration
RANKING_POPULARITY_VIEWS_WEIGHT=0.3      # Weight for views (0.0-1.0)
RANKING_POPULARITY_SALES_WEIGHT=0.7      # Weight for sales (0.0-1.0)
RANKING_BOOST_IN_STOCK=10                # In-stock boost percentage
RANKING_BOOST_FEATURED=20                # Featured boost percentage
RANKING_BOOST_RATING_MULTIPLIER=5        # Rating boost multiplier
RANKING_AUTO_UPDATE_ENABLED=true         # Auto-update on orders
```

### 3. Generate Prisma Client

```bash
# Regenerate Prisma Client with new schema
npx prisma generate
```

### 4. Initial Sync

```bash
# Full sync: calculate scores + update MeiliSearch + reindex
npm run ranking:sync

# Or step-by-step:
npm run ranking:calculate              # Calculate popularity scores
npm run ranking:update-meilisearch     # Update MeiliSearch ranking rules
npm run search:reindex                 # Reindex products
```

**Expected Output**:

```
🚀 Sync Product Ranking to MeiliSearch
==========================================================

Workflow:
  ✓ Step 1: Calculate popularity scores
  ✓ Step 2: Update MeiliSearch ranking rules
  ✓ Step 3: Reindex products

📡 Checking MeiliSearch availability...
✅ MeiliSearch is available

📈 Step 1: Calculating Popularity Scores
------------------------------------------------------------
Progress |████████████████████| 100% | 1000/1000 Products

✅ Popularity calculated: 1000/1000 products

📊 Step 2: Updating MeiliSearch Ranking Rules
------------------------------------------------------------
   Applying updates...
   Task UID: 42
   Waiting for completion...
✅ Ranking rules updated

🔄 Step 3: Reindexing Products
------------------------------------------------------------
Progress |████████████████████| 100% | 1000/1000 Products

✅ Reindexed: 1000/1000 products

==========================================================
✅ Ranking Sync Complete
==========================================================

⏱️  Total Time: 45.32s

📊 Updated Statistics:
   Total Products: 1000
   Average Popularity: 156
   Max Popularity: 892
   Featured: 120 (12%)
   In Stock: 850 (85%)

📋 Search is now optimized with:
   ✓ Popularity-based ranking
   ✓ In-stock prioritization
   ✓ Featured product boost
   ✓ Rating-based scoring
```

---

## Usage

### CLI Commands

#### Calculate Popularity Scores

```bash
# Calculate for all active products
npm run ranking:calculate

# Dry run (preview changes without saving)
npm run ranking:calculate -- --dry-run

# Filter by category
npm run ranking:calculate -- --category <categoryId>

# Filter by vendor
npm run ranking:calculate -- --vendor <vendorId>

# Custom batch size
npm run ranking:calculate -- --batch-size 50

# Only update uninitialized products (popularity = 0)
npm run ranking:calculate -- --only-uninitialized
```

**Example Output**:

```
🚀 Product Popularity Calculator
==========================================================

⚙️  Configuration:
   Batch Size: 100
   Status: ACTIVE

📊 Current Statistics:
   Total Products: 1000
   Average Popularity: 156
   Max Popularity: 892
   Featured Products: 120 (12%)
   In Stock Products: 850 (85%)

📦 Processing products...

Progress |████████████████████| 100% | 1000/1000 Products | Elapsed: 23s

==========================================================
✅ Popularity Calculation Complete
==========================================================

📊 Results:
   Total Products: 1000
   Successfully Updated: 1000
   Failed: 0
   Duration: 23.45s

📈 Popularity Statistics:
   Average: 156
   Maximum: 892
   Minimum: 0

📋 Next Steps:
  1. Update MeiliSearch ranking: npm run ranking:update-meilisearch
  2. Reindex products: npm run search:reindex
  3. Or run full sync: npm run ranking:sync
```

#### Update MeiliSearch Ranking

```bash
# Update ranking rules from config
npm run ranking:update-meilisearch

# Dry run
npm run ranking:update-meilisearch -- --dry-run

# Update specific index
npm run ranking:update-meilisearch -- --index products
```

#### Full Sync

```bash
# Complete workflow (recommended)
npm run ranking:sync

# Dry run
npm run ranking:sync:dry-run

# Skip popularity calculation
npm run ranking:sync -- --skip-popularity

# Skip reindexing
npm run ranking:sync -- --skip-reindex
```

### Admin API

#### Recalculate Popularity

**Endpoint**: `POST /api/admin/ranking/recalculate`

**Query Parameters**:
- `categoryId` (optional): Filter by category
- `vendorId` (optional): Filter by vendor
- `batchSize` (optional): Products per batch (default: 100)
- `onlyUninitialized` (optional): Only update products with popularity = 0
- `triggerReindex` (optional): Trigger MeiliSearch reindex (default: true)

**Example Request**:

```bash
curl -X POST "http://localhost:3000/api/admin/ranking/recalculate?batchSize=50&categoryId=clx123" \
  -H "Authorization: Bearer <admin-token>"
```

**Example Response**:

```json
{
  "success": true,
  "result": {
    "total": 250,
    "updated": 250,
    "failed": 0,
    "duration": 5432,
    "averagePopularity": 145,
    "maxPopularity": 678,
    "minPopularity": 0
  },
  "statistics": {
    "totalProducts": 1000,
    "averagePopularity": 156,
    "maxPopularity": 892,
    "minPopularity": 0,
    "averageRating": 4.2,
    "maxRating": 5,
    "featuredCount": 120,
    "inStockCount": 850,
    "featuredPercentage": 12,
    "inStockPercentage": 85
  },
  "message": "Popularity scores recalculated successfully"
}
```

#### Get Ranking Statistics

**Endpoint**: `GET /api/admin/ranking/recalculate`

**Example Response**:

```json
{
  "success": true,
  "statistics": {
    "totalProducts": 1000,
    "averagePopularity": 156,
    "maxPopularity": 892,
    "minPopularity": 0,
    "averageRating": 4.2,
    "maxRating": 5,
    "featuredCount": 120,
    "inStockCount": 850,
    "featuredPercentage": 12,
    "inStockPercentage": 85
  }
}
```

### Frontend Integration

Products can now be sorted by popularity:

```typescript
// In search/filter components
<SortDropdown>
  <option value="relevance">Most Relevant</option>
  <option value="popularity">Most Popular</option> ✨ NEW
  <option value="rating">Highest Rated</option>
  <option value="newest">Newest</option>
  <option value="bestseller">Bestseller</option>
  <option value="price-asc">Price: Low to High</option>
  <option value="price-desc">Price: High to Low</option>
</SortDropdown>
```

---

## Configuration

### Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `RANKING_POPULARITY_VIEWS_WEIGHT` | float | 0.3 | Weight for product views (0.0-1.0) |
| `RANKING_POPULARITY_SALES_WEIGHT` | float | 0.7 | Weight for sales (0.0-1.0) |
| `RANKING_BOOST_IN_STOCK` | int | 10 | In-stock boost percentage |
| `RANKING_BOOST_FEATURED` | int | 20 | Featured boost percentage |
| `RANKING_BOOST_RATING_MULTIPLIER` | int | 5 | Rating boost multiplier |
| `RANKING_AUTO_UPDATE_ENABLED` | boolean | true | Auto-update popularity on orders |

### Recommended Configurations

#### E-Commerce (Sales-Focused)

```bash
RANKING_POPULARITY_VIEWS_WEIGHT=0.2      # Less weight on views
RANKING_POPULARITY_SALES_WEIGHT=0.8      # More weight on sales
RANKING_BOOST_IN_STOCK=15                # Higher in-stock boost
RANKING_BOOST_FEATURED=25                # Higher featured boost
RANKING_BOOST_RATING_MULTIPLIER=6        # Higher rating impact
```

#### Content/Discovery (Views-Focused)

```bash
RANKING_POPULARITY_VIEWS_WEIGHT=0.6      # More weight on views
RANKING_POPULARITY_SALES_WEIGHT=0.4      # Less weight on sales
RANKING_BOOST_IN_STOCK=10                # Standard in-stock boost
RANKING_BOOST_FEATURED=15                # Lower featured boost
RANKING_BOOST_RATING_MULTIPLIER=4        # Lower rating impact
```

#### Balanced (Default)

```bash
RANKING_POPULARITY_VIEWS_WEIGHT=0.3
RANKING_POPULARITY_SALES_WEIGHT=0.7
RANKING_BOOST_IN_STOCK=10
RANKING_BOOST_FEATURED=20
RANKING_BOOST_RATING_MULTIPLIER=5
```

---

## Maintenance

### Scheduled Jobs

Set up cron jobs to keep popularity scores fresh:

#### Daily Recalculation (Recommended)

```bash
# crontab entry (runs daily at 2 AM)
0 2 * * * cd /path/to/mientior && npm run ranking:sync >> /var/log/ranking-sync.log 2>&1
```

#### Weekly Full Sync

```bash
# crontab entry (runs weekly on Sunday at 3 AM)
0 3 * * 0 cd /path/to/mientior && npm run ranking:sync >> /var/log/ranking-sync-weekly.log 2>&1
```

### Manual Maintenance

```bash
# Recalculate only changed products
npm run ranking:calculate -- --only-uninitialized

# Force full recalculation
npm run ranking:calculate

# Update MeiliSearch without recalculating
npm run ranking:sync -- --skip-popularity
```

### Monitoring

Check ranking statistics regularly:

```bash
# Via API
curl http://localhost:3000/api/admin/ranking/recalculate

# Or use the admin dashboard
open http://localhost:3000/admin/ranking
```

---

## Troubleshooting

### Issue: Popularity scores not updating

**Symptoms**: Products have popularity = 0 after running scripts

**Solutions**:
1. Check if migration was applied:
   ```bash
   psql $PRISMA_DATABASE_URL -c "SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'popularity';"
   ```
2. Verify Prisma Client is regenerated:
   ```bash
   npx prisma generate
   ```
3. Check for errors in script output:
   ```bash
   npm run ranking:calculate 2>&1 | tee ranking-debug.log
   ```

### Issue: MeiliSearch ranking not applied

**Symptoms**: Search results don't reflect popularity ranking

**Solutions**:
1. Verify MeiliSearch is running:
   ```bash
   npm run meilisearch:status
   ```
2. Check ranking rules:
   ```bash
   npm run ranking:update-meilisearch -- --dry-run
   ```
3. Reindex products:
   ```bash
   npm run search:reindex
   ```

### Issue: Performance degradation

**Symptoms**: Slow queries or high database load

**Solutions**:
1. Verify index exists:
   ```bash
   psql $PRISMA_DATABASE_URL -c "SELECT indexname FROM pg_indexes WHERE tablename = 'products' AND indexname = 'idx_products_popularity';"
   ```
2. Analyze query performance:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM products ORDER BY popularity DESC LIMIT 24;
   ```
3. Reduce batch size:
   ```bash
   npm run ranking:calculate -- --batch-size 50
   ```

### Issue: Auto-update not working

**Symptoms**: Popularity doesn't increase when orders are created

**Solutions**:
1. Check if auto-update is enabled:
   ```bash
   grep RANKING_AUTO_UPDATE_ENABLED .env.local
   ```
2. Verify Prisma middleware is active (check logs for `[Ranking]` entries)
3. Test manually:
   ```typescript
   // In a script or API route
   await prisma.product.update({
     where: { id: 'test-product-id' },
     data: { popularity: { increment: 70 } }
   })
   ```

---

## Performance

### Expected Performance

| Operation | Duration | Notes |
|-----------|----------|-------|
| Calculate 1000 products | 20-30s | Depends on database latency |
| Update MeiliSearch rules | <2s | Near-instant |
| Reindex 1000 products | 10-15s | Depends on MeiliSearch capacity |
| Full sync (1000 products) | 40-50s | End-to-end workflow |
| Search query overhead | <5ms | Negligible impact |

### Database Impact

- **Index Size**: ~8-16 KB per 1000 products
- **Query Performance**: O(log n) with index
- **Write Overhead**: Minimal (incremental updates only)

### MeiliSearch Impact

- **Reindexing Time**: ~10-15ms per product
- **Search Performance**: No noticeable difference (<1ms)
- **Storage Overhead**: ~4 bytes per product

### Optimization Tips

1. **Batch Size**: Adjust based on database capacity (50-200 recommended)
2. **Scheduled Jobs**: Run during off-peak hours (2-4 AM)
3. **Incremental Updates**: Use `--only-uninitialized` for new products only
4. **Auto-Update**: Enable for real-time accuracy, disable for lower overhead

---

## Related Documentation

- [MeiliSearch Setup](./README_MEILISEARCH.md)
- [Search Indexer](./README_SEARCH_INDEXER.md)
- [Database Architecture](./DATABASE_ARCHITECTURE_IMPLEMENTATION_COMPLETE.md)

---

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review [GitHub Issues](https://github.com/mientior/marketplace/issues)
- Contact: dev@mientior.com

# User Personalization System

Comprehensive personalization system for delivering personalized search results based on user behavior analysis.

## Overview

The personalization system analyzes user behavior (searches, product views, purchases) to identify favorite categories and brands, then applies relevance boosts to search results for logged-in users.

### Benefits

- **Improved Relevance**: Users see products from their preferred categories/brands first
- **Higher Conversion**: Personalized results lead to better engagement and sales
- **Better UX**: Returning users get a tailored shopping experience
- **Backward Compatible**: Works seamlessly for anonymous users (no personalization applied)

### How It Works

1. **Behavior Collection**: User actions are tracked in SearchLog (searches and product clicks via `clickedProductId`), and OrderItem (purchases)
2. **Preference Calculation**: A daily job analyzes behavior to identify top categories/brands with weighted scores
3. **Search Boost Application**: When a user searches, their preferences add relevance boosts to matching products (PostgreSQL FTS, MeiliSearch reranking, and Prisma queries)

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Behavior Sources                        │
├─────────────────────────────────┬───────────────────────────────┤
│   SearchLog                     │        OrderItem              │
│   (searches + clickedProductId) │       (purchases)             │
└────────────────┬────────────────┴────────────────┬──────────────┘
         │                 │                      │
         └─────────────────┼──────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │     Personalization Service         │
         │  - getUserBehaviorData()            │
         │  - calculatePreferenceScores()      │
         │  - batchCalculatePreferences()      │
         └─────────────────┬───────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────────┐
         │       User.preferences (JSON)       │
         │  - favoriteCategories[]             │
         │  - favoriteBrands[]                 │
         │  - searchPatterns                   │
         │  - lastCalculated                   │
         └─────────────────┬───────────────────┘
                           │
         ┌─────────────────┴───────────────────┐
         │                                     │
         ▼                                     ▼
┌─────────────────────┐           ┌─────────────────────┐
│   Redis Cache       │           │   Search Service    │
│   (1 hour TTL)      │◄──────────│   (boost injection) │
└─────────────────────┘           └─────────────────────┘
```

### Components

| Component | File | Purpose |
|-----------|------|---------|
| Types | `src/types/personalization.ts` | TypeScript interfaces |
| Service | `src/lib/personalization-service.ts` | Core calculation logic |
| Redis Cache | `src/lib/redis.ts` | Preference caching |
| Search Integration | `src/lib/product-search-service.ts` | Boost injection |
| CLI Script | `scripts/calculate-user-preferences.ts` | Batch calculation |
| Admin API | `src/app/api/admin/personalization/recalculate/route.ts` | Manual recalculation |

## Setup

### 1. Apply Database Migration

```bash
# Preview changes
./scripts/apply-user-preferences-migration.sh --dry-run

# Apply migration
./scripts/apply-user-preferences-migration.sh
```

Or manually:

```sql
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT NULL;
```

### 2. Regenerate Prisma Client

```bash
npx prisma generate
```

### 3. Configure Environment Variables

Add to `.env`:

```env
# Personalization Configuration
PERSONALIZATION_PURCHASES_WEIGHT=0.5    # Weight for purchases (0.0-1.0)
PERSONALIZATION_SEARCHES_WEIGHT=0.3     # Weight for searches (0.0-1.0)
PERSONALIZATION_VIEWS_WEIGHT=0.2        # Weight for views (0.0-1.0)
PERSONALIZATION_CATEGORY_BOOST=15       # Category boost percentage
PERSONALIZATION_BRAND_BOOST=10          # Brand boost percentage
PERSONALIZATION_MIN_INTERACTIONS=3      # Minimum interactions threshold
```

### 4. Calculate Initial Preferences

```bash
# Dry run to preview
npm run personalization:calculate:dry-run

# Calculate for all users
npm run personalization:calculate
```

### 5. Verify Setup

```bash
# Check statistics
npm run personalization:stats
```

## Configuration

### Weight Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PERSONALIZATION_PURCHASES_WEIGHT` | 0.5 | Weight for purchase history (highest intent) |
| `PERSONALIZATION_SEARCHES_WEIGHT` | 0.3 | Weight for search history (interest signal) |
| `PERSONALIZATION_VIEWS_WEIGHT` | 0.2 | Weight for product views (awareness) |

**Note**: Weights should sum to 1.0 for normalized scoring.

### Boost Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PERSONALIZATION_CATEGORY_BOOST` | 15 | Percentage boost for favorite categories |
| `PERSONALIZATION_BRAND_BOOST` | 10 | Percentage boost for favorite brands |
| `PERSONALIZATION_MIN_INTERACTIONS` | 3 | Minimum interactions to qualify |

### Tuning Guidelines

- **E-commerce with high purchase volume**: Increase `PURCHASES_WEIGHT` to 0.6-0.7
- **Content/discovery focused**: Increase `VIEWS_WEIGHT` to 0.3-0.4
- **Search-heavy users**: Increase `SEARCHES_WEIGHT` to 0.4
- **Strong personalization**: Increase boosts to 20-25%
- **Subtle personalization**: Decrease boosts to 5-10%

## Usage

### CLI Commands

```bash
# Calculate preferences for all users
npm run personalization:calculate

# Dry run (preview without saving)
npm run personalization:calculate:dry-run

# Calculate for specific user
npm run personalization:user -- clx123456

# Only users without preferences
npm run personalization:calculate -- --only-uninitialized

# View statistics
npm run personalization:stats

# JSON output for monitoring
npm run personalization:stats -- --json
```

### Admin API

#### Get Statistics

```bash
GET /api/admin/personalization/recalculate
```

Response:
```json
{
  "success": true,
  "statistics": {
    "totalUsers": 1000,
    "usersWithPreferences": 750,
    "coveragePercentage": 75.0,
    "avgCategoriesPerUser": 3.2,
    "avgBrandsPerUser": 1.8
  },
  "config": {
    "purchasesWeight": 0.5,
    "searchesWeight": 0.3,
    "viewsWeight": 0.2,
    "categoryBoost": 15,
    "brandBoost": 10
  }
}
```

#### Trigger Recalculation

```bash
POST /api/admin/personalization/recalculate?batchSize=100&onlyUninitialized=true
```

Response:
```json
{
  "success": true,
  "result": {
    "total": 250,
    "updated": 230,
    "skipped": 15,
    "failed": 5,
    "duration": 12500
  },
  "message": "Successfully calculated preferences for 230 users"
}
```

### Checking User Preferences

```sql
-- View a user's preferences
SELECT id, email, preferences 
FROM users 
WHERE id = 'user_id_here';

-- Users with preferences
SELECT COUNT(*) FROM users WHERE preferences IS NOT NULL;

-- Top favorite categories across users
SELECT 
  cat->>'name' as category,
  COUNT(*) as user_count
FROM users,
  jsonb_array_elements(preferences->'favoriteCategories') as cat
WHERE preferences IS NOT NULL
GROUP BY cat->>'name'
ORDER BY user_count DESC
LIMIT 10;
```

## Preference Calculation

### Algorithm

1. **Fetch Behavior Data**
   - Searches from `SearchLog` (grouped by query)
   - Views from `Analytics` (joined with Product for category/vendor)
   - Purchases from `OrderItem` (joined with Product, summed by quantity)

2. **Calculate Weighted Scores**
   ```
   score = purchases * PURCHASES_WEIGHT + 
           searches * SEARCHES_WEIGHT + 
           views * VIEWS_WEIGHT
   ```

3. **Filter by Threshold**
   - Only categories/brands with `totalInteractions >= MIN_INTERACTIONS`

4. **Normalize Scores**
   - Scale to 0-100 range relative to max score

5. **Select Top Items**
   - Top 5 categories
   - Top 3 brands

### Preference Structure

```typescript
interface UserPreferences {
  favoriteCategories: Array<{
    id: string
    name: string
    score: number      // 0-100
    boost: number      // e.g., 15 for 15%
    metadata: {
      views: number
      searches: number
      purchases: number
    }
  }>
  favoriteBrands: Array<{...}>
  searchPatterns: {
    topQueries: Array<{ query: string, count: number }>
    preferredLocale: 'fr' | 'en'
  }
  lastCalculated: Date
  algorithmVersion: string
}
```

## Search Integration

### PostgreSQL FTS

Personalization boosts are injected into the relevance ORDER BY clause:

```sql
ORDER BY (
  ts_rank(search_vector, query) +
  CASE WHEN featured THEN 0.2 ELSE 0 END +
  CASE WHEN stock > 0 THEN 0.1 ELSE 0 END +
  (rating / 5.0 * 0.1) +
  -- Personalization boosts
  CASE WHEN category_id = ANY($favoriteCategoryIds) THEN 0.15 ELSE 0 END +
  CASE WHEN vendor_id = ANY($favoriteBrandIds) THEN 0.10 ELSE 0 END
) DESC
```

### MeiliSearch

For MeiliSearch, personalization is applied via post-processing:
1. Fetch results from MeiliSearch
2. Apply boost multipliers to matching products
3. Re-sort by adjusted scores

### Fallback Behavior

- **No userId**: Standard search (no personalization)
- **No preferences**: Standard search (user hasn't been calculated yet)
- **Cache miss**: Fetch from database, cache for 1 hour
- **Error**: Log warning, continue with standard search

## Maintenance

### Daily Cron Job

Set up a daily cron job to recalculate preferences:

```bash
# crontab -e
0 3 * * * cd /path/to/project && npm run personalization:calculate >> /var/log/personalization.log 2>&1
```

### Monitoring

```bash
# Check coverage and health
npm run personalization:stats

# Monitor via API
curl -H "Authorization: Bearer $TOKEN" \
  https://your-site.com/api/admin/personalization/recalculate
```

### Cache Management

```bash
# Preferences are cached in Redis with 1-hour TTL
# To manually invalidate:
redis-cli KEYS "user:preferences:*" | xargs redis-cli DEL
```

## Performance

### Expected Impact

| Metric | Impact |
|--------|--------|
| Search latency overhead | < 5ms (with cache hit) |
| Search latency overhead | < 50ms (cache miss, DB fetch) |
| Calculation time per user | ~100-200ms |
| Batch calculation (1000 users) | ~2-3 minutes |

### Optimization Tips

1. **Use Redis caching**: Preferences are cached for 1 hour
2. **Batch calculations**: Process during off-peak hours
3. **Incremental updates**: Use `--only-uninitialized` for new users
4. **Monitor coverage**: Aim for 80%+ user coverage

## Troubleshooting

### No Preferences Calculated

**Symptoms**: `usersWithPreferences = 0`

**Solutions**:
1. Run `npm run personalization:calculate`
2. Check if users have sufficient behavior data
3. Lower `MIN_INTERACTIONS` threshold

### Boosts Not Applied

**Symptoms**: Search results not personalized

**Solutions**:
1. Verify userId is being passed to search API
2. Check Redis cache: `redis-cli GET user:preferences:USER_ID`
3. Verify preferences exist: `SELECT preferences FROM users WHERE id = 'USER_ID'`
4. Check logs for `[product-search-service] Applied personalization`

### Slow Calculations

**Symptoms**: Batch calculation takes too long

**Solutions**:
1. Reduce batch size: `--batch-size 25`
2. Add database indexes on analytics tables
3. Run during off-peak hours

### Stale Preferences

**Symptoms**: High `usersNeedingRecalculation` count

**Solutions**:
1. Set up daily cron job
2. Run `npm run personalization:calculate`
3. Consider more frequent recalculation for active users

## API Reference

### Personalization Service

```typescript
// Get configuration
getPersonalizationConfig(): PersonalizationConfig

// Get user behavior data
getUserBehaviorData(userId: string): Promise<UserBehaviorData>

// Calculate scores from behavior
calculatePreferenceScores(data: UserBehaviorData): { categories, brands }

// Calculate and save for one user
calculateUserPreferences(userId: string): Promise<UserPreferences | null>

// Batch calculate for multiple users
batchCalculatePreferences(options: BatchCalculateOptions): Promise<BatchCalculateResult>

// Get statistics
getPreferenceStatistics(): Promise<PersonalizationStatistics>

// Get cached preferences
getUserPreferences(userId: string): Promise<UserPreferences | null>

// Invalidate preferences
invalidateUserPreferences(userId: string): Promise<void>
```

### Redis Cache

```typescript
// Get cached preferences
getCachedUserPreferences(userId: string): Promise<UserPreferences | null>

// Set cached preferences
setCachedUserPreferences(userId: string, prefs: UserPreferences): Promise<void>

// Invalidate cache
invalidateUserPreferencesCache(userId: string): Promise<void>

// Invalidate all
invalidateAllUserPreferencesCache(): Promise<void>
```

## Future Enhancements

- [ ] Real-time preference updates on user actions
- [ ] Collaborative filtering (users who bought X also bought Y)
- [ ] A/B testing personalization impact
- [ ] Preference decay over time (recent behavior weighted higher)
- [ ] Category/brand affinity visualization in admin dashboard
- [ ] Personalized email recommendations
- [ ] Session-based personalization for anonymous users

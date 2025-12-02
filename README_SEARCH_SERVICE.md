# Unified Search Service

## Overview

The Unified Search Service provides a single, consistent interface for product search, suggestions, and facets that automatically routes to either PostgreSQL Full-Text Search or MeiliSearch based on configuration and A/B testing.

### Key Features

- **Automatic Engine Selection**: Routes to PostgreSQL or MeiliSearch based on feature flags and A/B testing
- **Transparent Fallback**: Automatically falls back to PostgreSQL if MeiliSearch is unavailable
- **A/B Testing**: Session-based A/B testing to compare search engine performance
- **Performance Tracking**: Detailed metrics and analytics for both engines
- **Consistent API**: Same interface regardless of underlying engine
- **Zero Downtime**: Graceful degradation ensures search always works

## Architecture

```
┌─────────────────┐
│   API Routes    │ (search, products/search, suggestions)
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  Unified Search Service │ (src/lib/search-service.ts)
└────────┬────────────────┘
         │
         ├─── A/B Test? ──► Check Session Variant
         │
         ├─── Feature Flag? ──► ENABLE_MEILISEARCH
         │
         └─── Available? ──► MeiliSearch Health Check
                │
                ├─► PostgreSQL FTS ◄─── Fallback
                │
                └─► MeiliSearch
```

### Decision Tree

1. **If A/B Testing Enabled** (`ENABLE_SEARCH_AB_TEST=true`):
   - Get variant from session (50/50 split)
   - Use assigned engine (PostgreSQL or MeiliSearch)

2. **Else If** `ENABLE_MEILISEARCH=true`:
   - Check MeiliSearch availability
   - If available → Use MeiliSearch
   - If unavailable → Fallback to PostgreSQL

3. **Else**:
   - Use PostgreSQL FTS

## Configuration

### Environment Variables

```bash
# Enable MeiliSearch for all users
ENABLE_MEILISEARCH=false

# Enable A/B testing (overrides ENABLE_MEILISEARCH)
ENABLE_SEARCH_AB_TEST=false

# MeiliSearch Configuration
MEILISEARCH_URL=http://localhost:7700
MEILISEARCH_MASTER_KEY=changeme_meilisearch_master_key_here
MEILISEARCH_INDEX_PREFIX=mientior_
```

### Feature Flag Precedence

```
A/B Test > ENABLE_MEILISEARCH > Availability Check > PostgreSQL Fallback
```

## Usage

### Basic Search

```typescript
import { search } from '@/lib/search-service'

const results = await search({
  query: 'laptop',
  filters: {
    priceMin: 500,
    priceMax: 2000,
    categories: ['electronics'],
    brands: ['apple', 'dell'],
    colors: ['silver', 'space-gray'],
    sizes: ['13-inch', '15-inch'],
    rating: 4,
    inStock: true,
    onSale: false,
  },
  sort: 'relevance', // or 'price-asc', 'price-desc', 'rating', 'newest', 'bestseller'
  page: 1,
  limit: 24,
})

console.log(results.products) // Array of products
console.log(results.totalCount) // Total matching products
console.log(results.searchEngine) // 'postgresql' or 'meilisearch'
console.log(results.executionTime) // Execution time in ms
console.log(results.abTestVariant) // A/B test variant (if enabled)
```

### Suggestions / Autocomplete

```typescript
import { suggest } from '@/lib/search-service'

const suggestions = await suggest({
  query: 'lap',
  limit: 10,
  useWordSimilarity: true, // For PostgreSQL word similarity
})

console.log(suggestions.suggestions) // Array of suggestions
console.log(suggestions.searchEngine) // Engine used
console.log(suggestions.metadata.usedFuzzy) // Whether fuzzy matching was used
```

### Dynamic Facets

```typescript
import { facets } from '@/lib/search-service'

const availableFilters = await facets({
  query: 'laptop',
  filters: {
    categories: ['electronics'],
  },
})

console.log(availableFilters.priceRange) // { min: number, max: number }
console.log(availableFilters.categories) // [{ id, name, count }]
console.log(availableFilters.brands) // [{ id, name, count }]
console.log(availableFilters.colors) // [{ value, name, count }]
console.log(availableFilters.sizes) // [{ value, count }]
```

## A/B Testing

### Enabling A/B Testing

1. **Set Environment Variable**:
   ```bash
   ENABLE_SEARCH_AB_TEST=true
   ```

   Or use npm script:
   ```bash
   npm run search:ab-enable
   ```

2. **Ensure Both Engines Are Ready**:
   - PostgreSQL FTS indexes exist
   - MeiliSearch is running and indexed

3. **Restart Application**:
   ```bash
   npm run dev
   ```

### How It Works

- **Session-Based**: Each user gets a session cookie (`search_session_id`)
- **50/50 Split**: Deterministic hash assigns variant (PostgreSQL or MeiliSearch)
- **Consistent**: Same user always gets same variant for 24 hours
- **Tracked**: All searches logged with variant information

### Viewing Metrics

**Admin Dashboard**:
```
GET /api/admin/search/ab-test-metrics?startDate=2024-01-01&endDate=2024-01-31
```

**Response Format**:
```json
{
  "period": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  },
  "postgresql": {
    "totalSearches": 12450,
    "avgExecutionTime": 156,
    "p50Latency": 142,
    "p95Latency": 287,
    "p99Latency": 412,
    "avgResultCount": 23.4,
    "zeroResultRate": 8.2
  },
  "meilisearch": {
    "totalSearches": 12389,
    "avgExecutionTime": 19,
    "p50Latency": 17,
    "p95Latency": 28,
    "p99Latency": 39,
    "avgResultCount": 23.6,
    "zeroResultRate": 7.9
  },
  "comparison": {
    "speedImprovement": 87.8,
    "winner": "meilisearch"
  },
  "enabled": true
}
```

**Command Line**:
```bash
npm run search:ab-metrics
npm run search:ab-metrics -- --start 2024-01-01 --end 2024-01-31
```

### Best Practices

- **Run for 7+ Days**: Get statistically significant data
- **Monitor Relevance**: Speed isn't everything—check user engagement
- **Sufficient Traffic**: Need enough searches for meaningful comparison
- **Disable After Decision**: Reduce complexity once you've chosen an engine

## Performance Comparison

### PostgreSQL FTS

**Pros:**
- ✅ No additional infrastructure required
- ✅ Immediate consistency (no indexing delay)
- ✅ Supports complex SQL queries
- ✅ Free and open source
- ✅ Integrated with existing database

**Cons:**
- ❌ Slower for large datasets (> 100K products)
- ❌ Limited typo tolerance (requires pg_trgm)
- ❌ Manual facet computation (slower)
- ❌ No built-in ranking customization
- ❌ Scales with database load

**Typical Performance:**
- Simple search: 100-200ms
- With facets: 150-300ms
- Suggestions: 50-100ms

### MeiliSearch

**Pros:**
- ✅ Ultra-fast (< 50ms typical)
- ✅ Built-in typo tolerance
- ✅ Native faceting (instant)
- ✅ Customizable ranking rules
- ✅ Better relevance out-of-the-box
- ✅ Horizontal scaling

**Cons:**
- ❌ Requires separate service (Docker/cloud)
- ❌ Eventual consistency (< 5s indexing delay)
- ❌ Additional infrastructure cost
- ❌ Memory-intensive (data must fit in RAM)
- ❌ Separate data synchronization needed

**Typical Performance:**
- Simple search: 10-30ms
- With facets: 15-40ms
- Suggestions: 5-15ms

## Troubleshooting

### MeiliSearch Unavailable

**Symptoms:**
- Searches automatically use PostgreSQL
- Console warns: "MeiliSearch unavailable, falling back"

**Diagnosis:**
```bash
# Check Docker container
docker ps | grep meilisearch

# Check health endpoint
curl http://localhost:7700/health

# Check logs
docker logs meilisearch
```

**Solutions:**
1. Start MeiliSearch: `npm run meilisearch:start`
2. Check network connectivity
3. Verify `MEILISEARCH_URL` in `.env`
4. Check firewall rules

### Slow Search Performance

**For PostgreSQL:**
```bash
# Check if FTS indexes exist
npm run db:product-search:status

# Analyze query performance
npm run db:product-search:analyze

# Optimize indexes
npm run db:product-search:optimize
```

**For MeiliSearch:**
```bash
# Check index stats
npm run meilisearch:status

# View detailed stats
npm run meilisearch:stats

# Check indexing queue
npm run search:status
```

### Inconsistent Results

**MeiliSearch has indexing delay (< 5s):**
```bash
# Check indexer queue status
npm run search:status

# Force reindex
npm run search:reindex
```

### A/B Test Not Working

**Verification Checklist:**
1. ✅ `ENABLE_SEARCH_AB_TEST=true` in `.env`
2. ✅ Session cookie `search_session_id` is being set
3. ✅ Both engines are available and functional
4. ✅ Redis is running (for variant storage)

**Debug:**
```bash
# Check Redis for variant assignments
redis-cli GET "ab:search:variant:{sessionId}"

# View recent metrics
npm run search:ab-metrics

# Test both engines manually
npm run search:test-meilisearch
```

## Migration Guide

### Phase 1: Setup (Week 1)

1. **Install and Configure MeiliSearch**:
   ```bash
   npm run meilisearch:start
   npm run meilisearch:init
   ```

2. **Verify Indexes**:
   ```bash
   npm run meilisearch:status
   ```

3. **Test Searches Manually**:
   ```bash
   npm run search:test-meilisearch
   ```

4. **Keep** `ENABLE_MEILISEARCH=false`

### Phase 2: A/B Testing (Weeks 2-3)

1. **Enable A/B Testing**:
   ```bash
   npm run search:ab-enable
   ```

2. **Monitor Daily**:
   ```bash
   npm run search:ab-metrics
   ```

3. **Compare Performance**:
   ```bash
   npm run search:compare
   ```

4. **Gather User Feedback**:
   - Track engagement metrics
   - Monitor zero-result rates
   - Check conversion rates

### Phase 3: Decision (Week 4)

1. **Analyze Results**:
   ```bash
   npm run search:ab-metrics -- --start 2024-01-01 --end 2024-01-31
   ```

2. **If MeiliSearch Wins**:
   ```bash
   # Disable A/B test
   npm run search:ab-disable

   # Enable MeiliSearch for all users
   # Set ENABLE_MEILISEARCH=true in .env
   ```

3. **If PostgreSQL Wins**:
   ```bash
   # Disable A/B test
   npm run search:ab-disable

   # Keep ENABLE_MEILISEARCH=false
   ```

4. **Document Decision**: Record rationale for future reference

### Phase 4: Cleanup (Week 5)

1. **Remove Unused Engine** (optional):
   - If keeping PostgreSQL: Can remove MeiliSearch infrastructure
   - If keeping MeiliSearch: Keep PostgreSQL as fallback

2. **Update Documentation**

3. **Optimize Chosen Engine**

## API Reference

### `search(options, sessionId?)`

Search products using the unified search service.

**Parameters:**
- `options: ProductSearchOptions` - Search options
  - `query: string` - Search query
  - `filters?: ProductSearchFilters` - Filters object
  - `sort?: SortOption` - Sort option
  - `page?: number` - Page number (default: 1)
  - `limit?: number` - Results per page (default: 24)
- `sessionId?: string` - Optional session ID for A/B testing

**Returns:** `Promise<SearchResultWithMetadata>`
- `products: Product[]` - Array of matching products
- `totalCount: number` - Total number of matches
- `searchEngine: 'postgresql' | 'meilisearch'` - Engine used
- `executionTime: number` - Execution time in milliseconds
- `abTestVariant?: 'postgresql' | 'meilisearch'` - A/B test variant (if enabled)

### `suggest(options, sessionId?)`

Get search suggestions for autocomplete.

**Parameters:**
- `options: SuggestionOptions` - Suggestion options
  - `query: string` - Search query (min 2 characters)
  - `limit?: number` - Max suggestions (default: 10)
  - `useWordSimilarity?: boolean` - Enable word similarity for PostgreSQL
- `sessionId?: string` - Optional session ID for A/B testing

**Returns:** `Promise<SuggestionResultWithMetadata>`
- `suggestions: Suggestion[]` - Array of suggestions
- `metadata` - Metadata object
  - `usedFuzzy: boolean` - Whether fuzzy matching was used
  - `executionTime: number` - Execution time in ms
  - `cacheHit: boolean` - Whether result was cached
- `searchEngine: 'postgresql' | 'meilisearch'` - Engine used
- `abTestVariant?` - A/B test variant (if enabled)

### `facets(options, sessionId?)`

Compute dynamic facets for current search/filters.

**Parameters:**
- `options: FacetsComputeOptions` - Facets options
  - `query?: string` - Search query
  - `filters?` - Current filters applied
- `sessionId?: string` - Optional session ID for A/B testing

**Returns:** `Promise<AvailableFilters>`
- `priceRange: { min: number, max: number }` - Price range
- `categories: Array<{ id, name, count }>` - Available categories
- `brands: Array<{ id, name, count }>` - Available brands
- `colors: Array<{ value, name, count }>` - Available colors
- `sizes: Array<{ value, count }>` - Available sizes

## Related Documentation

- [README_PRODUCT_FTS.md](./README_PRODUCT_FTS.md) - PostgreSQL Full-Text Search
- [README_MEILISEARCH.md](./README_MEILISEARCH.md) - MeiliSearch Setup
- [README_SEARCH_INDEXER.md](./README_SEARCH_INDEXER.md) - Search Indexer
- [README_SEARCH_ANALYTICS.md](./README_SEARCH_ANALYTICS.md) - Search Analytics

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review related documentation
- Check application logs
- Verify environment configuration

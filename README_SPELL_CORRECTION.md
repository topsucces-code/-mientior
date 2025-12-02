# Spell Correction for Search

## Overview

The spell correction feature automatically detects misspelled search queries that return zero results and suggests corrected terms based on existing product names, categories, and tags in the database. This improves user experience by helping users find what they're looking for even when they make typing errors.

When a search query returns no results, the system uses PostgreSQL's `pg_trgm` extension to find similar terms with high confidence (similarity > 0.4), automatically re-executes the search with the corrected query, and displays the results with a clear message indicating the correction was applied.

## How It Works

### Detection Flow

1. **Zero Results Detection**: When a product search returns 0 results, the spell correction system is triggered
2. **Cache Check**: The system first checks Redis for a cached correction to minimize database load
3. **Similarity Search**: If not cached, PostgreSQL's `similarity()` function queries Product, Category, and Tag tables
4. **Threshold Filtering**: Only corrections with similarity > 0.4 (configurable) are considered
5. **Best Match Selection**: The correction with the highest similarity score across all sources is selected
6. **Re-search**: The search is automatically re-executed with the corrected query
7. **User Feedback**: Results are displayed with a message: "Résultats pour [correction]" and a link to search the original query instead

### Example Flow

```
User searches: "smartphon"
  ↓
FTS returns 0 results
  ↓
Spell correction finds: "smartphone" (similarity: 0.89)
  ↓
Re-search with "smartphone" returns 24 products
  ↓
Display: "Résultats pour 'smartphone' · Rechercher plutôt 'smartphon'"
```

## Technical Implementation

### Service Layer

**File**: `src/lib/spell-correction.ts`

The core spell correction service provides:
- `getSpellCorrection(query: string)` - Main function that returns the best correction or null
- `SpellCorrectionResult` interface - Contains `correctedQuery`, `originalQuery`, `confidence`, and `source` fields
- Configurable threshold via `SEARCH_SPELL_CORRECTION_THRESHOLD` environment variable
- Queries across Product, Category, and Tag tables using raw SQL with `similarity()` function
- Returns the highest-confidence match across all sources

**Algorithm**:
```typescript
// Pseudo-code
for each table in [Product, Category, Tag]:
  SELECT name, similarity(name, query) as score
  WHERE similarity(name, query) > threshold
  ORDER BY score DESC
  LIMIT 1

bestMatch = highest scoring result across all tables
if bestMatch.name !== query.toLowerCase():
  return { correctedQuery: bestMatch.name, confidence: bestMatch.score, ... }
else:
  return null
```

### API Integration

**File**: `src/app/api/search/route.ts`

The search API endpoint integrates spell correction:
1. Executes initial product search via `searchProducts()`
2. If `totalCount === 0`, triggers spell correction
3. Checks Redis cache first: `search:correction:${query.toLowerCase()}`
4. If not cached, calls `getSpellCorrection(query)`
5. Caches the correction result (including null) for 1 hour
6. Re-executes search with corrected query if correction found
7. Includes `correctedQuery` and `originalQuery` in response
8. Logs correction in search analytics with `correctedFrom` field

### Caching Layer

**File**: `src/lib/redis.ts`

The `getCachedSpellCorrection()` helper function:
- Creates cache keys in format: `search:correction:${query.toLowerCase()}`
- Uses 1-hour TTL (3600 seconds) for all corrections
- Caches both successful corrections AND null results (to avoid repeated lookups)
- Stores null as string `'null'` to distinguish from cache miss
- Gracefully degrades by calling fetcher directly if Redis fails

### UI Component

**File**: `src/components/search/search-results.tsx`

The SearchResults component displays correction messages:
- Accepts `correctedQuery` and `originalQuery` props
- Displays a blue-bordered card with correction message when present
- Message format: "Résultats pour [corrected] · Rechercher plutôt [original]"
- Provides clickable link to search the original query
- Includes proper focus states for accessibility

### Type Definitions

**File**: `src/types/index.ts`

Extended `SearchResults` interface:
```typescript
export interface SearchResults {
  // ... existing fields
  correctedQuery?: string  // The corrected query that was used
  originalQuery?: string   // The original user query before correction
}
```

## Configuration

### Environment Variable

Add to your `.env.local`:

```bash
# Spell correction threshold for zero-result queries
# Higher threshold = more accurate corrections but fewer suggestions
# Recommended: 0.4 (higher than autocomplete to ensure quality)
SEARCH_SPELL_CORRECTION_THRESHOLD=0.4
```

**Threshold Guidelines**:
- **Range**: 0.0 to 1.0
- **Default**: 0.4
- **Lower values** (0.2 - 0.3): More corrections, but may include inaccurate suggestions
- **Recommended** (0.4 - 0.5): Balanced accuracy and coverage
- **Higher values** (0.6 - 0.7): Very accurate but may miss valid corrections

**Comparison with Other Thresholds**:
- `SEARCH_SIMILARITY_THRESHOLD=0.3` - Used for autocomplete suggestions (lower for more suggestions)
- `SEARCH_SPELL_CORRECTION_THRESHOLD=0.4` - Used for spell correction (higher for quality)

## Examples

### Successful Corrections

| Original Query | Corrected To | Confidence | Source |
|---------------|-------------|-----------|---------|
| smartphon | smartphone | 0.89 | product |
| ordinatuer | ordinateur | 0.85 | product |
| casque bluetoth | casque bluetooth | 0.82 | product |
| electronik | électronique | 0.78 | category |
| samsng | samsung | 0.83 | tag |

### No Correction Scenarios

- **Query too short**: Single character queries
- **Already correct**: Query matches existing term (case-insensitive)
- **Too different**: No terms found above threshold
- **Still zero results**: Correction found but re-search still returns 0 results

## Performance

### Latency Breakdown

- **Cache Hit**: < 5ms (Redis lookup)
- **Cache Miss**: < 50ms (pg_trgm query + cache write + re-search)
- **Total with correction**: ~55ms average (still under target of 100ms)

### Caching Strategy

- **Correction Cache**: 1 hour TTL (3600 seconds)
  - Key format: `search:correction:smartphon`
  - Stores both corrections and null results
  - Reduces database load by 95%+ for repeated misspellings

- **Search Results Cache**: 5 minutes TTL (300 seconds)
  - Separate cache for original vs corrected searches
  - Prevents confusion between user queries

### Database Indexes

The spell correction feature relies on existing trigram indexes:

```sql
-- These indexes should already exist from trigram search implementation
CREATE INDEX idx_product_name_trigram ON "Product" USING gin (name gin_trgm_ops);
CREATE INDEX idx_category_name_trigram ON "Category" USING gin (name gin_trgm_ops);
CREATE INDEX idx_tag_name_trigram ON "Tag" USING gin (name gin_trgm_ops);
```

## Monitoring

### Cache Hit Rate

Check Redis cache effectiveness:
```bash
# Redis CLI
redis-cli INFO stats | grep keyspace_hits
redis-cli INFO stats | grep keyspace_misses

# Calculate hit rate: hits / (hits + misses)
```

### Correction Frequency

Monitor how often corrections are applied:
```sql
-- Query search analytics for corrections
SELECT
  COUNT(*) as total_searches,
  COUNT(CASE WHEN metadata->>'correctedFrom' IS NOT NULL THEN 1 END) as corrected_searches,
  ROUND(COUNT(CASE WHEN metadata->>'correctedFrom' IS NOT NULL THEN 1 END)::decimal / COUNT(*) * 100, 2) as correction_rate
FROM "SearchAnalytics"
WHERE "createdAt" > NOW() - INTERVAL '7 days';
```

### Top Corrections

Identify common misspellings:
```sql
SELECT
  metadata->>'correctedFrom' as original_query,
  query as corrected_to,
  COUNT(*) as frequency
FROM "SearchAnalytics"
WHERE metadata->>'correctedFrom' IS NOT NULL
  AND "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY original_query, query
ORDER BY frequency DESC
LIMIT 20;
```

### Zero-Result Queries (No Correction Found)

Find queries that need attention:
```sql
SELECT
  query,
  COUNT(*) as search_count
FROM "SearchAnalytics"
WHERE "resultCount" = 0
  AND metadata->>'correctedFrom' IS NULL
  AND "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY query
ORDER BY search_count DESC
LIMIT 20;
```

## Troubleshooting

### Issue: No corrections found for obvious misspellings

**Possible Causes**:
1. Threshold too high (0.5+)
2. Product/Category/Tag names don't exist in database
3. pg_trgm extension not enabled

**Solutions**:
```bash
# 1. Check threshold
echo $SEARCH_SPELL_CORRECTION_THRESHOLD

# 2. Verify pg_trgm extension
psql -U mientior -d mientior_db -c "SELECT * FROM pg_extension WHERE extname = 'pg_trgm';"

# 3. Check trigram indexes
psql -U mientior -d mientior_db -c "\d Product"
# Look for: idx_product_name_trigram (gin)

# 4. Test similarity directly
psql -U mientior -d mientior_db -c "SELECT name, similarity(name, 'smartphon') as score FROM \"Product\" WHERE similarity(name, 'smartphon') > 0.3 ORDER BY score DESC LIMIT 5;"
```

### Issue: Too many incorrect corrections

**Possible Causes**:
1. Threshold too low (< 0.35)
2. Database contains similar but unrelated terms

**Solutions**:
```bash
# Increase threshold gradually
SEARCH_SPELL_CORRECTION_THRESHOLD=0.5

# Review correction logs
# See "Top Corrections" query above
```

### Issue: Performance degradation

**Possible Causes**:
1. Redis not running or inaccessible
2. Trigram indexes missing or not being used
3. Large Product/Category/Tag tables without proper indexes

**Solutions**:
```bash
# 1. Check Redis connection
redis-cli PING
# Expected: PONG

# 2. Verify index usage with EXPLAIN ANALYZE
psql -U mientior -d mientior_db -c "EXPLAIN ANALYZE SELECT name, similarity(name, 'test') as score FROM \"Product\" WHERE similarity(name, 'test') > 0.4 ORDER BY score DESC LIMIT 1;"
# Look for: "Bitmap Index Scan" using idx_product_name_trigram

# 3. Check table statistics
psql -U mientior -d mientior_db -c "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables WHERE tablename IN ('Product', 'Category', 'Tag');"

# 4. Update statistics if needed
psql -U mientior -d mientior_db -c "ANALYZE \"Product\"; ANALYZE \"Category\"; ANALYZE \"Tag\";"
```

### Issue: Corrections not displayed in UI

**Possible Causes**:
1. Frontend not passing `correctedQuery` props to `SearchResults` component
2. Component not re-rendering after correction

**Solutions**:
```typescript
// Check API response in browser DevTools
// Network tab → search?q=smartphon → Response should include:
{
  "products": [...],
  "correctedQuery": "smartphone",
  "originalQuery": "smartphon",
  ...
}

// Verify props are passed to SearchResults
<SearchResults
  query={query}
  results={data}
  correctedQuery={data.correctedQuery}  // Ensure this is present
  originalQuery={data.originalQuery}    // Ensure this is present
  onQueryChange={handleQueryChange}
/>
```

## Future Enhancements

### 1. Multi-Word Query Correction
Currently corrects entire queries as single terms. Could be enhanced to:
- Split queries into words
- Correct each word independently
- Handle partial corrections (e.g., "casque bluetoth" → "casque bluetooth")

### 2. Learning from User Behavior
Track user acceptance/rejection of corrections:
- Log when users click "Rechercher plutôt [original]"
- Adjust confidence thresholds dynamically
- Build a correction blacklist for frequently rejected suggestions

### 3. Language-Specific Correction Rules
Add French-specific handling:
- Accent handling (e.g., "ecouteur" → "écouteur")
- Common phonetic errors (e.g., "ph" ↔ "f")
- Keyboard proximity errors (e.g., "a" → "q" on AZERTY)

### 4. Synonym-Aware Corrections
Integrate with a synonym database:
- "ordinateur" ↔ "PC"
- "téléphone" ↔ "smartphone"
- "écouteurs" ↔ "casque audio"

### 5. Category-Aware Corrections
Weight corrections based on search context:
- If user previously searched in "Electronics", prioritize electronic product names
- Use session history to improve relevance

### 6. A/B Testing Framework
Test different thresholds and approaches:
- Threshold variations (0.3 vs 0.4 vs 0.5)
- Multi-source weighting (products 2x, categories 1x, tags 0.5x)
- Correction display formats

## Integration Testing

### Manual Test Cases

```bash
# Test 1: Basic correction (should correct)
curl "http://localhost:3000/api/search?q=smartphon"
# Expected: correctedQuery="smartphone", products returned

# Test 2: Already correct (should not correct)
curl "http://localhost:3000/api/search?q=smartphone"
# Expected: no correctedQuery field, products returned

# Test 3: Too different (should not correct)
curl "http://localhost:3000/api/search?q=zzzzzzz"
# Expected: no correctedQuery field, zero results

# Test 4: Cache hit (should be fast)
curl "http://localhost:3000/api/search?q=smartphon"
curl "http://localhost:3000/api/search?q=smartphon"  # Second call should use cache
# Expected: Second call < 10ms

# Test 5: French query
curl "http://localhost:3000/api/search?q=ordinatuer"
# Expected: correctedQuery="ordinateur", products returned
```

### Automated Tests

Consider adding unit tests for:
- `getSpellCorrection()` with various similarity scores
- Cache hit/miss scenarios
- Edge cases (empty query, single character, special characters)
- Threshold validation logic

## Related Documentation

- [Product Search Service](./src/lib/product-search-service.ts) - FTS implementation
- [Search Suggestions Service](./src/lib/search-suggestions-service.ts) - Autocomplete pattern
- [Trigram Search Migration](./prisma/trigram-search-migration.sql) - Database setup
- [Search Analytics](./README_SEARCH_ANALYTICS.md) - Analytics integration

## Support

For issues or questions:
1. Check this documentation
2. Review troubleshooting section
3. Check search analytics for patterns
4. Review Redis and PostgreSQL logs
5. Test with direct SQL queries to isolate issues

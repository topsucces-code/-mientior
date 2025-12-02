# PostgreSQL Trigram Fuzzy Search for Mientior

Complete guide for implementing and managing fuzzy search autocomplete using PostgreSQL's `pg_trgm` extension.

---

## 📚 Table of Contents

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Configuration](#configuration)
6. [Performance](#performance)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Query Examples](#query-examples)
10. [References](#references)

---

## 1. Introduction

### What is pg_trgm?

The `pg_trgm` extension provides trigram-based text similarity matching in PostgreSQL. A **trigram** is a group of three consecutive characters from a string. For example, "smartphone" generates trigrams: `{sma, mar, art, rtp, tph, pho, hon, one}`.

### Why Use pg_trgm for Autocomplete?

✅ **Typo Tolerance**: Finds "smartphone" even when user types "smartphon"
✅ **Performance**: Fast lookups with GIN/GIST indexes
✅ **Accent-Insensitive**: Handles "téléphone" vs "telephone"
✅ **Native PostgreSQL**: No external services required
✅ **Scoring**: Returns similarity scores for ranking results

### Use Cases

- **Search Suggestions**: Autocomplete for product search
- **Spell Correction**: Suggest corrections for misspelled queries
- **Fuzzy Matching**: Find similar product names
- **Multi-language Support**: Works with accented characters

---

## 2. Architecture

### System Flow

```
┌─────────────┐
│    User     │
│  Input: q   │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  /api/search/suggestions?q=smartphon                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │  1. Check Redis Cache (search:suggestions:*)       │  │
│  │     └─ Cache Hit? → Return cached results          │  │
│  │                                                      │  │
│  │  2. Cache Miss → Call getSuggestions()             │  │
│  │     ├─ Try: searchWithTrigram() using pg_trgm      │  │
│  │     │   ├─ similarity(name, query) > threshold     │  │
│  │     │   ├─ word_similarity(query, name) > thresh   │  │
│  │     │   └─ Fallback: name ILIKE %query%            │  │
│  │     │                                                │  │
│  │     └─ Catch Error → searchWithContains()          │  │
│  │                                                      │  │
│  │  3. Cache result in Redis (TTL: 1h)                │  │
│  │                                                      │  │
│  │  4. Return JSON + headers                          │  │
│  │     ├─ Cache-Control: 5min (HTTP)                  │  │
│  │     └─ X-Cache-Status: HIT/MISS                    │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  PostgreSQL Database                                     │
│  ┌────────────────────────────────────────────────────┐  │
│  │  pg_trgm Extension                                 │  │
│  │  ├─ idx_product_name_trgm (GIN)                    │  │
│  │  ├─ idx_category_name_trgm (GIN)                   │  │
│  │  ├─ idx_tag_name_trgm (GIN)                        │  │
│  │  ├─ idx_product_name_trgm_gist (GIST)              │  │
│  │  ├─ idx_category_name_trgm_gist (GIST)             │  │
│  │  └─ idx_tag_name_trgm_gist (GIST)                  │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Index Types

| Index Type | Use Case | Operators Supported | Performance |
|------------|----------|---------------------|-------------|
| **GIN** (Generalized Inverted Index) | `similarity()`, `%` operator | `%`, `similarity()` | Fast lookups, larger size |
| **GIST** (Generalized Search Tree) | `word_similarity()`, distance queries | `<%`, `word_similarity()` | Better for range queries |

### Similarity Functions

| Function | Description | Use Case |
|----------|-------------|----------|
| `similarity(text1, text2)` | Global similarity score (0.0-1.0) | "smartphone" ≈ "smartphon" |
| `word_similarity(text1, text2)` | Word-level similarity | "portable gaming" ≈ "gaming laptop portable" |
| `strict_word_similarity()` | Stricter word matching | More precise matching |

---

## 3. Installation

### Prerequisites

- PostgreSQL 9.1+ with `contrib` package installed
- Prisma ORM configured
- Redis for caching

### Step 1: Apply Migration

Run the migration script to enable `pg_trgm` and create indexes:

```bash
bash scripts/apply-trigram-search-migration.sh
```

This script will:
1. ✅ Check prerequisites (database connection, psql)
2. 💾 Optionally create a backup
3. 🚀 Apply the SQL migration
4. ✔️ Validate installation

**What gets created:**
- `pg_trgm` extension
- 3 GIN indexes on `Product.name`, `Category.name`, `Tag.name`
- 3 GIST indexes for word similarity queries

### Step 2: Configure Environment Variables

Add to your `.env` file:

```env
# Similarity threshold for fuzzy search (0.0 to 1.0)
SEARCH_SIMILARITY_THRESHOLD=0.3

# Word similarity threshold for multi-word queries
SEARCH_WORD_SIMILARITY_THRESHOLD=0.3
```

### Step 3: Verify Installation

Check that everything is set up correctly:

```bash
npm run db:trigram-search:status
```

Expected output:
```
✓ pg_trgm extension v1.6 is active
✓ Found 6 trigram indexes
✓ Indexed records: Products: 150, Categories: 12, Tags: 25
```

### Step 4: Test Fuzzy Search

Run test queries to verify functionality:

```bash
npm run db:trigram-search:test
```

This will test various typos and misspellings to ensure fuzzy matching works.

---

## 4. Usage

### API Endpoint

**Endpoint**: `GET /api/search/suggestions`

**Parameters**:
- `q` (required): Search query (minimum 2 characters)

**Response**:
```json
{
  "suggestions": [
    {
      "type": "product",
      "id": "product-123",
      "text": "Samsung Galaxy Smartphone",
      "image": "https://...",
      "score": 0.87
    },
    {
      "type": "category",
      "id": "cat-456",
      "text": "Smartphones",
      "score": 0.92
    },
    {
      "type": "tag",
      "id": "tag-789",
      "text": "Smart Devices",
      "score": 0.75
    }
  ],
  "metadata": {
    "usedFuzzy": true,
    "executionTime": 45,
    "cacheHit": false
  }
}
```

**Headers**:
- `Cache-Control`: HTTP cache (5 minutes)
- `X-Cache-Status`: `HIT` or `MISS` (for debugging)

### TypeScript Usage

Import and use the service directly:

```typescript
import { getSuggestions } from '@/lib/search-suggestions-service';

// Get suggestions with default threshold (0.3)
const result = await getSuggestions({
  query: 'smartphon',
  limit: 10,
});

// Custom threshold for stricter matching
const strictResult = await getSuggestions({
  query: 'laptop',
  limit: 5,
  threshold: 0.5, // Only highly similar results
});

console.log(result.suggestions);
console.log(result.metadata.usedFuzzy); // true if trigram was used
```

### Client-Side Example

```typescript
// React component with autocomplete
const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = async (q: string) => {
    if (q.length < 2) return;

    const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSuggestions(data.suggestions);
  };

  return (
    <input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        fetchSuggestions(e.target.value);
      }}
    />
  );
};
```

---

## 5. Configuration

### Similarity Thresholds

Configure in `.env`:

```env
SEARCH_SIMILARITY_THRESHOLD=0.3
SEARCH_WORD_SIMILARITY_THRESHOLD=0.3
```

**Threshold Recommendations**:

| Threshold | Precision | Recall | Use Case |
|-----------|-----------|--------|----------|
| **0.1** | Low | Very High | Maximum typo tolerance |
| **0.2** | Medium | High | Permissive autocomplete |
| **0.3** | Good | Good | ✅ **Recommended for autocomplete** |
| **0.4** | High | Medium | Spell correction |
| **0.5** | Very High | Low | Strict matching only |

**Precision vs Recall Trade-off**:
- **Lower threshold** → More results (higher recall), more false positives
- **Higher threshold** → Fewer results (higher precision), might miss valid matches

### Cache Configuration

**Redis Cache** (Server-side):
- TTL: 1 hour (`REDIS_CACHE_TTL = 3600`)
- Key prefix: `search:suggestions:`
- Reduces database load for repeated queries

**HTTP Cache** (CDN/Browser):
- TTL: 5 minutes (`CACHE_DURATION = 300`)
- Header: `Cache-Control: public, s-maxage=300, stale-while-revalidate`

### Suggestion Distribution

Configure in `src/lib/search-suggestions-service.ts`:

```typescript
const SUGGESTION_DISTRIBUTION = {
  products: 5,    // Top 5 product matches
  categories: 3,  // Top 3 category matches
  tags: 2,        // Top 2 tag matches
};
```

---

## 6. Performance

### Expected Benchmarks

| Metric | Target | Typical |
|--------|--------|---------|
| **Query Time (with index)** | < 100ms | 30-80ms |
| **Query Time (cache hit)** | < 50ms | 10-30ms |
| **Cache Hit Rate** | > 60% | 70-85% |
| **Index Size** | - | ~5-10% of table size |

### Comparison: Trigram vs Contains

| Metric | `ILIKE %query%` | pg_trgm |
|--------|-----------------|---------|
| **Typo Tolerance** | ❌ None | ✅ Excellent |
| **Speed (indexed)** | 150-300ms | 30-80ms |
| **Speed (no index)** | 500ms+ | N/A (requires index) |
| **Index Size** | BTREE (~2%) | GIN (~8%) |
| **Accent Support** | ❌ Limited | ✅ Good |

### Performance Tips

1. **Indexes are critical**: Always ensure trigram indexes exist
2. **Cache aggressively**: Use Redis for frequently searched terms
3. **Limit results**: Don't fetch more than 10-20 suggestions
4. **Monitor slow queries**: Use `EXPLAIN ANALYZE` (see Maintenance)

### Index Sizes

Check index sizes:

```bash
npm run db:trigram-search:status
```

Example output:
```
📊 Trigram Indexes:
  • idx_product_name_trgm (Product) - 2.1 MB
  • idx_category_name_trgm (Category) - 128 KB
  • idx_tag_name_trgm (Tag) - 256 KB
  • idx_product_name_trgm_gist (Product) - 1.8 MB
  ...
```

---

## 7. Maintenance

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run db:trigram-search:status` | Check extension and index status |
| `npm run db:trigram-search:test` | Test similarity queries with sample data |
| `npm run db:trigram-search:analyze` | Analyze query performance (EXPLAIN) |
| `npm run db:trigram-search:optimize` | Rebuild indexes and update statistics |
| `npm run db:trigram-search:clear-cache` | Clear Redis suggestion cache |
| `npm run db:trigram-search:benchmark` | Test different thresholds |

### Routine Maintenance

**Monthly**:
```bash
# Update statistics and optimize indexes
npm run db:trigram-search:optimize
```

**After Data Import**:
```bash
# Reindex after bulk product updates
npm run db:trigram-search:optimize

# Clear cache to reflect new data
npm run db:trigram-search:clear-cache
```

**Performance Degradation**:
```bash
# Check if indexes are being used
npm run db:trigram-search:analyze

# If not, rebuild indexes manually in psql:
# REINDEX TABLE CONCURRENTLY "Product";
```

### Monitoring

Check performance regularly:

```bash
# Analyze query plans
npm run db:trigram-search:analyze
```

Look for:
- ✅ `Index Scan using idx_product_name_trgm`
- ❌ `Seq Scan on Product` (indicates index not used)

---

## 8. Troubleshooting

### Problem: Extension Not Available

**Symptom**: `ERROR: extension "pg_trgm" is not available`

**Solution**:
1. Check PostgreSQL version: `psql -c "SELECT version()"`
   - Requires PostgreSQL 9.1+
2. Install contrib package:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-contrib

   # macOS
   brew install postgresql@15
   ```
3. Retry migration: `bash scripts/apply-trigram-search-migration.sh`

---

### Problem: No Results with High Threshold

**Symptom**: Query returns 0 results even for obvious matches

**Solution**:
1. Check current threshold:
   ```bash
   npm run db:trigram-search:status
   ```
2. Lower threshold in `.env`:
   ```env
   SEARCH_SIMILARITY_THRESHOLD=0.2  # More permissive
   ```
3. Or use `word_similarity` for multi-word queries

---

### Problem: Slow Performance

**Symptom**: Queries take > 200ms consistently

**Solutions**:

1. **Verify indexes exist**:
   ```bash
   npm run db:trigram-search:status
   ```

2. **Check if indexes are used**:
   ```bash
   npm run db:trigram-search:analyze
   ```

3. **Rebuild indexes**:
   ```sql
   -- In psql
   REINDEX TABLE CONCURRENTLY "Product";
   VACUUM ANALYZE "Product";
   ```

4. **Check Redis cache**:
   ```bash
   # Ensure Redis is running
   redis-cli ping  # Should return PONG
   ```

---

### Problem: Cache Not Working

**Symptom**: `X-Cache-Status: MISS` on every request

**Solutions**:

1. **Check Redis connection**:
   ```bash
   redis-cli ping
   ```

2. **Verify environment variable**:
   ```env
   REDIS_URL=redis://localhost:6379
   ```

3. **Check cache keys**:
   ```bash
   redis-cli KEYS "search:suggestions:*"
   ```

4. **Clear and retry**:
   ```bash
   npm run db:trigram-search:clear-cache
   ```

---

### Problem: Wrong Results for Accents

**Symptom**: "téléphone" doesn't match "telephone"

**Solution**:
pg_trgm handles accents well, but ensure:

1. Database uses UTF-8 encoding:
   ```sql
   SHOW server_encoding;  -- Should be UTF8
   ```

2. Use `unaccent` extension for strict accent removal:
   ```sql
   CREATE EXTENSION unaccent;

   SELECT similarity(
     unaccent('téléphone'),
     unaccent('telephone')
   );  -- Returns 1.0
   ```

---

## 9. Query Examples

### Basic Similarity Search

```sql
-- Find products similar to "smartphon" (typo)
SELECT
  name,
  similarity(name, 'smartphon') as score
FROM "Product"
WHERE similarity(name, 'smartphon') > 0.3
ORDER BY score DESC
LIMIT 10;
```

**Result**:
```
name                          | score
------------------------------|-------
Samsung Galaxy Smartphone     | 0.923
Apple iPhone Smartphone       | 0.857
Google Pixel Smart Phone      | 0.714
```

---

### Word Similarity (Multi-word)

```sql
-- Find products matching "portable gaming"
SELECT
  name,
  word_similarity('portable gaming', name) as score
FROM "Product"
WHERE 'portable gaming' <% name
ORDER BY score DESC
LIMIT 10;
```

**Result**:
```
name                              | score
----------------------------------|-------
ASUS ROG Gaming Laptop Portable   | 0.891
Nintendo Switch Portable Gaming   | 0.876
Steam Deck Portable Console       | 0.623
```

---

### Combined Search (Products, Categories, Tags)

```sql
-- Search across all entities
WITH product_results AS (
  SELECT
    'product' as type,
    id::text,
    name,
    similarity(name, 'laptop') as score
  FROM "Product"
  WHERE similarity(name, 'laptop') > 0.3
  ORDER BY score DESC
  LIMIT 5
),
category_results AS (
  SELECT
    'category' as type,
    id::text,
    name,
    similarity(name, 'laptop') as score
  FROM "Category"
  WHERE similarity(name, 'laptop') > 0.3
  ORDER BY score DESC
  LIMIT 3
),
tag_results AS (
  SELECT
    'tag' as type,
    id::text,
    name,
    similarity(name, 'laptop') as score
  FROM "Tag"
  WHERE similarity(name, 'laptop') > 0.3
  ORDER BY score DESC
  LIMIT 2
)
SELECT * FROM product_results
UNION ALL
SELECT * FROM category_results
UNION ALL
SELECT * FROM tag_results
ORDER BY score DESC;
```

---

### Using Operators

```sql
-- % operator (similarity)
SELECT name
FROM "Product"
WHERE name % 'smartphon'  -- Equivalent to similarity() > threshold
ORDER BY similarity(name, 'smartphon') DESC;

-- <% operator (word similarity)
SELECT name
FROM "Product"
WHERE 'portable gaming' <% name
ORDER BY word_similarity('portable gaming', name) DESC;
```

---

### Debugging: View Trigrams

```sql
-- See trigrams for a word
SELECT show_trgm('smartphone');
```

**Result**:
```
{" s"," sm",art,hon,mar,one,pho,rtp,sma,tph}
```

---

### Performance Testing

```sql
-- EXPLAIN ANALYZE to check index usage
EXPLAIN ANALYZE
SELECT name, similarity(name, 'smartphone') as score
FROM "Product"
WHERE similarity(name, 'smartphone') > 0.3
ORDER BY score DESC
LIMIT 10;
```

**Look for**:
```
Index Scan using idx_product_name_trgm on "Product"
  (cost=0.42..123.45 rows=100 width=64) (actual time=0.123..15.234 rows=10 loops=1)
```

✅ Index is being used
❌ If you see `Seq Scan`, indexes may need rebuilding

---

## 10. References

### Official Documentation

- [PostgreSQL pg_trgm Extension](https://www.postgresql.org/docs/current/pgtrgm.html)
- [Trigram Similarity](https://www.postgresql.org/docs/current/pgtrgm.html#PGTRGM-FUNCS-OPS)
- [GIN vs GIST Indexes](https://www.postgresql.org/docs/current/textsearch-indexes.html)

### Articles

- [Fuzzy Text Search with PostgreSQL](https://www.crunchydata.com/blog/fuzzy-text-search-with-postgresql)
- [Optimizing PostgreSQL Text Search](https://thoughtbot.com/blog/optimizing-full-text-search-with-postgres-tsvector-columns-and-triggers)
- [Trigram Indexes Performance](https://use-the-index-luke.com/sql/where-clause/searching-for-ranges/like-performance-tuning)

### Alternatives

| Solution | Pros | Cons |
|----------|------|------|
| **pg_trgm** | ✅ Native, Fast, Simple | ❌ Limited NLP features |
| **Elasticsearch** | ✅ Advanced features, Scalable | ❌ Complex setup, Extra infrastructure |
| **MeiliSearch** | ✅ Easy setup, Great UX | ❌ Additional service, Memory-hungry |
| **Typesense** | ✅ Fast, Typo-tolerant | ❌ Separate database |

**Recommendation**: Use `pg_trgm` for most e-commerce autocomplete needs. It's fast, reliable, and requires no extra infrastructure.

---

## Summary

✅ **pg_trgm enables typo-tolerant autocomplete** with minimal setup
✅ **GIN/GIST indexes** provide fast fuzzy search
✅ **Configurable thresholds** balance precision and recall
✅ **Redis caching** reduces database load
✅ **Automatic fallback** ensures reliability

**Next Steps**:
1. Apply migration: `bash scripts/apply-trigram-search-migration.sh`
2. Configure thresholds in `.env`
3. Test: `npm run db:trigram-search:test`
4. Monitor performance: `npm run db:trigram-search:analyze`

**Questions?** Check [Troubleshooting](#troubleshooting) or raise an issue on GitHub.

---

**Maintained by**: Mientior Team
**Last Updated**: 2025-11-29
**Version**: 1.0

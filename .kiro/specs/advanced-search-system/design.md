# Advanced Search System Design

## Overview

The Advanced Search System will transform Mientior's product discovery experience by implementing a high-performance search engine with modern features including autocomplete, spell correction, semantic search, and dynamic filtering. The system will be built using Meilisearch, an open-source search engine that provides Elasticsearch/Algolia-like capabilities with simpler deployment and excellent performance characteristics.

### Why Meilisearch?

After evaluating several options (Elasticsearch, Algolia, Typesense, Meilisearch), Meilisearch was selected because:

- **Performance**: Sub-50ms search responses, perfect for our 200ms target
- **Ease of deployment**: Single binary, no complex cluster management
- **Built-in features**: Typo tolerance, synonyms, faceted search, and highlighting out of the box
- **French language support**: Excellent tokenization and stemming for French
- **Cost-effective**: Open-source with optional cloud hosting
- **Developer experience**: Simple REST API and excellent documentation
- **Resource efficient**: Can run on modest hardware (2GB RAM for 100k products)

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   Next.js App   │
│                 │
│  ┌───────────┐  │
│  │  Search   │  │
│  │    UI     │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │  Search   │  │
│  │    API    │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
    ┌────▼────┐
    │ Search  │
    │ Service │◄──────┐
    │ Layer   │       │
    └────┬────┘       │
         │            │
    ┌────▼────────┐   │
    │ Meilisearch │   │
    │   Engine    │   │
    └─────────────┘   │
                      │
    ┌─────────────┐   │
    │  PostgreSQL │   │
    │  (Source of │───┘
    │    Truth)   │
    └─────────────┘
```

### Component Interaction Flow

1. **User Input** → Search UI captures user query
2. **API Request** → Client sends request to `/api/search`
3. **Search Service** → Processes query, applies filters, queries Meilisearch
4. **Meilisearch** → Returns ranked results with facets
5. **Response** → API formats and returns results to client
6. **UI Update** → Search UI displays results and filters

### Data Synchronization

```
Product CRUD Operation
        │
        ▼
   PostgreSQL
        │
        ▼
   Webhook/Event
        │
        ▼
  Search Indexer
        │
        ▼
   Meilisearch
```

## Components and Interfaces

### 1. Meilisearch Client (`src/lib/meilisearch.ts`)

Singleton client for interacting with Meilisearch.

```typescript
interface MeilisearchConfig {
  host: string
  apiKey: string
  indexName: string
}

interface SearchClient {
  // Initialize connection
  connect(): Promise<void>
  
  // Index operations
  indexProduct(product: IndexableProduct): Promise<void>
  indexProducts(products: IndexableProduct[]): Promise<void>
  deleteProduct(productId: string): Promise<void>
  rebuildIndex(): Promise<void>
  
  // Search operations
  search(params: SearchParams): Promise<SearchResults>
  autocomplete(query: string): Promise<AutocompleteResults>
  
  // Health check
  isHealthy(): Promise<boolean>
}
```

### 2. Search Service (`src/lib/search-service.ts`)

Business logic layer for search operations.

```typescript
interface SearchParams {
  query: string
  filters?: SearchFilters
  sort?: SortOption
  page?: number
  limit?: number
  facets?: string[]
}

interface SearchFilters {
  categories?: string[]
  brands?: string[]
  colors?: string[]
  sizes?: string[]
  priceRange?: { min: number; max: number }
  rating?: number
  inStock?: boolean
  onSale?: boolean
}

interface SearchResults {
  hits: SearchHit[]
  facets: FacetDistribution
  totalHits: number
  totalPages: number
  processingTimeMs: number
  query: string
}

interface SearchHit {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number
  image: string
  category: { id: string; name: string; slug: string }
  brand?: string
  colors: string[]
  sizes: string[]
  rating: number
  reviewCount: number
  stock: number
  inStock: boolean
  onSale: boolean
  featured: boolean
  _formatted?: Partial<SearchHit> // Highlighted fields
}
```

### 3. Search Indexer (`src/lib/search-indexer.ts`)

Handles product data transformation and indexing.

```typescript
interface IndexableProduct {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number
  image: string
  categoryId: string
  categoryName: string
  categorySlug: string
  categoryHierarchy: string[] // For hierarchical filtering
  brand?: string
  colors: string[]
  sizes: string[]
  tags: string[]
  rating: number
  reviewCount: number
  stock: number
  inStock: boolean
  onSale: boolean
  featured: boolean
  createdAt: number // Unix timestamp
  updatedAt: number
  popularity: number // Calculated from views/sales
}

interface SearchIndexer {
  transformProduct(product: PrismaProduct): IndexableProduct
  transformProducts(products: PrismaProduct[]): IndexableProduct[]
  syncProduct(productId: string): Promise<void>
  syncAllProducts(): Promise<void>
}
```

### 4. Search API Routes

#### `/api/search/route.ts` - Main search endpoint

```typescript
// GET /api/search?q=laptop&category=electronics&page=1
interface SearchRequest {
  q: string
  categories?: string | string[]
  brands?: string | string[]
  colors?: string | string[]
  sizes?: string | string[]
  minPrice?: number
  maxPrice?: number
  rating?: number
  inStock?: boolean
  onSale?: boolean
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest'
  page?: number
  limit?: number
}
```

#### `/api/search/autocomplete/route.ts` - Autocomplete endpoint

```typescript
// GET /api/search/autocomplete?q=lap
interface AutocompleteRequest {
  q: string
  limit?: number
}

interface AutocompleteResults {
  suggestions: AutocompleteSuggestion[]
  products: SearchHit[]
  categories: { id: string; name: string; slug: string }[]
  brands: { name: string; count: number }[]
}
```

#### `/api/search/sync/route.ts` - Index synchronization endpoint

```typescript
// POST /api/search/sync
interface SyncRequest {
  action: 'sync_product' | 'sync_all' | 'rebuild'
  productId?: string
}
```

### 5. Search UI Components

#### `SearchBar` Component

```typescript
interface SearchBarProps {
  initialQuery?: string
  onSearch?: (query: string) => void
  showAutocomplete?: boolean
  placeholder?: string
}
```

#### `SearchResults` Component

```typescript
interface SearchResultsProps {
  query: string
  results: SearchResults
  onFilterChange: (filters: SearchFilters) => void
  onSortChange: (sort: SortOption) => void
  onPageChange: (page: number) => void
}
```

#### `SearchFilters` Component

```typescript
interface SearchFiltersProps {
  facets: FacetDistribution
  activeFilters: SearchFilters
  onFilterChange: (filters: SearchFilters) => void
  onClearFilters: () => void
}
```

#### `AutocompleteDropdown` Component

```typescript
interface AutocompleteDropdownProps {
  query: string
  results: AutocompleteResults
  onSelect: (item: AutocompleteSuggestion) => void
  isLoading: boolean
}
```

## Data Models

### Meilisearch Index Settings

```json
{
  "searchableAttributes": [
    "name",
    "description",
    "brand",
    "categoryName",
    "tags"
  ],
  "filterableAttributes": [
    "categoryId",
    "categoryHierarchy",
    "brand",
    "colors",
    "sizes",
    "price",
    "rating",
    "inStock",
    "onSale",
    "featured"
  ],
  "sortableAttributes": [
    "price",
    "rating",
    "createdAt",
    "popularity"
  ],
  "rankingRules": [
    "words",
    "typo",
    "proximity",
    "attribute",
    "sort",
    "exactness",
    "popularity:desc",
    "rating:desc"
  ],
  "stopWords": ["le", "la", "les", "un", "une", "des", "de", "du"],
  "synonyms": {
    "téléphone": ["smartphone", "mobile", "cellulaire"],
    "ordinateur": ["pc", "laptop", "portable"],
    "télévision": ["tv", "télé", "écran"]
  },
  "typoTolerance": {
    "enabled": true,
    "minWordSizeForTypos": {
      "oneTypo": 4,
      "twoTypos": 8
    }
  },
  "faceting": {
    "maxValuesPerFacet": 100
  },
  "pagination": {
    "maxTotalHits": 10000
  }
}
```

### Search Analytics Schema

```typescript
interface SearchAnalytics {
  id: string
  query: string
  resultCount: number
  filters: SearchFilters
  userId?: string
  sessionId: string
  timestamp: Date
  processingTimeMs: number
  clickedProducts: string[] // Product IDs clicked
  clickPositions: number[] // Positions of clicked products
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 13.1-13.6 (index structure) can be combined into a single comprehensive property
- Properties 10.1 and 4.5 are duplicates (both test relevance ranking)
- Properties 6.1-6.7 (filter types) can be tested through the general filter property 5.4
- Properties 2.1 and 7.1 both test response time and can share timing validation logic

### Core Properties

**Property 1: Product indexing completeness**
*For any* product indexed in Meilisearch, the indexed document should contain all required fields: name, description, SKU, brand, variant attributes, category hierarchy, tags, pricing, stock status, ratings, review count, and metadata.
**Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6**

**Property 2: Index synchronization timeliness**
*For any* product created, updated, or deleted in the database, the change should be reflected in the search index within 5 seconds.
**Validates: Requirements 1.2, 1.3**

**Property 3: Autocomplete response structure**
*For any* autocomplete query with at least 2 characters, the response should include product names, categories, and brands within the suggestions.
**Validates: Requirements 2.2**

**Property 4: Autocomplete product display**
*For any* product in autocomplete results, the product should include thumbnail, name, and price fields.
**Validates: Requirements 2.5**

**Property 5: Spell correction activation**
*For any* search query with common misspellings, the search engine should automatically correct the spelling and return results for the corrected query.
**Validates: Requirements 3.1, 3.4**

**Property 6: Spell correction feedback**
*For any* search where spell correction is applied, the UI should display a message showing "Showing results for [corrected query]".
**Validates: Requirements 3.2**

**Property 7: Optimal spell correction selection**
*For any* query with multiple possible spelling corrections, the search engine should choose the correction that yields the most results.
**Validates: Requirements 3.5**

**Property 8: Synonym expansion**
*For any* search query using a term with configured synonyms, the results should include products matching both the original term and its synonyms.
**Validates: Requirements 4.1**

**Property 9: French accent insensitivity**
*For any* search query in French, searching with or without accents should return the same results (e.g., "cafe" and "café").
**Validates: Requirements 4.2, 9.1**

**Property 10: French plural handling**
*For any* French search term, searching in singular or plural form should return similar results.
**Validates: Requirements 4.2, 9.2**

**Property 11: Attribute-based matching**
*For any* search query containing product attributes (color, size, material), the results should include products with those attributes even if the attribute is not in the product name.
**Validates: Requirements 4.3**

**Property 12: Relevance-based ranking**
*For any* search results, products should be ordered by descending relevance score.
**Validates: Requirements 4.5, 10.1**

**Property 13: Exact match prioritization**
*For any* search query, products with exact name matches should rank higher than products with partial matches.
**Validates: Requirements 10.2**

**Property 14: Rating boost in ranking**
*For any* two products with similar relevance scores, the product with higher rating and more reviews should rank higher.
**Validates: Requirements 10.3**

**Property 15: Featured product boost**
*For any* two products with similar relevance scores, featured and in-stock products should rank higher than non-featured or out-of-stock products.
**Validates: Requirements 10.5**

**Property 16: Dynamic facet generation**
*For any* search result set, the available filters (facets) should be generated from the attributes present in the current results.
**Validates: Requirements 5.1**

**Property 17: Facet availability**
*For any* filter option with zero matching products in the current result set, that option should be disabled or hidden.
**Validates: Requirements 5.3**

**Property 18: Filter combination logic**
*For any* search with multiple filters applied, filters within the same category should use AND logic, and filters across different categories should use OR logic.
**Validates: Requirements 5.4**

**Property 19: Filter reset restoration**
*For any* search with filters applied, clearing all filters should restore the original unfiltered search results.
**Validates: Requirements 5.5**

**Property 20: Price range filtering**
*For any* price range filter applied, all returned products should have prices within the specified minimum and maximum values.
**Validates: Requirements 6.1**

**Property 21: Search response time**
*For any* search query, the search engine should return results within 200 milliseconds for 95% of queries.
**Validates: Requirements 7.1**

**Property 22: Pagination response time**
*For any* paginated search, loading subsequent pages should complete within 100 milliseconds.
**Validates: Requirements 7.4**

**Property 23: Search analytics logging**
*For any* search performed, the system should log the query, result count, and timestamp.
**Validates: Requirements 8.1**

**Property 24: Click tracking**
*For any* search result clicked by a user, the system should track the clicked product ID and its position in the results.
**Validates: Requirements 8.2**

**Property 25: Zero-result flagging**
*For any* search query that returns zero results, the query should be flagged for review in the analytics system.
**Validates: Requirements 8.3**

**Property 26: Search history storage**
*For any* search performed by a user, the query should be stored in local search history.
**Validates: Requirements 12.1**

**Property 27: Recent search display**
*For any* user focusing the search box with existing search history, up to 5 recent searches should be displayed.
**Validates: Requirements 12.2**

**Property 28: API response structure**
*For any* successful search API call, the response should include products array, facets object, total count, and query metadata.
**Validates: Requirements 14.2**

**Property 29: API error handling**
*For any* search API error, the response should include an appropriate HTTP status code and error message.
**Validates: Requirements 14.3**

**Property 30: API rate limiting**
*For any* client making excessive search API requests, the rate limiter should return 429 status code after exceeding the threshold.
**Validates: Requirements 14.5**

## Error Handling

### Search Service Unavailability

When Meilisearch is unavailable, the system will gracefully degrade:

1. **Health Check**: Periodic health checks (every 30 seconds) to detect Meilisearch availability
2. **Fallback to Database**: If Meilisearch is down, fall back to PostgreSQL full-text search
3. **User Notification**: Display a banner: "Search is running in limited mode. Some features may be unavailable."
4. **Automatic Recovery**: When Meilisearch becomes available, automatically switch back

```typescript
async function search(params: SearchParams): Promise<SearchResults> {
  try {
    if (await meilisearch.isHealthy()) {
      return await meilisearch.search(params)
    }
  } catch (error) {
    logger.error('Meilisearch unavailable, falling back to database', error)
  }
  
  // Fallback to database search
  return await databaseSearch(params)
}
```

### Index Synchronization Failures

When product indexing fails:

1. **Retry Logic**: Exponential backoff retry (3 attempts)
2. **Dead Letter Queue**: Failed indexing jobs go to a queue for manual review
3. **Monitoring**: Alert administrators when indexing failure rate exceeds 5%
4. **Manual Sync**: Admin interface to manually trigger product re-indexing

### Query Errors

Handle malformed or problematic queries:

1. **Input Validation**: Sanitize queries to prevent injection attacks
2. **Query Length Limits**: Maximum 200 characters for search queries
3. **Special Character Handling**: Escape or remove problematic characters
4. **Empty Query Handling**: Return popular/featured products for empty queries

### Performance Degradation

When search performance degrades:

1. **Circuit Breaker**: If response times exceed 1 second, temporarily disable advanced features
2. **Caching**: Cache popular queries for 5 minutes
3. **Query Simplification**: Reduce facet calculations for slow queries
4. **Load Shedding**: Rate limit during high load periods

## Testing Strategy

### Unit Testing

Unit tests will verify individual components and functions:

- **Meilisearch Client**: Connection, indexing, search operations
- **Search Service**: Query transformation, filter application, result formatting
- **Search Indexer**: Product transformation, field mapping
- **API Routes**: Request validation, response formatting, error handling
- **UI Components**: Rendering, user interactions, state management

**Testing Framework**: Vitest with @testing-library/react for component tests

### Property-Based Testing

Property-based tests will verify universal properties across many inputs:

- **Library**: fast-check (already in the project)
- **Configuration**: Minimum 100 iterations per property test
- **Tagging**: Each test tagged with `**Feature: advanced-search-system, Property {number}: {property_text}**`

Property tests will generate:
- Random product data with various attributes
- Random search queries (valid and invalid)
- Random filter combinations
- Random user interactions

### Integration Testing

Integration tests will verify end-to-end workflows:

- Product CRUD → Index synchronization → Search results
- Search query → Meilisearch → API → UI rendering
- Filter application → Facet updates → Result filtering
- Autocomplete typing → Debouncing → Suggestions display

### Performance Testing

Performance tests will verify response time requirements:

- Search query response time (target: <200ms for 95% of queries)
- Autocomplete response time (target: <100ms)
- Pagination response time (target: <100ms)
- Filter application response time (target: <200ms)

**Tools**: Artillery or k6 for load testing

### Manual Testing Scenarios

Manual tests for subjective quality:

- Search relevance quality (do results make sense?)
- Autocomplete suggestion quality
- Spell correction accuracy
- UI/UX flow and responsiveness
- Mobile experience

## Implementation Considerations

### Meilisearch Deployment

**Development**: Run Meilisearch locally via Docker
```bash
docker run -d -p 7700:7700 \
  -v $(pwd)/meili_data:/meili_data \
  getmeili/meilisearch:v1.5 \
  meilisearch --master-key="MASTER_KEY"
```

**Production**: Deploy on dedicated server or use Meilisearch Cloud
- Minimum 2GB RAM for 100k products
- SSD storage for optimal performance
- Regular backups of index data

### Index Management

**Initial Index Build**:
```typescript
// Run once during deployment
await searchIndexer.syncAllProducts()
```

**Incremental Updates**:
- Hook into Prisma middleware to capture product changes
- Queue indexing jobs in Redis for reliability
- Process queue with background worker

**Index Settings**:
- Configure on application startup
- Version control index configuration
- Test index settings in staging before production

### Caching Strategy

**Query Caching**:
- Cache popular queries (>10 requests/hour) for 5 minutes
- Use Redis for distributed caching
- Invalidate cache when products are updated

**Facet Caching**:
- Cache facet distributions for common filter combinations
- Shorter TTL (2 minutes) due to dynamic nature

### Monitoring and Observability

**Metrics to Track**:
- Search query volume and patterns
- Average response times (p50, p95, p99)
- Zero-result query rate
- Click-through rates
- Index synchronization lag
- Meilisearch health and resource usage

**Logging**:
- Log all search queries with metadata
- Log indexing operations and failures
- Log performance anomalies

**Alerting**:
- Alert when Meilisearch is down
- Alert when response times exceed thresholds
- Alert when indexing failure rate is high
- Alert when zero-result rate spikes

### Security Considerations

**API Security**:
- Rate limiting: 100 requests per minute per IP
- Input sanitization to prevent injection
- API key rotation for Meilisearch
- CORS configuration for client-side requests

**Data Privacy**:
- Don't index sensitive user data
- Anonymize search analytics
- Comply with GDPR for search history

### Scalability

**Horizontal Scaling**:
- Meilisearch supports clustering for high availability
- Load balance API requests across multiple instances
- Shard large indexes if needed (>1M products)

**Vertical Scaling**:
- Increase RAM for larger indexes
- Use faster storage (NVMe SSD)
- Optimize index settings for performance

### Migration Strategy

**Phase 1: Parallel Run**
- Deploy Meilisearch alongside existing search
- Index all products
- A/B test with small percentage of users

**Phase 2: Gradual Rollout**
- Increase percentage of users on new search
- Monitor performance and quality
- Collect feedback

**Phase 3: Full Migration**
- Switch all users to new search
- Deprecate old search implementation
- Remove old search code

**Rollback Plan**:
- Keep old search code for 2 weeks
- Feature flag to switch between implementations
- Database search as ultimate fallback


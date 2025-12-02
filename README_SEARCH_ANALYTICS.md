# Search Analytics System

## Overview
Comprehensive search analytics tracking for Mientior e-commerce platform. Tracks search queries, results, user interactions, and provides detailed reports for optimization.

## Features
- ✅ Search query logging with filters and metadata
- ✅ Click-through rate (CTR) tracking
- ✅ Zero-result query identification
- ✅ Top queries analysis
- ✅ Search trends over time
- ✅ Product click statistics
- ✅ Anonymous and authenticated user tracking
- ✅ Admin dashboard API

## Installation

### 1. Run Migration
```bash
# Using the migration script
./scripts/migrate-search-analytics.sh

# Or manually
npx prisma migrate dev --name add_search_log_model
npx prisma generate
```

### 2. Verify Database
```bash
npx prisma studio
# Check that search_logs table exists with all fields and indexes
```

## Usage

### Backend - Logging Searches
```typescript
import { logSearch } from '@/lib/search-analytics'

await logSearch({
  query: 'smartphone',
  resultCount: 42,
  userId: 'user_123', // Optional
  filters: { category: 'electronics' },
  sort: 'relevance',
  executionTime: 45,
})
```

### Backend - Logging Clicks
```typescript
import { logSearchClick } from '@/lib/search-analytics'

await logSearchClick({
  query: 'smartphone',
  productId: 'prod_456',
  position: 3,
  userId: 'user_123',
})
```

### Frontend - Tracking Clicks
```typescript
import { useSearchAnalytics } from '@/hooks/use-search-analytics'

function SearchResults({ query, products }) {
  const { trackSearchClick } = useSearchAnalytics()
  
  const handleProductClick = (product, index) => {
    trackSearchClick({
      query,
      productId: product.id,
      position: index + 1,
    })
    // Navigate to product page
  }
  
  return (
    <div>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          onClick={() => handleProductClick(product, index)}
        />
      ))}
    </div>
  )
}
```

### Admin - Fetching Analytics
```typescript
// GET /api/admin/search/analytics?startDate=2024-01-01&endDate=2024-01-31&limit=20

const response = await fetch('/api/admin/search/analytics?startDate=2024-01-01&limit=20')
const analytics = await response.json()

console.log(analytics.topQueries) // Most popular searches
console.log(analytics.zeroResultQueries) // Queries with no results
console.log(analytics.overallCTR) // Click-through rate
console.log(analytics.trends) // Search volume over time
```

## API Reference

### POST /api/search/analytics/click
Track a search result click.

**Request Body:**
```json
{
  "query": "smartphone",
  "productId": "prod_456",
  "position": 3,
  "searchLogId": "log_789" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "logId": "log_789"
}
```

### GET /api/admin/search/analytics
Get comprehensive search analytics report.

**Query Parameters:**
- `startDate` (ISO string, default: 30 days ago)
- `endDate` (ISO string, default: now)
- `limit` (number, default: 10, max: 100)
- `interval` ('hour' | 'day' | 'week', default: 'day')

**Response:**
```json
{
  "topQueries": [
    {
      "query": "smartphone",
      "count": 1234,
      "avgResultCount": 42,
      "clickThroughRate": 0.68
    }
  ],
  "zeroResultQueries": [
    {
      "query": "xyz product",
      "count": 15,
      "lastSearched": "2024-01-15T10:30:00Z"
    }
  ],
  "overallCTR": 0.45,
  "totalSearches": 5678,
  "uniqueUsers": 1234,
  "avgResultCount": 38.5,
  "trends": [
    {
      "timestamp": "2024-01-01T00:00:00Z",
      "count": 234,
      "uniqueUsers": 89
    }
  ],
  "productStats": [
    {
      "productId": "prod_456",
      "clicks": 156,
      "avgPosition": 2.4,
      "queries": ["smartphone", "phone", "mobile"]
    }
  ],
  "period": {
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-01-31T23:59:59.999Z"
  }
}
```

## Database Schema

### SearchLog Model
```prisma
model SearchLog {
  id               String    @id @default(cuid())
  query            String
  resultCount      Int
  userId           String?
  sessionId        String?
  filters          Json?
  sort             String?
  executionTime    Int?
  clickedProductId String?
  clickPosition    Int?
  clickedAt        DateTime?
  ipAddress        String?
  userAgent        String?
  timestamp        DateTime  @default(now())
  
  @@index([query])
  @@index([userId])
  @@index([timestamp])
  @@index([resultCount])
  @@index([clickedProductId])
  @@map("search_logs")
}
```

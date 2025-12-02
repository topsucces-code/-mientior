# Search Analytics Dashboard

Comprehensive visual analytics dashboard for monitoring search performance, user behavior, and identifying optimization opportunities.

## Overview

The Search Analytics Dashboard provides real-time insights into:
- **Search Volume Trends**: Track search activity over time (hourly/daily/weekly)
- **Top Queries**: Identify most popular search terms and their performance
- **Click-Through Rates**: Measure user engagement with search results
- **Zero-Result Queries**: Discover queries that need content or synonym improvements
- **Locale Distribution**: Understand language preferences of users
- **Product Click Stats**: Analyze which products are most discoverable via search

## Features

### 1. Interactive Visualizations
- **Line Chart**: Search volume trends with unique user overlay
- **Bar Charts**: Top queries and CTR breakdown
- **Doughnut Chart**: Locale distribution (FR/EN)
- **Tables**: Zero-result queries and product click stats with sorting/pagination

### 2. Flexible Date Filtering
- **Quick Filters**: 7 days, 30 days, 90 days
- **Custom Range**: Select any date range with DatePicker
- **Period Comparison**: Compare with previous period or last year

### 3. CSV Export
- Export all analytics data for offline analysis
- **Format**: CSV only (other formats not yet supported)
- Includes metadata, top queries, zero-result queries, trends, and product stats
- Filename format: `search-analytics-{startDate}-{endDate}.csv`
- **Note**: Exports are not currently audited

### 4. Real-Time KPIs
- Total Searches with trend indicator
- Overall CTR with period-over-period change
- Unique Users count (true distinct count over the period)
- Average Results per query

## Access

**URL**: `/admin/search/analytics`

**Permissions**: Requires `DASHBOARD_READ` permission (admin role)

## API Endpoints

### Dashboard Data
```
GET /api/admin/search/analytics/dashboard
```

**Query Parameters**:
- `startDate` (ISO 8601): Start of date range
- `endDate` (ISO 8601): End of date range
- `limit` (number, default 10): Number of top queries/zero-result queries
- `interval` (string, default 'day'): Trend granularity ('hour', 'day', 'week')
- `compareWith` (string, optional): Comparison mode ('previous-period', 'previous-year')

**Response**: `DashboardAnalyticsReport` (see Types section)

**Caching**: 10 minutes (Redis)

### CSV Export
```
GET /api/admin/search/analytics/export
```

**Query Parameters**:
- `startDate` (ISO 8601): Start of date range
- `endDate` (ISO 8601): End of date range

**Response**: CSV file download

## Usage Examples

### Viewing Last 30 Days
1. Navigate to `/admin/search/analytics`
2. Click "30d" quick filter
3. Dashboard loads with last 30 days of data

### Comparing with Previous Period
1. Select date range (e.g., Jan 1-31)
2. Choose "vs Previous period" from Compare dropdown
3. KPI cards show percentage changes (e.g., +12.5% searches)

### Exporting Data
1. Select desired date range
2. Click "Export CSV" button
3. CSV file downloads automatically

### Identifying Optimization Opportunities
- **High Zero-Result Queries**: Add synonyms or create content
- **Low CTR Queries**: Improve result relevance or ranking
- **Popular Queries**: Ensure products are well-stocked and featured

## Types

### DashboardAnalyticsReport
```typescript
interface DashboardAnalyticsReport extends SearchAnalyticsReport {
  ctrByQuery: CTRByQuery[]
  localeDistribution: LocaleDistribution[]
  searchEngineComparison?: SearchEngineComparison // Future: not yet implemented
  periodComparison?: PeriodComparison
}
```

### CTRByQuery
```typescript
interface CTRByQuery {
  query: string
  ctr: number
  searches: number
  clicks: number
}
```

### LocaleDistribution
```typescript
interface LocaleDistribution {
  locale: 'fr' | 'en' | 'other'  // 'other' aggregates unknown locales
  count: number
  percentage: number
}
```

### PeriodComparison
```typescript
interface PeriodComparison {
  current: { totalSearches: number; overallCTR: number; avgResultCount: number }
  previous: { totalSearches: number; overallCTR: number; avgResultCount: number }
  changes: { searchesChange: number; ctrChange: number; resultsChange: number }
}
```

## Performance

- **API Response Time**: < 500ms (cached), < 2s (uncached)
- **Dashboard Load Time**: < 1s (with cached data)
- **CSV Export**: < 5s for 90 days of data
- **Cache Duration**: 10 minutes (Redis)

## Troubleshooting

### Dashboard Not Loading
- **Check Permissions**: Ensure user has `DASHBOARD_READ` permission
- **Check API**: Verify `/api/admin/search/analytics/dashboard` returns 200
- **Check Redis**: Ensure Redis is running (`docker compose ps`)

### No Data Displayed
- **Check Date Range**: Ensure selected period has search activity
- **Check Database**: Verify `SearchLog` table has records (`SELECT COUNT(*) FROM search_logs`)
- **Check Filters**: Reset filters to default (last 30 days)

### CSV Export Fails
- **Check Permissions**: Ensure user has `DASHBOARD_READ` permission
- **Check Date Range**: Ensure valid ISO 8601 dates
- **Check Server Logs**: Look for errors in API route

## Related Documentation

- [Search Analytics Service](./README_SEARCH_ANALYTICS.md)
- [Search Service](./README_SEARCH_SERVICE.md)
- [MeiliSearch Integration](./README_MEILISEARCH.md)
- [Search Cache](./README_SEARCH_CACHE.md)

## Maintenance

### Clearing Cache
```bash
npm run search:clear-cache
```

### Viewing Cache Metrics
```bash
npm run search:cache-metrics
```

### Testing Dashboard API
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/admin/search/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31"
```

## Future Enhancements

- [ ] **Search Engine Comparison**: Compare PostgreSQL vs MeiliSearch performance metrics
- [ ] **Export Formats**: Support JSON and Excel formats in addition to CSV
- [ ] **Audit Logging**: Log export actions for compliance
- [ ] Real-time updates with WebSockets/Pusher
- [ ] Custom dashboard widgets (drag-and-drop)
- [ ] Scheduled email reports
- [ ] Advanced filtering (by category, brand, user segment)
- [ ] Search funnel analysis (query → results → clicks → conversions)
- [ ] A/B test results visualization
- [ ] Heatmaps for search result positions

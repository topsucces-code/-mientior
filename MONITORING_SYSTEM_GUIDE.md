# Customer 360 Dashboard Monitoring System

## Overview

The monitoring system tracks performance metrics and triggers alerts for the Customer 360 Dashboard. It monitors dashboard load times, API response times, real-time update latency, export generation times, and detects performance degradation.

## Features

✅ **Dashboard Load Time Tracking** - Monitors how long it takes to load the Customer 360 dashboard  
✅ **API Response Time Monitoring** - Tracks response times for all Customer 360 API endpoints  
✅ **Real-time Update Latency** - Measures latency of real-time updates via Pusher  
✅ **Export Generation Tracking** - Monitors PDF/CSV export generation times  
✅ **Performance Degradation Detection** - Compares current performance to baseline and alerts on degradation  
✅ **Automatic Alerting** - Triggers alerts when performance thresholds are exceeded  
✅ **Metrics Storage** - In-memory metrics store with percentile calculations (P50, P95, P99)

## Performance Thresholds

The system monitors against these thresholds:

| Metric | Threshold | Alert Trigger |
|--------|-----------|---------------|
| Dashboard Load | 2 seconds | > 2s = Medium, > 4s = High |
| API Response | 500ms | > 500ms = Medium, > 1.5s = High |
| Real-time Update | 5 seconds | > 5s = High, > 10s = Critical |
| Export Generation | 10 seconds | > 10s = Medium, > 20s = High |
| Database Query | 1 second | > 1s = Medium, > 3s = High |

## Usage Examples

### Track Dashboard Load Time

```typescript
import { trackDashboardLoad } from '@/lib/monitoring'

export default async function Customer360Page({ params }: Props) {
  const data = await trackDashboardLoad(
    'customer-360',
    async () => {
      // Load dashboard data
      return await getCustomer360View(params.id)
    },
    { customerId: params.id }
  )
  
  return <Customer360Dashboard data={data} />
}
```

### Track API Response Time

```typescript
import { trackApiResponse } from '@/lib/monitoring'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await trackApiResponse(
    '/api/admin/customers/[id]/360',
    'GET',
    async () => {
      return await getCustomer360View(params.id)
    },
    { customerId: params.id }
  )
  
  return NextResponse.json(data)
}
```

### Track Real-time Update Latency

```typescript
import { trackRealtimeUpdate } from '@/lib/monitoring'

// When receiving a real-time update
pusher.subscribe('customer-updates').bind('order-created', (data) => {
  const latency = Date.now() - data.timestamp
  
  trackRealtimeUpdate('order-created', latency, {
    customerId: data.customerId,
    orderId: data.orderId,
  })
  
  // Update UI
  updateOrderHistory(data)
})
```

### Track Export Generation Time

```typescript
import { trackExportGeneration } from '@/lib/monitoring'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pdf = await trackExportGeneration(
    'pdf',
    async () => {
      return await generateCustomerPDF(params.id)
    },
    { customerId: params.id }
  )
  
  return new Response(pdf, {
    headers: { 'Content-Type': 'application/pdf' },
  })
}
```

### Track Database Query Time

```typescript
import { trackDatabaseQuery } from '@/lib/monitoring'

async function getCustomerOrders(customerId: string) {
  return await trackDatabaseQuery(
    'getCustomerOrders',
    async () => {
      return await prisma.order.findMany({
        where: { customerId },
        include: { items: true },
      })
    },
    { customerId }
  )
}
```

### Track Cache Operations

```typescript
import { trackCacheHit, trackCacheMiss } from '@/lib/monitoring'

async function getCachedCustomer360(customerId: string) {
  const cacheKey = `customer-360:${customerId}`
  const cached = await redis.get(cacheKey)
  
  if (cached) {
    trackCacheHit(cacheKey, { customerId })
    return JSON.parse(cached)
  }
  
  trackCacheMiss(cacheKey, { customerId })
  
  const data = await getCustomer360View(customerId)
  await redis.setex(cacheKey, 30, JSON.stringify(data))
  
  return data
}
```

### Get Performance Statistics

```typescript
import { getPerformanceStats, MetricType } from '@/lib/monitoring'

// Get dashboard load time statistics for the last hour
const stats = getPerformanceStats(MetricType.DASHBOARD_LOAD, 3600000)

console.log({
  average: stats.average,
  p50: stats.p50, // Median
  p95: stats.p95, // 95th percentile
  p99: stats.p99, // 99th percentile
  recent: stats.recent, // Last 10 metrics
})
```

### Check for Performance Degradation

```typescript
import { checkPerformanceDegradation, MetricType } from '@/lib/monitoring'

// Compare last 5 minutes to last hour baseline
const degradation = checkPerformanceDegradation(
  MetricType.API_RESPONSE,
  3600000, // 1 hour baseline
  300000   // 5 minute current window
)

if (degradation.degraded) {
  console.warn('Performance degradation detected!', {
    baselineAvg: degradation.baselineAvg,
    currentAvg: degradation.currentAvg,
    degradationPercent: degradation.degradationPercent,
  })
}
```

## Alert Severity Levels

The system uses four alert severity levels:

- **LOW** - Minor performance issues, logged as warnings
- **MEDIUM** - Performance threshold exceeded, logged as warnings
- **HIGH** - Significant performance degradation, logged as errors
- **CRITICAL** - Critical performance issues (e.g., real-time updates > 10s), logged as errors

## Metric Types

```typescript
enum MetricType {
  DASHBOARD_LOAD = 'dashboard:load',
  API_RESPONSE = 'api:response',
  REALTIME_UPDATE = 'realtime:update',
  EXPORT_GENERATION = 'export:generation',
  DATABASE_QUERY = 'database:query',
  CACHE_HIT = 'cache:hit',
  CACHE_MISS = 'cache:miss',
}
```

## Integration with External Systems

In production, alerts can be sent to:

- **Sentry** - Error tracking and performance monitoring (already integrated via logger)
- **Slack** - Real-time alerts for HIGH and CRITICAL issues
- **PagerDuty** - On-call alerts for CRITICAL issues
- **Email** - Daily/weekly performance reports

To enable external alerting, update the `sendToAlertingSystem` function in `src/lib/monitoring.ts`:

```typescript
function sendToAlertingSystem(alert: Alert): void {
  // Send to Slack
  if (alert.severity === AlertSeverity.HIGH || alert.severity === AlertSeverity.CRITICAL) {
    fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      body: JSON.stringify({
        text: `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`,
        attachments: [{
          fields: [
            { title: 'Metric', value: alert.metric.type, short: true },
            { title: 'Value', value: `${alert.metric.value}ms`, short: true },
            { title: 'Threshold', value: `${alert.threshold}ms`, short: true },
          ]
        }]
      })
    })
  }
  
  // Send to PagerDuty for critical alerts
  if (alert.severity === AlertSeverity.CRITICAL) {
    // PagerDuty integration
  }
}
```

## Metrics Storage

The current implementation uses an in-memory metrics store that keeps the last 1000 metrics. For production use with multiple servers, consider:

1. **Redis** - Store metrics in Redis with TTL
2. **Time-series Database** - Use InfluxDB, TimescaleDB, or Prometheus
3. **Cloud Monitoring** - Use AWS CloudWatch, Google Cloud Monitoring, or Datadog

## Testing

The monitoring system includes comprehensive tests in `src/lib/monitoring.test.ts`:

```bash
npm test src/lib/monitoring.test.ts
```

Tests cover:
- ✅ Metric collection for successful and failed operations
- ✅ Alert triggers for various scenarios
- ✅ Performance threshold detection
- ✅ Dashboard, API, real-time, and export metrics
- ✅ Performance degradation detection
- ✅ Concurrent operation monitoring

## Environment Variables

No additional environment variables are required. The monitoring system uses the existing logger configuration and respects the `NODE_ENV` setting.

## Best Practices

1. **Always wrap critical operations** - Use tracking functions for all dashboard loads, API calls, and exports
2. **Include context** - Add relevant context (customerId, orderId, etc.) to help with debugging
3. **Monitor cache effectiveness** - Track cache hits/misses to optimize caching strategy
4. **Review metrics regularly** - Check performance statistics to identify trends
5. **Set up alerts** - Configure external alerting for production environments
6. **Tune thresholds** - Adjust performance thresholds based on your infrastructure

## Related Files

- `src/lib/monitoring.ts` - Main monitoring implementation
- `src/lib/monitoring.test.ts` - Comprehensive test suite
- `src/lib/logger.ts` - Underlying logging system
- `.kiro/specs/customer-360-dashboard/tasks.md` - Task 21 implementation details

## Requirements Validated

This implementation satisfies:
- ✅ Dashboard load time tracking (< 2s requirement)
- ✅ API response time monitoring (< 500ms requirement)
- ✅ Real-time update latency tracking (< 5s requirement)
- ✅ Export generation time monitoring
- ✅ Performance degradation detection and alerting
- ✅ All monitoring requirements from the Customer 360 Dashboard spec

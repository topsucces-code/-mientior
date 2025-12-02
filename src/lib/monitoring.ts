/**
 * Monitoring and Analytics System for Customer 360 Dashboard
 * 
 * Tracks performance metrics and triggers alerts for:
 * - Dashboard load times
 * - API response times
 * - Real-time update latency
 * - Export generation times
 * - Performance degradation
 * 
 * Requirements: All (monitoring)
 * Task 21: Implement monitoring and analytics
 */

import { logger, measureTime, type LogContext } from './logger'
import { isProduction } from './env'

/**
 * Metric types for monitoring
 */
export enum MetricType {
  DASHBOARD_LOAD = 'dashboard:load',
  API_RESPONSE = 'api:response',
  REALTIME_UPDATE = 'realtime:update',
  EXPORT_GENERATION = 'export:generation',
  DATABASE_QUERY = 'database:query',
  CACHE_HIT = 'cache:hit',
  CACHE_MISS = 'cache:miss',
}

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Performance thresholds for alerts (in milliseconds)
 */
export const PERFORMANCE_THRESHOLDS = {
  DASHBOARD_LOAD: 2000, // 2 seconds
  API_RESPONSE: 500, // 500ms
  REALTIME_UPDATE: 5000, // 5 seconds
  EXPORT_GENERATION: 10000, // 10 seconds
  DATABASE_QUERY: 1000, // 1 second
} as const

/**
 * Metric data structure
 */
export interface Metric {
  type: MetricType
  value: number
  timestamp: Date
  context?: LogContext
}

/**
 * Alert data structure
 */
export interface Alert {
  severity: AlertSeverity
  message: string
  metric: Metric
  threshold: number
  timestamp: Date
}

/**
 * In-memory metrics store (in production, use Redis or a time-series database)
 */
class MetricsStore {
  private metrics: Metric[] = []
  private readonly maxMetrics = 1000 // Keep last 1000 metrics

  add(metric: Metric): void {
    this.metrics.push(metric)
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  getRecent(type?: MetricType, limit = 100): Metric[] {
    let filtered = this.metrics
    
    if (type) {
      filtered = filtered.filter(m => m.type === type)
    }
    
    return filtered.slice(-limit)
  }

  getAverage(type: MetricType, windowMs = 60000): number {
    const now = Date.now()
    const windowStart = now - windowMs
    
    const recentMetrics = this.metrics.filter(
      m => m.type === type && m.timestamp.getTime() >= windowStart
    )
    
    if (recentMetrics.length === 0) return 0
    
    const sum = recentMetrics.reduce((acc, m) => acc + m.value, 0)
    return sum / recentMetrics.length
  }

  getPercentile(type: MetricType, percentile: number, windowMs = 60000): number {
    const now = Date.now()
    const windowStart = now - windowMs
    
    const recentMetrics = this.metrics
      .filter(m => m.type === type && m.timestamp.getTime() >= windowStart)
      .map(m => m.value)
      .sort((a, b) => a - b)
    
    if (recentMetrics.length === 0) return 0
    
    const index = Math.ceil((percentile / 100) * recentMetrics.length) - 1
    return recentMetrics[Math.max(0, index)]
  }

  clear(): void {
    this.metrics = []
  }
}

/**
 * Global metrics store
 */
const metricsStore = new MetricsStore()

/**
 * Record a performance metric
 */
export function recordMetric(
  type: MetricType,
  value: number,
  context?: LogContext
): void {
  const metric: Metric = {
    type,
    value,
    timestamp: new Date(),
    context,
  }
  
  metricsStore.add(metric)
  
  // Check if metric exceeds threshold and trigger alert
  checkThreshold(metric)
  
  // Log metric in development
  if (!isProduction) {
    logger.debug(`Metric recorded: ${type}`, {
      value,
      ...context,
    })
  }
}

/**
 * Check if metric exceeds threshold and trigger alert
 */
function checkThreshold(metric: Metric): void {
  let threshold: number | undefined
  let severity: AlertSeverity = AlertSeverity.LOW
  
  switch (metric.type) {
    case MetricType.DASHBOARD_LOAD:
      threshold = PERFORMANCE_THRESHOLDS.DASHBOARD_LOAD
      severity = metric.value > threshold * 2 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM
      break
    case MetricType.API_RESPONSE:
      threshold = PERFORMANCE_THRESHOLDS.API_RESPONSE
      severity = metric.value > threshold * 3 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM
      break
    case MetricType.REALTIME_UPDATE:
      threshold = PERFORMANCE_THRESHOLDS.REALTIME_UPDATE
      severity = metric.value > threshold * 2 ? AlertSeverity.CRITICAL : AlertSeverity.HIGH
      break
    case MetricType.EXPORT_GENERATION:
      threshold = PERFORMANCE_THRESHOLDS.EXPORT_GENERATION
      severity = metric.value > threshold * 2 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM
      break
    case MetricType.DATABASE_QUERY:
      threshold = PERFORMANCE_THRESHOLDS.DATABASE_QUERY
      severity = metric.value > threshold * 3 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM
      break
  }
  
  if (threshold && metric.value > threshold) {
    triggerAlert({
      severity,
      message: `Performance threshold exceeded for ${metric.type}`,
      metric,
      threshold,
      timestamp: new Date(),
    })
  }
}

/**
 * Trigger an alert
 */
function triggerAlert(alert: Alert): void {
  const logContext: LogContext = {
    alertSeverity: alert.severity,
    metricType: alert.metric.type,
    metricValue: alert.metric.value,
    threshold: alert.threshold,
    exceedance: alert.metric.value - alert.threshold,
    exceedancePercent: ((alert.metric.value / alert.threshold - 1) * 100).toFixed(2),
    ...alert.metric.context,
  }
  
  // Log based on severity
  if (alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.HIGH) {
    logger.error(alert.message, undefined, logContext)
  } else {
    logger.warn(alert.message, logContext)
  }
  
  // In production, send to alerting system (PagerDuty, Slack, etc.)
  if (isProduction) {
    sendToAlertingSystem(alert)
  }
}

/**
 * Send alert to external alerting system
 */
function sendToAlertingSystem(alert: Alert): void {
  // In a real implementation, integrate with:
  // - PagerDuty for critical alerts
  // - Slack for high/medium alerts
  // - Email for low alerts
  
  // Example: Send to Slack webhook
  // fetch(process.env.SLACK_WEBHOOK_URL, {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     text: `🚨 ${alert.severity.toUpperCase()}: ${alert.message}`,
  //     attachments: [{
  //       fields: [
  //         { title: 'Metric', value: alert.metric.type, short: true },
  //         { title: 'Value', value: `${alert.metric.value}ms`, short: true },
  //         { title: 'Threshold', value: `${alert.threshold}ms`, short: true },
  //       ]
  //     }]
  //   })
  // })
}

/**
 * Track dashboard load time
 */
export async function trackDashboardLoad<T>(
  dashboardType: string,
  loadFn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now()
  
  try {
    const result = await loadFn()
    const duration = Date.now() - start
    
    recordMetric(MetricType.DASHBOARD_LOAD, duration, {
      dashboardType,
      ...context,
    })
    
    return result
  } catch (error) {
    const duration = Date.now() - start
    
    recordMetric(MetricType.DASHBOARD_LOAD, duration, {
      dashboardType,
      error: true,
      ...context,
    })
    
    throw error
  }
}

/**
 * Track API response time
 */
export async function trackApiResponse<T>(
  endpoint: string,
  method: string,
  apiFn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now()
  
  try {
    const result = await apiFn()
    const duration = Date.now() - start
    
    recordMetric(MetricType.API_RESPONSE, duration, {
      endpoint,
      method,
      ...context,
    })
    
    return result
  } catch (error) {
    const duration = Date.now() - start
    
    recordMetric(MetricType.API_RESPONSE, duration, {
      endpoint,
      method,
      error: true,
      ...context,
    })
    
    throw error
  }
}

/**
 * Track real-time update latency
 */
export function trackRealtimeUpdate(
  updateType: string,
  latencyMs: number,
  context?: LogContext
): void {
  recordMetric(MetricType.REALTIME_UPDATE, latencyMs, {
    updateType,
    ...context,
  })
}

/**
 * Track export generation time
 */
export async function trackExportGeneration<T>(
  format: string,
  generateFn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now()
  
  try {
    const result = await generateFn()
    const duration = Date.now() - start
    
    recordMetric(MetricType.EXPORT_GENERATION, duration, {
      format,
      ...context,
    })
    
    return result
  } catch (error) {
    const duration = Date.now() - start
    
    recordMetric(MetricType.EXPORT_GENERATION, duration, {
      format,
      error: true,
      ...context,
    })
    
    throw error
  }
}

/**
 * Track database query time
 */
export async function trackDatabaseQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  return measureTime(`db:${queryName}`, queryFn, context)
}

/**
 * Track cache hit
 */
export function trackCacheHit(key: string, context?: LogContext): void {
  recordMetric(MetricType.CACHE_HIT, 1, {
    cacheKey: key,
    ...context,
  })
}

/**
 * Track cache miss
 */
export function trackCacheMiss(key: string, context?: LogContext): void {
  recordMetric(MetricType.CACHE_MISS, 1, {
    cacheKey: key,
    ...context,
  })
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(type: MetricType, windowMs = 60000) {
  return {
    average: metricsStore.getAverage(type, windowMs),
    p50: metricsStore.getPercentile(type, 50, windowMs),
    p95: metricsStore.getPercentile(type, 95, windowMs),
    p99: metricsStore.getPercentile(type, 99, windowMs),
    recent: metricsStore.getRecent(type, 10),
  }
}

/**
 * Get all recent metrics
 */
export function getRecentMetrics(limit = 100): Metric[] {
  return metricsStore.getRecent(undefined, limit)
}

/**
 * Clear all metrics (for testing)
 */
export function clearMetrics(): void {
  metricsStore.clear()
}

/**
 * Check for performance degradation
 * Compares current performance to baseline
 */
export function checkPerformanceDegradation(
  type: MetricType,
  baselineWindowMs = 3600000, // 1 hour
  currentWindowMs = 300000 // 5 minutes
): {
  degraded: boolean
  baselineAvg: number
  currentAvg: number
  degradationPercent: number
} {
  const baselineAvg = metricsStore.getAverage(type, baselineWindowMs)
  const currentAvg = metricsStore.getAverage(type, currentWindowMs)
  
  if (baselineAvg === 0) {
    return {
      degraded: false,
      baselineAvg: 0,
      currentAvg: 0,
      degradationPercent: 0,
    }
  }
  
  const degradationPercent = ((currentAvg / baselineAvg - 1) * 100)
  const degraded = degradationPercent > 50 // Alert if 50% slower
  
  if (degraded) {
    logger.warn(`Performance degradation detected for ${type}`, {
      baselineAvg,
      currentAvg,
      degradationPercent: degradationPercent.toFixed(2),
    })
  }
  
  return {
    degraded,
    baselineAvg,
    currentAvg,
    degradationPercent,
  }
}

/**
 * Export monitoring utilities
 */
export {
  metricsStore,
  measureTime,
}

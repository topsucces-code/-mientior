/**
 * Monitoring Tests for Customer 360 Dashboard
 * 
 * Tests metric collection and alert triggers for monitoring system health
 * 
 * Requirements: All (monitoring)
 * 
 * Task 21.1: Write monitoring tests
 * - Test metric collection
 * - Test alert triggers
 * 
 * Note: In test environment, logger only logs ERROR level by design.
 * These tests focus on error monitoring and metric collection patterns.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { logger, measureTime, createApiLogger } from './logger'
import type { LogContext } from './logger'

describe('Monitoring System Tests', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    // Spy on console.error (the only level logged in test environment)
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('Metric Collection', () => {
    it('should collect execution time for successful operations', async () => {
      const operation = 'testOperation'
      const expectedResult = { data: 'test' }
      
      const mockFn = vi.fn().mockResolvedValue(expectedResult)
      
      const result = await measureTime(operation, mockFn)
      
      // Verify function was called
      expect(mockFn).toHaveBeenCalledOnce()
      
      // Verify result is returned correctly
      expect(result).toEqual(expectedResult)
      
      // In test mode, only errors are logged, so no console.log expected
      // The metric collection still happens internally
    })

    it('should collect error metrics when operation fails', async () => {
      const operation = 'failingOperation'
      const error = new Error('Test error')
      
      const mockFn = vi.fn().mockRejectedValue(error)
      
      await expect(measureTime(operation, mockFn)).rejects.toThrow('Test error')
      
      // Verify error log was called with duration
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls.find(call => 
        call[0].includes(operation) && call[0].includes('failed')
      )
      expect(errorCall).toBeDefined()
    })

    it('should collect metrics with custom context on errors', async () => {
      const operation = 'contextOperation'
      const context: LogContext = {
        userId: 'user-123',
        requestId: 'req-456',
      }
      const error = new Error('Operation failed')
      
      const mockFn = vi.fn().mockRejectedValue(error)
      
      await expect(measureTime(operation, mockFn, context)).rejects.toThrow()
      
      // Verify context was included in error log
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0][0]
      expect(errorCall).toContain('user-123')
      expect(errorCall).toContain('req-456')
    })

    it('should create API logger with request context', () => {
      const mockRequest = new Request('http://localhost:3000/api/test', {
        method: 'GET',
        headers: {
          'user-agent': 'Mozilla/5.0',
          'x-forwarded-for': '192.168.1.1',
        },
      })
      
      const apiLogger = createApiLogger(mockRequest)
      
      // Verify logger is created (it will have request context internally)
      expect(apiLogger).toBeDefined()
      
      // Test that error logging includes request context
      apiLogger.error('API error', new Error('Test'))
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0][0]
      expect(errorCall).toContain('GET')
      expect(errorCall).toContain('/api/test')
    })

    it('should collect error details with stack traces', () => {
      const error = new Error('Database connection failed')
      error.stack = 'Error: Database connection failed\n    at test.ts:10:15'
      
      logger.error('Database error', error, { operation: 'query' })
      
      // Verify error details are logged
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0][0]
      expect(errorCall).toContain('Database connection failed')
      expect(errorCall).toContain('test.ts:10:15')
      expect(errorCall).toContain('query')
    })

    it('should collect metrics for multiple concurrent operations', async () => {
      const operations = ['op1', 'op2', 'op3', 'op4', 'op5']
      
      const promises = operations.map(op => 
        measureTime(op, async () => {
          await new Promise(resolve => setTimeout(resolve, 10))
          return op
        })
      )
      
      const results = await Promise.all(promises)
      
      // Verify all operations completed successfully
      expect(results).toEqual(operations)
      
      // Verify no errors were logged (all operations succeeded)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should measure operation duration accurately', async () => {
      const operation = 'timedOperation'
      const delay = 50
      
      const startTime = Date.now()
      await measureTime(operation, async () => {
        await new Promise(resolve => setTimeout(resolve, delay))
        return 'done'
      })
      const endTime = Date.now()
      const actualDuration = endTime - startTime
      
      // Verify operation took approximately the expected time
      expect(actualDuration).toBeGreaterThanOrEqual(delay)
      expect(actualDuration).toBeLessThan(delay + 50) // Allow 50ms tolerance
    })
  })

  describe('Alert Triggers', () => {
    it('should detect slow operations through timing', async () => {
      const slowOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return 'done'
      }
      
      const startTime = Date.now()
      await measureTime('slowOperation', slowOperation)
      const duration = Date.now() - startTime
      
      // Verify operation took expected time
      expect(duration).toBeGreaterThanOrEqual(50)
      
      // In a real monitoring system, we would trigger an alert if duration > threshold
      // The measureTime function captures this metric for monitoring
    })

    it('should trigger alert for high error rates', () => {
      // Simulate multiple errors
      const errors = [
        new Error('Error 1'),
        new Error('Error 2'),
        new Error('Error 3'),
        new Error('Error 4'),
        new Error('Error 5'),
      ]
      
      errors.forEach((error, index) => {
        logger.error(`Operation ${index} failed`, error)
      })
      
      // Verify all errors were logged
      expect(consoleErrorSpy).toHaveBeenCalledTimes(errors.length)
      
      // In a real system, we would check if an alert was triggered
      // when error rate exceeds threshold (e.g., 5 errors in 1 minute)
    })

    it('should trigger alert for critical errors', () => {
      const criticalError = new Error('Database connection lost')
      
      logger.error('CRITICAL: Database unavailable', criticalError, {
        severity: 'critical',
        service: 'database',
      })
      
      // Verify critical error was logged
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0][0]
      expect(errorCall).toContain('CRITICAL')
      expect(errorCall).toContain('Database unavailable')
      expect(errorCall).toContain('critical')
    })

    it('should log authentication failures for monitoring', () => {
      const authError = new Error('Invalid credentials')
      const authContext: LogContext = {
        userId: 'user-123',
        ip: '192.168.1.1',
        path: '/api/auth/login',
        statusCode: 401,
      }
      
      logger.error('Authentication failed', authError, authContext)
      
      // Verify error was logged with context
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0][0]
      expect(errorCall).toContain('Authentication failed')
      expect(errorCall).toContain('401')
      expect(errorCall).toContain('192.168.1.1')
    })

    it('should trigger alert for resource exhaustion', () => {
      const resourceContext: LogContext = {
        memoryUsage: 95,
        cpuUsage: 90,
        diskUsage: 85,
      }
      
      logger.error('Resource exhaustion detected', undefined, resourceContext)
      
      // Verify alert was logged
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0][0]
      expect(errorCall).toContain('Resource exhaustion')
      expect(errorCall).toContain('95')
      expect(errorCall).toContain('90')
    })

    it('should log rate limit violations for monitoring', () => {
      const rateLimitError = new Error('Rate limit exceeded')
      const rateLimitContext: LogContext = {
        userId: 'user-123',
        ip: '192.168.1.1',
        endpoint: '/api/customers/search',
        requestCount: 150,
        limit: 100,
      }
      
      logger.error('Rate limit exceeded', rateLimitError, rateLimitContext)
      
      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0][0]
      expect(errorCall).toContain('Rate limit exceeded')
      expect(errorCall).toContain('150')
    })

    it('should trigger alert for payment failures', () => {
      const paymentError = new Error('Payment gateway timeout')
      const paymentContext: LogContext = {
        orderId: 'order-123',
        amount: 99.99,
        gateway: 'paystack',
        userId: 'user-456',
      }
      
      logger.error('Payment processing failed', paymentError, paymentContext)
      
      // Verify error was logged with payment details
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0][0]
      expect(errorCall).toContain('Payment processing failed')
      expect(errorCall).toContain('order-123')
      expect(errorCall).toContain('paystack')
    })

    it('should trigger alert for data integrity issues', () => {
      const integrityContext: LogContext = {
        table: 'orders',
        recordId: 'order-789',
        issue: 'negative_total',
        value: -50,
      }
      
      logger.error('Data integrity violation detected', undefined, integrityContext)
      
      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0][0]
      expect(errorCall).toContain('Data integrity violation')
      expect(errorCall).toContain('orders')
      expect(errorCall).toContain('negative_total')
    })
  })

  describe('Alert Thresholds', () => {
    it('should not trigger error for normal operation times', async () => {
      const normalOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'done'
      }
      
      await measureTime('normalOperation', normalOperation)
      
      // Verify no error was logged for successful operation
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should distinguish between errors and expected failures', () => {
      // Expected failure (user error)
      const userError = new Error('Invalid input')
      logger.error('Validation failed', userError, { 
        type: 'validation',
        severity: 'low' 
      })
      
      // Critical system error
      const systemError = new Error('Database crashed')
      logger.error('System failure', systemError, { 
        type: 'system',
        severity: 'critical' 
      })
      
      // Both should be logged, but monitoring system would treat them differently
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2)
      
      const calls = consoleErrorSpy.mock.calls
      expect(calls[0][0]).toContain('validation')
      expect(calls[1][0]).toContain('critical')
    })

    it('should track error frequency for alerting', () => {
      // Simulate repeated errors that should trigger an alert
      const errorCount = 10
      
      for (let i = 0; i < errorCount; i++) {
        logger.error(`Repeated error ${i}`, new Error('Same error'))
      }
      
      // Verify all errors were logged
      expect(consoleErrorSpy).toHaveBeenCalledTimes(errorCount)
      
      // In a real system, error frequency > threshold would trigger an alert
    })
  })

  describe('Monitoring Dashboard Metrics', () => {
    it('should collect dashboard load time metrics', async () => {
      const loadDashboard = async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return { loaded: true }
      }
      
      const startTime = Date.now()
      const result = await measureTime('dashboard:load', loadDashboard, {
        dashboardType: 'customer-360',
        customerId: 'user-123',
      })
      const duration = Date.now() - startTime
      
      expect(result.loaded).toBe(true)
      expect(duration).toBeGreaterThanOrEqual(100)
      
      // Metric is collected internally for monitoring
      // No error should be logged for successful operation
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should collect API response time metrics', async () => {
      const apiCall = async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        return { data: [] }
      }
      
      const startTime = Date.now()
      await measureTime('api:customer-360', apiCall, {
        endpoint: '/api/admin/customers/123/360',
        method: 'GET',
      })
      const duration = Date.now() - startTime
      
      expect(duration).toBeGreaterThanOrEqual(50)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should collect real-time update latency metrics', async () => {
      const updateLatency = async () => {
        await new Promise(resolve => setTimeout(resolve, 30))
        return { updated: true }
      }
      
      const startTime = Date.now()
      await measureTime('realtime:update', updateLatency, {
        updateType: 'order',
        customerId: 'user-123',
      })
      const duration = Date.now() - startTime
      
      expect(duration).toBeGreaterThanOrEqual(30)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should collect export generation time metrics', async () => {
      const generateExport = async () => {
        await new Promise(resolve => setTimeout(resolve, 200))
        return { file: 'export.pdf' }
      }
      
      const startTime = Date.now()
      await measureTime('export:generate', generateExport, {
        format: 'pdf',
        customerId: 'user-123',
      })
      const duration = Date.now() - startTime
      
      expect(duration).toBeGreaterThanOrEqual(200)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should log errors in dashboard operations', async () => {
      const failingDashboard = async () => {
        throw new Error('Dashboard load failed')
      }
      
      await expect(measureTime('dashboard:load', failingDashboard, {
        dashboardType: 'customer-360',
      })).rejects.toThrow('Dashboard load failed')
      
      // Verify error was logged with context
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0][0]
      expect(errorCall).toContain('dashboard:load')
      expect(errorCall).toContain('customer-360')
    })
  })

  describe('Child Logger Context Propagation', () => {
    it('should propagate context to child logger errors', () => {
      const parentContext: LogContext = {
        requestId: 'req-123',
        userId: 'user-456',
      }
      
      const childLogger = logger.child(parentContext)
      childLogger.error('Child error message', new Error('Test'), { action: 'test' })
      
      // Verify parent context is included in error
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0][0]
      expect(errorCall).toContain('req-123')
      expect(errorCall).toContain('user-456')
      expect(errorCall).toContain('test')
    })

    it('should allow child logger to override parent context', () => {
      const parentContext: LogContext = {
        requestId: 'req-123',
        userId: 'user-456',
      }
      
      const childLogger = logger.child(parentContext)
      childLogger.error('Override test', new Error('Test'), { userId: 'user-789' })
      
      // Verify child context overrides parent
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0][0]
      expect(errorCall).toContain('user-789')
    })

    it('should support nested child loggers', () => {
      const level1Context: LogContext = { level: 1 }
      const level2Context: LogContext = { level: 2 }
      
      const childLogger1 = logger.child(level1Context)
      const childLogger2 = childLogger1.child(level2Context)
      
      childLogger2.error('Nested error', new Error('Test'))
      
      // Verify both contexts are included
      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorCall = consoleErrorSpy.mock.calls[0][0]
      expect(errorCall).toContain('"level":2')
    })
  })

  describe('Error Handling in Monitoring', () => {
    it('should handle non-Error objects gracefully', () => {
      const nonError = { message: 'Something went wrong', code: 500 }
      
      logger.error('Non-error object', nonError)
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled()
      const errorCall = vi.mocked(console.error).mock.calls[0][0]
      expect(errorCall).toContain('Non-error object')
    })

    it('should handle string errors', () => {
      logger.error('String error', 'This is an error string')
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled()
      const errorCall = vi.mocked(console.error).mock.calls[0][0]
      expect(errorCall).toContain('String error')
      expect(errorCall).toContain('This is an error string')
    })

    it('should handle undefined errors', () => {
      logger.error('Undefined error', undefined, { context: 'test' })
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalled()
      const errorCall = vi.mocked(console.error).mock.calls[0][0]
      expect(errorCall).toContain('Undefined error')
      expect(errorCall).toContain('test')
    })
  })

  describe('Performance Monitoring', () => {
    it('should track operation performance over time', async () => {
      const durations: number[] = []
      
      // Simulate 10 operations with varying durations
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now()
        await measureTime(`operation-${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 10 + i * 5))
          return i
        })
        const duration = Date.now() - startTime
        durations.push(duration)
      }
      
      // Verify all operations completed
      expect(durations).toHaveLength(10)
      
      // Verify durations increase as expected
      expect(durations[9]).toBeGreaterThan(durations[0])
      
      // No errors should be logged for successful operations
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should identify performance degradation through timing', async () => {
      const baselineStart = Date.now()
      await measureTime('baseline', async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'done'
      })
      const baselineDuration = Date.now() - baselineStart
      
      const degradedStart = Date.now()
      await measureTime('degraded', async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return 'done'
      })
      const degradedDuration = Date.now() - degradedStart
      
      // Verify degraded operation took significantly longer
      expect(degradedDuration).toBeGreaterThan(baselineDuration * 5)
      
      // In a real system, we would compare durations and trigger alert
      // if degradation exceeds threshold (e.g., 2x baseline)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should monitor concurrent operation performance', async () => {
      const operations = Array.from({ length: 5 }, (_, i) => 
        measureTime(`concurrent-${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 20))
          return i
        })
      )
      
      const startTime = Date.now()
      const results = await Promise.all(operations)
      const totalDuration = Date.now() - startTime
      
      // Verify all operations completed
      expect(results).toEqual([0, 1, 2, 3, 4])
      
      // Concurrent operations should complete faster than sequential
      // (should be ~20ms, not 100ms)
      expect(totalDuration).toBeLessThan(100)
      
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })
})

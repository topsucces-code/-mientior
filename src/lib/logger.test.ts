import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger, createApiLogger, measureTime, LogLevel } from './logger'

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  describe('Basic logging', () => {
    it('should log info messages', () => {
      logger.info('Test message')
      expect(consoleLogSpy).toHaveBeenCalled()
      expect(consoleLogSpy.mock.calls[0][0]).toContain('INFO')
      expect(consoleLogSpy.mock.calls[0][0]).toContain('Test message')
    })

    it('should log warning messages', () => {
      logger.warn('Warning message')
      expect(consoleWarnSpy).toHaveBeenCalled()
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('WARN')
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Warning message')
    })

    it('should log error messages', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', error)
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR')
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error occurred')
    })
  })

  describe('Context logging', () => {
    it('should include context in log messages', () => {
      logger.info('User action', { userId: 'user-123', action: 'login' })
      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('userId')
      expect(logOutput).toContain('user-123')
    })

    it('should format error context correctly', () => {
      const error = new Error('Test error')
      logger.error('Operation failed', error, { operation: 'payment' })
      expect(consoleErrorSpy).toHaveBeenCalled()
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('operation')
      expect(logOutput).toContain('payment')
      expect(logOutput).toContain('Test error')
    })
  })

  describe('Child logger', () => {
    it('should create child logger with default context', () => {
      const childLogger = logger.child({ requestId: 'req-123' })
      childLogger.info('Child log')
      
      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('requestId')
      expect(logOutput).toContain('req-123')
    })

    it('should merge child context with additional context', () => {
      const childLogger = logger.child({ requestId: 'req-123' })
      childLogger.info('Child log', { userId: 'user-456' })
      
      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('requestId')
      expect(logOutput).toContain('req-123')
      expect(logOutput).toContain('userId')
      expect(logOutput).toContain('user-456')
    })
  })

  describe('API logger', () => {
    it('should create logger with request context', () => {
      const request = new Request('http://localhost:3000/api/products', {
        method: 'GET',
        headers: {
          'user-agent': 'test-agent',
          'x-forwarded-for': '192.168.1.1',
        },
      })

      const apiLogger = createApiLogger(request)
      apiLogger.info('API request')

      expect(consoleLogSpy).toHaveBeenCalled()
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('GET')
      expect(logOutput).toContain('/api/products')
      expect(logOutput).toContain('192.168.1.1')
    })
  })

  describe('measureTime', () => {
    it('should measure execution time of async function', async () => {
      const mockFn = vi.fn().mockResolvedValue('result')
      
      const result = await measureTime('test-operation', mockFn)
      
      expect(result).toBe('result')
      expect(mockFn).toHaveBeenCalled()
      expect(consoleLogSpy).toHaveBeenCalled()
      
      const logOutput = consoleLogSpy.mock.calls[0][0]
      expect(logOutput).toContain('test-operation completed')
      expect(logOutput).toContain('duration')
    })

    it('should log error and rethrow on failure', async () => {
      const error = new Error('Operation failed')
      const mockFn = vi.fn().mockRejectedValue(error)
      
      await expect(measureTime('test-operation', mockFn)).rejects.toThrow('Operation failed')
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('test-operation failed')
    })
  })
})

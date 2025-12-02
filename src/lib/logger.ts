import { env, isProduction, isDevelopment, isTest } from './env'

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Context object for structured logging
 */
export interface LogContext {
  userId?: string
  requestId?: string
  ip?: string
  userAgent?: string
  path?: string
  method?: string
  statusCode?: number
  duration?: number
  error?: {
    name: string
    message: string
    stack?: string
  }
  [key: string]: unknown
}

/**
 * Structured logger with support for different log levels and contexts
 * Integrates with Sentry in production for error tracking
 */
class Logger {
  private minLevel: LogLevel

  constructor() {
    // Set minimum log level based on environment
    if (isTest) {
      this.minLevel = LogLevel.ERROR // Only errors in tests
    } else if (isProduction) {
      this.minLevel = LogLevel.INFO // Info and above in production
    } else {
      this.minLevel = LogLevel.DEBUG // Everything in development
    }
  }

  /**
   * Check if a log level should be logged based on current environment
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR]
    const currentLevelIndex = levels.indexOf(this.minLevel)
    const requestedLevelIndex = levels.indexOf(level)
    return requestedLevelIndex >= currentLevelIndex
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const levelStr = level.toUpperCase().padEnd(5)
    
    if (!context || Object.keys(context).length === 0) {
      return `[${timestamp}] [${levelStr}] ${message}`
    }

    // Format context for readability
    const contextStr = JSON.stringify(context, null, isDevelopment ? 2 : 0)
    return `[${timestamp}] [${levelStr}] ${message}\n${contextStr}`
  }

  /**
   * Send error to Sentry in production
   */
  private sendToSentry(message: string, error?: Error, context?: LogContext): void {
    if (!isProduction || !env.SENTRY_DSN) {
      return
    }

    try {
      // Dynamically import Sentry to avoid loading it in non-production
      // In a real implementation, you would use @sentry/nextjs
      // Sentry.captureException(error || new Error(message), {
      //   contexts: {
      //     custom: context,
      //   },
      //   level: 'error',
      // })
    } catch (sentryError) {
      // Fail silently if Sentry is not available
      console.error('Failed to send error to Sentry:', sentryError)
    }
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, context))
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message, context))
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context))
    }
  }

  /**
   * Log error message and send to Sentry in production
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) {
      return
    }

    // Normalize error object
    let normalizedError: Error | undefined
    let errorContext = { ...context }

    if (error instanceof Error) {
      normalizedError = error
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    } else if (error) {
      // Handle non-Error objects
      const errorMessage = String(error)
      normalizedError = new Error(errorMessage)
      errorContext.error = {
        name: 'UnknownError',
        message: errorMessage,
        stack: undefined,
      }
    }

    console.error(this.formatMessage(LogLevel.ERROR, message, errorContext))

    // Send to Sentry in production
    if (normalizedError) {
      this.sendToSentry(message, normalizedError, errorContext)
    }
  }

  /**
   * Create a child logger with default context
   * Useful for adding request-specific context to all logs
   */
  child(defaultContext: LogContext): Logger {
    const childLogger = new Logger()
    
    // Override methods to include default context
    const originalDebug = childLogger.debug.bind(childLogger)
    const originalInfo = childLogger.info.bind(childLogger)
    const originalWarn = childLogger.warn.bind(childLogger)
    const originalError = childLogger.error.bind(childLogger)

    childLogger.debug = (message: string, context?: LogContext) => {
      originalDebug(message, { ...defaultContext, ...context })
    }

    childLogger.info = (message: string, context?: LogContext) => {
      originalInfo(message, { ...defaultContext, ...context })
    }

    childLogger.warn = (message: string, context?: LogContext) => {
      originalWarn(message, { ...defaultContext, ...context })
    }

    childLogger.error = (message: string, error?: Error | unknown, context?: LogContext) => {
      originalError(message, error, { ...defaultContext, ...context })
    }

    return childLogger
  }
}

/**
 * Global logger instance
 * 
 * @example
 * import { logger } from '@/lib/logger'
 * 
 * logger.info('User logged in', { userId: 'user-123' })
 * logger.error('Payment failed', error, { orderId: 'order-456' })
 */
export const logger = new Logger()

/**
 * Create a logger for API routes with request context
 * 
 * @example
 * import { createApiLogger } from '@/lib/logger'
 * 
 * export async function GET(request: NextRequest) {
 *   const log = createApiLogger(request)
 *   log.info('Fetching products')
 * }
 */
export function createApiLogger(request: Request): Logger {
  const url = new URL(request.url)
  const context: LogContext = {
    method: request.method,
    path: url.pathname,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 
        request.headers.get('x-real-ip') || 
        undefined,
  }

  return logger.child(context)
}

/**
 * Measure execution time of an async function
 * 
 * @example
 * const result = await measureTime('fetchProducts', async () => {
 *   return await prisma.product.findMany()
 * })
 */
export async function measureTime<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now()
  
  try {
    const result = await fn()
    const duration = Date.now() - start
    
    logger.debug(`${operation} completed`, {
      ...context,
      duration,
      operation,
    })
    
    return result
  } catch (error) {
    const duration = Date.now() - start
    
    logger.error(`${operation} failed`, error, {
      ...context,
      duration,
      operation,
    })
    
    throw error
  }
}

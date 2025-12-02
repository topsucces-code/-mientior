import { NextResponse } from 'next/server'

/**
 * Standard API success response format
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
    hasMore?: boolean
    [key: string]: unknown
  }
}

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Standard error codes for API responses
 */
export const ErrorCodes = {
  // Authentication & Authorization (4xx)
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation (4xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource Errors (4xx)
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate Limiting (4xx)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Payment Errors (4xx)
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  INVALID_PAYMENT_METHOD: 'INVALID_PAYMENT_METHOD',

  // Server Errors (5xx)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

/**
 * Create a standardized success response
 * 
 * @example
 * return apiSuccess({ user: { id: '123', name: 'John' } })
 * return apiSuccess(products, { page: 1, limit: 10, total: 100 })
 */
export function apiSuccess<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta'],
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status }
  )
}

/**
 * Create a standardized error response
 * 
 * @example
 * return apiError('User not found', ErrorCodes.NOT_FOUND, 404)
 * return apiError('Validation failed', ErrorCodes.VALIDATION_ERROR, 400, errors)
 */
export function apiError(
  message: string,
  code: ErrorCode = ErrorCodes.INTERNAL_ERROR,
  status: number = 500,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  )
}

/**
 * Common error responses for reuse
 */
export const CommonErrors = {
  unauthorized: () => apiError(
    'Authentication required',
    ErrorCodes.UNAUTHORIZED,
    401
  ),

  forbidden: (message: string = 'Access denied') => apiError(
    message,
    ErrorCodes.FORBIDDEN,
    403
  ),

  notFound: (resource: string = 'Resource') => apiError(
    `${resource} not found`,
    ErrorCodes.NOT_FOUND,
    404
  ),

  validationError: (details?: unknown) => apiError(
    'Validation failed',
    ErrorCodes.VALIDATION_ERROR,
    400,
    details
  ),

  rateLimitExceeded: (retryAfter?: number) => {
    const response = apiError(
      'Too many requests. Please try again later.',
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      429,
      retryAfter ? { retryAfter } : undefined
    )
    
    if (retryAfter) {
      response.headers.set('Retry-After', retryAfter.toString())
    }
    
    return response
  },

  internalError: (message: string = 'An internal error occurred') => apiError(
    message,
    ErrorCodes.INTERNAL_ERROR,
    500
  ),

  serviceUnavailable: (service?: string) => apiError(
    service ? `${service} is temporarily unavailable` : 'Service temporarily unavailable',
    ErrorCodes.SERVICE_UNAVAILABLE,
    503
  ),
}

/**
 * Type guard to check if a response is an error
 */
export function isApiError(response: ApiResponse): response is ApiErrorResponse {
  return response.success === false
}

/**
 * Type guard to check if a response is successful
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true
}

/**
 * Alias for apiError for backward compatibility
 */
export const createApiError = apiError

import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'
import { apiError, ErrorCodes } from './api-response'
import { logger } from './logger'

/**
 * Result of request validation
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse }

/**
 * Validate request body against a Zod schema
 * Returns parsed data or an error response
 * 
 * @example
 * const validation = await validateRequest(request, createProductSchema)
 * if (!validation.success) return validation.response
 * 
 * const { data } = validation
 * // data is now typed according to the schema
 */
export async function validateRequest<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): Promise<ValidationResult<z.infer<T>>> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Request validation failed', {
        path: new URL(request.url).pathname,
        errors: error.errors,
      })

      return {
        success: false,
        response: apiError(
          'Validation failed',
          ErrorCodes.VALIDATION_ERROR,
          400,
          {
            errors: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message,
              code: err.code,
            })),
          }
        ),
      }
    }

    if (error instanceof SyntaxError) {
      return {
        success: false,
        response: apiError(
          'Invalid JSON in request body',
          ErrorCodes.INVALID_INPUT,
          400
        ),
      }
    }

    logger.error('Unexpected validation error', error)
    return {
      success: false,
      response: apiError(
        'Failed to parse request body',
        ErrorCodes.INVALID_INPUT,
        400
      ),
    }
  }
}

/**
 * Validate query parameters against a Zod schema
 * 
 * @example
 * const validation = validateQueryParams(request, paginationSchema)
 * if (!validation.success) return validation.response
 */
export function validateQueryParams<T extends z.ZodType>(
  request: NextRequest,
  schema: T
): ValidationResult<z.infer<T>> {
  try {
    const { searchParams } = new URL(request.url)
    const params = Object.fromEntries(searchParams.entries())
    const data = schema.parse(params)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Query parameter validation failed', {
        path: new URL(request.url).pathname,
        errors: error.errors,
      })

      return {
        success: false,
        response: apiError(
          'Invalid query parameters',
          ErrorCodes.VALIDATION_ERROR,
          400,
          {
            errors: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message,
              code: err.code,
            })),
          }
        ),
      }
    }

    logger.error('Unexpected query validation error', error)
    return {
      success: false,
      response: apiError(
        'Failed to parse query parameters',
        ErrorCodes.INVALID_INPUT,
        400
      ),
    }
  }
}

/**
 * Common validation schemas for reuse
 */
export const CommonSchemas = {
  /**
   * Pagination parameters
   */
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),

  /**
   * Sorting parameters
   */
  sorting: z.object({
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),

  /**
   * Search parameters
   */
  search: z.object({
    q: z.string().min(1).max(100),
  }),

  /**
   * ID parameter
   */
  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  /**
   * Email parameter
   */
  email: z.object({
    email: z.string().email('Invalid email format'),
  }),
}

/**
 * Combine multiple schemas
 * 
 * @example
 * const schema = combineSchemas(
 *   CommonSchemas.pagination,
 *   CommonSchemas.sorting,
 *   z.object({ category: z.string().optional() })
 * )
 */
export function combineSchemas<T extends z.ZodRawShape[]>(...schemas: T) {
  return z.object(
    schemas.reduce((acc, schema) => ({ ...acc, ...schema.shape }), {} as z.ZodRawShape)
  )
}

import { describe, it, expect } from 'vitest'
import {
  apiSuccess,
  apiError,
  ErrorCodes,
  CommonErrors,
  isApiError,
  isApiSuccess,
} from './api-response'

describe('API Response Utilities', () => {
  describe('apiSuccess', () => {
    it('should create success response with data', async () => {
      const response = apiSuccess({ id: '123', name: 'Test' })
      const json = await response.json()

      expect(response.status).toBe(200)
      expect(json.success).toBe(true)
      expect(json.data).toEqual({ id: '123', name: 'Test' })
    })

    it('should include meta information', async () => {
      const response = apiSuccess(
        [{ id: '1' }, { id: '2' }],
        { page: 1, limit: 10, total: 2 }
      )
      const json = await response.json()

      expect(json.meta).toEqual({ page: 1, limit: 10, total: 2 })
    })

    it('should accept custom status code', async () => {
      const response = apiSuccess({ created: true }, undefined, 201)
      expect(response.status).toBe(201)
    })
  })

  describe('apiError', () => {
    it('should create error response with message and code', async () => {
      const response = apiError('Not found', ErrorCodes.NOT_FOUND, 404)
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.success).toBe(false)
      expect(json.error.code).toBe('NOT_FOUND')
      expect(json.error.message).toBe('Not found')
    })

    it('should include error details', async () => {
      const details = { field: 'email', reason: 'invalid format' }
      const response = apiError(
        'Validation failed',
        ErrorCodes.VALIDATION_ERROR,
        400,
        details
      )
      const json = await response.json()

      expect(json.error.details).toEqual(details)
    })

    it('should use default error code and status', async () => {
      const response = apiError('Something went wrong')
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('CommonErrors', () => {
    it('should create unauthorized error', async () => {
      const response = CommonErrors.unauthorized()
      const json = await response.json()

      expect(response.status).toBe(401)
      expect(json.error.code).toBe('UNAUTHORIZED')
    })

    it('should create forbidden error', async () => {
      const response = CommonErrors.forbidden('Admin access required')
      const json = await response.json()

      expect(response.status).toBe(403)
      expect(json.error.code).toBe('FORBIDDEN')
      expect(json.error.message).toBe('Admin access required')
    })

    it('should create not found error', async () => {
      const response = CommonErrors.notFound('Product')
      const json = await response.json()

      expect(response.status).toBe(404)
      expect(json.error.message).toBe('Product not found')
    })

    it('should create rate limit error with retry-after header', async () => {
      const response = CommonErrors.rateLimitExceeded(60)
      const json = await response.json()

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('60')
      expect(json.error.details).toEqual({ retryAfter: 60 })
    })
  })

  describe('Type guards', () => {
    it('should identify error responses', async () => {
      const errorResponse = apiError('Error', ErrorCodes.NOT_FOUND, 404)
      const json = await errorResponse.json()

      expect(isApiError(json)).toBe(true)
      expect(isApiSuccess(json)).toBe(false)
    })

    it('should identify success responses', async () => {
      const successResponse = apiSuccess({ data: 'test' })
      const json = await successResponse.json()

      expect(isApiSuccess(json)).toBe(true)
      expect(isApiError(json)).toBe(false)
    })
  })
})

import { z } from 'zod'

/**
 * Supported export formats
 */
export const SUPPORTED_FORMATS = ['pdf', 'csv', 'xlsx', 'json'] as const
export type ExportFormat = typeof SUPPORTED_FORMATS[number]

/**
 * Export query parameters validation schema
 */
export const exportQuerySchema = z.object({
  format: z.enum(['pdf', 'csv', 'xlsx', 'json']).default('pdf'),
  includeOrders: z.coerce.boolean().default(true),
  includeAnalytics: z.coerce.boolean().default(false),
  includeNotes: z.coerce.boolean().default(true),
  includeTags: z.coerce.boolean().default(true),
  dateRange: z.enum(['30d', '90d', '1y', 'all']).default('all'),
  orderLimit: z.coerce.number().min(1).max(1000).default(100),
})

export type ExportQueryParams = z.infer<typeof exportQuerySchema>

/**
 * Customer ID parameter validation
 */
export const customerIdSchema = z.object({
  id: z.string().uuid('Invalid customer ID format'),
})

/**
 * Export options for different formats
 */
export const exportOptionsSchema = z.object({
  compression: z.boolean().default(false),
  password: z.string().optional(),
  watermark: z.boolean().default(false),
  template: z.enum(['standard', 'detailed', 'summary']).default('standard'),
})

export type ExportOptions = z.infer<typeof exportOptionsSchema>

/**
 * Validate export request parameters
 */
export function validateExportRequest(
  params: unknown,
  query: unknown
): {
  success: boolean
  data?: { params: { id: string }; query: ExportQueryParams }
  errors?: string[]
} {
  try {
    const validatedParams = customerIdSchema.parse(params)
    const validatedQuery = exportQuerySchema.parse(query)

    return {
      success: true,
      data: {
        params: validatedParams,
        query: validatedQuery,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`),
      }
    }

    return {
      success: false,
      errors: ['Invalid request parameters'],
    }
  }
}

/**
 * Validate export size limits
 */
export const EXPORT_SIZE_LIMITS = {
  PDF: 50 * 1024 * 1024, // 50MB
  CSV: 100 * 1024 * 1024, // 100MB
  XLSX: 25 * 1024 * 1024, // 25MB
  JSON: 10 * 1024 * 1024, // 10MB
} as const

export function validateExportSize(
  format: ExportFormat,
  size: number
): { valid: boolean; maxSize: number } {
  const maxSize = EXPORT_SIZE_LIMITS[format.toUpperCase() as keyof typeof EXPORT_SIZE_LIMITS]
  return {
    valid: size <= maxSize,
    maxSize,
  }
}
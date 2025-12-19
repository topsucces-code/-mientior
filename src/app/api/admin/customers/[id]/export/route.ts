/**
 * Customer Export API Endpoint
 * 
 * GET /api/admin/customers/[id]/export
 * 
 * Exports customer data in multiple formats (PDF, CSV, XLSX, JSON) with:
 * - Rate limiting protection
 * - Export caching
 * - Size validation
 * - Streaming for large datasets
 * - Comprehensive error handling
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { 
  generatePDFReport, 
  generateCSVReport,
  generateXLSXReport,
  generateJSONReport,
  createStreamingCSVExport,
  type ExportMetadata 
} from '@/lib/customer-export'
import { createApiResponse, createApiError } from '@/lib/api-response'
import { rateLimitExport } from '@/lib/export-rate-limit'
import { cacheExport, getCachedExport } from '@/lib/export-cache'
import { validateExportRequest, validateExportSize, type ExportFormat } from '@/lib/export-validation'
import { 
  CustomerNotFoundError, 
  ExportSizeExceededError, 
  ExportGenerationError,
  UnsupportedExportFormatError,
  ExportRateLimitError
} from '@/lib/export-errors'

interface Props {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    // Require admin authentication
    const adminSession = await requireAdminAuth()
    
    // Extract IP address for rate limiting
    const ipAddress = 
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.ip ||
      'unknown'

    // Rate limiting check
    const rateLimitResult = await rateLimitExport(ipAddress, 'customer')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many export requests',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          },
        }
      )
    }
    
    // Get and validate parameters
    const resolvedParams = await params
    const { searchParams } = new URL(request.url)
    
    const validation = validateExportRequest(
      resolvedParams,
      Object.fromEntries(searchParams.entries())
    )
    
    if (!validation.success) {
      return createApiError(
        `Invalid request parameters: ${validation.errors?.join(', ')}`,
        400,
        'VALIDATION_ERROR'
      )
    }
    
    const { params: validatedParams, query: validatedQuery } = validation.data!
    const { id: customerId } = validatedParams
    const { format, ...exportOptions } = validatedQuery
    
    // Check if customer exists
    const customer = await prisma.users.findUnique({
      where: { id: customerId },
      select: { id: true, email: true, firstName: true, lastName: true }
    })
    
    if (!customer) {
      throw new CustomerNotFoundError(customerId)
    }
    
    // Check cache first
    const cachedExport = await getCachedExport(customerId, format, validatedQuery)
    if (cachedExport) {
      const filename = `customer-${customerId}-cached.${format}`
      const mimeType = getMimeType(format)
      
      const headers = new Headers({
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Cache': 'HIT',
      })

      if (cachedExport instanceof Buffer) {
        headers.set('Content-Length', cachedExport.length.toString())
      }

      return new NextResponse(cachedExport, { headers })
    }
    
    // Prepare export metadata
    const metadata: ExportMetadata = {
      exportedBy: {
        id: adminSession.user.id,
        name: adminSession.user.name || 'Admin User'
      },
      exportedAt: new Date(),
      customerId,
      format,
      options: validatedQuery,
    }

    let exportData: Buffer | string
    let filename: string
    let mimeType: string

    // Generate export based on format
    try {
      switch (format) {
        case 'pdf':
          exportData = await generatePDFReport(customerId, metadata)
          filename = `customer-${customerId}-${Date.now()}.pdf`
          mimeType = 'application/pdf'
          break
          
        case 'csv':
          // Use streaming for large datasets
          if (exportOptions.orderLimit > 500) {
            const stream = createStreamingCSVExport(customerId, metadata)
            filename = `customer-${customerId}-${Date.now()}.csv`
            
            return new NextResponse(stream as any, {
              headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Transfer-Encoding': 'chunked',
                'X-Export-Type': 'streaming',
              }
            })
          }
          
          exportData = await generateCSVReport(customerId, metadata)
          filename = `customer-${customerId}-${Date.now()}.csv`
          mimeType = 'text/csv'
          break
          
        case 'xlsx':
          exportData = await generateXLSXReport(customerId, metadata)
          filename = `customer-${customerId}-${Date.now()}.xlsx`
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          break
          
        case 'json':
          exportData = await generateJSONReport(customerId, metadata)
          filename = `customer-${customerId}-${Date.now()}.json`
          mimeType = 'application/json'
          break
          
        default:
          throw new UnsupportedExportFormatError(format, ['pdf', 'csv', 'xlsx', 'json'])
      }
    } catch (error) {
      if (error instanceof ExportGenerationError) {
        throw error
      }
      throw new ExportGenerationError(format, error as Error)
    }

    // Validate export size
    const dataSize = Buffer.isBuffer(exportData) ? exportData.length : Buffer.byteLength(exportData, 'utf8')
    const sizeValidation = validateExportSize(format, dataSize)
    
    if (!sizeValidation.valid) {
      throw new ExportSizeExceededError(dataSize, sizeValidation.maxSize)
    }

    // Cache the export for future requests
    await cacheExport(customerId, format, validatedQuery, exportData)

    // Set response headers
    const headers = new Headers({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Cache': 'MISS',
      'X-Export-Size': dataSize.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    })

    if (exportData instanceof Buffer) {
      headers.set('Content-Length', exportData.length.toString())
    }

    return new NextResponse(exportData, { headers })
    
  } catch (error) {
    console.error('Customer export error:', error)
    
    // Handle specific error types
    if (error instanceof CustomerNotFoundError) {
      return createApiError('Customer not found', 404, 'CUSTOMER_NOT_FOUND')
    }
    
    if (error instanceof ExportSizeExceededError) {
      return createApiError(
        `Export data too large. Please reduce the data scope.`,
        413,
        'EXPORT_SIZE_EXCEEDED'
      )
    }
    
    if (error instanceof ExportGenerationError) {
      return createApiError(
        'Export generation failed. Please try again or contact support.',
        500,
        'EXPORT_GENERATION_FAILED'
      )
    }
    
    if (error instanceof UnsupportedExportFormatError) {
      return createApiError(error.message, 400, 'UNSUPPORTED_FORMAT')
    }
    
    if (error instanceof ExportRateLimitError) {
      return createApiError(error.message, 429, 'RATE_LIMIT_EXCEEDED')
    }
    
    // Generic error fallback
    return createApiError('Export generation failed', 500, 'EXPORT_FAILED')
  }
}

/**
 * Get MIME type for export format
 */
function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    json: 'application/json',
  }
  
  return mimeTypes[format] || 'application/octet-stream'
}
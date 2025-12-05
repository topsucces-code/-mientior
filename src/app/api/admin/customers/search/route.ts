import { NextRequest } from 'next/server'
import { requirePermission } from '@/lib/auth-admin'
import { Permission } from '@/lib/permissions'
import { apiSuccess, apiError } from '@/lib/api-response'
import { customerSearchSchema } from '@/lib/customer-search-validation'
import { rateLimitSearch } from '@/lib/search-rate-limit'
import { CustomerSearchService } from '@/lib/customer-search-service'

/**
 * GET /api/admin/customers/search
 * 
 * Search and filter customers with pagination - OPTIMIZED VERSION
 * 
 * Query Parameters:
 * - q: Search query (name, email, phone, order number)
 * - segment: Filter by segment ID
 * - tier: Filter by loyalty tier (BRONZE, SILVER, GOLD, PLATINUM)
 * - tag: Filter by tag ID
 * - registrationFrom: Filter by registration date from (ISO string)
 * - registrationTo: Filter by registration date to (ISO string)
 * - lastPurchaseFrom: Filter by last purchase date from (ISO string)
 * - lastPurchaseTo: Filter by last purchase date to (ISO string)
 * - clvMin: Filter by minimum customer lifetime value
 * - clvMax: Filter by maximum customer lifetime value
 * - orderCountMin: Filter by minimum order count
 * - orderCountMax: Filter by maximum order count
 * - page: Page number (default: 1)
 * - limit: Results per page (default: 20, max: 100)
 * - sortBy: Sort field (default: createdAt)
 * - sortOrder: Sort direction (default: desc)
 * 
 * Requirements:
 * - 15.1: Support search by name, email, phone, and order number
 * - 15.2: Support filtering by segment, loyalty tier, and tag
 * - 15.3: Support filtering by registration date range and last purchase date
 * - 15.4: Support filtering by CLV range and order count
 * - 15.5: Display matching customers with result count
 * - 19.1: Verify admin has customer view permissions
 * 
 * Performance Optimizations:
 * - Database-level filtering (no post-query filtering)
 * - Redis caching for expensive queries
 * - Rate limiting to prevent abuse
 * - Proper TypeScript typing
 * - Selective includes to prevent N+1 queries
 * - Input sanitization for security
 */
export async function GET(request: NextRequest) {
  try {
    // Require USERS_READ permission and get admin session
    const adminSession = await requirePermission(Permission.USERS_READ)
    
    // Apply rate limiting
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 'unknown'
    
    const rateLimitResult = await rateLimitSearch(adminSession.adminUser.id, ipAddress)
    if (!rateLimitResult.allowed) {
      return apiError(
        'Too many search requests',
        'RATE_LIMIT_EXCEEDED',
        429,
        { retryAfter: rateLimitResult.retryAfter }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Validate and sanitize input parameters
    const validationResult = customerSearchSchema.safeParse({
      q: searchParams.get('q')?.trim(),
      segment: searchParams.get('segment'),
      tier: searchParams.get('tier'),
      tag: searchParams.get('tag'),
      registrationFrom: searchParams.get('registrationFrom'),
      registrationTo: searchParams.get('registrationTo'),
      lastPurchaseFrom: searchParams.get('lastPurchaseFrom'),
      lastPurchaseTo: searchParams.get('lastPurchaseTo'),
      clvMin: searchParams.get('clvMin'),
      clvMax: searchParams.get('clvMax'),
      orderCountMin: searchParams.get('orderCountMin'),
      orderCountMax: searchParams.get('orderCountMax'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    })

    if (!validationResult.success) {
      return apiError(
        'Invalid search parameters',
        'VALIDATION_ERROR',
        400,
        validationResult.error.errors
      )
    }

    const params = validationResult.data

    // Use the optimized search service
    const searchResult = await CustomerSearchService.search(params)

    const responseData = {
      customers: searchResult.customers,
      pagination: searchResult.pagination,
      meta: {
        searchQuery: params.q,
        filtersApplied: {
          segment: !!params.segment,
          tier: !!params.tier,
          tag: !!params.tag,
          dateRange: !!(params.registrationFrom || params.registrationTo),
          clvRange: !!(params.clvMin !== undefined || params.clvMax !== undefined),
          orderCountRange: !!(params.orderCountMin !== undefined || params.orderCountMax !== undefined),
          lastPurchaseRange: !!(params.lastPurchaseFrom || params.lastPurchaseTo)
        },
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        performance: {
          executionTime: searchResult.metrics.executionTime,
          cacheHit: searchResult.metrics.cacheHit,
          queryComplexity: searchResult.metrics.queryComplexity,
          indexesUsed: searchResult.metrics.indexesUsed
        }
      }
    }

    return apiSuccess(responseData)

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return apiError('Authentication required', 'UNAUTHORIZED', 401)
      }
      if (error.message.includes('Forbidden')) {
        return apiError('Insufficient permissions', 'FORBIDDEN', 403)
      }
    }

    console.error('Error searching customers:', error)
    return apiError(
      'Failed to search customers',
      'INTERNAL_ERROR',
      500
    )
  }
}
import { Prisma } from '@prisma/client'
import { prisma } from './prisma'
import { redis } from './redis'
import type { CustomerSearchParams } from './customer-search-validation'

export interface CustomerSearchResult {
  id: string
  name: string
  firstName: string | null
  lastName: string | null
  email: string
  loyaltyLevel: string
  loyaltyPoints: number
  totalOrders: number
  totalSpent: number
  createdAt: Date
  lastPurchaseDate: Date | null
  segments: Array<{ id: string; name: string }>
  tags: Array<{ id: string; name: string; color: string }>
}

export interface SearchMetrics {
  totalCount: number
  executionTime: number
  cacheHit: boolean
  queryComplexity: 'simple' | 'moderate' | 'complex'
  indexesUsed: string[]
}

/**
 * Optimized customer search service using materialized views and advanced caching
 */
export class CustomerSearchService {
  private static readonly CACHE_TTL = 120 // 2 minutes
  private static readonly COMPLEX_QUERY_THRESHOLD = 3 // Number of filters that make a query "complex"

  /**
   * Perform optimized customer search with automatic fallback strategies
   */
  static async search(params: CustomerSearchParams): Promise<{
    customers: CustomerSearchResult[]
    pagination: {
      page: number
      limit: number
      totalCount: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
    metrics: SearchMetrics
  }> {
    const startTime = Date.now()
    const skip = (params.page - 1) * params.limit
    
    // Determine query complexity
    const complexity = this.getQueryComplexity(params)
    
    // Try cache first for complex queries
    if (complexity === 'complex') {
      const cached = await this.getCachedResult(params)
      if (cached) {
        return {
          ...cached,
          metrics: {
            ...cached.metrics,
            executionTime: Date.now() - startTime,
            cacheHit: true
          }
        }
      }
    }

    // Choose search strategy based on complexity and available features
    let result
    try {
      if (await this.isMaterializedViewAvailable()) {
        result = await this.searchWithMaterializedView(params, skip)
      } else {
        result = await this.searchWithOptimizedQuery(params, skip)
      }
    } catch (error) {
      console.warn('Primary search method failed, falling back:', error)
      result = await this.searchWithFallbackQuery(params, skip)
    }

    const executionTime = Date.now() - startTime
    const metrics: SearchMetrics = {
      totalCount: result.totalCount,
      executionTime,
      cacheHit: false,
      queryComplexity: complexity,
      indexesUsed: result.indexesUsed || []
    }

    const response = {
      customers: result.customers,
      pagination: {
        page: params.page,
        limit: params.limit,
        totalCount: result.totalCount,
        totalPages: Math.ceil(result.totalCount / params.limit),
        hasNextPage: params.page < Math.ceil(result.totalCount / params.limit),
        hasPreviousPage: params.page > 1
      },
      metrics
    }

    // Cache complex queries
    if (complexity === 'complex') {
      await this.cacheResult(params, response)
    }

    return response
  }

  /**
   * Search using materialized view for optimal performance
   */
  private static async searchWithMaterializedView(
    params: CustomerSearchParams, 
    skip: number
  ): Promise<{ customers: CustomerSearchResult[]; totalCount: number; indexesUsed: string[] }> {
    const conditions: string[] = []
    const values: any[] = []
    let paramIndex = 1

    // Build WHERE conditions for raw SQL
    if (params.q) {
      conditions.push(`search_vector @@ plainto_tsquery('english', $${paramIndex})`)
      values.push(params.q)
      paramIndex++
    }

    if (params.tier) {
      conditions.push(`"loyaltyLevel" = $${paramIndex}`)
      values.push(params.tier)
      paramIndex++
    }

    if (params.clvMin !== undefined) {
      conditions.push(`"totalSpent" >= $${paramIndex}`)
      values.push(params.clvMin)
      paramIndex++
    }

    if (params.clvMax !== undefined) {
      conditions.push(`"totalSpent" <= $${paramIndex}`)
      values.push(params.clvMax)
      paramIndex++
    }

    if (params.orderCountMin !== undefined) {
      conditions.push(`"totalOrders" >= $${paramIndex}`)
      values.push(params.orderCountMin)
      paramIndex++
    }

    if (params.orderCountMax !== undefined) {
      conditions.push(`"totalOrders" <= $${paramIndex}`)
      values.push(params.orderCountMax)
      paramIndex++
    }

    if (params.registrationFrom) {
      conditions.push(`"createdAt" >= $${paramIndex}`)
      values.push(new Date(params.registrationFrom))
      paramIndex++
    }

    if (params.registrationTo) {
      conditions.push(`"createdAt" <= $${paramIndex}`)
      values.push(new Date(params.registrationTo))
      paramIndex++
    }

    if (params.lastPurchaseFrom) {
      conditions.push(`last_purchase_date >= $${paramIndex}`)
      values.push(new Date(params.lastPurchaseFrom))
      paramIndex++
    }

    if (params.lastPurchaseTo) {
      conditions.push(`last_purchase_date <= $${paramIndex}`)
      values.push(new Date(params.lastPurchaseTo))
      paramIndex++
    }

    // Handle segment and tag filtering with JSON operations
    if (params.segment) {
      conditions.push(`segments @> $${paramIndex}::jsonb`)
      values.push(JSON.stringify([{ id: params.segment }]))
      paramIndex++
    }

    if (params.tag) {
      conditions.push(`tags @> $${paramIndex}::jsonb`)
      values.push(JSON.stringify([{ id: params.tag }]))
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = `ORDER BY "${params.sortBy}" ${params.sortOrder.toUpperCase()}`
    const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    values.push(params.limit, skip)

    // Execute the optimized query
    const query = `
      SELECT 
        id, name, "firstName", "lastName", email, "loyaltyLevel", 
        "loyaltyPoints", "totalOrders", "totalSpent", "createdAt",
        last_purchase_date, segments, tags
      FROM customer_search_view 
      ${whereClause} 
      ${orderClause} 
      ${limitClause}
    `

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM customer_search_view 
      ${whereClause}
    `

    const [customers, countResult] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(query, ...values.slice(0, -2), values[values.length - 2], values[values.length - 1]),
      prisma.$queryRawUnsafe<[{ total: bigint }]>(countQuery, ...values.slice(0, -2))
    ])

    return {
      customers: customers.map(this.transformMaterializedViewResult),
      totalCount: Number(countResult[0].total),
      indexesUsed: ['customer_search_view_search_vector', 'customer_search_view_loyalty_level']
    }
  }

  /**
   * Search using optimized Prisma queries with proper includes
   */
  private static async searchWithOptimizedQuery(
    params: CustomerSearchParams,
    skip: number
  ): Promise<{ customers: CustomerSearchResult[]; totalCount: number; indexesUsed: string[] }> {
    const where: Prisma.UserWhereInput = {}
    const orderConditions: Prisma.OrderWhereInput[] = []

    // Build search conditions
    if (params.q) {
      const sanitizedQuery = params.q.replace(/[<>]/g, '').replace(/[;'"`\\]/g, '').trim()
      where.OR = [
        { name: { contains: sanitizedQuery, mode: 'insensitive' } },
        { email: { contains: sanitizedQuery, mode: 'insensitive' } },
        { firstName: { contains: sanitizedQuery, mode: 'insensitive' } },
        { lastName: { contains: sanitizedQuery, mode: 'insensitive' } }
      ]
    }

    if (params.tier) {
      where.loyaltyLevel = params.tier
    }

    if (params.segment) {
      where.segmentAssignments = { some: { segmentId: params.segment } }
    }

    if (params.tag) {
      where.tagAssignments = { some: { tagId: params.tag } }
    }

    if (params.registrationFrom || params.registrationTo) {
      where.createdAt = {}
      if (params.registrationFrom) where.createdAt.gte = new Date(params.registrationFrom)
      if (params.registrationTo) where.createdAt.lte = new Date(params.registrationTo)
    }

    if (params.clvMin !== undefined || params.clvMax !== undefined) {
      where.totalSpent = {}
      if (params.clvMin !== undefined) where.totalSpent.gte = params.clvMin
      if (params.clvMax !== undefined) where.totalSpent.lte = params.clvMax
    }

    if (params.orderCountMin !== undefined || params.orderCountMax !== undefined) {
      where.totalOrders = {}
      if (params.orderCountMin !== undefined) where.totalOrders.gte = params.orderCountMin
      if (params.orderCountMax !== undefined) where.totalOrders.lte = params.orderCountMax
    }

    // Handle last purchase date filtering
    if (params.lastPurchaseFrom || params.lastPurchaseTo) {
      const lastPurchaseCondition: Prisma.OrderWhereInput = {}
      if (params.lastPurchaseFrom) {
        lastPurchaseCondition.createdAt = { gte: new Date(params.lastPurchaseFrom) }
      }
      if (params.lastPurchaseTo) {
        lastPurchaseCondition.createdAt = {
          ...lastPurchaseCondition.createdAt,
          lte: new Date(params.lastPurchaseTo)
        }
      }
      orderConditions.push(lastPurchaseCondition)
    }

    if (orderConditions.length > 0) {
      where.orders = {
        some: orderConditions.length === 1 ? orderConditions[0] : { AND: orderConditions }
      }
    }

    const include: Prisma.UserInclude = {
      segmentAssignments: {
        select: { segment: { select: { id: true, name: true } } },
        take: 10
      },
      tagAssignments: {
        select: { tag: { select: { id: true, name: true, color: true } } },
        take: 20
      },
      orders: {
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }

    const [customers, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        include,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip,
        take: params.limit
      }),
      prisma.user.count({ where })
    ])

    return {
      customers: customers.map(this.transformPrismaResult),
      totalCount,
      indexesUsed: ['idx_user_search_text', 'idx_user_loyalty_level']
    }
  }

  /**
   * Fallback search method for when other methods fail
   */
  private static async searchWithFallbackQuery(
    params: CustomerSearchParams,
    skip: number
  ): Promise<{ customers: CustomerSearchResult[]; totalCount: number; indexesUsed: string[] }> {
    // Simple query without complex joins
    const where: Prisma.UserWhereInput = {}

    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { email: { contains: params.q, mode: 'insensitive' } }
      ]
    }

    if (params.tier) where.loyaltyLevel = params.tier
    if (params.clvMin !== undefined) where.totalSpent = { gte: params.clvMin }
    if (params.clvMax !== undefined) where.totalSpent = { ...where.totalSpent, lte: params.clvMax }

    const [customers, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip,
        take: params.limit
      }),
      prisma.user.count({ where })
    ])

    return {
      customers: customers.map(customer => ({
        ...customer,
        lastPurchaseDate: null,
        segments: [],
        tags: []
      })),
      totalCount,
      indexesUsed: ['basic_user_indexes']
    }
  }

  /**
   * Transform materialized view result to standard format
   */
  private static transformMaterializedViewResult(row: any): CustomerSearchResult {
    return {
      id: row.id,
      name: row.name,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      loyaltyLevel: row.loyaltyLevel,
      loyaltyPoints: row.loyaltyPoints,
      totalOrders: row.totalOrders,
      totalSpent: row.totalSpent,
      createdAt: row.createdAt,
      lastPurchaseDate: row.last_purchase_date,
      segments: Array.isArray(row.segments) ? row.segments : [],
      tags: Array.isArray(row.tags) ? row.tags : []
    }
  }

  /**
   * Transform Prisma result to standard format
   */
  private static transformPrismaResult(customer: any): CustomerSearchResult {
    return {
      id: customer.id,
      name: customer.name,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      loyaltyLevel: customer.loyaltyLevel,
      loyaltyPoints: customer.loyaltyPoints,
      totalOrders: customer.totalOrders,
      totalSpent: customer.totalSpent,
      createdAt: customer.createdAt,
      lastPurchaseDate: customer.orders.length > 0 ? customer.orders[0].createdAt : null,
      segments: customer.segmentAssignments.map((sa: any) => sa.segment),
      tags: customer.tagAssignments.map((ta: any) => ta.tag)
    }
  }

  /**
   * Determine query complexity based on number of filters
   */
  private static getQueryComplexity(params: CustomerSearchParams): 'simple' | 'moderate' | 'complex' {
    const filterCount = [
      params.q,
      params.segment,
      params.tier,
      params.tag,
      params.registrationFrom,
      params.registrationTo,
      params.lastPurchaseFrom,
      params.lastPurchaseTo,
      params.clvMin,
      params.clvMax,
      params.orderCountMin,
      params.orderCountMax
    ].filter(Boolean).length

    if (filterCount <= 1) return 'simple'
    if (filterCount <= this.COMPLEX_QUERY_THRESHOLD) return 'moderate'
    return 'complex'
  }

  /**
   * Check if materialized view is available
   */
  private static async isMaterializedViewAvailable(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1 FROM customer_search_view LIMIT 1`
      return true
    } catch {
      return false
    }
  }

  /**
   * Get cached search result
   */
  private static async getCachedResult(params: CustomerSearchParams): Promise<any | null> {
    try {
      const cacheKey = `customer-search-v2:${Buffer.from(JSON.stringify(params)).toString('base64')}`
      const cached = await redis.get(cacheKey)
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  }

  /**
   * Cache search result
   */
  private static async cacheResult(params: CustomerSearchParams, result: any): Promise<void> {
    try {
      const cacheKey = `customer-search-v2:${Buffer.from(JSON.stringify(params)).toString('base64')}`
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result))
    } catch (error) {
      console.warn('Failed to cache search result:', error)
    }
  }
}
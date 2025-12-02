import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'
import type { Product, SortOption, SupportedLocale } from '@/types'
import type { UserPreferences } from '@/types/personalization'
import { getSearchableFields } from './i18n-search'
import { getCachedUserPreferences, setCachedUserPreferences } from './redis'
import { getUserPreferences, getPersonalizationConfig } from './personalization-service'

/**
 * Product Search Service using PostgreSQL Full-Text Search
 * 
 * This service provides high-performance product search with:
 * - PostgreSQL FTS with French language configuration
 * - Weighted ranking (name > description)
 * - Multi-factor relevance scoring
 * - Advanced filtering and sorting
 * - Fallback to contains search
 */

export interface ProductSearchFilters {
  priceMin?: number
  priceMax?: number
  categories?: string[]
  brands?: string[]
  colors?: string[]
  sizes?: string[]
  rating?: number
  inStock?: boolean
  onSale?: boolean
}

export interface ProductSearchOptions {
  query: string
  filters?: ProductSearchFilters
  sort?: SortOption
  page?: number
  limit?: number
  locale?: SupportedLocale
  /** User ID for personalized search results */
  userId?: string
}

export interface ProductSearchResult {
  products: Product[]
  totalCount: number
}

/**
 * Search products using PostgreSQL Full-Text Search
 */
export async function searchProducts(
  options: ProductSearchOptions,
  locale?: SupportedLocale
): Promise<ProductSearchResult> {
  const {
    query,
    filters = {},
    sort = 'relevance',
    page = 1,
    limit = 24,
  } = options

  try {
    // If no query and sorting by relevance, use default sort
    const effectiveSort = !query && sort === 'relevance' ? 'newest' : sort

    // Build the FTS query if there's a search term
    if (query && query.trim()) {
      return await searchWithFTS(query.trim(), filters, effectiveSort, page, limit, locale, options.userId)
    }

    // No search query - just filter and sort (pass userId for personalization - Comment 7)
    return await searchWithoutQuery(filters, effectiveSort, page, limit, options.userId)
  } catch (error) {
    console.error('Product search error:', error)
    // Fallback to contains search (pass userId for personalization - Comment 7)
    return await fallbackSearch(query, filters, sort, page, limit, locale, options.userId)
  }
}

/**
 * Search using PostgreSQL Full-Text Search with ts_rank
 * Supports personalization boosts when userId is provided
 */
async function searchWithFTS(
  query: string,
  filters: ProductSearchFilters,
  sort: SortOption,
  page: number,
  limit: number,
  locale?: SupportedLocale,
  userId?: string
): Promise<ProductSearchResult> {
  const skip = (page - 1) * limit
  const effectiveLocale = locale || 'fr'
  const fields = getSearchableFields(effectiveLocale)

  // Build WHERE clause for filters
  const whereConditions: string[] = [
    "p.status = 'ACTIVE'",
    "p.approval_status = 'APPROVED'",
  ]

  // Add locale-aware FTS condition
  if (effectiveLocale === 'en') {
    // English: use COALESCE with English fields and English text search config
    whereConditions.push(`to_tsvector('english', ${fields.nameCoalesce} || ' ' || ${fields.descriptionCoalesce}) @@ plainto_tsquery('english', $1)`)
  } else {
    // French: use existing search_vector
    whereConditions.push("p.search_vector @@ plainto_tsquery('french', $1)")
  }

  const params: (string | number | string[])[] = [query]
  let paramIndex = 2

  // Apply filters
  if (filters.priceMin !== undefined) {
    whereConditions.push(`p.price >= $${paramIndex}`)
    params.push(filters.priceMin)
    paramIndex++
  }

  if (filters.priceMax !== undefined) {
    whereConditions.push(`p.price <= $${paramIndex}`)
    params.push(filters.priceMax)
    paramIndex++
  }

  if (filters.rating !== undefined) {
    whereConditions.push(`p.rating >= $${paramIndex}`)
    params.push(filters.rating)
    paramIndex++
  }

  if (filters.inStock) {
    whereConditions.push('p.stock > 0')
  }

  if (filters.onSale) {
    whereConditions.push('p.on_sale = true')
  }

  if (filters.categories && filters.categories.length > 0) {
    whereConditions.push(`p.category_id = ANY($${paramIndex}::text[])`)
    params.push(filters.categories)
    paramIndex++
  }

  // Brands filter (using vendor_id)
  if (filters.brands && filters.brands.length > 0) {
    whereConditions.push(`p.vendor_id = ANY($${paramIndex}::text[])`)
    params.push(filters.brands)
    paramIndex++
  }

  // Colors filter (using variants)
  if (filters.colors && filters.colors.length > 0) {
    whereConditions.push(`EXISTS (
      SELECT 1 FROM product_variants pv
      WHERE pv.product_id = p.id
      AND pv.color = ANY($${paramIndex}::text[])
    )`)
    params.push(filters.colors)
    paramIndex++
  }

  // Sizes filter (using variants)
  if (filters.sizes && filters.sizes.length > 0) {
    whereConditions.push(`EXISTS (
      SELECT 1 FROM product_variants pv
      WHERE pv.product_id = p.id
      AND pv.size = ANY($${paramIndex}::text[])
    )`)
    params.push(filters.sizes)
    paramIndex++
  }

  const whereClause = whereConditions.join(' AND ')

  // Fetch user preferences for personalization if userId provided
  let userPreferences: UserPreferences | null = null
  if (userId) {
    try {
      // Try cache first
      userPreferences = await getCachedUserPreferences(userId)
      
      // If not in cache, fetch from database using raw query
      // (avoids TypeScript error until Prisma client is regenerated with preferences field)
      if (!userPreferences) {
        const result = await prisma.$queryRaw<Array<{ preferences: unknown }>>`
          SELECT preferences FROM users WHERE id = ${userId}
        `
        userPreferences = result[0]?.preferences as UserPreferences | null
        
        // Cache for future requests
        if (userPreferences) {
          const { setCachedUserPreferences } = await import('./redis')
          await setCachedUserPreferences(userId, userPreferences)
        }
      }
    } catch (error) {
      console.warn(`[product-search-service] Error fetching preferences for user ${userId}:`, error)
    }
  }

  // Build personalization boost expressions
  let personalizationBoost = ''
  if (userPreferences && sort === 'relevance') {
    const favoriteCategoryIds = userPreferences.favoriteCategories.map(c => c.id)
    const favoriteBrandIds = userPreferences.favoriteBrands.map(b => b.id)
    const categoryBoostValue = (userPreferences.favoriteCategories[0]?.boost || 15) / 100
    const brandBoostValue = (userPreferences.favoriteBrands[0]?.boost || 10) / 100

    if (favoriteCategoryIds.length > 0 || favoriteBrandIds.length > 0) {
      const boostParts: string[] = []
      
      if (favoriteCategoryIds.length > 0) {
        boostParts.push(`CASE WHEN p.category_id = ANY($${paramIndex}::text[]) THEN ${categoryBoostValue} ELSE 0 END`)
        params.push(favoriteCategoryIds)
        paramIndex++
      }
      
      if (favoriteBrandIds.length > 0) {
        boostParts.push(`CASE WHEN p.vendor_id = ANY($${paramIndex}::text[]) THEN ${brandBoostValue} ELSE 0 END`)
        params.push(favoriteBrandIds)
        paramIndex++
      }
      
      personalizationBoost = boostParts.join(' + ')
      console.log(`[product-search-service] Applied personalization for user ${userId}: categories=${favoriteCategoryIds.length}, brands=${favoriteBrandIds.length}`)
    }
  }

  // Build ORDER BY clause
  let orderByClause: string
  if (sort === 'relevance') {
    // Calculate relevance score with multiple factors (locale-aware)
    const tsRankExpression = effectiveLocale === 'en'
      ? `ts_rank(to_tsvector('english', ${fields.nameCoalesce} || ' ' || ${fields.descriptionCoalesce}), plainto_tsquery('english', $1), 1)`
      : `ts_rank(p.search_vector, plainto_tsquery('french', $1), 1)`
    
    // Include personalization boost if available
    const personalizationPart = personalizationBoost ? ` + ${personalizationBoost}` : ''
    
    orderByClause = `
      (
        ${tsRankExpression} +
        CASE WHEN p.featured THEN 0.2 ELSE 0 END +
        CASE WHEN p.stock > 0 THEN 0.1 ELSE 0 END +
        (p.rating / 5.0 * 0.1) +
        (LOG(GREATEST(p.review_count, 1)) * 0.05)${personalizationPart}
      ) DESC,
      p.created_at DESC
    `
  } else if (sort === 'price-asc') {
    orderByClause = 'p.price ASC, p.created_at DESC'
  } else if (sort === 'price-desc') {
    orderByClause = 'p.price DESC, p.created_at DESC'
  } else if (sort === 'rating') {
    orderByClause = 'p.rating DESC, p.review_count DESC, p.created_at DESC'
  } else if (sort === 'newest') {
    orderByClause = 'p.created_at DESC'
  } else if (sort === 'bestseller') {
    orderByClause = 'p.review_count DESC, p.rating DESC, p.created_at DESC'
  } else {
    orderByClause = 'p.created_at DESC'
  }

  // Execute raw SQL query to get product IDs with scores
  const productIdsQuery = `
    SELECT p.id
    FROM products p
    WHERE ${whereClause}
    ORDER BY ${orderByClause}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `

  params.push(limit, skip)

  const productRows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    productIdsQuery,
    ...params
  )

  const productIds = productRows.map((row) => row.id)

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as count
    FROM products p
    WHERE ${whereClause}
  `

  const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
    countQuery,
    ...params.slice(0, -2) // Remove limit and offset
  )

  const totalCount = Number(countResult[0]?.count || 0)

  // Fetch full products with relations using Prisma
  if (productIds.length === 0) {
    return { products: [], totalCount: 0 }
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
    },
    include: {
      images: {
        orderBy: { order: 'asc' },
      },
      variants: true,
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      vendor: {
        select: {
          id: true,
          businessName: true,
          slug: true,
        },
      },
    },
  })

  // Reorder products to match the FTS ranking
  const productMap = new Map(products.map((p) => [p.id, p]))
  const orderedProducts = productIds
    .map((id) => productMap.get(id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)

  // Transform to Product type
  const transformedProducts: Product[] = orderedProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || undefined,
    price: p.price,
    compareAtPrice: p.compareAtPrice || undefined,
    stock: p.stock,
    rating: p.rating,
    reviewCount: p.reviewCount,
    badge: p.badge || undefined,
    featured: p.featured,
    onSale: p.onSale,
    images: p.images.map((img) => ({
      url: img.url,
      alt: img.alt,
      type: (img.type === 'VIDEO' ? 'video' : img.type === 'THREE_SIXTY' ? '360' : 'image') as 'image' | 'video' | '360',
      thumbnail: img.thumbnail || undefined,
      videoUrl: img.videoUrl || undefined,
      frames: img.frames ? (img.frames as string[]) : undefined,
    })),
    variants: p.variants?.map((v) => ({
      id: v.id,
      size: v.size || undefined,
      color: v.color || undefined,
      sku: v.sku,
      stock: v.stock,
      priceModifier: v.priceModifier,
    })),
    category: {
      id: p.category.id,
      name: p.category.name,
      slug: p.category.slug,
      isActive: true,
    },
    tags: p.tags?.map((pt) => ({
      id: pt.tag.id,
      name: pt.tag.name,
      slug: pt.tag.slug,
    })),
    vendor: p.vendor ? {
      id: p.vendor.id,
      businessName: p.vendor.businessName,
      slug: p.vendor.slug,
    } : undefined,
    specifications: p.specifications ? (p.specifications as Record<string, string>) : undefined,
    seo: p.seo ? (p.seo as { title: string; description: string; keywords?: string[] }) : undefined,
    arModelUrl: p.arModelUrl || undefined,
  }))

  return {
    products: transformedProducts,
    totalCount,
  }
}

/**
 * Search without query - just filter and sort
 * Supports personalization when userId is provided (Comment 7)
 */
async function searchWithoutQuery(
  filters: ProductSearchFilters,
  sort: SortOption,
  page: number,
  limit: number,
  userId?: string
): Promise<ProductSearchResult> {
  const skip = (page - 1) * limit

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.price = {}
    if (filters.priceMin !== undefined) where.price.gte = filters.priceMin
    if (filters.priceMax !== undefined) where.price.lte = filters.priceMax
  }

  if (filters.rating !== undefined) {
    where.rating = { gte: filters.rating }
  }

  if (filters.inStock) {
    where.stock = { gt: 0 }
  }

  if (filters.onSale) {
    where.onSale = true
  }

  if (filters.categories && filters.categories.length > 0) {
    where.categoryId = { in: filters.categories }
  }

  // Brands filter (vendors)
  if (filters.brands && filters.brands.length > 0) {
    where.vendorId = { in: filters.brands }
  }

  // Colors and Sizes filters (variants) - need to handle combined filters
  const variantFilters: Prisma.ProductVariantWhereInput[] = []
  if (filters.colors && filters.colors.length > 0) {
    variantFilters.push({ color: { in: filters.colors } })
  }
  if (filters.sizes && filters.sizes.length > 0) {
    variantFilters.push({ size: { in: filters.sizes } })
  }

  if (variantFilters.length > 0) {
    // Products must have variants matching ALL specified filters
    where.AND = variantFilters.map(filter => ({
      variants: { some: filter }
    }))
  }

  // Build order by
  let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[]
  if (sort === 'price-asc') {
    orderBy = { price: 'asc' }
  } else if (sort === 'price-desc') {
    orderBy = { price: 'desc' }
  } else if (sort === 'rating') {
    orderBy = [{ rating: 'desc' }, { reviewCount: 'desc' }]
  } else if (sort === 'bestseller') {
    orderBy = [{ reviewCount: 'desc' }, { rating: 'desc' }]
  } else {
    orderBy = { createdAt: 'desc' }
  }

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        variants: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ])

  // Transform to Product type
  const transformedProducts: Product[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || undefined,
    price: p.price,
    compareAtPrice: p.compareAtPrice || undefined,
    stock: p.stock,
    rating: p.rating,
    reviewCount: p.reviewCount,
    badge: p.badge || undefined,
    featured: p.featured,
    onSale: p.onSale,
    images: p.images.map((img) => ({
      url: img.url,
      alt: img.alt,
      type: (img.type === 'VIDEO' ? 'video' : img.type === 'THREE_SIXTY' ? '360' : 'image') as 'image' | 'video' | '360',
      thumbnail: img.thumbnail || undefined,
      videoUrl: img.videoUrl || undefined,
      frames: img.frames ? (img.frames as string[]) : undefined,
    })),
    variants: p.variants?.map((v) => ({
      id: v.id,
      size: v.size || undefined,
      color: v.color || undefined,
      sku: v.sku,
      stock: v.stock,
      priceModifier: v.priceModifier,
    })),
    category: {
      id: p.category.id,
      name: p.category.name,
      slug: p.category.slug,
      isActive: true,
    },
    tags: p.tags?.map((pt) => ({
      id: pt.tag.id,
      name: pt.tag.name,
      slug: pt.tag.slug,
    })),
    vendor: p.vendor ? {
      id: p.vendor.id,
      businessName: p.vendor.businessName,
      slug: p.vendor.slug,
    } : undefined,
    specifications: p.specifications ? (p.specifications as Record<string, string>) : undefined,
    seo: p.seo ? (p.seo as { title: string; description: string; keywords?: string[] }) : undefined,
    arModelUrl: p.arModelUrl || undefined,
  }))

  // Apply personalization reranking if userId provided (Comment 7)
  let finalProducts = transformedProducts
  if (userId) {
    finalProducts = await applyPersonalizationRerankingForPrisma(transformedProducts, userId)
  }

  return {
    products: finalProducts,
    totalCount,
  }
}

/**
 * Fallback search using contains (case-insensitive)
 * Supports personalization when userId is provided (Comment 7)
 */
async function fallbackSearch(
  query: string,
  filters: ProductSearchFilters,
  sort: SortOption,
  page: number,
  limit: number,
  locale?: SupportedLocale,
  userId?: string
): Promise<ProductSearchResult> {
  console.warn('Using fallback contains search for query:', query)

  const skip = (page - 1) * limit
  // locale parameter kept for API compatibility but not used in simplified fallback search

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
  }

  if (query && query.trim()) {
    // Search in name and description fields
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ]
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    where.price = {}
    if (filters.priceMin !== undefined) where.price.gte = filters.priceMin
    if (filters.priceMax !== undefined) where.price.lte = filters.priceMax
  }

  if (filters.rating !== undefined) {
    where.rating = { gte: filters.rating }
  }

  if (filters.inStock) {
    where.stock = { gt: 0 }
  }

  if (filters.onSale) {
    where.onSale = true
  }

  if (filters.categories && filters.categories.length > 0) {
    where.categoryId = { in: filters.categories }
  }

  // Brands filter (vendors)
  if (filters.brands && filters.brands.length > 0) {
    where.vendorId = { in: filters.brands }
  }

  // Colors and Sizes filters (variants) - need to handle combined filters
  const variantFilters: Prisma.ProductVariantWhereInput[] = []
  if (filters.colors && filters.colors.length > 0) {
    variantFilters.push({ color: { in: filters.colors } })
  }
  if (filters.sizes && filters.sizes.length > 0) {
    variantFilters.push({ size: { in: filters.sizes } })
  }

  if (variantFilters.length > 0) {
    // Products must have variants matching ALL specified filters
    where.AND = variantFilters.map(filter => ({
      variants: { some: filter }
    }))
  }

  // Build order by
  let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[]
  if (sort === 'price-asc') {
    orderBy = { price: 'asc' }
  } else if (sort === 'price-desc') {
    orderBy = { price: 'desc' }
  } else if (sort === 'rating') {
    orderBy = [{ rating: 'desc' }, { reviewCount: 'desc' }]
  } else if (sort === 'bestseller') {
    orderBy = [{ reviewCount: 'desc' }, { rating: 'desc' }]
  } else {
    orderBy = { createdAt: 'desc' }
  }

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        variants: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ])

  // Transform to Product type
  const transformedProducts: Product[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description || undefined,
    price: p.price,
    compareAtPrice: p.compareAtPrice || undefined,
    stock: p.stock,
    rating: p.rating,
    reviewCount: p.reviewCount,
    badge: p.badge || undefined,
    featured: p.featured,
    onSale: p.onSale,
    images: p.images.map((img) => ({
      url: img.url,
      alt: img.alt,
      type: (img.type === 'VIDEO' ? 'video' : img.type === 'THREE_SIXTY' ? '360' : 'image') as 'image' | 'video' | '360',
      thumbnail: img.thumbnail || undefined,
      videoUrl: img.videoUrl || undefined,
      frames: img.frames ? (img.frames as string[]) : undefined,
    })),
    variants: p.variants?.map((v) => ({
      id: v.id,
      size: v.size || undefined,
      color: v.color || undefined,
      sku: v.sku,
      stock: v.stock,
      priceModifier: v.priceModifier,
    })),
    category: {
      id: p.category.id,
      name: p.category.name,
      slug: p.category.slug,
      isActive: true,
    },
    tags: p.tags?.map((pt) => ({
      id: pt.tag.id,
      name: pt.tag.name,
      slug: pt.tag.slug,
    })),
    vendor: p.vendor ? {
      id: p.vendor.id,
      businessName: p.vendor.businessName,
      slug: p.vendor.slug,
    } : undefined,
    specifications: p.specifications ? (p.specifications as Record<string, string>) : undefined,
    seo: p.seo ? (p.seo as { title: string; description: string; keywords?: string[] }) : undefined,
    arModelUrl: p.arModelUrl || undefined,
  }))

  // Apply personalization reranking if userId provided (Comment 7 - fallbackSearch)
  let finalProductsFallback = transformedProducts
  if (userId) {
    finalProductsFallback = await applyPersonalizationRerankingForPrisma(transformedProducts, userId)
  }

  return {
    products: finalProductsFallback,
    totalCount,
  }
}

/**
 * Apply personalization reranking to Prisma search results (Comment 7)
 * 
 * Boosts products from user's favorite categories and brands by adjusting
 * their position in the results. Used for searchWithoutQuery and fallbackSearch.
 */
async function applyPersonalizationRerankingForPrisma(
  products: Product[],
  visitorUserId: string
): Promise<Product[]> {
  try {
    // Try cache first, then database
    let userPreferences: UserPreferences | null = await getCachedUserPreferences(visitorUserId)
    
    if (!userPreferences) {
      userPreferences = await getUserPreferences(visitorUserId)
      // Cache for future requests
      if (userPreferences) {
        await setCachedUserPreferences(visitorUserId, userPreferences)
      }
    }

    if (!userPreferences || 
        (userPreferences.favoriteCategories.length === 0 && userPreferences.favoriteBrands.length === 0)) {
      // No preferences, return original order
      return products
    }

    const config = getPersonalizationConfig()
    const categoryBoost = config.categoryBoost / 100 // Convert percentage to decimal
    const brandBoost = config.brandBoost / 100

    // Build lookup sets for fast matching
    const favoriteCategoryIds = new Set(userPreferences.favoriteCategories.map(c => c.id))
    const favoriteBrandIds = new Set(userPreferences.favoriteBrands.map(b => b.id))

    // Calculate personalization score for each product
    const scoredProducts = products.map((product, index) => {
      let boost = 0
      
      // Check category match
      if (product.category?.id && favoriteCategoryIds.has(product.category.id)) {
        boost += categoryBoost
      }
      
      // Check brand/vendor match
      if (product.vendor?.id && favoriteBrandIds.has(product.vendor.id)) {
        boost += brandBoost
      }

      // Base score is inverse of position (higher position = higher base score)
      const baseScore = 1 - (index / products.length)
      const personalizedScore = baseScore * (1 + boost)

      return { product, personalizedScore, originalIndex: index }
    })

    // Sort by personalized score (descending)
    scoredProducts.sort((a, b) => b.personalizedScore - a.personalizedScore)

    console.log(`[product-search-service] Applied Prisma personalization for user ${visitorUserId}: ` +
      `${userPreferences.favoriteCategories.length} categories, ${userPreferences.favoriteBrands.length} brands`)

    return scoredProducts.map(sp => sp.product)
  } catch (error) {
    console.warn(`[product-search-service] Error applying personalization for user ${visitorUserId}:`, error)
    // Return original order on error
    return products
  }
}

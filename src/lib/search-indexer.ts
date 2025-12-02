/**
 * MeiliSearch Product Indexing Service
 *
 * Handles transformation and synchronization of Prisma Product models to MeiliSearch documents.
 */

import { prisma } from '@/lib/prisma'
import { getIndex, isAvailable, ENABLE_MEILISEARCH } from '@/lib/meilisearch-client'
import { calculateBoostScore } from '@/lib/ranking-service'
import type {
  MeiliSearchProductDocument,
  IndexResult,
  BatchIndexResult,
  ReindexOptions
} from '@/types/search-indexer'
import type { Product, ProductImage, ProductVariant, Prisma } from '@prisma/client'

/**
 * Extended Product type including relations and runtime optional fields
 */
interface ExtendedProduct extends Product {
  category: { id: string; name: string } | null
  vendor: { id: string; businessName: string } | null
  tags: Array<{ tag: { name: string; slug: string } }>
  images: ProductImage[]
  variants: ProductVariant[]
  // Runtime fields (from raw queries or extensions)
  popularity?: number
  nameEn?: string | null
  descriptionEn?: string | null
}

/**
 * Transform Prisma Product to MeiliSearch document format
 */
export function transformProductToDocument(
  product: ExtendedProduct
): MeiliSearchProductDocument {
  // Extract first image for thumbnail (images are already sorted by order ASC)
  const thumbnail = product.images[0]?.url || null

  // Extract unique colors and sizes from variants
  const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))] as string[]
  const sizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))] as string[]

  // Calculate final score with boost factors
  // Note: We use views=0 and sales=0 here because we're only using the stored popularity value
  // The full calculation with views/sales is done by the ranking-service during batch updates
  const popularity = product.popularity || 0
  const inStock = product.stock > 0
  const featured = product.featured
  const rating = Number(product.rating)

  // Calculate boost score using the ranking service
  const rankingScore = calculateBoostScore({
    productId: product.id,
    views: 0, // Not needed - we use pre-calculated popularity
    sales: 0, // Not needed - we use pre-calculated popularity
    inStock,
    featured,
    rating,
  })

  // Final score = popularity * (1 + boostScore/100)
  // This applies the boost percentages to the base popularity
  const finalScore = Math.round(popularity * (1 + rankingScore.boostScore / 100))

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    // Multilingual fields for English support
    nameEn: product.nameEn || null,
    descriptionEn: product.descriptionEn || null,
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    stock: product.stock,
    inStock,
    rating,
    reviewCount: product.reviewCount,
    // Popularity - auto-calculated by ranking service, defaults to 0 for new products
    popularity,
    // Final score - popularity with boost factors applied for ranking
    finalScore,
    featured,
    onSale: product.onSale,
    status: product.status,
    approvalStatus: product.approvalStatus,
    categoryId: product.categoryId,
    categoryName: product.category?.name || '',
    vendorId: product.vendorId,
    vendorName: product.vendor?.businessName || null,
    tags: product.tags.map(pt => pt.tag.name),
    colors,
    sizes,
    thumbnail,
    createdAt: product.createdAt.getTime(),
    updatedAt: product.updatedAt.getTime(),
  }
}

/**
 * Get configured batch size from environment
 */
export const getBatchSize = (): number => {
  return Number(process.env.SEARCH_INDEXER_BATCH_SIZE) || 1000
}

/**
 * Index a single product in MeiliSearch
 */
export async function indexProduct(productId: string): Promise<IndexResult> {
  const startTime = Date.now()

  // Guard: Check if MeiliSearch is enabled
  if (!ENABLE_MEILISEARCH) {
    return {
      success: false,
      productId,
      error: 'MeiliSearch is disabled',
      duration: Date.now() - startTime
    }
  }

  // Check availability
  const available = await isAvailable()
  if (!available) {
    return {
      success: false,
      productId,
      error: 'MeiliSearch is not available',
      duration: Date.now() - startTime
    }
  }

  try {
    // Fetch product with all relations
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, businessName: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
        images: { orderBy: { order: 'asc' } },
        variants: true,
      },
    }) as unknown as ExtendedProduct

    if (!product) {
      return {
        success: false,
        productId,
        error: 'Product not found',
        duration: Date.now() - startTime
      }
    }

    // Transform to MeiliSearch document
    const document = transformProductToDocument(product)

    // Index in MeiliSearch
    const index = getIndex('products')
    const task = await index.addDocuments([document], { primaryKey: 'id' })

    return {
      success: true,
      productId,
      taskUid: task.taskUid,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    console.error(`[MeiliSearch] Failed to index product ${productId}:`, error)
    return {
      success: false,
      productId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Delete a product from MeiliSearch
 */
export async function deleteProduct(productId: string): Promise<IndexResult> {
  const startTime = Date.now()

  // Guard: Check if MeiliSearch is enabled
  if (!ENABLE_MEILISEARCH) {
    return {
      success: false,
      productId,
      error: 'MeiliSearch is disabled',
      duration: Date.now() - startTime
    }
  }

  // Check availability
  const available = await isAvailable()
  if (!available) {
    return {
      success: false,
      productId,
      error: 'MeiliSearch is not available',
      duration: Date.now() - startTime
    }
  }

  try {
    const index = getIndex('products')
    const task = await index.deleteDocument(productId)

    return {
      success: true,
      productId,
      taskUid: task.taskUid,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    console.error(`[MeiliSearch] Failed to delete product ${productId}:`, error)
    return {
      success: false,
      productId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Index multiple products in batch
 */
export async function indexProducts(productIds: string[]): Promise<BatchIndexResult> {
  const startTime = Date.now()
  const errors: Array<{ productId: string; error: string }> = []
  let indexed = 0

  // Guard: Check if MeiliSearch is enabled
  if (!ENABLE_MEILISEARCH) {
    return {
      total: productIds.length,
      indexed: 0,
      failed: productIds.length,
      errors: productIds.map(id => ({ productId: id, error: 'MeiliSearch is disabled' })),
      duration: Date.now() - startTime,
    }
  }

  // Check availability
  const available = await isAvailable()
  if (!available) {
    return {
      total: productIds.length,
      indexed: 0,
      failed: productIds.length,
      errors: productIds.map(id => ({ productId: id, error: 'MeiliSearch is not available' })),
      duration: Date.now() - startTime,
    }
  }

  try {
    // Fetch all products with relations
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, businessName: true } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
        images: { orderBy: { order: 'asc' } },
        variants: true,
      },
    }) as unknown as ExtendedProduct[]

    // Transform to documents
    const documents = products.map(transformProductToDocument)

    // Index in MeiliSearch (configurable batch size)
    const index = getIndex('products')
    const batchSize = getBatchSize()

    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize)
      try {
        await index.addDocuments(batch, { primaryKey: 'id' })
        indexed += batch.length
      } catch (error) {
        batch.forEach(doc => {
          errors.push({
            productId: doc.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        })
      }
    }

    return {
      total: productIds.length,
      indexed,
      failed: errors.length,
      errors,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    console.error('[MeiliSearch] Failed to batch index products:', error)
    return {
      total: productIds.length,
      indexed: 0,
      failed: productIds.length,
      errors: productIds.map(id => ({
        productId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })),
      duration: Date.now() - startTime,
    }
  }
}

/**
 * Reindex all products (full or filtered)
 */
export async function reindexAll(options: ReindexOptions = {}): Promise<BatchIndexResult> {
  const startTime = Date.now()
  const { filters = {}, batchSize = getBatchSize(), onProgress, dryRun = false } = options
  const errors: Array<{ productId: string; error: string }> = []
  let indexed = 0

  // Guard: Check if MeiliSearch is enabled
  if (!ENABLE_MEILISEARCH) {
    return {
      total: 0,
      indexed: 0,
      failed: 0,
      errors: [{ productId: 'N/A', error: 'MeiliSearch is disabled' }],
      duration: Date.now() - startTime,
    }
  }

  // Check availability
  const available = await isAvailable()
  if (!available) {
    return {
      total: 0,
      indexed: 0,
      failed: 0,
      errors: [{ productId: 'N/A', error: 'MeiliSearch is not available' }],
      duration: Date.now() - startTime,
    }
  }

  try {
    // Build where clause from filters
    const where: Prisma.ProductWhereInput = {}
    if (filters.categoryId) where.categoryId = filters.categoryId
    if (filters.vendorId) where.vendorId = filters.vendorId
    // Use type assertion for status since string might not match exact enum
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (filters.status) where.status = filters.status as any

    // Get total count
    const total = await prisma.product.count({ where })

    if (dryRun) {
      return {
        total,
        indexed: 0,
        failed: 0,
        errors: [],
        duration: Date.now() - startTime,
      }
    }

    // Process in batches
    const index = getIndex('products')
    let skip = 0

    while (skip < total) {
      // Fetch batch
      const products = await prisma.product.findMany({
        where,
        skip,
        take: batchSize,
        include: {
          category: { select: { id: true, name: true } },
          vendor: { select: { id: true, businessName: true } },
          tags: { include: { tag: { select: { name: true, slug: true } } } },
          images: { orderBy: { order: 'asc' } },
          variants: true,
        },
      }) as unknown as ExtendedProduct[]

      if (products.length === 0) break

      // Transform to documents
      const documents = products.map(transformProductToDocument)

      // Index batch
      try {
        await index.addDocuments(documents, { primaryKey: 'id' })
        indexed += documents.length
      } catch (error) {
        documents.forEach(doc => {
          errors.push({
            productId: doc.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        })
      }

      // Update progress
      if (onProgress) {
        onProgress({ total, indexed, failed: errors.length })
      }

      skip += batchSize
    }

    return {
      total,
      indexed,
      failed: errors.length,
      errors,
      duration: Date.now() - startTime,
    }
  } catch (error) {
    console.error('[MeiliSearch] Failed to reindex products:', error)
    return {
      total: 0,
      indexed: 0,
      failed: 1,
      errors: [{
        productId: 'N/A',
        error: error instanceof Error ? error.message : 'Unknown error',
      }],
      duration: Date.now() - startTime,
    }
  }
}

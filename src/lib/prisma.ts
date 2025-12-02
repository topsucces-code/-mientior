/**
 * Prisma Client Singleton
 * Provides database access for the entire application
 */

import { PrismaClient } from '@prisma/client'
import { SearchCache } from './search-cache'
import { enqueueIndexJob, enqueueDeleteJob } from './search-queue'
import { ENABLE_MEILISEARCH } from './meilisearch-client'

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

// Prisma Middleware: Invalidate caches on product/variant changes
// Strategy: Broad pattern invalidation ('*') clears all affected cache entries for simplicity and performance.
// Trade-offs: May invalidate more than necessary, but acceptable at current scale; avoids complex logic for granular invalidation.
// All calls are fire-and-forget to prevent blocking database operations.
prisma.$use(async (params, next) => {
  const result = await next(params)

  // Invalidate caches when products or variants are modified
  if (
    (params.model === 'Product' || params.model === 'ProductVariant') &&
    ['create', 'update', 'delete', 'createMany', 'updateMany', 'deleteMany'].includes(params.action)
  ) {
    try {
      // Invalidate all search-related caches
      SearchCache.invalidateAll('*').catch(err => console.error('Failed to invalidate caches:', err))
    } catch (err) {
      console.error('Failed to invalidate caches:', err)
    }
  }

  return result
})

// Prisma Middleware: Sync products to MeiliSearch
prisma.$use(async (params, next) => {
  const result = await next(params)

  // Skip if indexer is disabled
  if (process.env.SEARCH_INDEXER_ENABLED === 'false') return result

  // Skip if MeiliSearch is disabled
  if (!ENABLE_MEILISEARCH) return result

  try {
    // Handle Product model changes
    if (params.model === 'Product') {
      if (['create', 'update'].includes(params.action)) {
        // Index product
        const productId = result.id
        enqueueIndexJob(productId).catch((err) => {
          console.error('[MeiliSearch] Failed to enqueue index job:', err)
        })
      } else if (params.action === 'delete') {
        // Delete product
        const productId = params.args?.where?.id
        if (productId) {
          enqueueDeleteJob(productId).catch((err) => {
            console.error('[MeiliSearch] Failed to enqueue delete job:', err)
          })
        }
      }
    }

    // Handle ProductImage changes (re-index parent product)
    if (params.model === 'ProductImage') {
      if (['create', 'update', 'delete'].includes(params.action)) {
        const productId = result?.productId || params.args?.data?.productId || params.args?.where?.productId
        if (productId) {
          enqueueIndexJob(productId).catch((err) => {
            console.error('[MeiliSearch] Failed to enqueue index job:', err)
          })
        }
      }
    }

    // Handle ProductVariant changes (re-index parent product)
    if (params.model === 'ProductVariant') {
      if (['create', 'update', 'delete'].includes(params.action)) {
        const productId = result?.productId || params.args?.data?.productId || params.args?.where?.productId
        if (productId) {
          enqueueIndexJob(productId).catch((err) => {
            console.error('[MeiliSearch] Failed to enqueue index job:', err)
          })
        }
      }
    }

    // Handle ProductTag changes (re-index parent product via relation)
    if (params.model === 'ProductTag') {
      if (['create', 'delete'].includes(params.action)) {
        const productId = result?.productId || params.args?.data?.productId
        if (productId) {
          enqueueIndexJob(productId).catch((err) => {
            console.error('[MeiliSearch] Failed to enqueue index job:', err)
          })
        }
      }
    }
  } catch (error) {
    console.error('[MeiliSearch] Middleware error:', error)
    // Don't throw - graceful degradation
  }

  return result
})

// Prisma Middleware: Auto-update popularity on orders (optional)
// Incrementally updates product popularity when orders are created
prisma.$use(async (params, next) => {
  const result = await next(params)

  // Skip if auto-update is disabled
  if (process.env.RANKING_AUTO_UPDATE_ENABLED === 'false') return result

  try {
    // Handle Order creation - increment popularity for ordered products
    if (params.model === 'OrderItem' && params.action === 'create') {
      const productId = result?.productId
      if (productId) {
        // Get sales weight from config (default: 0.7)
        // This matches the scale used in ranking-service.ts calculatePopularity()
        const salesWeight = parseFloat(process.env.RANKING_POPULARITY_SALES_WEIGHT || '0.7')
        const incrementValue = Math.round(salesWeight) // Scale consistent with calculatePopularity()

        // Increment popularity asynchronously (fire and forget)
        prisma.product
          .update({
            where: { id: productId },
            data: { popularity: { increment: incrementValue } },
          })
          .catch((err) => {
            console.error(`[Ranking] Failed to auto-increment popularity for product ${productId}:`, err)
          })
      }
    }

    // Handle Order creation with multiple items (via OrderItem createMany)
    if (params.model === 'OrderItem' && params.action === 'createMany') {
      const items = params.args?.data || []
      const salesWeight = parseFloat(process.env.RANKING_POPULARITY_SALES_WEIGHT || '0.7')
      const incrementValue = Math.round(salesWeight) // Scale consistent with calculatePopularity()

      // Increment popularity for each product
      items.forEach((item: any) => {
        if (item.productId) {
          prisma.product
            .update({
              where: { id: item.productId },
              data: { popularity: { increment: incrementValue } },
            })
            .catch((err) => {
              console.error(`[Ranking] Failed to auto-increment popularity for product ${item.productId}:`, err)
            })
        }
      })
    }
  } catch (error) {
    console.error('[Ranking] Middleware error:', error)
    // Don't throw - graceful degradation
  }

  return result
})

// Prisma Middleware: Invalidate caches on category changes
// Strategy: Broad invalidation affects facets, search, and suggestions since categories impact all.
// Trade-offs: Simple and effective, but may clear unrelated entries; suitable for current scale.
prisma.$use(async (params, next) => {
  const result = await next(params)

  if (params.model === 'Category' && ['create', 'update', 'delete'].includes(params.action)) {
    SearchCache.invalidateAll('*').catch(err => console.error('Failed to invalidate caches:', err))
  }

  return result
})

// Prisma Middleware: Invalidate caches on tag changes
// Strategy: Invalidate search and suggestions caches as tags affect search results and autocomplete.
// Trade-offs: Broad invalidation is straightforward; facets are not directly affected by tags.
prisma.$use(async (params, next) => {
  const result = await next(params)

  if (params.model === 'Tag' && ['create', 'update', 'delete'].includes(params.action)) {
    SearchCache.invalidateAll('*').catch(err => console.error('Failed to invalidate caches:', err))
  }

  return result
})

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

// Re-export Prisma types for convenience
export type {
  Product,
  Category,
  Order,
  OrderItem,
  User,
  Review,
  Tag,
  ProductImage,
  ProductVariant,
  FAQ,
  Media,
  ProductStatus,
  OrderStatus,
  PaymentStatus,
  LoyaltyLevel,
  ReviewStatus
} from '@prisma/client'



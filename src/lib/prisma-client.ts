/**
 * Prisma Client Singleton - Base client without middleware
 * This file should be imported by other modules that need prisma
 * to avoid circular dependencies
 */

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var prismaClient: PrismaClient | undefined
}

export const prisma = global.prismaClient || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') global.prismaClient = prisma

// Re-export Prisma types for convenience
export type {
  Product,
  Category,
  orders as Order,
  order_items as OrderItem,
  users as User,
  reviews as Review,
  tags as Tag,
  product_images as ProductImage,
  product_variants as ProductVariant,
  faqs as FAQ,
  media as Media,
  ProductStatus,
  OrderStatus,
  PaymentStatus,
  LoyaltyLevel,
  ReviewStatus
} from '@prisma/client'

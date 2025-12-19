/**
 * Prisma Client Singleton
 * Provides database access for the entire application
 * Re-exports from prisma-client.ts
 */

// Re-export prisma from the base client to avoid circular dependencies
export { prisma } from './prisma-client'

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

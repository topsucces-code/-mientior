/**
 * Prisma Client Singleton
 * Provides database access for the entire application
 */

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
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



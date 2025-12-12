/**
 * Prisma Client Singleton (Simple version)
 * Provides database access for the entire application
 */

import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line vars-on-top, no-var
  var prismaSimple: PrismaClient | undefined
}

export const prisma = global.prismaSimple || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
})

if (process.env.NODE_ENV !== 'production') global.prismaSimple = prisma

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

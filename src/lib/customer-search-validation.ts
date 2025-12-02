import { z } from 'zod'
import { LoyaltyLevel } from '@prisma/client'

export const customerSearchSchema = z.object({
  q: z.string().max(100).trim().optional(),
  segment: z.string().uuid().optional(),
  tier: z.nativeEnum(LoyaltyLevel).optional(),
  tag: z.string().uuid().optional(),
  registrationFrom: z.string().datetime().optional(),
  registrationTo: z.string().datetime().optional(),
  lastPurchaseFrom: z.string().datetime().optional(),
  lastPurchaseTo: z.string().datetime().optional(),
  clvMin: z.coerce.number().min(0).max(1000000).optional(),
  clvMax: z.coerce.number().min(0).max(1000000).optional(),
  orderCountMin: z.coerce.number().int().min(0).max(10000).optional(),
  orderCountMax: z.coerce.number().int().min(0).max(10000).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'name', 'email', 'totalSpent', 'totalOrders', 'loyaltyLevel']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).refine(data => {
  // Validate date ranges
  if (data.registrationFrom && data.registrationTo) {
    return new Date(data.registrationFrom) <= new Date(data.registrationTo)
  }
  if (data.lastPurchaseFrom && data.lastPurchaseTo) {
    return new Date(data.lastPurchaseFrom) <= new Date(data.lastPurchaseTo)
  }
  if (data.clvMin && data.clvMax) {
    return data.clvMin <= data.clvMax
  }
  if (data.orderCountMin && data.orderCountMax) {
    return data.orderCountMin <= data.orderCountMax
  }
  return true
}, {
  message: "Invalid range parameters"
})

export type CustomerSearchParams = z.infer<typeof customerSearchSchema>
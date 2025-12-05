import { z } from 'zod'
import { LoyaltyLevel } from '@prisma/client'

// Helper to handle null from searchParams.get()
const nullableUuid = z.string().uuid().nullable().transform(v => v ?? undefined)
const nullableDatetime = z.string().datetime().nullable().transform(v => v ?? undefined)

export const customerSearchSchema = z.object({
  q: z.string().max(100).trim().nullish().transform(v => v ?? undefined),
  segment: nullableUuid.optional(),
  tier: z.nativeEnum(LoyaltyLevel).nullable().transform(v => v ?? undefined).optional(),
  tag: nullableUuid.optional(),
  registrationFrom: nullableDatetime.optional(),
  registrationTo: nullableDatetime.optional(),
  lastPurchaseFrom: nullableDatetime.optional(),
  lastPurchaseTo: nullableDatetime.optional(),
  clvMin: z.coerce.number().min(0).max(1000000).nullable().transform(v => v ?? undefined).optional(),
  clvMax: z.coerce.number().min(0).max(1000000).nullable().transform(v => v ?? undefined).optional(),
  orderCountMin: z.coerce.number().int().min(0).max(10000).nullable().transform(v => v ?? undefined).optional(),
  orderCountMax: z.coerce.number().int().min(0).max(10000).nullable().transform(v => v ?? undefined).optional(),
  page: z.coerce.number().int().min(1).max(1000).nullable().transform(v => v ?? 1).default(1),
  limit: z.coerce.number().int().min(1).max(100).nullable().transform(v => v ?? 20).default(20),
  sortBy: z.enum(['createdAt', 'name', 'email', 'totalSpent', 'totalOrders', 'loyaltyLevel']).nullable().transform(v => v ?? 'createdAt').default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).nullable().transform(v => v ?? 'desc').default('desc')
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
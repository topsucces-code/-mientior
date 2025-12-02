import { z } from 'zod'

/**
 * Validation schema for segment criteria
 * Ensures that segment criteria follow the expected structure
 */
export const segmentCriteriaSchema = z.object({
  // Loyalty level filtering
  loyaltyLevel: z
    .array(z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']))
    .optional(),

  // Total spent range
  totalSpentMin: z.number().min(0).optional(),
  totalSpentMax: z.number().min(0).optional(),

  // Total orders range
  totalOrdersMin: z.number().int().min(0).optional(),
  totalOrdersMax: z.number().int().min(0).optional(),

  // Last order recency (in days)
  lastOrderDays: z.number().int().min(0).optional(),

  // Tag filtering
  tags: z.array(z.string()).optional(),

  // Boolean filters
  hasOrders: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
})

export type SegmentCriteria = z.infer<typeof segmentCriteriaSchema>

/**
 * Validation schema for segment creation
 */
export const createSegmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .refine(
      (name) => !/<|>/.test(name),
      'Name cannot contain < or > characters'
    ),
  
  criteria: segmentCriteriaSchema,
  
  isAutomatic: z.boolean(),
  
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
})

export type CreateSegmentInput = z.infer<typeof createSegmentSchema>

import { z } from 'zod'
import { OrderStatus } from '@prisma/client'

export const ordersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  status: z.nativeEnum(OrderStatus).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  search: z.string().max(100).optional(), // Search by orderNumber or productName
})

export type OrdersQuery = z.infer<typeof ordersQuerySchema>

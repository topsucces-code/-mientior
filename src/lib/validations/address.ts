import { z } from 'zod'

export const addressSchema = z.object({
  firstName: z.string().min(1, 'First name required').max(50),
  lastName: z.string().min(1, 'Last name required').max(50),
  line1: z.string().min(5, 'Address too short').max(100),
  line2: z.string().max(100).optional().nullable(),
  city: z.string().min(2, 'City required').max(50),
  postalCode: z.string().regex(/^[0-9]{5}$/, 'Invalid postal code (5 digits)'),
  country: z.string().length(2, 'Country code must be 2 letters'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().nullable(),
  isDefault: z.boolean().default(false),
})

export type AddressInput = z.infer<typeof addressSchema>

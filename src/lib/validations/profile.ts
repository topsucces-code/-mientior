import { z } from 'zod'

export const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name required').max(50).optional(),
  lastName: z.string().min(1, 'Last name required').max(50).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone').optional(),
  locale: z.enum(['fr', 'en', 'ar']).optional(),
  countryCode: z.string().length(2).optional(),
  currency: z.enum(['XOF', 'XAF', 'NGN', 'KES', 'ZAR', 'MAD', 'GHS', 'EUR']).optional(),
})

export const updateEmailSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required for email change'),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>

import { z } from 'zod'

/**
 * Factory function to create internationalized profile validation schema
 * @param t - Translation function from useTranslations('account.profile.validation')
 */
export const createUpdateProfileSchema = (t: (key: string) => string) => z.object({
  firstName: z.string().min(1, t('firstNameRequired')).max(50).optional(),
  lastName: z.string().min(1, t('lastNameRequired')).max(50).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, t('invalidPhone')).optional(),
  locale: z.enum(['fr', 'en', 'ar']).optional(),
  countryCode: z.string().length(2).optional(),
  currency: z.enum(['XOF', 'XAF', 'NGN', 'KES', 'ZAR', 'MAD', 'GHS', 'EUR']).optional(),
})

/**
 * Factory function to create internationalized email update validation schema
 * @param t - Translation function from useTranslations('account.profile.validation')
 */
export const createUpdateEmailSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t('invalidEmail')),
  password: z.string().min(1, t('passwordRequired')),
})

// Default schemas for backward compatibility (not recommended for new code)
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

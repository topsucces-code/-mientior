import { z } from 'zod'

/**
 * Environment variables schema with validation
 * This ensures all required environment variables are present and valid at startup
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  PRISMA_DATABASE_URL: z.string().url('Invalid database URL'),

  // Redis
  REDIS_URL: z.string().url('Invalid Redis URL'),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32, 'Auth secret must be at least 32 characters'),
  BETTER_AUTH_URL: z.string().url('Invalid Better Auth URL'),

  // Payment Gateways - Paystack (Primary)
  PAYSTACK_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Paystack secret key format'),
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: z.string().startsWith('pk_', 'Invalid Paystack public key format'),

  // Payment Gateways - Flutterwave (Secondary)
  FLUTTERWAVE_SECRET_KEY: z.string().regex(/^FLWSECK[_-]/, 'Invalid Flutterwave secret key format'),
  NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY: z.string().regex(/^FLWPUBK[_-]/, 'Invalid Flutterwave public key format'),

  // Email Service
  RESEND_API_KEY: z.string().startsWith('re_', 'Invalid Resend API key format'),
  EMAIL_FROM: z.string().email('Invalid sender email address'),

  // Application URLs
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL'),
  NEXT_PUBLIC_SERVER_URL: z.string().url('Invalid server URL').optional(),

  // Optional - OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Optional - Payment Gateways
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  NEXT_PUBLIC_STRIPE_PUBLIC_KEY: z.string().startsWith('pk_').optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_API_URL: z.string().url().optional(),
  APPLE_PAY_MERCHANT_ID: z.string().optional(),
  APPLE_PAY_CERT_PATH: z.string().optional(),
  APPLE_PAY_KEY_PATH: z.string().optional(),
  GOOGLE_PAY_GATEWAY: z.string().optional(),
  GOOGLE_PAY_MERCHANT_ID: z.string().optional(),

  // Optional - External Services
  INSTAGRAM_ACCESS_TOKEN: z.string().optional(),
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_KEY: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  PUSHER_CLUSTER: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

  // Optional - Feature Flags
  ALLOW_GUEST_CHECKOUT: z.enum(['true', 'false']).default('true'),
  ENABLE_STORE_PICKUP: z.enum(['true', 'false']).default('false'),
  RUN_INTEGRATION_TESTS: z.enum(['true', 'false']).default('false'),

  // Optional - Security
  REVALIDATION_SECRET: z.string().optional(),
  ADDRESS_VALIDATION_API_KEY: z.string().optional(),

  // Optional - Akeneo PIM Integration
  AKENEO_WEBHOOK_SECRET: z.string().min(32, 'Akeneo webhook secret must be at least 32 characters').optional(),

  // Optional - PIM Health Monitoring
  /** Percentage of failed syncs to trigger alert (default: 10%) */
  PIM_SYNC_FAILURE_THRESHOLD: z.coerce.number().int().positive().default(10).optional(),
  /** Seconds since last sync to trigger delay alert (default: 3600 = 1h) */
  PIM_SYNC_DELAY_THRESHOLD: z.coerce.number().int().positive().default(3600).optional(),
  /** Seconds of sync history to analyze (default: 86400 = 24h) */
  PIM_SYNC_HEALTH_CHECK_WINDOW: z.coerce.number().int().positive().default(86400).optional(),

  // Optional - Domain
  NEXT_PUBLIC_DOMAIN: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

/**
 * Validate and parse environment variables
 * Throws an error if validation fails, preventing the app from starting with invalid config
 */
function validateEnv(): Env {
  try {
    const parsed = envSchema.parse(process.env)
    
    // Additional runtime validations
    if (parsed.NODE_ENV === 'production') {
      // Ensure critical production configs are set
      if (!parsed.SENTRY_DSN) {
        console.warn('⚠️  SENTRY_DSN not set in production - error tracking disabled')
      }
      
      // Ensure HTTPS in production
      if (!parsed.NEXT_PUBLIC_APP_URL.startsWith('https://')) {
        throw new Error('NEXT_PUBLIC_APP_URL must use HTTPS in production')
      }
    }
    
    return parsed
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      console.error(JSON.stringify(error.format(), null, 2))
      
      // List missing required variables
      const missingVars = error.issues
        .filter(issue => issue.code === 'invalid_type' && issue.received === 'undefined')
        .map(issue => issue.path.join('.'))
      
      if (missingVars.length > 0) {
        console.error('\n📋 Missing required environment variables:')
        missingVars.forEach(varName => console.error(`   - ${varName}`))
        console.error('\n💡 Check your .env file and .env.example for reference\n')
      }
    }
    
    throw new Error('Environment validation failed - check logs above')
  }
}

/**
 * Validated environment variables
 * Import this instead of using process.env directly
 * 
 * @example
 * import { env } from '@/lib/env'
 * const apiKey = env.RESEND_API_KEY
 */
export const env = validateEnv()

/**
 * Helper to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production'

/**
 * Helper to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development'

/**
 * Helper to check if we're in test mode
 */
export const isTest = env.NODE_ENV === 'test'

/**
 * Helper to get the base URL for the application
 */
export const getBaseUrl = () => env.NEXT_PUBLIC_APP_URL

/**
 * Helper to check if a feature is enabled
 */
export const isFeatureEnabled = (feature: 'guestCheckout' | 'storePickup' | 'integrationTests'): boolean => {
  switch (feature) {
    case 'guestCheckout':
      return env.ALLOW_GUEST_CHECKOUT === 'true'
    case 'storePickup':
      return env.ENABLE_STORE_PICKUP === 'true'
    case 'integrationTests':
      return env.RUN_INTEGRATION_TESTS === 'true'
    default:
      return false
  }
}

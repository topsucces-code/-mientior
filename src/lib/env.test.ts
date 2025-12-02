import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Environment Validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset modules to get fresh env validation
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should validate required environment variables', async () => {
    // Set all required variables
    process.env.NODE_ENV = 'test'
    process.env.PRISMA_DATABASE_URL = 'postgresql://localhost:5432/test'
    process.env.REDIS_URL = 'redis://localhost:6379'
    process.env.BETTER_AUTH_SECRET = 'a'.repeat(32)
    process.env.BETTER_AUTH_URL = 'http://localhost:3000'
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_123'
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = 'pk_test_123'
    process.env.FLUTTERWAVE_SECRET_KEY = 'FLWSECK-test123'
    process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK-test123'
    process.env.RESEND_API_KEY = 're_test123'
    process.env.EMAIL_FROM = 'test@example.com'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

    const { env } = await import('./env')
    
    expect(env.NODE_ENV).toBe('test')
    expect(env.PRISMA_DATABASE_URL).toBe('postgresql://localhost:5432/test')
    expect(env.REDIS_URL).toBe('redis://localhost:6379')
  })

  it('should reject invalid database URL', async () => {
    process.env.PRISMA_DATABASE_URL = 'not-a-url'
    
    await expect(async () => {
      await import('./env')
    }).rejects.toThrow()
  })

  it('should reject short auth secret', async () => {
    process.env.BETTER_AUTH_SECRET = 'tooshort'
    
    await expect(async () => {
      await import('./env')
    }).rejects.toThrow()
  })

  it('should reject invalid Paystack key format', async () => {
    process.env.PAYSTACK_SECRET_KEY = 'invalid_format'
    
    await expect(async () => {
      await import('./env')
    }).rejects.toThrow()
  })

  it('should accept optional variables', async () => {
    // Set required variables
    process.env.NODE_ENV = 'test'
    process.env.PRISMA_DATABASE_URL = 'postgresql://localhost:5432/test'
    process.env.REDIS_URL = 'redis://localhost:6379'
    process.env.BETTER_AUTH_SECRET = 'a'.repeat(32)
    process.env.BETTER_AUTH_URL = 'http://localhost:3000'
    process.env.PAYSTACK_SECRET_KEY = 'sk_test_123'
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = 'pk_test_123'
    process.env.FLUTTERWAVE_SECRET_KEY = 'FLWSECK-test123'
    process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK-test123'
    process.env.RESEND_API_KEY = 're_test123'
    process.env.EMAIL_FROM = 'test@example.com'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    
    // Set optional variables
    process.env.GOOGLE_CLIENT_ID = 'google-client-id'
    process.env.SENTRY_DSN = 'https://sentry.io/123'

    const { env } = await import('./env')
    
    expect(env.GOOGLE_CLIENT_ID).toBe('google-client-id')
    expect(env.SENTRY_DSN).toBe('https://sentry.io/123')
  })
})

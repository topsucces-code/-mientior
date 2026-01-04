// Vitest setup file
import { beforeAll, afterAll } from 'vitest'

// Load environment variables from .env file first
// Vitest loads .env automatically

// Set up test environment variables (only if not already set)
process.env.NODE_ENV = 'test'
// Keep existing database URL from .env for integration tests
// process.env.PRISMA_DATABASE_URL is already loaded from .env
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing-purposes-only'
process.env.BETTER_AUTH_URL = 'http://localhost:3000'
process.env.PAYSTACK_SECRET_KEY = 'sk_test_123456789'
process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY = 'pk_test_123456789'
process.env.FLUTTERWAVE_SECRET_KEY = 'FLWSECK-test123456789'
process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY = 'FLWPUBK-test123456789'
process.env.RESEND_API_KEY = 're_test_123456789'
process.env.EMAIL_FROM = 'test@example.com'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

beforeAll(async () => {
  // Setup code before all tests
})

afterAll(async () => {
  // Cleanup code after all tests
})

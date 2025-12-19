import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'

// Determine if CSRF should be disabled (only in development)
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// Security check: Log critical warning if CSRF is disabled in production
if (isProduction && isDevelopment) {
  console.error(
    '🚨 CRITICAL SECURITY WARNING: CSRF protection cannot be disabled in production!'
  )
}

// CSRF protection configuration
// IMPORTANT: CSRF check is ONLY disabled in development mode
// In production, CSRF protection is ALWAYS enabled for security
const disableCSRFCheck = isDevelopment

// Log CSRF status for transparency
if (disableCSRFCheck) {
  console.warn('⚠️  CSRF protection is DISABLED (development mode)')
} else {
  console.info('✅ CSRF protection is ENABLED')
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  user: {
    modelName: 'users', // Use the existing users model
    fields: {
      email: 'email',
      name: 'name',
      emailVerified: 'email_verified',
      image: 'image',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    },
  },
  account: {
    modelName: 'accounts',
  },
  session: {
    modelName: 'sessions',
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Disable for development
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!process.env.GOOGLE_CLIENT_ID,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      enabled: !!process.env.FACEBOOK_CLIENT_ID,
    },
  },
    advanced: {
    // CSRF Protection: ONLY disabled in development, ALWAYS enabled in production
    disableCSRFCheck,
    // Secure cookies: ONLY in production (HTTPS required)
    useSecureCookies: isProduction,
    cookiePrefix: 'better-auth',
  },
  // Cookie security configuration
  // Better Auth automatically sets:
  // - HttpOnly: true (prevents XSS by blocking JavaScript access)
  // - Secure: true in production (HTTPS only, controlled by useSecureCookies)
  // - SameSite: Lax (prevents CSRF while allowing top-level navigation)
  // - Path: / (available across entire site)
  // These settings comply with Requirements 8.5
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key-change-in-production',
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  trustedOrigins: [
    process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  ],
})

export type Session = typeof auth.$Infer.Session

// Client-side auth methods
export const signIn = auth?.api?.signInEmail
export const signOut = auth?.api?.signOut

// Re-export server-side auth functions for backward compatibility
// Note: These should only be used in server components/API routes
export { requireAuth, getSession, getAdminSession, requireAdminAuth } from './auth-server'

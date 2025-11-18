import { betterAuth } from 'better-auth'

// Get database URL with fallback
const getDatabaseUrl = () => {
  const url = process.env.BETTER_AUTH_DATABASE_URL || process.env.DATABASE_URL || ''
  if (!url) {
    console.warn('⚠️  No database URL found for Better Auth. Authentication will not work properly.')
    // Return a dummy URL to prevent initialization errors
    return 'postgresql://localhost:5432/dummy'
  }
  return url
}

// Only initialize auth if we have a valid database URL
const hasValidDatabase = !!(process.env.BETTER_AUTH_DATABASE_URL || process.env.DATABASE_URL)

export const auth = hasValidDatabase ? betterAuth({
  database: {
    provider: 'postgres',
    url: getDatabaseUrl(),
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!process.env.GOOGLE_CLIENT_ID
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5 // 5 minutes
    }
  },
  // Disable migrations to avoid initialization errors
  advanced: {
    generateSchema: false,
    disableCSRFCheck: process.env.NODE_ENV === 'development',
  },
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key-change-in-production',
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  trustedOrigins: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000']
}) : {} as ReturnType<typeof betterAuth>

export type Session = typeof auth.$Infer.Session

// Client-side auth methods
export const signIn = auth?.api?.signInEmail
export const signOut = auth?.api?.signOut

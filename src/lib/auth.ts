import { betterAuth } from 'better-auth'

export const auth = betterAuth({
  database: {
    provider: 'postgres',
    // Use BETTER_AUTH_DATABASE_URL for BetterAuth tables
    url: process.env.BETTER_AUTH_DATABASE_URL || ''
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
  // Désactiver temporairement pour éviter les erreurs d'initialisation
  disableMigration: true,
  secret: process.env.BETTER_AUTH_SECRET || 'your-secret-key-change-in-production',
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  trustedOrigins: [process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000']
})

export type Session = typeof auth.$Infer.Session

// Client-side auth methods
export const signIn = auth.api.signInEmail
export const signOut = auth.api.signOut

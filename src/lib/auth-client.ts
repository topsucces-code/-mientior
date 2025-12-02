import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined'
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  // OAuth methods
  $Infer,
} = authClient

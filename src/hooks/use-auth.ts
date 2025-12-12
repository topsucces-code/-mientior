'use client'

import { useRouter } from 'next/navigation'
import { useSession, signOut } from '@/lib/auth-client'
import { useCallback } from 'react'

export function useAuth() {
  const router = useRouter()
  const { data: session, isPending, error } = useSession()

  const handleSignIn = useCallback(
    async (email: string, password: string, redirectTo?: string, rememberMe?: boolean) => {
      try {
        // Use custom login endpoint to handle rememberMe
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, rememberMe }),
        })

        const result = await response.json()

        if (!response.ok || result.error) {
          // Check if error is due to unverified email
          if (result.code === 'EMAIL_NOT_VERIFIED') {
            // Redirect to email verification prompt page
            router.push(`/verify-email-prompt?email=${encodeURIComponent(result.email || email)}`)
            return { success: false, error: result.error, code: result.code }
          }
          
          // Check if error is due to account lockout
          if (result.code === 'ACCOUNT_LOCKED') {
            return {
              success: false,
              error: result.error,
              code: result.code,
              lockedUntil: result.lockedUntil,
              remainingSeconds: result.remainingSeconds,
            }
          }
          
          throw new Error(result.error || 'Échec de la connexion')
        }

        // Redirect after successful sign in
        router.push(redirectTo || '/account')
        router.refresh()
        return { success: true }
      } catch (error) {
        console.error('Sign in error:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur de connexion',
        }
      }
    },
    [router]
  )

  const handleSignUp = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      _redirectTo?: string
    ) => {
      try {
        // Use custom registration endpoint for proper validation and email sending
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        })

        const result = await response.json()

        if (!response.ok) {
          return { 
            success: false, 
            error: result.error || 'Registration failed',
            suggestion: result.suggestion 
          }
        }

        // Don't redirect automatically - let the form handle showing success message
        return { success: true, data: result }
      } catch (err) {
        console.error('Sign up error:', err)
        return { success: false, error: 'Une erreur inattendue est survenue' }
      }
    },
    []
  )

  const handleSignOut = useCallback(async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }, [router])

  const handleGoogleSignIn = useCallback(
    async (redirectTo?: string) => {
      try {
        // Better Auth handles OAuth flow automatically
        // Construct the OAuth URL with redirect parameter
        const callbackUrl = redirectTo || '/account'
        const oauthUrl = `/api/auth/signin/google?callbackURL=${encodeURIComponent(callbackUrl)}`
        
        // Redirect to Google OAuth
        window.location.href = oauthUrl
        
        return { success: true }
      } catch (error) {
        console.error('Google sign in error:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur de connexion Google',
        }
      }
    },
    []
  )

  const handleFacebookSignIn = useCallback(
    async (redirectTo?: string) => {
      try {
        // Better Auth handles OAuth flow automatically
        // Construct the OAuth URL with redirect parameter
        const callbackUrl = redirectTo || '/account'
        const oauthUrl = `/api/auth/signin/facebook?callbackURL=${encodeURIComponent(callbackUrl)}`
        
        // Redirect to Facebook OAuth
        window.location.href = oauthUrl
        
        return { success: true }
      } catch (error) {
        console.error('Facebook sign in error:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur de connexion Facebook',
        }
      }
    },
    []
  )

  return {
    session,
    user: session?.user,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    signInWithGoogle: handleGoogleSignIn,
    signInWithFacebook: handleFacebookSignIn,
  }
}

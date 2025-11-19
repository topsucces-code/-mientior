'use client'

import { useRouter } from 'next/navigation'
import { useSession, signIn, signUp, signOut } from '@/lib/auth-client'
import { useCallback } from 'react'

export function useAuth() {
  const router = useRouter()
  const { data: session, isPending, error } = useSession()

  const handleSignIn = useCallback(
    async (email: string, password: string, redirectTo?: string) => {
      try {
        const result = await signIn.email({
          email,
          password,
        })

        if (result.error) {
          throw new Error(result.error.message || 'Échec de la connexion')
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
      redirectTo?: string
    ) => {
      try {
        const result = await signUp.email({
          email,
          password,
          name,
        })

        if (result.error) {
          throw new Error(result.error.message || 'Échec de l\'inscription')
        }

        // Redirect after successful sign up
        router.push(redirectTo || '/account')
        router.refresh()
        return { success: true }
      } catch (error) {
        console.error('Sign up error:', error)
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erreur d\'inscription',
        }
      }
    },
    [router]
  )

  const handleSignOut = useCallback(async () => {
    try {
      await signOut()
      router.push('/')
      router.refresh()
      return { success: true }
    } catch (error) {
      console.error('Sign out error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de déconnexion',
      }
    }
  }, [router])

  return {
    session,
    user: session?.user,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
  }
}

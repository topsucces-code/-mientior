'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { useAuthFeedback } from '@/hooks/use-auth-feedback'
import { PasswordStrengthIndicator } from './password-strength-indicator'
import { LockoutCountdown } from './lockout-countdown'
import { passwordSchema } from '@/lib/password-validation'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
  rememberMe: z.boolean().optional(),
})

const registerSchema = z
  .object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Email invalide'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

interface AuthFormProps {
  mode: 'login' | 'register'
  redirectTo?: string
}

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')
  const [breachError, setBreachError] = useState<string | null>(null)
  const [isCheckingBreach, setIsCheckingBreach] = useState(false)
  const [lockoutUntil, setLockoutUntil] = useState<string | null>(null)
  const { signInWithGoogle, signUp } = useAuth()
  const { showMessage, dismissMessage } = useAuthFeedback()
  const formRef = useRef<HTMLFormElement>(null)

  const isLogin = mode === 'login'
  const schema = isLogin ? loginSchema : registerSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(schema),
    defaultValues: isLogin ? { rememberMe: false } : undefined,
    mode: isLogin ? 'onSubmit' : 'onChange', // Only validate login on submit
  })

  const rememberMe = watch('rememberMe' as keyof (LoginFormData | RegisterFormData))

  // Keyboard navigation: Escape key dismisses messages (Requirement 6.5, 9.3)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Dismiss all toast messages
        dismissMessage()
        
        // Return focus to the form if a message was dismissed
        if (formRef.current) {
          const firstInput = formRef.current.querySelector('input:not([disabled])') as HTMLInputElement
          if (firstInput) {
            firstInput.focus()
          }
        }
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dismissMessage])

  // Check password breach on blur
  const checkPasswordBreach = useCallback(async (password: string) => {
    if (!password || password.length < 8) {
      return
    }

    setIsCheckingBreach(true)
    setBreachError(null)

    try {
      const response = await fetch('/api/auth/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!data.isValid && data.errors) {
        // Find breach-specific error
        const breachErr = data.errors.find((err: string) =>
          err.includes('violation de données')
        )
        if (breachErr) {
          setBreachError(breachErr)
        }
      }
    } catch (err) {
      console.error('Error checking password breach:', err)
    } finally {
      setIsCheckingBreach(false)
    }
  }, [])

  const handleResendVerification = async (email: string) => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        showMessage('EMAIL_VERIFICATION_SENT', { email })
      } else {
        showMessage('EMAIL_VERIFICATION_FAILED')
      }
    } catch (err) {
      console.error('Resend verification error:', err)
      showMessage('NETWORK_ERROR')
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      await signInWithGoogle(redirectTo)
    } catch (err) {
      setError('Erreur lors de la connexion avec Google')
      console.error('Google OAuth error:', err)
      setIsSubmitting(false)
    }
  }

  const onSubmit = async (data: LoginFormData | RegisterFormData) => {
    setError(null)
    setLockoutUntil(null)
    setIsSubmitting(true)

    try {
      if (isLogin) {
        const { email, password, rememberMe } = data as LoginFormData
        
        // Call login API directly to avoid immediate redirect
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, rememberMe }),
        })

        const result = await response.json()

        if (!response.ok || result.error) {
          // Requirement 4.5: Preserve email field value on errors (already handled by form state)
          
          // Requirement 4.2: Handle unverified email with resend action
          if (result.code === 'EMAIL_NOT_VERIFIED') {
            showMessage('EMAIL_NOT_VERIFIED', {
              action: {
                label: 'Renvoyer l\'email',
                onClick: () => handleResendVerification(result.email || email),
              },
            })
            setIsSubmitting(false)
            return
          }
          
          // Requirement 4.3: Handle account lockout with duration display
          if (result.code === 'ACCOUNT_LOCKED' && result.lockedUntil) {
            const lockedUntil = new Date(result.lockedUntil)
            const now = new Date()
            const durationMinutes = Math.ceil((lockedUntil.getTime() - now.getTime()) / (1000 * 60))
            
            showMessage('ACCOUNT_LOCKED', {
              duration: durationMinutes,
              attempts: result.attempts,
            })
            setLockoutUntil(result.lockedUntil)
            setIsSubmitting(false)
            return
          }
          
          // Requirement 4.1: Handle invalid credentials
          if (response.status === 401) {
            showMessage('INVALID_CREDENTIALS')
            setIsSubmitting(false)
            return
          }
          
          // Requirement 4.4: Handle network errors
          if (response.status >= 500) {
            showMessage('SERVER_ERROR')
            setIsSubmitting(false)
            return
          }
          
          // Generic error fallback
          setError(result.error || 'Échec de la connexion')
          setIsSubmitting(false)
          return
        }

        // Login successful - show success message (Requirements 3.1, 3.2, 3.3, 3.4)
        // Requirement 3.1: Display success message after successful login
        showMessage('LOGIN_SUCCESS')
        
        // Requirement 3.2: Display for 2 seconds before redirect
        // Requirement 3.3: Keep loading indicator during redirect
        // Requirement 3.4: Redirect to intended page or account dashboard
        setTimeout(() => {
          window.location.href = redirectTo || '/account'
        }, 2000) // 2 second delay before redirect
        
        // Keep isSubmitting true to show loading indicator during redirect
      } else {
        const { email, password, name } = data as RegisterFormData

        // Use the signUp function from useAuth hook
        const result = await signUp(email, password, name, redirectTo)

        if (!result.success) {
          setError(result.error || 'Échec de l\'inscription')
          if (result.suggestion) {
            setError(`${result.error}. ${result.suggestion}`)
          }
        } else {
          // Registration successful - show success toast with email and resend action
          // Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
          
          // Show success message with email (Requirement 1.3) and resend action (Requirement 1.4)
          toast.success('Inscription réussie !', {
            description: `Votre compte a été créé avec succès. Un email de vérification a été envoyé à ${email}. Veuillez vérifier votre boîte de réception.`,
            duration: 5000, // Auto-dismiss after 5 seconds (Requirement 1.5)
            className: 'auth-toast auth-toast-success',
            action: {
              label: 'Renvoyer l\'email',
              onClick: () => handleResendVerification(email),
            },
            closeButton: true,
          })
        }
      }
    } catch (err) {
      // Requirement 4.4: Handle network errors
      if (isLogin) {
        showMessage('NETWORK_ERROR')
      } else {
        setError('Connexion impossible. Vérifiez votre connexion internet et réessayez.')
      }
      console.error('Auth error:', err)
    } finally {
      if (!isLogin) {
        setIsSubmitting(false)
      }
      // For login, keep isSubmitting true during redirect
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">
          {isLogin ? 'Connexion' : 'Créer un compte'}
        </h1>
        <p className="text-muted-foreground">
          {isLogin
            ? 'Connectez-vous à votre compte'
            : 'Inscrivez-vous pour commencer vos achats'}
        </p>
      </div>

      <form 
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-4"
        aria-label={isLogin ? 'Formulaire de connexion' : 'Formulaire d\'inscription'}
      >
        {error && (
          <Alert variant="destructive" role="alert" aria-live="assertive">
            <AlertDescription>
              {error}
              {lockoutUntil && (
                <div className="mt-2">
                  Try again in{' '}
                  <LockoutCountdown
                    lockedUntil={lockoutUntil}
                    onExpire={() => {
                      setLockoutUntil(null)
                      setError(null)
                    }}
                  />
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              type="text"
              placeholder="Jean Dupont"
              {...register('name' as keyof (LoginFormData | RegisterFormData))}
              disabled={isSubmitting}
              aria-invalid={'name' in errors && errors.name ? 'true' : 'false'}
              aria-describedby={'name' in errors && errors.name ? 'name-error' : undefined}
            />
            {'name' in errors && errors.name && (
              <p id="name-error" className="text-sm text-red-500" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            {...register('email')}
            disabled={isSubmitting}
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-sm text-red-500" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            {isLogin && (
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            )}
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register('password', {
              onChange: (e) => setPasswordValue(e.target.value),
              onBlur: (e) => {
                if (!isLogin) {
                  checkPasswordBreach(e.target.value)
                }
              }
            })}
            disabled={isSubmitting}
            aria-invalid={errors.password || breachError ? 'true' : 'false'}
            aria-describedby={
              errors.password 
                ? 'password-error' 
                : breachError 
                ? 'password-breach-error' 
                : !isLogin && passwordValue 
                ? 'password-strength' 
                : undefined
            }
          />
          {errors.password && (
            <p id="password-error" className="text-sm text-red-500" role="alert">
              {errors.password.message}
            </p>
          )}
          {!isLogin && passwordValue && (
            <div id="password-strength" aria-live="polite">
              <PasswordStrengthIndicator password={passwordValue} />
            </div>
          )}
          {!isLogin && breachError && (
            <Alert variant="destructive" className="mt-2" role="alert">
              <AlertDescription id="password-breach-error">{breachError}</AlertDescription>
            </Alert>
          )}
          {!isLogin && isCheckingBreach && (
            <p className="text-xs text-gray-500" aria-live="polite">
              Vérification de la sécurité du mot de passe...
            </p>
          )}
        </div>

        {isLogin && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="rememberMe"
              checked={!!rememberMe}
              onCheckedChange={(checked) => {
                // Type assertion needed because RegisterFormData doesn't have rememberMe
                if (isLogin) {
                  setValue('rememberMe' as keyof LoginFormData, !!checked)
                }
              }}
              disabled={isSubmitting}
            />
            <Label
              htmlFor="rememberMe"
              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Rester connecté pendant 30 jours
            </Label>
          </div>
        )}

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword' as keyof (LoginFormData | RegisterFormData))}
              disabled={isSubmitting}
              aria-invalid={'confirmPassword' in errors && errors.confirmPassword ? 'true' : 'false'}
              aria-describedby={'confirmPassword' in errors && errors.confirmPassword ? 'confirmPassword-error' : undefined}
            />
            {'confirmPassword' in errors && errors.confirmPassword && (
              <p id="confirmPassword-error" className="text-sm text-red-500" role="alert">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting || !!lockoutUntil}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isLogin ? 'Connexion en cours...' : 'Inscription en cours...'}
            </>
          ) : lockoutUntil ? (
            'Compte verrouillé'
          ) : isLogin ? (
            'Se connecter'
          ) : (
            'S\'inscrire'
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continuer avec
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
        disabled={isSubmitting || !!lockoutUntil}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connexion en cours...
          </>
        ) : (
          <>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuer avec Google
          </>
        )}
      </Button>

      <div className="text-center text-sm">
        {isLogin ? (
          <>
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-primary hover:underline">
              S'inscrire
            </Link>
          </>
        ) : (
          <>
            Vous avez déjà un compte ?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

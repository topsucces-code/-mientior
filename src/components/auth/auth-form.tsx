'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
// toast import removed - using redirect to success page instead
import { Loader2, Mail, Lock, User, Eye, EyeOff, Shield, Truck, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/use-auth'
import { useAuthFeedback } from '@/hooks/use-auth-feedback'
import { PasswordStrengthIndicator } from './password-strength-indicator'
import { LockoutCountdown } from './lockout-countdown'
import { TwoFactorVerificationForm } from './two-factor-verification-form'
import { passwordSchema } from '@/lib/password-validation'
import { cn } from '@/lib/utils'

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

// Trust badges for the auth form
const trustBadges = [
  { icon: Shield, text: 'Paiement sécurisé' },
  { icon: Truck, text: 'Livraison rapide' },
  { icon: Gift, text: '-10% 1ère commande' },
]

export function AuthForm({ mode, redirectTo }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [passwordValue, setPasswordValue] = useState('')
  const [breachError, setBreachError] = useState<string | null>(null)
  const [isCheckingBreach, setIsCheckingBreach] = useState(false)
  const [lockoutUntil, setLockoutUntil] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFactorData, setTwoFactorData] = useState<{
    userId: string
    tempToken: string
    rememberMe: boolean
  } | null>(null)
  const { signInWithGoogle, signInWithFacebook, signUp } = useAuth()
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

  const handleFacebookSignIn = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      await signInWithFacebook(redirectTo)
    } catch (err) {
      setError('Erreur lors de la connexion avec Facebook')
      console.error('Facebook OAuth error:', err)
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

          // Handle 2FA requirement
          if (result.code === 'REQUIRES_2FA') {
            setRequires2FA(true)
            setTwoFactorData({
              userId: result.userId,
              tempToken: result.tempToken,
              rememberMe: rememberMe || false,
            })
            setIsSubmitting(false)
            return
          }

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
          // Registration successful - redirect to success page
          window.location.href = `/register/success?email=${encodeURIComponent(email)}`
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

  // Show 2FA verification form if required
  if (requires2FA && twoFactorData) {
    return (
      <TwoFactorVerificationForm
        userId={twoFactorData.userId}
        tempToken={twoFactorData.tempToken}
        rememberMe={twoFactorData.rememberMe}
        redirectTo={redirectTo}
        onBack={() => {
          setRequires2FA(false)
          setTwoFactorData(null)
          setIsSubmitting(false)
        }}
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Card Container */}
      <div className="rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-turquoise-600 shadow-lg">
            {isLogin ? (
              <Lock className="h-8 w-8 text-white" />
            ) : (
              <User className="h-8 w-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isLogin ? 'Bon retour !' : 'Créer un compte'}
          </h1>
          <p className="mt-2 text-gray-500">
            {isLogin
              ? 'Connectez-vous pour accéder à votre compte'
              : 'Rejoignez +2M de clients satisfaits'}
          </p>
        </div>

        {/* Social Login Buttons - First for better UX */}
        <div className="mb-6 space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || !!lockoutUntil}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuer avec Google
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
            onClick={handleFacebookSignIn}
            disabled={isSubmitting || !!lockoutUntil}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continuer avec Facebook
              </>
            )}
          </Button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-400">
              ou avec votre email
            </span>
          </div>
        </div>

        {/* Form */}
        <form 
          ref={formRef}
          onSubmit={handleSubmit(onSubmit)} 
          className="space-y-4"
          aria-label={isLogin ? 'Formulaire de connexion' : 'Formulaire d\'inscription'}
        >
          {error && (
            <Alert variant="destructive" role="alert" aria-live="assertive" className="rounded-xl">
              <AlertDescription>
                {error}
                {lockoutUntil && (
                  <div className="mt-2">
                    Réessayez dans{' '}
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

          {/* Name field for registration */}
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                Nom complet
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Amadou Diallo"
                  className={cn(
                    "h-12 pl-11 rounded-xl border-gray-200 focus:border-turquoise-500 focus:ring-turquoise-500",
                    'name' in errors && errors.name && "border-red-500"
                  )}
                  {...register('name' as keyof (LoginFormData | RegisterFormData))}
                  disabled={isSubmitting}
                  aria-invalid={'name' in errors && errors.name ? 'true' : 'false'}
                  aria-describedby={'name' in errors && errors.name ? 'name-error' : undefined}
                />
              </div>
              {'name' in errors && errors.name && (
                <p id="name-error" className="text-sm text-red-500" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>
          )}

          {/* Email field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Adresse email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                className={cn(
                  "h-12 pl-11 rounded-xl border-gray-200 focus:border-turquoise-500 focus:ring-turquoise-500",
                  errors.email && "border-red-500"
                )}
                {...register('email')}
                disabled={isSubmitting}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-red-500" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </Label>
              {isLogin && (
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-turquoise-600 hover:text-turquoise-700"
                >
                  Mot de passe oublié ?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className={cn(
                  "h-12 pl-11 pr-11 rounded-xl border-gray-200 focus:border-turquoise-500 focus:ring-turquoise-500",
                  (errors.password || breachError) && "border-red-500"
                )}
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
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
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
              <Alert variant="destructive" className="mt-2 rounded-xl" role="alert">
                <AlertDescription id="password-breach-error">{breachError}</AlertDescription>
              </Alert>
            )}
            {!isLogin && isCheckingBreach && (
              <p className="text-xs text-gray-500" aria-live="polite">
                Vérification de la sécurité du mot de passe...
              </p>
            )}
          </div>

          {/* Confirm Password for registration */}
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={cn(
                    "h-12 pl-11 pr-11 rounded-xl border-gray-200 focus:border-turquoise-500 focus:ring-turquoise-500",
                    'confirmPassword' in errors && errors.confirmPassword && "border-red-500"
                  )}
                  {...register('confirmPassword' as keyof (LoginFormData | RegisterFormData))}
                  disabled={isSubmitting}
                  aria-invalid={'confirmPassword' in errors && errors.confirmPassword ? 'true' : 'false'}
                  aria-describedby={'confirmPassword' in errors && errors.confirmPassword ? 'confirmPassword-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {'confirmPassword' in errors && errors.confirmPassword && (
                <p id="confirmPassword-error" className="text-sm text-red-500" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          )}

          {/* Remember me for login */}
          {isLogin && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={!!rememberMe}
                onCheckedChange={(checked) => {
                  if (isLogin) {
                    setValue('rememberMe' as keyof LoginFormData, !!checked)
                  }
                }}
                disabled={isSubmitting}
                className="border-gray-300 data-[state=checked]:bg-turquoise-600 data-[state=checked]:border-turquoise-600"
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-normal text-gray-600 cursor-pointer"
              >
                Rester connecté pendant 30 jours
              </Label>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600 rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/30"
            disabled={isSubmitting || !!lockoutUntil}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isLogin ? 'Connexion...' : 'Création du compte...'}
              </>
            ) : lockoutUntil ? (
              'Compte verrouillé'
            ) : isLogin ? (
              'Se connecter'
            ) : (
              'Créer mon compte'
            )}
          </Button>
        </form>

        {/* Footer link */}
        <div className="mt-6 text-center text-sm text-gray-500">
          {isLogin ? (
            <>
              Pas encore de compte ?{' '}
              <Link href="/register" className="font-semibold text-turquoise-600 hover:text-turquoise-700">
                Créer un compte
              </Link>
            </>
          ) : (
            <>
              Déjà un compte ?{' '}
              <Link href="/login" className="font-semibold text-turquoise-600 hover:text-turquoise-700">
                Se connecter
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="mt-6 flex items-center justify-center gap-6">
        {trustBadges.map((badge, index) => (
          <div key={index} className="flex items-center gap-2 text-gray-500">
            <badge.icon className="h-4 w-4 text-turquoise-600" />
            <span className="text-xs font-medium">{badge.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

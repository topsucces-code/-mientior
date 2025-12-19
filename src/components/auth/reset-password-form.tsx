'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Loader2, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react'
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator'
import { passwordSchema } from '@/lib/password-validation'
import { cn } from '@/lib/utils'

const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

interface ResetPasswordFormProps {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch('password', '')

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null)
    setSuccess(false)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.code === 'TOKEN_INVALID') {
          setError('Le lien de réinitialisation est invalide ou a expiré.')
        } else if (result.code === 'PASSWORD_REUSED') {
          setError('Veuillez choisir un mot de passe que vous n\'avez pas utilisé récemment.')
        } else if (result.code === 'PASSWORD_INVALID') {
          setError(result.details?.join(', ') || 'Le mot de passe ne respecte pas les exigences.')
        } else {
          setError(result.error || 'Une erreur est survenue.')
        }
        return
      }

      setSuccess(true)

      setTimeout(() => {
        router.push('/login?reset=success')
      }, 2000)
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
      console.error('Reset password error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-red-600 px-8 py-10 text-center text-white">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mx-auto">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>
            <h1 className="mt-6 text-3xl font-bold">Lien invalide</h1>
            <p className="mt-2 text-red-100">Ce lien a expiré ou est incorrect</p>
          </div>

          <div className="px-8 py-8 space-y-6">
            <p className="text-center text-gray-600">
              Le lien de réinitialisation que vous avez utilisé n'est plus valide. 
              Veuillez demander un nouveau lien.
            </p>

            <Button
              asChild
              className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600"
            >
              <Link href="/forgot-password">
                Demander un nouveau lien
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <div className="text-center">
              <Link 
                href="/login" 
                className="inline-flex items-center text-sm font-medium text-turquoise-600 hover:text-turquoise-700"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-turquoise-600 px-8 py-10 text-center text-white">
            <div className="relative inline-flex">
              <div className="absolute inset-0 animate-ping rounded-full bg-white/30" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mx-auto">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="mt-6 text-3xl font-bold">Mot de passe réinitialisé !</h1>
            <p className="mt-2 text-green-100">Vous pouvez maintenant vous connecter</p>
          </div>

          <div className="px-8 py-8 space-y-6">
            <p className="text-center text-gray-600">
              Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion...
            </p>

            <Button
              asChild
              className="w-full h-12 rounded-xl bg-turquoise-600 hover:bg-turquoise-700"
            >
              <Link href="/login">
                Se connecter maintenant
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-turquoise-600 px-8 py-10 text-center text-white">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mx-auto">
            <ShieldCheck className="h-10 w-10 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Nouveau mot de passe</h1>
          <p className="mt-2 text-turquoise-100">Choisissez un mot de passe sécurisé</p>
        </div>

        {/* Form */}
        <div className="px-8 py-8 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Nouveau mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={cn(
                    "h-12 pl-11 pr-11 rounded-xl border-gray-200 focus:border-turquoise-500 focus:ring-turquoise-500",
                    errors.password && "border-red-500"
                  )}
                  {...register('password')}
                  disabled={isSubmitting}
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
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
              {password && (
                <PasswordStrengthIndicator password={password} className="mt-3" />
              )}
            </div>

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
                    errors.confirmPassword && "border-red-500"
                  )}
                  {...register('confirmPassword')}
                  disabled={isSubmitting}
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
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 font-semibold shadow-lg shadow-orange-500/25"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Réinitialisation...
                </>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center text-sm font-medium text-turquoise-600 hover:text-turquoise-700"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

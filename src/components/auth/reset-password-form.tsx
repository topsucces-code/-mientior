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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { PasswordStrengthIndicator } from '@/components/auth/password-strength-indicator'
import { passwordSchema } from '@/lib/password-validation'

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
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  // Watch password field for real-time strength indicator
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
        // Handle specific error codes
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

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
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
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Lien invalide</h1>
          <p className="text-muted-foreground">
            Le lien de réinitialisation est invalide ou a expiré.
          </p>
        </div>

        <div className="text-center">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">Mot de passe réinitialisé</h1>
          <p className="text-muted-foreground">
            Votre mot de passe a été réinitialisé avec succès. Vous allez être
            redirigé vers la page de connexion...
          </p>
        </div>

        <div className="text-center">
          <Link href="/login" className="text-primary hover:underline">
            Se connecter maintenant
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Réinitialiser le mot de passe</h1>
        <p className="text-muted-foreground">
          Entrez votre nouveau mot de passe
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            {...register('password')}
            disabled={isSubmitting}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
          
          {/* Password strength indicator */}
          {password && (
            <PasswordStrengthIndicator password={password} className="mt-3" />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            {...register('confirmPassword')}
            disabled={isSubmitting}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Réinitialisation en cours...
            </>
          ) : (
            'Réinitialiser le mot de passe'
          )}
        </Button>
      </form>

      <div className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Retour à la connexion
        </Link>
      </div>
    </div>
  )
}

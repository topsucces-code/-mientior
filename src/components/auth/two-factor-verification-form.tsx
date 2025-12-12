'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

const twoFactorSchema = z.object({
  code: z.string().length(6, 'Le code doit contenir 6 chiffres'),
})

type TwoFactorFormData = z.infer<typeof twoFactorSchema>

interface TwoFactorVerificationFormProps {
  userId: string
  tempToken: string
  rememberMe?: boolean
  redirectTo?: string
  onBack: () => void
}

export function TwoFactorVerificationForm({
  userId,
  tempToken,
  rememberMe = false,
  redirectTo,
  onBack,
}: TwoFactorVerificationFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
  })

  const onSubmit = async (data: TwoFactorFormData) => {
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/2fa/verify-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          tempToken,
          code: data.code,
          rememberMe,
        }),
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        // Handle account lockout
        if (result.code === 'ACCOUNT_LOCKED') {
          const durationMinutes = Math.ceil(result.remainingSeconds / 60)
          setError(
            `Compte temporairement verrouillé suite à plusieurs tentatives échouées. Réessayez dans ${durationMinutes} minute${durationMinutes > 1 ? 's' : ''}.`
          )
          setIsSubmitting(false)
          return
        }

        setError(result.error || 'Code de vérification invalide')
        setIsSubmitting(false)
        return
      }

      // Success - redirect after a brief moment
      setTimeout(() => {
        window.location.href = redirectTo || '/account'
      }, 1000)
    } catch (err) {
      console.error('2FA verification error:', err)
      setError(
        'Connexion impossible. Vérifiez votre connexion internet et réessayez.'
      )
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-turquoise-500 to-turquoise-600 shadow-lg">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Vérification en deux étapes
          </h1>
          <p className="mt-2 text-gray-500">
            Entrez le code de votre application d'authentification ou un code de
            secours
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive" role="alert" className="rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 2FA Code Input */}
          <div className="space-y-2">
            <Label
              htmlFor="code"
              className="text-sm font-medium text-gray-700"
            >
              Code de vérification
            </Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              className={`h-12 text-center text-2xl tracking-widest rounded-xl border-gray-200 focus:border-turquoise-500 focus:ring-turquoise-500 ${
                errors.code ? 'border-red-500' : ''
              }`}
              {...register('code')}
              disabled={isSubmitting}
              autoComplete="one-time-code"
              autoFocus
            />
            {errors.code && (
              <p className="text-sm text-red-500" role="alert">
                {errors.code.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              Ouvrez votre application d'authentification (Google Authenticator,
              Authy, etc.) et entrez le code à 6 chiffres
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-orange-500 hover:bg-orange-600 rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl hover:shadow-orange-500/30"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Vérification...
              </>
            ) : (
              'Vérifier'
            )}
          </Button>

          {/* Back Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base rounded-xl"
            onClick={onBack}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la connexion
          </Button>
        </form>

        {/* Help Text */}
        <div className="mt-6 rounded-lg bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            <strong>Codes de secours :</strong> Si vous n'avez pas accès à votre
            application d'authentification, utilisez l'un de vos codes de secours
            à 8 caractères.
          </p>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Loader2, Mail, ArrowLeft, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null)
    setSuccess(false)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      })

      const result = await response.json()

      if (response.status === 429) {
        const retryAfter = result.retryAfter || 3600
        const minutes = Math.ceil(retryAfter / 60)
        setError(
          `Trop de tentatives. Veuillez réessayer dans ${minutes} minute${minutes > 1 ? 's' : ''}.`
        )
        return
      }

      if (!response.ok && response.status !== 429) {
        setError(result.error || 'Une erreur est survenue. Veuillez réessayer.')
        return
      }

      setSubmittedEmail(data.email)
      setSuccess(true)
    } catch (err) {
      console.error('Forgot password error:', err)
      setError('Impossible de se connecter au serveur. Veuillez vérifier votre connexion.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Success Header */}
          <div className="bg-turquoise-600 px-8 py-10 text-center text-white">
            <div className="relative inline-flex">
              <div className="absolute inset-0 animate-ping rounded-full bg-white/30" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mx-auto">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="mt-6 text-3xl font-bold">Email envoyé !</h1>
            <p className="mt-2 text-green-100">Vérifiez votre boîte de réception</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-6">
            <div className="text-center">
              <p className="text-gray-600">
                Si un compte existe avec l'adresse
              </p>
              <p className="font-semibold text-gray-900 mt-1 break-all">{submittedEmail}</p>
              <p className="text-gray-600 mt-2">
                vous recevrez un lien de réinitialisation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-800">
                💡 Pensez à vérifier vos spams si vous ne trouvez pas l'email.
              </p>
            </div>

            <Button
              asChild
              className="w-full h-12 rounded-xl bg-turquoise-600 hover:bg-turquoise-700"
            >
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
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
            <KeyRound className="h-10 w-10 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Mot de passe oublié ?</h1>
          <p className="mt-2 text-turquoise-100">Pas de panique, on vous aide</p>
        </div>

        {/* Form */}
        <div className="px-8 py-8 space-y-6">
          <p className="text-center text-gray-600">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

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
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
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
                  Envoi en cours...
                </>
              ) : (
                'Envoyer le lien de réinitialisation'
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

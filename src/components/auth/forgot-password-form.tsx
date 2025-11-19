'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2 } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
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
      // TODO: Implement password reset request
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log('Password reset requested for:', data.email)
      setSuccess(true)
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
      console.error('Forgot password error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold">Email envoyé</h1>
          <p className="text-muted-foreground">
            Si un compte existe avec cette adresse email, vous recevrez un lien
            de réinitialisation de mot de passe.
          </p>
        </div>

        <div className="text-center">
          <Link href="/login" className="text-primary hover:underline">
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Mot de passe oublié</h1>
        <p className="text-muted-foreground">
          Entrez votre adresse email et nous vous enverrons un lien pour
          réinitialiser votre mot de passe.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            {...register('email')}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer le lien'}
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

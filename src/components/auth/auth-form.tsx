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
import { useAuth } from '@/hooks/use-auth'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

const registerSchema = z
  .object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
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
  const { signIn, signUp } = useAuth()

  const isLogin = mode === 'login'
  const schema = isLogin ? loginSchema : registerSchema

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData | RegisterFormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: LoginFormData | RegisterFormData) => {
    setError(null)
    setIsSubmitting(true)

    try {
      if (isLogin) {
        const { email, password } = data as LoginFormData
        const result = await signIn(email, password, redirectTo)

        if (!result.success) {
          setError(result.error || 'Échec de la connexion')
        }
      } else {
        const { email, password, name } = data as RegisterFormData
        const result = await signUp(email, password, name, redirectTo)

        if (!result.success) {
          setError(result.error || 'Échec de l\'inscription')
        }
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
      console.error('Auth error:', err)
    } finally {
      setIsSubmitting(false)
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
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
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
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
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
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
            {...register('password')}
            disabled={isSubmitting}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword' as keyof (LoginFormData | RegisterFormData))}
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting
            ? 'Chargement...'
            : isLogin
            ? 'Se connecter'
            : 'S\'inscrire'}
        </Button>
      </form>

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

      {/* TODO: Add Google OAuth button when configured */}
      {/* <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Ou continuer avec
          </span>
        </div>
      </div>
      <Button variant="outline" className="w-full" disabled>
        Google
      </Button> */}
    </div>
  )
}

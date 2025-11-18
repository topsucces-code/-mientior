'use client'

import * as React from 'react'
import { Mail, CheckCircle2, Loader2, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface NewsletterSubscriptionProps {
  title?: string
  subtitle?: string
  incentive?: string
  onSubmit?: (email: string, acceptMarketing: boolean) => Promise<void>
  className?: string
}

export default function NewsletterSubscription({
  title = 'Restez Informé',
  subtitle = 'Inscrivez-vous à notre newsletter et recevez nos dernières offres',
  incentive = '-10% sur votre première commande',
  onSubmit,
  className,
}: NewsletterSubscriptionProps) {
  const [email, setEmail] = React.useState('')
  const [acceptMarketing, setAcceptMarketing] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [error, setError] = React.useState('')
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()
  const { toast } = useToast()

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!email) {
      setError('Veuillez entrer votre adresse email')
      return
    }

    if (!validateEmail(email)) {
      setError('Veuillez entrer une adresse email valide')
      return
    }

    if (!acceptMarketing) {
      setError('Veuillez accepter de recevoir nos communications')
      return
    }

    setIsLoading(true)

    try {
      if (onSubmit) {
        await onSubmit(email, acceptMarketing)
      } else {
        // Mock API call
        await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, acceptMarketing }),
        }).then(async (res) => {
          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.message || 'Une erreur est survenue')
          }
        })
      }

      setIsSuccess(true)
      setEmail('')
      setAcceptMarketing(false)

      toast({
        title: 'Inscription réussie ! 🎉',
        description: 'Vous recevrez bientôt votre code promo par email.',
        variant: 'default',
      })

      // Reset success state after 5 seconds
      setTimeout(() => {
        setIsSuccess(false)
      }, 5000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative overflow-hidden py-10 md:py-14',
        className
      )}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600" />
      <div className="absolute inset-0 bg-[url('/patterns/dots.svg')] opacity-10" />

      <div className="container relative mx-auto px-3 md:px-4 lg:px-6">
        <div className="mx-auto max-w-2xl">
          {/* Content */}
          <div
            className={cn(
              'mb-6 text-center',
              isVisible && !prefersReducedMotion && 'animate-fade-in-up'
            )}
          >
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Mail className="h-8 w-8 text-white" />
              </div>
            </div>

            {/* Title */}
            <h2 className="mb-3 font-display text-display-md md:text-display-lg text-white">
              {title}
            </h2>

            {/* Subtitle */}
            <p className="mb-4 text-lg text-white/90">
              {subtitle}
            </p>

            {/* Incentive Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 backdrop-blur-sm">
              <Gift className="h-5 w-5 text-white" />
              <span className="font-semibold text-white">{incentive}</span>
            </div>
          </div>

          {/* Form */}
          <div
            className={cn(
              isVisible && !prefersReducedMotion && 'animate-fade-in-up'
            )}
            style={{ animationDelay: '200ms' }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-nuanced-400" />
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || isSuccess}
                    className={cn(
                      'h-14 rounded-xl border-0 bg-white pl-12 pr-4 text-base shadow-elevation-2 transition-all',
                      'focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-orange-600',
                      error && 'ring-2 ring-red-300'
                    )}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'email-error' : undefined}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || isSuccess}
                  className={cn(
                    'h-14 rounded-xl bg-white px-8 text-base font-semibold text-orange-600 shadow-elevation-2 transition-all',
                    'hover:bg-platinum-50 hover:shadow-elevation-3 hover:-translate-y-0.5',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    isSuccess && 'bg-success hover:bg-success text-white'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Inscription...
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Inscrit !
                    </>
                  ) : (
                    "S'inscrire"
                  )}
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <p
                  id="email-error"
                  className="text-sm text-red-100 animate-fade-in-up"
                  role="alert"
                >
                  {error}
                </p>
              )}

              {/* Checkbox */}
              <label className="flex cursor-pointer items-start gap-3 text-sm text-white/90">
                <input
                  type="checkbox"
                  checked={acceptMarketing}
                  onChange={(e) => setAcceptMarketing(e.target.checked)}
                  disabled={isLoading || isSuccess}
                  className={cn(
                    'mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-white/30 bg-white/10 transition-all',
                    'checked:bg-white checked:border-white',
                    'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-orange-600',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                />
                <span>
                  J'accepte de recevoir les communications marketing et les offres promotionnelles.
                  Vous pouvez vous désabonner à tout moment.
                </span>
              </label>
            </form>

            {/* Privacy Note */}
            <p
              className={cn(
                'mt-6 text-center text-xs text-white/70',
                isVisible && !prefersReducedMotion && 'animate-fade-in-up'
              )}
              style={{ animationDelay: '400ms' }}
            >
              Vos données sont protégées. Consultez notre{' '}
              <a
                href="/privacy"
                className="underline transition-colors hover:text-white"
              >
                politique de confidentialité
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

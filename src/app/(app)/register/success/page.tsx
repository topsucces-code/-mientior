'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail, ArrowRight, RefreshCw, Inbox, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RegisterSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get('email') || ''
  
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      router.push('/register')
    }
  }, [email, router])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResend = async () => {
    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Échec de l\'envoi')
      }

      setResendSuccess(true)
      setCountdown(60)
    } catch (error) {
      setResendError(error instanceof Error ? error.message : 'Échec de l\'envoi')
    } finally {
      setIsResending(false)
    }
  }

  if (!email) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-turquoise-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header with animation */}
          <div className="bg-turquoise-600 px-8 py-10 text-center text-white">
            <div className="relative inline-flex">
              <div className="absolute inset-0 animate-ping rounded-full bg-white/30" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mx-auto">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="mt-6 text-3xl font-bold">Inscription réussie !</h1>
            <p className="mt-2 text-green-100">Bienvenue dans la famille Mientior</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-6">
            {/* Email verification notice */}
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Mail className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Vérifiez votre email</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Un email de vérification a été envoyé à :
                </p>
                <p className="font-medium text-amber-900 mt-1 break-all">{email}</p>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Prochaines étapes :</h3>
              <div className="space-y-3">
                {[
                  { icon: Inbox, text: 'Ouvrez votre boîte de réception', done: true },
                  { icon: Mail, text: 'Cliquez sur le lien de vérification', done: false },
                  { icon: ArrowRight, text: 'Connectez-vous et profitez de -10%', done: false },
                ].map((step, index) => (
                  <div 
                    key={index}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-colors",
                      step.done ? "bg-green-50" : "bg-gray-50"
                    )}
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                      step.done ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                    )}>
                      {index + 1}
                    </div>
                    <step.icon className={cn(
                      "h-5 w-5",
                      step.done ? "text-green-600" : "text-gray-400"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      step.done ? "text-green-900" : "text-gray-600"
                    )}>
                      {step.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resend section */}
            {resendSuccess && (
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Email renvoyé avec succès !
                </p>
              </div>
            )}

            {resendError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-800">{resendError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <Button
                onClick={handleResend}
                disabled={isResending || countdown > 0}
                variant="outline"
                className="w-full h-12 rounded-xl border-gray-200"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : countdown > 0 ? (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Renvoyer dans {countdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Renvoyer l'email de vérification
                  </>
                )}
              </Button>

              <Button
                asChild
                className="w-full h-12 rounded-xl bg-turquoise-600 hover:bg-turquoise-700"
              >
                <Link href="/login">
                  Aller à la connexion
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Help text */}
            <p className="text-center text-sm text-gray-500">
              Vous n'avez pas reçu l'email ? Vérifiez vos spams ou{' '}
              <Link href="/aide" className="text-turquoise-600 hover:underline">
                contactez le support
              </Link>
            </p>
          </div>
        </div>

        {/* Promo reminder */}
        <div className="mt-6 p-4 rounded-2xl bg-orange-50 border border-orange-200 text-center">
          <p className="text-sm text-orange-800">
            🎁 N'oubliez pas : <span className="font-bold">-10% sur votre première commande</span> vous attend !
          </p>
        </div>
      </div>
    </div>
  )
}

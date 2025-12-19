'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, CheckCircle, RefreshCw, Clock, Inbox, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EmailVerificationPromptProps {
  email: string
  onResend?: () => void
}

export function EmailVerificationPrompt({ email, onResend }: EmailVerificationPromptProps) {
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    return undefined
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

      if (onResend) {
        onResend()
      }
    } catch (error) {
      setResendError(error instanceof Error ? error.message : 'Échec de l\'envoi')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-orange-600 px-8 py-10 text-center text-white">
        <div className="relative inline-flex">
          <div className="absolute inset-0 animate-pulse rounded-full bg-white/20" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mx-auto">
            <Mail className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="mt-6 text-3xl font-bold">Vérifiez votre email</h1>
        <p className="mt-2 text-amber-100">Une dernière étape avant de commencer</p>
      </div>

      {/* Content */}
      <div className="px-8 py-8 space-y-6">
        {/* Email info */}
        <div className="text-center">
          <p className="text-gray-600">Un email de vérification a été envoyé à :</p>
          <p className="font-semibold text-gray-900 mt-1 text-lg break-all">{email}</p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {[
            { icon: Inbox, text: 'Ouvrez votre boîte de réception', highlight: true },
            { icon: Mail, text: 'Cliquez sur le lien de vérification', highlight: false },
            { icon: Sparkles, text: 'Profitez de -10% sur votre 1ère commande', highlight: false },
          ].map((step, index) => (
            <div 
              key={index}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl transition-colors",
                step.highlight ? "bg-turquoise-50 border border-turquoise-200" : "bg-gray-50"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                step.highlight ? "bg-turquoise-500 text-white" : "bg-gray-200 text-gray-600"
              )}>
                {index + 1}
              </div>
              <step.icon className={cn(
                "h-5 w-5",
                step.highlight ? "text-turquoise-600" : "text-gray-400"
              )} />
              <span className={cn(
                "text-sm font-medium",
                step.highlight ? "text-turquoise-900" : "text-gray-600"
              )}>
                {step.text}
              </span>
            </div>
          ))}
        </div>

        {/* Success/Error messages */}
        {resendSuccess && (
          <div className="p-4 rounded-xl bg-turquoise-50 border border-turquoise-200">
            <p className="text-sm text-turquoise-800 flex items-center gap-2">
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
                Renvoyer l'email
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
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Mail, AlertCircle, X } from 'lucide-react'

export function EmailVerificationBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    async function checkVerificationStatus() {
      try {
        const response = await fetch('/api/auth/verification-status')

        // If user is not authenticated, the API will return 401
        if (response.status === 401) {
          return
        }

        const data = await response.json()

        if (data.emailVerified === false) {
          setEmail(data.email)
          setIsVisible(true)
        }
      } catch (error) {
        console.error('Error checking verification status:', error)
      }
    }

    checkVerificationStatus()
  }, [])

  const handleResend = async () => {
    if (!email) return

    setIsResending(true)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setCountdown(60)

        // Start countdown timer
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch (error) {
      console.error('Error resending verification:', error)
    } finally {
      setIsResending(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    setIsVisible(false)
  }

  if (!isVisible || isDismissed) {
    return null
  }

  return (
    <Alert className="rounded-lg border-yellow-200 bg-yellow-50 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <AlertDescription className="text-yellow-800">
              <span className="font-semibold">Vérifiez votre adresse email</span>
              <p className="mt-1">
                Nous avons envoyé un lien de vérification à <strong>{email}</strong>.
                Cliquez sur le lien dans l'email pour vérifier votre compte.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Button
                  onClick={handleResend}
                  disabled={isResending || countdown > 0}
                  size="sm"
                  variant="outline"
                  className="bg-white hover:bg-yellow-100 border-yellow-300"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {isResending
                    ? 'Envoi...'
                    : countdown > 0
                    ? `Renvoyer dans ${countdown}s`
                    : 'Renvoyer l\'email'}
                </Button>
                <span className="text-xs text-yellow-700">
                  Vous n'avez pas reçu l'email ? Vérifiez vos spams.
                </span>
              </div>
            </AlertDescription>
          </div>
        </div>
        <Button
          onClick={handleDismiss}
          size="sm"
          variant="ghost"
          className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 -mt-1 -mr-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
}

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface EmailVerificationPromptProps {
  email: string
  onResend?: () => void
}

export function EmailVerificationPrompt({ email, onResend }: EmailVerificationPromptProps) {
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

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
        throw new Error(data.error || 'Failed to resend verification email')
      }

      setResendSuccess(true)
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

      if (onResend) {
        onResend()
      }
    } catch (error) {
      setResendError(error instanceof Error ? error.message : 'Failed to resend verification email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="rounded-full bg-yellow-100 p-3">
          <Mail className="h-6 w-6 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Please verify your email</h2>
          <p className="text-muted-foreground mt-2">
            We sent a verification link to
          </p>
          <p className="font-medium mt-1">{email}</p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You need to verify your email address before you can continue. Please check your inbox and click the verification link.
        </AlertDescription>
      </Alert>

      {resendSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Verification email sent! Please check your inbox.
          </AlertDescription>
        </Alert>
      )}

      {resendError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{resendError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        <Button
          onClick={handleResend}
          disabled={isResending || countdown > 0}
          className="w-full"
          variant="default"
        >
          {isResending ? (
            'Sending...'
          ) : countdown > 0 ? (
            `Resend in ${countdown}s`
          ) : (
            'Resend verification email'
          )}
        </Button>

        <Button
          asChild
          variant="outline"
          className="w-full"
        >
          <Link href="/login">Use a different email</Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Didn't receive the email? Check your spam folder or try resending.
      </p>
    </div>
  )
}

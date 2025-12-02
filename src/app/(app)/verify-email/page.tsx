'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, Clock } from 'lucide-react'

type VerificationState = 'loading' | 'success' | 'expired' | 'invalid' | 'error'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [state, setState] = useState<VerificationState>('loading')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')

  useEffect(() => {
    if (!token) {
      setState('invalid')
      setMessage('No verification token provided')
      return
    }

    const verifyEmailToken = async (token: string) => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()

        if (response.ok) {
          setState('success')
          setMessage(data.message || 'Email verified successfully!')
          
          // Auto-redirect to login after 2 seconds
          setTimeout(() => {
            router.push('/login?verified=true')
          }, 2000)
        } else {
          if (data.expired) {
            setState('expired')
            setMessage(data.error || 'Verification link has expired')
          } else {
            setState('invalid')
            setMessage(data.error || 'Invalid verification link')
          }
        }
      } catch (error) {
        console.error('Verification error:', error)
        setState('error')
        setMessage('An error occurred during verification. Please try again.')
      }
    }

    verifyEmailToken(token)
  }, [token, router])

  const handleResendVerification = async () => {
    setResending(true)
    setResendError('')
    setResendSuccess(false)

    try {
      // We need to get the email from somewhere
      // For now, we'll show a message to register again
      // In a real implementation, you might want to store the email in localStorage
      // or have the user enter it
      setResendError('Please return to the registration page to request a new verification email.')
    } catch (error) {
      console.error('Resend error:', error)
      setResendError('Failed to resend verification email. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Email Verification
          </h1>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-8">
          {state === 'loading' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
              <p className="text-lg text-gray-700">Verifying your email...</p>
              <p className="text-sm text-gray-500">Please wait a moment</p>
            </div>
          )}

          {state === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Email verified!
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Redirecting to login...
                </p>
              </div>
              <div className="pt-4">
                <Button
                  onClick={() => router.push('/login?verified=true')}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          )}

          {state === 'expired' && (
            <div className="text-center space-y-4">
              <Clock className="h-16 w-16 text-yellow-600 mx-auto" />
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Link expired
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {message}
                </p>
              </div>
              
              {resendSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <p className="text-sm text-green-800">
                    Verification email sent! Please check your inbox.
                  </p>
                </div>
              )}

              {resendError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">{resendError}</p>
                </div>
              )}

              <div className="space-y-2 pt-4">
                <Button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="w-full"
                  variant="default"
                >
                  {resending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>
                <Button
                  onClick={() => router.push('/register')}
                  variant="outline"
                  className="w-full"
                >
                  Back to Registration
                </Button>
              </div>
            </div>
          )}

          {state === 'invalid' && (
            <div className="text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Invalid link
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {message}
                </p>
              </div>
              <div className="pt-4">
                <Button
                  onClick={() => router.push('/register')}
                  className="w-full"
                >
                  Try Registering Again
                </Button>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="text-center space-y-4">
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  Verification failed
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {message}
                </p>
              </div>
              <div className="space-y-2 pt-4">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push('/register')}
                  variant="outline"
                  className="w-full"
                >
                  Back to Registration
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="/aide" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

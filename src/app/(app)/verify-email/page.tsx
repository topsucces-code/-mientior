'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, Clock, ArrowRight, RefreshCw, Sparkles } from 'lucide-react'

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
      setMessage('Aucun token de vérification fourni')
      return
    }

    const verifyEmailToken = async (verificationToken: string) => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: verificationToken }),
        })

        const data = await response.json()

        if (response.ok) {
          setState('success')
          setMessage(data.message || 'Email vérifié avec succès !')
          
          setTimeout(() => {
            router.push('/login?verified=true')
          }, 3000)
        } else {
          if (data.expired) {
            setState('expired')
            setMessage(data.error || 'Le lien de vérification a expiré')
          } else {
            setState('invalid')
            setMessage(data.error || 'Lien de vérification invalide')
          }
        }
      } catch (error) {
        console.error('Verification error:', error)
        setState('error')
        setMessage('Une erreur est survenue lors de la vérification.')
      }
    }

    verifyEmailToken(token)
  }, [token, router])

  const handleResendVerification = async () => {
    setResending(true)
    setResendError('')
    setResendSuccess(false)

    try {
      setResendError('Veuillez retourner à la page d\'inscription pour demander un nouvel email.')
    } catch (error) {
      console.error('Resend error:', error)
      setResendError('Échec de l\'envoi. Veuillez réessayer.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-turquoise-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Loading State */}
          {state === 'loading' && (
            <>
              <div className="bg-turquoise-600 px-8 py-10 text-center text-white">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mx-auto">
                  <Loader2 className="h-10 w-10 text-white animate-spin" />
                </div>
                <h1 className="mt-6 text-3xl font-bold">Vérification en cours</h1>
                <p className="mt-2 text-turquoise-100">Veuillez patienter...</p>
              </div>
              <div className="px-8 py-8">
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <div className="h-2 w-2 rounded-full bg-turquoise-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-turquoise-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 rounded-full bg-turquoise-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </>
          )}

          {/* Success State */}
          {state === 'success' && (
            <>
              <div className="bg-turquoise-600 px-8 py-10 text-center text-white">
                <div className="relative inline-flex">
                  <div className="absolute inset-0 animate-ping rounded-full bg-white/30" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mx-auto">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h1 className="mt-6 text-3xl font-bold">Email vérifié !</h1>
                <p className="mt-2 text-green-100">Votre compte est maintenant actif</p>
              </div>
              <div className="px-8 py-8 space-y-6">
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
                  <p className="text-sm text-green-800 flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Profitez de -10% sur votre première commande !
                  </p>
                </div>

                <p className="text-center text-gray-600">
                  Redirection vers la connexion dans quelques secondes...
                </p>

                <Button
                  asChild
                  className="w-full h-12 rounded-xl bg-turquoise-600 hover:bg-turquoise-700"
                >
                  <Link href="/login?verified=true">
                    Se connecter maintenant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </>
          )}

          {/* Expired State */}
          {state === 'expired' && (
            <>
              <div className="bg-orange-600 px-8 py-10 text-center text-white">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mx-auto">
                  <Clock className="h-10 w-10 text-white" />
                </div>
                <h1 className="mt-6 text-3xl font-bold">Lien expiré</h1>
                <p className="mt-2 text-amber-100">Ce lien n'est plus valide</p>
              </div>
              <div className="px-8 py-8 space-y-6">
                <p className="text-center text-gray-600">{message}</p>

                {resendSuccess && (
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Email renvoyé avec succès !
                    </p>
                  </div>
                )}

                {resendError && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800">{resendError}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handleResendVerification}
                    disabled={resending}
                    variant="outline"
                    className="w-full h-12 rounded-xl border-gray-200"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi...
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
                    className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600"
                  >
                    <Link href="/register">
                      Retour à l'inscription
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Invalid State */}
          {state === 'invalid' && (
            <>
              <div className="bg-red-600 px-8 py-10 text-center text-white">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mx-auto">
                  <XCircle className="h-10 w-10 text-white" />
                </div>
                <h1 className="mt-6 text-3xl font-bold">Lien invalide</h1>
                <p className="mt-2 text-red-100">Ce lien ne fonctionne pas</p>
              </div>
              <div className="px-8 py-8 space-y-6">
                <p className="text-center text-gray-600">{message}</p>

                <Button
                  asChild
                  className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600"
                >
                  <Link href="/register">
                    Créer un nouveau compte
                  </Link>
                </Button>

                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="text-sm font-medium text-turquoise-600 hover:text-turquoise-700"
                  >
                    J'ai déjà un compte
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Error State */}
          {state === 'error' && (
            <>
              <div className="bg-red-600 px-8 py-10 text-center text-white">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mx-auto">
                  <XCircle className="h-10 w-10 text-white" />
                </div>
                <h1 className="mt-6 text-3xl font-bold">Erreur</h1>
                <p className="mt-2 text-red-100">La vérification a échoué</p>
              </div>
              <div className="px-8 py-8 space-y-6">
                <p className="text-center text-gray-600">{message}</p>

                <div className="space-y-3">
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full h-12 rounded-xl bg-turquoise-600 hover:bg-turquoise-700"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Réessayer
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full h-12 rounded-xl border-gray-200"
                  >
                    <Link href="/register">
                      Retour à l'inscription
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Help link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Besoin d'aide ?{' '}
            <Link href="/aide" className="font-medium text-turquoise-600 hover:text-turquoise-700">
              Contactez le support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

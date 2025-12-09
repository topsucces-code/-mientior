'use client'

import * as React from 'react'
import { Mail, Gift, ArrowRight, Check, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface NewsletterEnhancedProps {
  title?: string
  description?: string
}

export default function NewsletterEnhanced({
  title = 'Restez Connecté',
  description = 'Inscrivez-vous à notre newsletter et recevez nos dernières offres',
}: NewsletterEnhancedProps) {
  const [email, setEmail] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSubscribed, setIsSubscribed] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsLoading(false)
    setIsSubscribed(true)
    toast.success('Inscription réussie !', {
      description: 'Vous recevrez bientôt nos meilleures offres.',
    })
  }

  return (
    <section className="py-8 sm:py-10 md:py-12 lg:py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-lg grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
          {/* Left - Newsletter */}
          <div>
            {/* Icon */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-turquoise-500 to-turquoise-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 md:mb-6 shadow-lg shadow-turquoise-500/30">
              <Mail className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-800 mb-2 sm:mb-3 md:mb-4">
              {title}
            </h2>

            {/* Description */}
            <p className="text-gray-500 text-sm sm:text-base md:text-lg mb-4 sm:mb-5 md:mb-6">
              {description}
            </p>

            {/* Benefits */}
            <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6 md:mb-8 p-3 sm:p-4 bg-orange-50 rounded-lg sm:rounded-xl border border-orange-100">
              <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 flex-shrink-0" />
              <span className="text-orange-700 text-sm sm:text-base font-semibold">
                -10% sur votre première commande
              </span>
            </div>

            {/* Form */}
            {!isSubscribed ? (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:border-turquoise-500 focus:ring-4 focus:ring-turquoise-500/10 transition-all"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={cn(
                      "px-5 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm sm:text-base font-bold rounded-lg sm:rounded-xl",
                      "shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40",
                      "hover:-translate-y-0.5 transition-all duration-300",
                      "disabled:opacity-70 disabled:cursor-not-allowed",
                      "flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto"
                    )}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        S'inscrire
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-gray-400">
                  Vos données sont protégées. Consultez notre{' '}
                  <a href="/privacy" className="text-turquoise-600 hover:underline">
                    politique de confidentialité
                  </a>
                  .
                </p>
              </form>
            ) : (
              <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6 bg-emerald-50 rounded-lg sm:rounded-xl border border-emerald-100">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-emerald-700 text-sm sm:text-base">Merci pour votre inscription !</p>
                  <p className="text-xs sm:text-sm text-emerald-600">Vérifiez votre boîte mail pour confirmer.</p>
                </div>
              </div>
            )}
          </div>

          {/* Right - App Download */}
          <div className="text-center lg:text-left">
            {/* Phone Mockup */}
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mx-auto lg:mx-0 mb-6 sm:mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-turquoise-500 to-orange-500 rounded-2xl sm:rounded-3xl rotate-6 opacity-20" />
              <div className="absolute inset-0 bg-white rounded-2xl sm:rounded-3xl shadow-xl flex items-center justify-center border-3 sm:border-4 border-turquoise-500">
                <Smartphone className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-turquoise-500" />
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto lg:mx-0 mb-4 sm:mb-6 p-3 sm:p-4 bg-white border-3 sm:border-4 border-turquoise-500 rounded-xl sm:rounded-2xl">
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-md sm:rounded-lg flex items-center justify-center">
                <span className="text-[10px] sm:text-xs text-gray-500 text-center">Scanner pour télécharger</span>
              </div>
            </div>

            {/* App Store Badges */}
            <div className="flex justify-center lg:justify-start gap-2 sm:gap-3 md:gap-4">
              <a 
                href="#" 
                className="h-10 sm:h-11 md:h-12 px-3 sm:px-4 bg-black text-white rounded-md sm:rounded-lg flex items-center gap-1.5 sm:gap-2 hover:-translate-y-1 transition-transform"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <div className="text-[8px] sm:text-[10px] opacity-80">Télécharger sur</div>
                  <div className="text-xs sm:text-sm font-semibold">App Store</div>
                </div>
              </a>
              <a 
                href="#" 
                className="h-10 sm:h-11 md:h-12 px-3 sm:px-4 bg-black text-white rounded-md sm:rounded-lg flex items-center gap-1.5 sm:gap-2 hover:-translate-y-1 transition-transform"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <div className="text-left">
                  <div className="text-[8px] sm:text-[10px] opacity-80">Télécharger sur</div>
                  <div className="text-xs sm:text-sm font-semibold">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

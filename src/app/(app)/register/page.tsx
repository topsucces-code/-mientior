import { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth/auth-form'
import { Gift, Truck, Shield, CreditCard, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Créer un compte | Mientior',
  description: 'Rejoignez Mientior et profitez de -10% sur votre première commande. Livraison rapide en Afrique.',
}

const benefits = [
  { icon: Gift, title: '-10% sur votre 1ère commande', description: 'Code envoyé par email' },
  { icon: Truck, title: 'Livraison rapide', description: 'Partout en Afrique' },
  { icon: Shield, title: 'Paiement sécurisé', description: 'Mobile Money & Cartes' },
  { icon: CreditCard, title: 'Paiement flexible', description: 'Payez en plusieurs fois' },
]

const steps = [
  'Créez votre compte en 30 secondes',
  'Recevez votre code promo -10%',
  'Commencez à shopper !',
]

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-orange-50 via-white to-turquoise-50">
      <div className="container flex flex-col lg:flex-row items-center justify-center gap-12 py-12 lg:py-16">
        {/* Left side - Benefits */}
        <div className="hidden lg:flex flex-col max-w-md">
          <Link href="/" className="mb-8">
            <h1 className="text-4xl font-bold">
              <span className="text-turquoise-600">Mientior</span>
            </h1>
            <p className="text-gray-500 mt-1">La marketplace africaine</p>
          </Link>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Rejoignez +2 millions de clients satisfaits
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Créez votre compte gratuitement et profitez d'avantages exclusifs.
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="p-4 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 mb-3">
                  <benefit.icon className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                <p className="text-sm text-gray-500">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* Steps */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-turquoise-500 to-turquoise-600 text-white">
            <h3 className="font-bold text-lg mb-4">C'est simple et rapide :</h3>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                    {index + 1}
                  </div>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Vos données sont protégées et ne seront jamais partagées</span>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full max-w-md">
          <AuthForm mode="register" redirectTo={params.redirectTo} />
        </div>
      </div>
    </div>
  )
}

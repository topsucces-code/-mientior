import { Metadata } from 'next'
import Link from 'next/link'
import { AuthForm } from '@/components/auth/auth-form'
import { ShoppingBag, Star, Users, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Connexion | Mientior',
  description: 'Connectez-vous à votre compte Mientior pour accéder à vos commandes et profiter de nos offres exclusives',
}

const features = [
  { icon: ShoppingBag, text: '+50,000 produits' },
  { icon: Star, text: '4.8/5 satisfaction' },
  { icon: Users, text: '+2M clients' },
  { icon: Sparkles, text: 'Offres exclusives' },
]

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-turquoise-50 via-white to-orange-50">
      <div className="container flex flex-col lg:flex-row items-center justify-center gap-12 py-12 lg:py-20">
        {/* Left side - Branding */}
        <div className="hidden lg:flex flex-col max-w-md">
          <Link href="/" className="mb-8">
            <h1 className="text-4xl font-bold">
              <span className="text-turquoise-600">Mientior</span>
            </h1>
            <p className="text-gray-500 mt-1">La marketplace africaine</p>
          </Link>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Bienvenue sur votre marketplace préférée
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Connectez-vous pour retrouver vos commandes, votre wishlist et profiter d'offres personnalisées.
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 rounded-xl bg-white shadow-sm border border-gray-100"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-turquoise-100">
                  <feature.icon className="h-5 w-5 text-turquoise-600" />
                </div>
                <span className="font-medium text-gray-700">{feature.text}</span>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div className="mt-8 p-6 rounded-2xl bg-white shadow-lg border border-gray-100">
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-gray-600 italic mb-4">
              "Mientior a changé ma façon de faire du shopping. Livraison rapide et produits de qualité !"
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-turquoise-400 to-turquoise-600 flex items-center justify-center text-white font-bold">
                F
              </div>
              <div>
                <p className="font-medium text-gray-900">Fatou S.</p>
                <p className="text-sm text-gray-500">Dakar, Sénégal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="w-full max-w-md">
          <AuthForm mode="login" redirectTo={params.redirectTo} />
        </div>
      </div>
    </div>
  )
}

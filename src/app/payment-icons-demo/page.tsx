'use client'

import { PaymentIconsDisplay } from '@/components/ui/payment-icons-display'

export default function PaymentIconsDemo() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Méthodes de Paiement Acceptées
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Mobile Money Africain
          </h2>
          <PaymentIconsDisplay 
            methods={['orange-money', 'mtn-momo', 'm-pesa', 'wave', 'moov-money']}
            iconSize={48}
            showLabels={true}
            className="mb-8"
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Cartes Bancaires Internationales
          </h2>
          <PaymentIconsDisplay 
            methods={['visa', 'mastercard']}
            iconSize={48}
            showLabels={true}
            className="mb-8"
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Autres Méthodes
          </h2>
          <PaymentIconsDisplay 
            methods={['paypal', 'cash-on-delivery']}
            iconSize={48}
            showLabels={true}
            className="mb-8"
          />
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Tous les Logos (sans labels)
          </h2>
          <PaymentIconsDisplay 
            iconSize={40}
            className="justify-center"
          />
        </div>
      </div>
    </div>
  )
}

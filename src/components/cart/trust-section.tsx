'use client'

import { Truck, RotateCcw, CreditCard, Headphones } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { CART_CONFIG } from '@/lib/constants'
import { formatCurrency } from '@/lib/currency'

interface TrustFeature {
  icon: React.ElementType
  title: string
  description: string
  color: string
}

const trustFeatures: TrustFeature[] = [
  {
    icon: Truck,
    title: 'Livraison gratuite',
    description: `Sur toutes les commandes de plus de ${formatCurrency(CART_CONFIG.freeShippingThreshold)}`,
    color: 'text-orange-600 bg-orange-100'
  },
  {
    icon: RotateCcw,
    title: 'Retours gratuits',
    description: 'Retours sous 30 jours sans frais',
    color: 'text-blue-600 bg-blue-100'
  },
  {
    icon: CreditCard,
    title: 'Paiement sécurisé',
    description: 'Cryptage SSL pour vos transactions',
    color: 'text-green-600 bg-green-100'
  },
  {
    icon: Headphones,
    title: 'Support 24/7',
    description: 'Assistance disponible à tout moment',
    color: 'text-purple-600 bg-purple-100'
  }
]

interface TrustSectionProps {
  className?: string
}

export function TrustSection({ className }: TrustSectionProps) {
  return (
    <div className={cn('rounded-lg bg-gradient-to-br from-platinum-50 to-white p-6', className)}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trustFeatures.map((feature) => (
          <Card
            key={feature.title}
            className="p-4 text-center hover:shadow-elevation-2 transition-all hover:-translate-y-1 duration-300 cursor-default"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', feature.color)}>
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-sm text-anthracite-700">
                {feature.title}
              </h3>
              <p className="text-xs text-nuanced-500">
                {feature.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

'use client'

import { Truck, Zap, Clock, MapPin } from 'lucide-react'

const deliveryOptions = [
  {
    id: 'standard',
    name: 'Livraison Standard',
    description: 'Livraison à domicile ou en point relais',
    icon: Truck,
    duration: '3-5 jours ouvrés',
    price: 4.9,
    freeThreshold: 50,
    features: [
      'Suivi de colis',
      'Livraison en point relais disponible',
      'Assurance incluse',
    ],
    color: 'blue',
  },
  {
    id: 'express',
    name: 'Livraison Express',
    description: 'Livraison rapide garantie',
    icon: Zap,
    duration: '1-2 jours ouvrés',
    price: 9.9,
    freeThreshold: null,
    features: [
      'Livraison prioritaire',
      'Suivi en temps réel',
      'Garantie de livraison',
    ],
    color: 'orange',
  },
  {
    id: 'same-day',
    name: 'Livraison Jour Même',
    description: 'Disponible dans certaines villes',
    icon: Clock,
    duration: 'Aujourd\'hui',
    price: 14.9,
    freeThreshold: null,
    features: [
      'Commande avant 14h',
      'Paris, Lyon, Marseille',
      'Créneau horaire au choix',
    ],
    color: 'purple',
  },
  {
    id: 'pickup',
    name: 'Click & Collect',
    description: 'Retrait en magasin gratuit',
    icon: MapPin,
    duration: '2-3 heures',
    price: 0,
    freeThreshold: null,
    features: [
      'Retrait gratuit',
      'Disponible sous 2-3h',
      'Plus de 50 magasins',
    ],
    color: 'green',
  },
]

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    badge: 'bg-blue-600',
    text: 'text-blue-600',
  },
  orange: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    icon: 'bg-orange-100 text-orange-600',
    badge: 'bg-orange-600',
    text: 'text-orange-600',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: 'bg-purple-100 text-purple-600',
    badge: 'bg-purple-600',
    text: 'text-purple-600',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'bg-green-100 text-green-600',
    badge: 'bg-green-600',
    text: 'text-green-600',
  },
}

export function DeliveryOptions() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {deliveryOptions.map((option) => {
        const Icon = option.icon
        const colors = colorClasses[option.color as keyof typeof colorClasses]

        return (
          <div
            key={option.id}
            className={`relative bg-white rounded-xl p-6 border-2 ${colors.border} hover:shadow-xl transition-all duration-300 group`}
          >
            {/* Free badge */}
            {option.price === 0 && (
              <div className="absolute -top-3 -right-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                GRATUIT
              </div>
            )}

            {/* Icon */}
            <div
              className={`w-16 h-16 ${colors.icon} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
            >
              <Icon className="w-8 h-8" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">{option.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{option.description}</p>

            {/* Duration */}
            <div className={`inline-flex items-center gap-2 ${colors.bg} px-3 py-1.5 rounded-full mb-4`}>
              <Clock className={`w-4 h-4 ${colors.text}`} />
              <span className={`text-sm font-semibold ${colors.text}`}>{option.duration}</span>
            </div>

            {/* Price */}
            <div className="mb-4">
              {option.price === 0 ? (
                <div className="text-2xl font-bold text-green-600">Gratuit</div>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-gray-900">{option.price.toFixed(2)}€</div>
                  {option.freeThreshold && (
                    <div className="text-xs text-gray-500 mt-1">
                      Gratuit dès {option.freeThreshold}€
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Features */}
            <ul className="space-y-2">
              {option.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <div className={`w-1.5 h-1.5 rounded-full ${colors.badge} mt-1.5 flex-shrink-0`} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

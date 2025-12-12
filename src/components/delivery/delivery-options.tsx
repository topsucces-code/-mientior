'use client'

import { useState } from 'react'
import { Truck, Zap, Clock, MapPin, Check, Package, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DeliveryOption {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  duration: string
  price: number
  freeThreshold: number | null
  features: string[]
  color: 'blue' | 'orange' | 'purple' | 'green'
}

const deliveryOptions: DeliveryOption[] = [
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
    duration: "Aujourd'hui",
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
    bgSelected: 'bg-blue-100',
    border: 'border-blue-200',
    borderSelected: 'border-blue-500 ring-2 ring-blue-200',
    icon: 'bg-blue-100 text-blue-600',
    iconSelected: 'bg-blue-600 text-white',
    badge: 'bg-blue-600',
    text: 'text-blue-600',
  },
  orange: {
    bg: 'bg-orange-50',
    bgSelected: 'bg-orange-100',
    border: 'border-orange-200',
    borderSelected: 'border-orange-500 ring-2 ring-orange-200',
    icon: 'bg-orange-100 text-orange-600',
    iconSelected: 'bg-orange-600 text-white',
    badge: 'bg-orange-600',
    text: 'text-orange-600',
  },
  purple: {
    bg: 'bg-purple-50',
    bgSelected: 'bg-purple-100',
    border: 'border-purple-200',
    borderSelected: 'border-purple-500 ring-2 ring-purple-200',
    icon: 'bg-purple-100 text-purple-600',
    iconSelected: 'bg-purple-600 text-white',
    badge: 'bg-purple-600',
    text: 'text-purple-600',
  },
  green: {
    bg: 'bg-green-50',
    bgSelected: 'bg-green-100',
    border: 'border-green-200',
    borderSelected: 'border-green-500 ring-2 ring-green-200',
    icon: 'bg-green-100 text-green-600',
    iconSelected: 'bg-green-600 text-white',
    badge: 'bg-green-600',
    text: 'text-green-600',
  },
}

interface DeliveryOptionsProps {
  selectedOption?: string
  onSelect?: (option: DeliveryOption) => void
  cartTotal?: number
  showFullCards?: boolean
}

export function DeliveryOptions({ 
  selectedOption = 'standard', 
  onSelect,
  cartTotal = 0,
  showFullCards = true
}: DeliveryOptionsProps) {
  const [selected, setSelected] = useState(selectedOption)

  const handleSelect = (option: DeliveryOption) => {
    setSelected(option.id)
    onSelect?.(option)
  }

  const getShippingPrice = (option: DeliveryOption) => {
    if (option.price === 0) return 0
    if (option.freeThreshold && cartTotal >= option.freeThreshold) return 0
    return option.price
  }

  if (!showFullCards) {
    // Compact mode for checkout
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-500" />
          Mode de livraison
        </h3>
        <div className="space-y-2">
          {deliveryOptions.map((option) => {
            const Icon = option.icon
            const colors = colorClasses[option.color]
            const isSelected = selected === option.id
            const actualPrice = getShippingPrice(option)
            const isFree = actualPrice === 0

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200',
                  isSelected 
                    ? `${colors.bgSelected} ${colors.borderSelected}` 
                    : `bg-white ${colors.border} hover:${colors.bg}`
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0',
                    isSelected ? colors.iconSelected : colors.icon
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{option.name}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-sm text-gray-500">{option.duration}</span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">{option.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isFree ? (
                    <span className="text-green-600 font-bold">Gratuit</span>
                  ) : (
                    <span className="font-bold text-gray-900">{actualPrice.toFixed(2)}€</span>
                  )}
                  <div className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                    isSelected 
                      ? `${colors.badge} border-transparent` 
                      : 'border-gray-300 bg-white'
                  )}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        
        {/* Selected option summary */}
        {selected && (
          <div className={cn(
            'p-4 rounded-xl border',
            colorClasses[deliveryOptions.find(o => o.id === selected)?.color || 'blue'].bg,
            colorClasses[deliveryOptions.find(o => o.id === selected)?.color || 'blue'].border
          )}>
            <p className="text-sm text-gray-600">
              <strong>Livraison estimée:</strong>{' '}
              {deliveryOptions.find(o => o.id === selected)?.duration}
            </p>
          </div>
        )}
      </div>
    )
  }

  // Full cards mode (for delivery info page)
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">Choisissez votre mode de livraison</h3>
        {cartTotal > 0 && (
          <span className="text-sm text-gray-500">Panier: {cartTotal.toFixed(2)}€</span>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {deliveryOptions.map((option) => {
          const Icon = option.icon
          const colors = colorClasses[option.color]
          const isSelected = selected === option.id
          const actualPrice = getShippingPrice(option)
          const isFree = actualPrice === 0

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option)}
              className={cn(
                'relative text-left bg-white rounded-xl p-6 border-2 transition-all duration-300 group',
                isSelected 
                  ? `${colors.borderSelected} shadow-xl` 
                  : `${colors.border} hover:shadow-xl`
              )}
            >
              {/* Selection indicator */}
              <div className={cn(
                'absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
                isSelected 
                  ? `${colors.badge} border-transparent` 
                  : 'border-gray-300 bg-white group-hover:border-gray-400'
              )}>
                {isSelected && <Check className="w-4 h-4 text-white" />}
              </div>

              {/* Free badge */}
              {isFree && (
                <div className="absolute -top-3 -left-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  GRATUIT
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-all',
                  isSelected ? colors.iconSelected : colors.icon
                )}
              >
                <Icon className="w-8 h-8" />
              </div>

              {/* Title */}
              <h4 className="text-xl font-bold text-gray-900 mb-2">{option.name}</h4>
              <p className="text-sm text-gray-600 mb-4">{option.description}</p>

              {/* Duration */}
              <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4', colors.bg)}>
                <Clock className={cn('w-4 h-4', colors.text)} />
                <span className={cn('text-sm font-semibold', colors.text)}>{option.duration}</span>
              </div>

              {/* Price */}
              <div className="mb-4">
                {isFree ? (
                  <div className="text-2xl font-bold text-green-600">Gratuit</div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{actualPrice.toFixed(2)}€</div>
                    {option.freeThreshold && cartTotal < option.freeThreshold && (
                      <div className="text-xs text-gray-500 mt-1">
                        Gratuit dès {option.freeThreshold}€ • Plus que {(option.freeThreshold - cartTotal).toFixed(2)}€
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {option.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                    <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', colors.badge)} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Select arrow */}
              <div className={cn(
                'absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity',
                isSelected && 'opacity-100'
              )}>
                <ChevronRight className={cn('w-5 h-5', colors.text)} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Export delivery options for use elsewhere
export { deliveryOptions }

'use client'

import { useState } from 'react'
import { Truck, Zap, Clock, MapPin, Check, Package, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/hooks/use-currency'

export interface DeliveryOption {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  duration: string
  price: number // Prix en centimes EUR
  freeThreshold: number | null // Seuil en centimes EUR
  features: string[]
  color: 'blue' | 'orange' | 'purple' | 'green'
}

function getDeliveryOptions(t: ReturnType<typeof useTranslations>): DeliveryOption[] {
  // Prix en centimes EUR (seront convertis à l'affichage)
  return [
    {
      id: 'standard',
      name: t('options.standard.name'),
      description: t('options.standard.description'),
      icon: Truck,
      duration: t('options.standard.duration'),
      price: 250, // 2.50€ = ~1500 FCFA
      freeThreshold: 4000, // 40€ = ~25 000 FCFA
      features: [
        t('options.standard.features.tracking'),
        t('options.standard.features.relay'),
        t('options.standard.features.insurance'),
      ],
      color: 'blue',
    },
    {
      id: 'express',
      name: t('options.express.name'),
      description: t('options.express.description'),
      icon: Zap,
      duration: t('options.express.duration'),
      price: 600, // 6€ = ~3500 FCFA
      freeThreshold: null,
      features: [
        t('options.express.features.priority'),
        t('options.express.features.realtimeTracking'),
        t('options.express.features.guarantee'),
      ],
      color: 'orange',
    },
    {
      id: 'same-day',
      name: t('options.sameDay.name'),
      description: t('options.sameDay.description'),
      icon: Clock,
      duration: t('options.sameDay.duration'),
      price: 850, // 8.50€ = ~5000 FCFA
      freeThreshold: null,
      features: [
        t('options.sameDay.features.cutoff'),
        t('options.sameDay.features.cities'),
        t('options.sameDay.features.slot'),
      ],
      color: 'purple',
    },
    {
      id: 'pickup',
      name: t('options.pickup.name'),
      description: t('options.pickup.description'),
      icon: MapPin,
      duration: t('options.pickup.duration'),
      price: 0,
      freeThreshold: null,
      features: [
        t('options.pickup.features.freePickup'),
        t('options.pickup.features.ready'),
        t('options.pickup.features.stores'),
      ],
      color: 'green',
    },
  ]
}

const colorClasses = {
  blue: {
    bg: 'bg-turquoise-50',
    bgSelected: 'bg-turquoise-100',
    border: 'border-turquoise-200',
    borderSelected: 'border-turquoise-500 ring-2 ring-turquoise-200',
    icon: 'bg-turquoise-100 text-turquoise-600',
    iconSelected: 'bg-turquoise-600 text-white',
    badge: 'bg-turquoise-600',
    text: 'text-turquoise-600',
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
    bg: 'bg-turquoise-50',
    bgSelected: 'bg-turquoise-100',
    border: 'border-turquoise-200',
    borderSelected: 'border-turquoise-500 ring-2 ring-turquoise-200',
    icon: 'bg-turquoise-100 text-turquoise-600',
    iconSelected: 'bg-turquoise-600 text-white',
    badge: 'bg-turquoise-600',
    text: 'text-turquoise-600',
  },
  green: {
    bg: 'bg-turquoise-50',
    bgSelected: 'bg-turquoise-100',
    border: 'border-turquoise-200',
    borderSelected: 'border-turquoise-500 ring-2 ring-turquoise-200',
    icon: 'bg-turquoise-100 text-turquoise-600',
    iconSelected: 'bg-turquoise-600 text-white',
    badge: 'bg-turquoise-600',
    text: 'text-turquoise-600',
  },
}

interface DeliveryOptionsProps {
  selectedOption?: string
  onSelect?: (option: DeliveryOption) => void
  cartTotal?: number
  showFullCards?: boolean
  visibleOptionIds?: string[]
  showHeader?: boolean
}

export function DeliveryOptions({ 
  selectedOption = 'standard', 
  onSelect,
  cartTotal = 0,
  showFullCards = true,
  visibleOptionIds,
  showHeader = true
}: DeliveryOptionsProps) {
  const t = useTranslations('products.pdp.deliveryOptions')
  const { formatPrice } = useCurrency()
  const deliveryOptions = getDeliveryOptions(t)
  const visibleOptions = visibleOptionIds?.length
    ? deliveryOptions.filter((o) => visibleOptionIds.includes(o.id))
    : deliveryOptions
  const [selected, setSelected] = useState(selectedOption)

  const handleSelect = (option: DeliveryOption) => {
    setSelected(option.id)
    onSelect?.(option)
  }

  // cartTotal est en centimes EUR, option.price aussi
  const getShippingPrice = (option: DeliveryOption) => {
    if (option.price === 0) return 0
    if (option.freeThreshold && cartTotal >= option.freeThreshold) return 0
    return option.price
  }

  if (!showFullCards) {
    // Compact mode for checkout
    return (
      <div className="space-y-3">
        {showHeader && (
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-500" />
            {t('modeTitle')}
          </h3>
        )}
        <div className="space-y-2">
          {visibleOptions.map((option) => {
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
                    <span className="text-green-600 font-bold">{t('free')}</span>
                  ) : (
                    <span className="font-bold text-gray-900">{formatPrice(actualPrice)}</span>
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
              <strong>{t('estimatedDeliveryLabel')}</strong>{' '}
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
        <h3 className="text-xl font-bold text-gray-900">{t('chooseTitle')}</h3>
        {cartTotal > 0 && (
          <span className="text-sm text-gray-500">{t('cartTotal', { total: cartTotal.toFixed(2) })}</span>
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
                <div className="absolute -top-3 -left-3 bg-turquoise-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
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
                  <div className="text-2xl font-bold text-green-600">{t('free')}</div>
                ) : (
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{formatPrice(actualPrice)}</div>
                    {option.freeThreshold && cartTotal < option.freeThreshold && (
                      <div className="text-xs text-gray-500 mt-1">
                        {t('freeFromAndRemaining', {
                          threshold: formatPrice(option.freeThreshold),
                          remaining: formatPrice(option.freeThreshold - cartTotal)
                        })}
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


'use client'

import { Truck, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FreeShippingProgressProps {
  currentTotal: number
  threshold: number
  className?: string
}

export function FreeShippingProgress({ currentTotal, threshold, className }: FreeShippingProgressProps) {
  const percentage = Math.min((currentTotal / threshold) * 100, 100)
  const remaining = Math.max(threshold - currentTotal, 0)
  const unlocked = currentTotal >= threshold

  // Format cents to dollars
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  return (
    <div
      className={cn(
        'rounded-lg p-6 shadow-elevation-2 transition-all duration-300',
        unlocked ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gradient-to-r from-orange-50 to-amber-50',
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {unlocked ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Check className="h-5 w-5 text-green-600" />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Truck className="h-5 w-5 text-orange-600" />
            </div>
          )}
          <div>
            {unlocked ? (
              <p className="text-sm font-semibold text-green-700">Livraison gratuite débloquée !</p>
            ) : (
              <p className="text-sm font-semibold text-gray-900">
                Plus que {formatPrice(remaining)} pour la livraison gratuite
              </p>
            )}
          </div>
        </div>
        <span className="text-xs font-medium text-gray-600">{Math.round(percentage)}%</span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            unlocked
              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
              : 'bg-gradient-to-r from-orange-500 to-orange-600 animate-shimmer'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {!unlocked && (
        <p className="mt-2 text-xs text-gray-600">
          Ajoutez {formatPrice(remaining)} de plus pour profiter de la livraison gratuite
        </p>
      )}
    </div>
  )
}

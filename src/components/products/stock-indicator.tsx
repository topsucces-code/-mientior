'use client'

/**
 * Real-time stock indicator component
 * Requirements: 8.1, 8.3, 8.4
 */

import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StockIndicatorProps {
  productId: string
  variantId?: string
  stock: number
  className?: string
}

export function StockIndicator({
  productId: _productId,
  variantId: _variantId,
  stock,
  className,
}: StockIndicatorProps) {
  // Requirement 8.3: Handle out of stock state
  if (stock === 0) {
    return (
      <div className={cn('flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg', className)}>
        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-900">Rupture de stock</p>
          <p className="text-xs text-red-700">Ce produit n'est actuellement pas disponible</p>
        </div>
      </div>
    )
  }

  // Requirement 8.1: Display stock quantity if below threshold of 10 units
  if (stock >= 10) {
    return null
  }

  // Requirement 8.4: Low stock warning (< 5 units)
  const isLowStock = stock < 5
  const percentage = Math.min((stock / 10) * 100, 100)

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        {isLowStock ? (
          <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
        ) : (
          <CheckCircle className="h-5 w-5 text-turquoise-600 flex-shrink-0" />
        )}
        <div className="flex-1">
          <p
            className={cn(
              'text-sm font-semibold',
              isLowStock ? 'text-orange-900' : 'text-turquoise-900'
            )}
          >
            {isLowStock
              ? `Plus que ${stock} en stock - Dépêchez-vous !`
              : `${stock} en stock`}
          </p>
          {isLowStock && (
            <p className="text-xs text-orange-700">Stock limité, commandez rapidement</p>
          )}
        </div>
      </div>
      
      {/* Visual stock level indicator */}
      <div className="h-2 w-full bg-platinum-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 rounded-full',
            isLowStock
              ? 'bg-orange-600'
              : 'bg-turquoise-600'
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={stock}
          aria-valuemin={0}
          aria-valuemax={10}
          aria-label={`Stock disponible: ${stock} unités`}
        />
      </div>
    </div>
  )
}

'use client'

/**
 * DeliveryEstimator Component
 * Displays estimated delivery dates for products with multiple shipping options
 * Handles location-based estimates and backorder scenarios
 */

import { useState, useEffect, useMemo } from 'react'
import { Truck, MapPin, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import type { ShippingOption, DeliveryEstimate, Location } from '@/types/delivery'
import {
  calculateDeliveryEstimates,
  calculateBackorderDelivery,
  formatDeliveryRange,
  calculateLocationBasedEstimates,
  getDeliveryCacheKey,
} from '@/lib/delivery-calculation'
import { useGeolocation } from '@/hooks/use-geolocation'
import { cn } from '@/lib/utils'

interface DeliveryEstimatorProps {
  productId: string
  variantId?: string
  processingDays: number
  shippingOptions: ShippingOption[]
  userLocation?: Location
  isBackordered?: boolean
  restockDate?: Date
  className?: string
}

export function DeliveryEstimator({
  productId,
  variantId,
  processingDays,
  shippingOptions,
  userLocation: providedLocation,
  isBackordered = false,
  restockDate,
  className,
}: DeliveryEstimatorProps) {
  const [estimates, setEstimates] = useState<DeliveryEstimate[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Detect user location if not provided
  const { data: detectedLocation } = useGeolocation()
  
  // Use provided location or detected location
  const userLocation = useMemo(() => {
    if (providedLocation) return providedLocation
    if (detectedLocation) {
      return {
        country: detectedLocation.country,
        region: detectedLocation.region || undefined,
        city: detectedLocation.city || undefined,
      }
    }
    return undefined
  }, [providedLocation, detectedLocation])

  // Cache key for delivery estimates
  const cacheKey = useMemo(
    () => getDeliveryCacheKey(productId, variantId, userLocation),
    [productId, variantId, userLocation]
  )

  useEffect(() => {
    calculateEstimates()
  }, [processingDays, shippingOptions, isBackordered, restockDate, userLocation])

  const calculateEstimates = () => {
    setIsLoading(true)
    
    try {
      // Check cache first
      const cached = sessionStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached)
          // Validate cache is recent (within 5 minutes)
          if (Date.now() - parsedCache.timestamp < 5 * 60 * 1000) {
            setEstimates(
              parsedCache.estimates.map((est: any) => ({
                ...est,
                minDate: new Date(est.minDate),
                maxDate: new Date(est.maxDate),
              }))
            )
            if (shippingOptions.length > 0 && !selectedOption) {
              setSelectedOption(shippingOptions[0].id)
            }
            setIsLoading(false)
            return
          }
        } catch {
          // Invalid cache, continue with calculation
        }
      }

      const currentDate = new Date()

      if (isBackordered && restockDate) {
        // Calculate backorder delivery for each shipping option
        const backorderEstimates = shippingOptions.map((option) => {
          return calculateBackorderDelivery(
            restockDate,
            processingDays,
            option.estimatedDays
          )
        })
        const newEstimates = backorderEstimates.map((est, idx) => ({
          ...est,
          shippingOption: shippingOptions[idx],
        }))
        setEstimates(newEstimates)
        
        // Cache the results
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ estimates: newEstimates, timestamp: Date.now() })
        )
      } else {
        // Calculate location-based delivery estimates
        const newEstimates = calculateLocationBasedEstimates(
          currentDate,
          processingDays,
          shippingOptions,
          userLocation
        )
        setEstimates(newEstimates)
        
        // Cache the results
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ estimates: newEstimates, timestamp: Date.now() })
        )
      }

      // Select first option by default
      if (shippingOptions.length > 0 && !selectedOption) {
        setSelectedOption(shippingOptions[0].id)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const selectedEstimate = estimates.find(
    (est) => est.shippingOption.id === selectedOption
  )

  if (isLoading || estimates.length === 0) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Truck className="h-4 w-4" />
          <span>Calculating delivery...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Location indicator */}
      {userLocation && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            Delivering to{' '}
            {userLocation.city || userLocation.region || userLocation.country || 'France'}
          </span>
        </div>
      )}

      {/* Backorder warning */}
      {isBackordered && restockDate && (
        <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm">
          <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
          <div>
            <p className="font-medium text-orange-900">Item on backorder</p>
            <p className="text-orange-700">
              Expected restock: {format(restockDate, 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      )}

      {/* Shipping options */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Shipping Method</label>
        <div className="space-y-2">
          {estimates.map((estimate) => {
            const option = estimate.shippingOption
            const isSelected = selectedOption === option.id

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedOption(option.id)}
                className={cn(
                  'w-full rounded-lg border p-3 text-left transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{option.name}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {option.description}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {formatDeliveryRange(estimate)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {option.price === 0 ? 'Free' : `€${option.price.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected estimate summary */}
      {selectedEstimate && (
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <div className="flex items-start gap-2">
            <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">Estimated Delivery</p>
              <p className="text-muted-foreground">
                {formatDeliveryRange(selectedEstimate)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Processing time: {processingDays} business day
                {processingDays !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

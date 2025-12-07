'use client'

import * as React from 'react'
import { toast } from 'sonner'

interface StockData {
  stock: number
  inStock: boolean
  lastUpdated: string
}

interface UseRealTimeStockOptions {
  productId: string
  variantId?: string
  pollingInterval?: number
  enabled?: boolean
}

/**
 * Hook to monitor real-time stock updates for a product
 *
 * @param productId - Product ID to monitor
 * @param variantId - Optional variant ID
 * @param pollingInterval - Polling interval in milliseconds (default: 30000ms / 30s)
 * @param enabled - Enable/disable polling (default: true)
 * @returns Current stock data
 */
export function useRealTimeStock({
  productId,
  variantId,
  pollingInterval = 30000,
  enabled = true,
}: UseRealTimeStockOptions) {
  const [stockData, setStockData] = React.useState<StockData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const previousStock = React.useRef<number | null>(null)

  const fetchStock = React.useCallback(async () => {
    try {
      const params = new URLSearchParams({ productId })
      if (variantId) {
        params.append('variantId', variantId)
      }

      const response = await fetch(`/api/products/stock?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch stock data')
      }

      const data: StockData = await response.json()

      // Check if stock changed
      if (previousStock.current !== null && data.stock !== previousStock.current) {
        if (data.stock === 0 && previousStock.current > 0) {
          // Product went out of stock
          toast.warning('Rupture de stock', {
            description: 'Ce produit n\'est plus disponible pour le moment.',
          })
        } else if (data.stock < previousStock.current && data.stock < 10) {
          // Stock running low
          toast.info('Stock limité', {
            description: `Plus que ${data.stock} unité${data.stock > 1 ? 's' : ''} en stock.`,
          })
        } else if (data.stock > 0 && previousStock.current === 0) {
          // Product back in stock
          toast.success('De retour en stock !', {
            description: 'Ce produit est à nouveau disponible.',
          })
        }
      }

      previousStock.current = data.stock
      setStockData(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to fetch stock:', err)
    } finally {
      setIsLoading(false)
    }
  }, [productId, variantId])

  React.useEffect(() => {
    if (!enabled) return

    // Initial fetch
    fetchStock()

    // Set up polling
    const intervalId = setInterval(fetchStock, pollingInterval)

    return () => {
      clearInterval(intervalId)
    }
  }, [enabled, fetchStock, pollingInterval])

  return {
    stock: stockData?.stock ?? null,
    inStock: stockData?.inStock ?? true,
    lastUpdated: stockData?.lastUpdated,
    isLoading,
    error,
    refetch: fetchStock,
  }
}

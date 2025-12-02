'use client'

/**
 * Real-time stock indicator with Pusher integration
 * Requirements: 8.2
 */

import { useEffect, useState, useRef } from 'react'
import { StockIndicator } from './stock-indicator'
import PusherClient from 'pusher-js'

interface RealTimeStockIndicatorProps {
  productId: string
  variantId?: string
  initialStock: number
  className?: string
}

interface StockUpdate {
  productId: string
  variantId?: string
  stock: number
  timestamp: number
}

export function RealTimeStockIndicator({
  productId,
  variantId,
  initialStock,
  className,
}: RealTimeStockIndicatorProps) {
  const [stock, setStock] = useState(initialStock)
  const [isConnected, setIsConnected] = useState(false)
  const pusherRef = useRef<PusherClient | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Initialize Pusher client
    const initPusher = () => {
      try {
        // Check if Pusher key is available
        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY
        const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

        if (!pusherKey || !pusherCluster || pusherKey === 'your_pusher_key' || pusherCluster === 'your_pusher_cluster') {
          console.warn('Pusher not configured or using placeholders, falling back to polling')
          startPolling()
          return
        }

        const pusher = new PusherClient(pusherKey, {
          cluster: pusherCluster,
        })

        pusherRef.current = pusher

        // Subscribe to product-specific channel
        const channelName = variantId
          ? `product-${productId}-variant-${variantId}`
          : `product-${productId}`

        const channel = pusher.subscribe(channelName)

        // Handle connection state
        pusher.connection.bind('connected', () => {
          setIsConnected(true)
          console.log('Pusher connected for stock updates')
        })

        pusher.connection.bind('disconnected', () => {
          setIsConnected(false)
          console.log('Pusher disconnected, falling back to polling')
          startPolling()
        })

        pusher.connection.bind('error', (err: Error) => {
          console.error('Pusher connection error:', err)
          setIsConnected(false)
          startPolling()
        })

        // Listen for stock updates
        channel.bind('stock-updated', (data: StockUpdate) => {
          // Verify the update is for this product/variant
          if (
            data.productId === productId &&
            (!variantId || data.variantId === variantId)
          ) {
            setStock(data.stock)
            console.log('Stock updated via Pusher:', data.stock)
          }
        })

        return () => {
          channel.unbind_all()
          pusher.unsubscribe(channelName)
          pusher.disconnect()
        }
      } catch (error) {
        console.error('Failed to initialize Pusher:', error)
        startPolling()
        return undefined
      }
    }

    // Fallback polling mechanism
    const startPolling = () => {
      // Clear any existing polling interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }

      // Poll every 30 seconds
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const endpoint = variantId
            ? `/api/products/${productId}/variants/${variantId}/stock`
            : `/api/products/${productId}/stock`

          const response = await fetch(endpoint)
          if (response.ok) {
            const data = await response.json()
            setStock(data.stock)
            console.log('Stock updated via polling:', data.stock)
          }
        } catch (error) {
          console.error('Failed to poll stock:', error)
        }
      }, 30000) // 30 seconds
    }

    // Initialize Pusher or start polling
    const cleanup = initPusher()

    return () => {
      if (cleanup) cleanup()
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [productId, variantId])

  return (
    <div className="relative">
      <StockIndicator
        productId={productId}
        variantId={variantId}
        stock={stock}
        className={className}
      />
      {/* Optional: Show connection status indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 text-xs text-gray-500">
          {isConnected ? '🟢 Live' : '🔴 Polling'}
        </div>
      )}
    </div>
  )
}

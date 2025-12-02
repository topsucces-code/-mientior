import { useEffect, useRef, useCallback } from 'react'
import Pusher from 'pusher-js'
import type { Customer360UpdateData } from '@/types/customer-360'

interface UseCustomer360RealtimeOptions {
  customerId: string
  onUpdate?: (update: Customer360UpdateData) => void
  onOrderUpdate?: (update: Customer360UpdateData) => void
  onLoyaltyUpdate?: (update: Customer360UpdateData) => void
  onSupportUpdate?: (update: Customer360UpdateData) => void
  onProfileUpdate?: (update: Customer360UpdateData) => void
  onNotesUpdate?: (update: Customer360UpdateData) => void
  onTagsUpdate?: (update: Customer360UpdateData) => void
}

/**
 * Hook for subscribing to Customer 360 real-time updates
 * 
 * This hook connects to Pusher and listens for customer-specific updates
 * that should be reflected in the Customer 360 dashboard.
 */
export function useCustomer360Realtime({
  customerId,
  onUpdate,
  onOrderUpdate,
  onLoyaltyUpdate,
  onSupportUpdate,
  onProfileUpdate,
  onNotesUpdate,
  onTagsUpdate,
}: UseCustomer360RealtimeOptions) {
  const pusherRef = useRef<Pusher | null>(null)
  const channelRef = useRef<any>(null)

  const handleUpdate = useCallback((update: Customer360UpdateData) => {
    // Call the general update handler
    onUpdate?.(update)

    // Call specific update handlers based on type
    switch (update.updateType) {
      case 'order':
        onOrderUpdate?.(update)
        break
      case 'loyalty':
        onLoyaltyUpdate?.(update)
        break
      case 'support':
        onSupportUpdate?.(update)
        break
      case 'profile':
        onProfileUpdate?.(update)
        break
      case 'notes':
        onNotesUpdate?.(update)
        break
      case 'tags':
        onTagsUpdate?.(update)
        break
    }
  }, [onUpdate, onOrderUpdate, onLoyaltyUpdate, onSupportUpdate, onProfileUpdate, onNotesUpdate, onTagsUpdate])

  useEffect(() => {
    if (!customerId) return

    // Initialize Pusher client
    if (!pusherRef.current) {
      const key = process.env.NEXT_PUBLIC_PUSHER_KEY
      const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER

      // Check if credentials are valid (not missing and not placeholders)
      if (!key || !cluster || key === 'your_pusher_key' || cluster === 'your_pusher_cluster') {
        console.warn('Pusher credentials not configured or using placeholders. Real-time updates disabled.')
        return
      }

      pusherRef.current = new Pusher(key, {
        cluster: cluster,
        forceTLS: true,
      })
    }

    // Subscribe to customer-specific channel
    const channelName = `customer-360-${customerId}`
    channelRef.current = pusherRef.current.subscribe(channelName)

    // Listen for customer updates
    channelRef.current.bind('customer-updated', handleUpdate)

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind('customer-updated', handleUpdate)
        pusherRef.current?.unsubscribe(`customer-360-${customerId}`)
        channelRef.current = null
      }
    }
  }, [customerId, handleUpdate])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pusherRef.current) {
        pusherRef.current.disconnect()
        pusherRef.current = null
      }
    }
  }, [])

  return {
    isConnected: pusherRef.current?.connection.state === 'connected',
    connectionState: pusherRef.current?.connection.state,
  }
}
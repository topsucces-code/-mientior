/**
 * Debounced quantity update hook for cart items
 * Maintains local state and triggers optimistic mutation after debounce delay
 */

import { useState, useEffect, useCallback } from 'react'
import { useOptimisticCart } from './use-optimistic-cart'

interface UseDebouncedQuantityUpdateOptions {
  itemId: string
  initialQuantity: number
  debounceMs?: number
  onUpdate?: (quantity: number) => void
}

export function useDebouncedQuantityUpdate({
  itemId,
  initialQuantity,
  debounceMs = 500,
  onUpdate,
}: UseDebouncedQuantityUpdateOptions) {
  const [localQuantity, setLocalQuantity] = useState(initialQuantity)
  const { updateQuantity, isUpdating } = useOptimisticCart()

  // Sync with initial quantity when it changes externally
  useEffect(() => {
    setLocalQuantity(initialQuantity)
  }, [initialQuantity])

  // Debounced update effect
  useEffect(() => {
    // Don't trigger if quantity hasn't changed
    if (localQuantity === initialQuantity) return

    const timeoutId = setTimeout(() => {
      updateQuantity({ itemId, quantity: localQuantity })
      onUpdate?.(localQuantity)
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [localQuantity, itemId, initialQuantity, debounceMs, updateQuantity, onUpdate])

  // Handlers for increment/decrement
  const increment = useCallback(() => {
    setLocalQuantity((prev) => prev + 1)
  }, [])

  const decrement = useCallback(() => {
    setLocalQuantity((prev) => Math.max(1, prev - 1))
  }, [])

  const setQuantity = useCallback((quantity: number) => {
    setLocalQuantity(Math.max(1, quantity))
  }, [])

  return {
    quantity: localQuantity,
    increment,
    decrement,
    setQuantity,
    isUpdating,
    isPending: localQuantity !== initialQuantity,
  }
}

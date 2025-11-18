/**
 * Optimistic cart update hook using TanStack Query mutations
 * Provides instant UI updates with automatic rollback on errors
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCartStore } from '@/stores/cart.store'
import { useToast } from '@/hooks/use-toast'

interface UpdateQuantityParams {
  itemId: string
  quantity: number
}

interface RemoveItemParams {
  itemId: string
}

interface SaveForLaterParams {
  itemId: string
}

export function useOptimisticCart() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const cartStore = useCartStore()

  // Optimistic quantity update
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: UpdateQuantityParams) => {
      // In production, this would call an API endpoint
      // For now, we just simulate the async operation
      await new Promise(resolve => setTimeout(resolve, 100))
      return { itemId, quantity }
    },
    onMutate: async ({ itemId, quantity }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cart'] })

      // Snapshot previous state
      const previousCart = cartStore.items

      // Optimistically update the UI
      cartStore.updateQuantity(itemId, quantity)

      // Return context with snapshot
      return { previousCart }
    },
    onError: (error, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousCart) {
        cartStore.items = context.previousCart
      }

      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la quantité',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      // Invalidate and refetch cart queries
      queryClient.invalidateQueries({ queryKey: ['cart'] })
    },
  })

  // Optimistic item removal
  const removeItemMutation = useMutation({
    mutationFn: async ({ itemId }: RemoveItemParams) => {
      // In production, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 100))
      return { itemId }
    },
    onMutate: async ({ itemId }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })

      const previousCart = cartStore.items

      // Optimistically remove item
      cartStore.removeItem(itemId)

      return { previousCart }
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        cartStore.items = context.previousCart
      }

      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'article',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })

      toast({
        title: 'Article supprimé',
        description: 'L\'article a été retiré de votre panier',
      })
    },
  })

  // Optimistic save for later
  const saveForLaterMutation = useMutation({
    mutationFn: async ({ itemId }: SaveForLaterParams) => {
      // In production, this would call an API endpoint
      await new Promise(resolve => setTimeout(resolve, 100))
      return { itemId }
    },
    onMutate: async ({ itemId }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] })
      await queryClient.cancelQueries({ queryKey: ['saved-items'] })

      const previousCart = cartStore.items
      const previousSaved = cartStore.savedForLater

      // Optimistically save item
      cartStore.saveForLater(itemId)

      return { previousCart, previousSaved }
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        cartStore.items = context.previousCart
      }
      if (context?.previousSaved) {
        cartStore.savedForLater = context.previousSaved
      }

      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder l\'article',
        variant: 'destructive',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['saved-items'] })

      toast({
        title: 'Article sauvegardé',
        description: 'L\'article a été déplacé vers "Enregistré pour plus tard"',
      })
    },
  })

  return {
    updateQuantity: updateQuantityMutation.mutate,
    removeItem: removeItemMutation.mutate,
    saveForLater: saveForLaterMutation.mutate,
    isUpdating: updateQuantityMutation.isPending,
    isRemoving: removeItemMutation.isPending,
    isSaving: saveForLaterMutation.isPending,
  }
}

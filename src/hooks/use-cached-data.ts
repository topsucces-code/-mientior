/**
 * Client-side caching hooks using SWR
 * Implements caching strategies for delivery estimates, stock data, and size guides (15.5)
 */

import useSWR from 'swr'
import type { DeliveryEstimate, ShippingOption } from '@/types/delivery'

// Fetcher function for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    throw error
  }
  return res.json()
}

// POST fetcher for delivery estimates
const postFetcher = async (url: string, data: unknown) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.')
    throw error
  }
  return res.json()
}

/**
 * Hook for fetching and caching product stock data
 * Revalidates every 30 seconds to match server-side cache TTL
 */
export function useProductStock(productId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    productId ? `/api/products/${productId}/stock` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 5000, // Dedupe requests within 5 seconds
    }
  )

  return {
    stock: data?.stock,
    timestamp: data?.timestamp,
    cached: data?.cached,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook for fetching and caching variant stock data
 * Revalidates every 30 seconds to match server-side cache TTL
 */
export function useVariantStock(productId: string | null, variantId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    productId && variantId
      ? `/api/products/${productId}/variants/${variantId}/stock`
      : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  )

  return {
    stock: data?.stock,
    timestamp: data?.timestamp,
    cached: data?.cached,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook for fetching and caching size guides by category
 * Revalidates on mount and focus, but not on interval (size guides change infrequently)
 */
export function useSizeGuide(categoryId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    categoryId ? `/api/size-guides/${categoryId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // Dedupe requests within 1 minute
    }
  )

  return {
    sizeGuide: data
      ? {
          id: data.id,
          categoryId: data.categoryId,
          measurements: data.measurements,
          instructions: data.instructions,
          fitRecommendations: data.fitRecommendations,
        }
      : null,
    cached: data?.cached,
    isLoading,
    error,
    mutate,
  }
}

/**
 * Hook for fetching and caching delivery estimates
 * Uses a custom key that includes request parameters for proper caching
 */
export function useDeliveryEstimate(
  productId: string | null,
  options?: {
    variantId?: string
    location?: {
      country?: string
      region?: string
      city?: string
      postalCode?: string
    }
    shippingMethod?: string
  }
) {
  // Create a stable key for SWR caching
  const key = productId
    ? [
        '/api/delivery/estimate',
        productId,
        options?.variantId,
        JSON.stringify(options?.location || {}),
        options?.shippingMethod,
      ].join('|')
    : null

  const { data, error, isLoading, mutate } = useSWR(
    key,
    async () => {
      if (!productId) return null
      return postFetcher('/api/delivery/estimate', {
        productId,
        variantId: options?.variantId,
        location: options?.location,
        shippingMethod: options?.shippingMethod,
      })
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // Dedupe requests within 30 seconds
    }
  )

  return {
    estimates: data?.estimates as
      | Array<{
          minDate: string
          maxDate: string
          shippingOption: ShippingOption
          processingDays: number
        }>
      | undefined,
    location: data?.location,
    isBackordered: data?.isBackordered,
    cached: data?.cached,
    isLoading,
    error,
    mutate,
  }
}

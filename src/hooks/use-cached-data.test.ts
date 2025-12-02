/**
 * Tests for client-side caching hooks (15.5)
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import {
  useProductStock,
  useVariantStock,
  useSizeGuide,
  useDeliveryEstimate,
} from './use-cached-data'

// Mock fetch
global.fetch = vi.fn()

describe('use-cached-data hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useProductStock', () => {
    it('should fetch and cache product stock data', async () => {
      const mockStockData = {
        productId: 'prod-1',
        stock: 15,
        timestamp: Date.now(),
        cached: false,
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStockData,
      })

      const { result } = renderHook(() => useProductStock('prod-1'))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stock).toBe(15)
      expect(result.current.timestamp).toBe(mockStockData.timestamp)
      expect(global.fetch).toHaveBeenCalledWith('/api/products/prod-1/stock')
    })

    it('should not fetch when productId is null', () => {
      const { result } = renderHook(() => useProductStock(null))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.stock).toBeUndefined()
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('useVariantStock', () => {
    it('should fetch and cache variant stock data', async () => {
      const mockStockData = {
        variantId: 'var-1',
        stock: 8,
        timestamp: Date.now(),
        cached: false,
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStockData,
      })

      const { result } = renderHook(() =>
        useVariantStock('prod-1', 'var-1')
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stock).toBe(8)
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/products/prod-1/variants/var-1/stock'
      )
    })

    it('should not fetch when productId or variantId is null', () => {
      const { result: result1 } = renderHook(() =>
        useVariantStock(null, 'var-1')
      )
      const { result: result2 } = renderHook(() =>
        useVariantStock('prod-1', null)
      )

      expect(result1.current.isLoading).toBe(false)
      expect(result2.current.isLoading).toBe(false)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('useSizeGuide', () => {
    it('should fetch and cache size guide data', async () => {
      const mockSizeGuide = {
        id: 'guide-1',
        categoryId: 'cat-1',
        measurements: [
          { size: 'S', chest: 90, waist: 75, unit: 'cm' },
          { size: 'M', chest: 95, waist: 80, unit: 'cm' },
        ],
        instructions: 'Measure around the fullest part of your chest',
        fitRecommendations: [
          { size: 'S', recommendation: 'Slim fit' },
        ],
        cached: false,
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSizeGuide,
      })

      const { result } = renderHook(() => useSizeGuide('cat-1'))

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.sizeGuide).toEqual({
        id: 'guide-1',
        categoryId: 'cat-1',
        measurements: mockSizeGuide.measurements,
        instructions: mockSizeGuide.instructions,
        fitRecommendations: mockSizeGuide.fitRecommendations,
      })
      expect(global.fetch).toHaveBeenCalledWith('/api/size-guides/cat-1')
    })

    it('should not fetch when categoryId is null', () => {
      const { result } = renderHook(() => useSizeGuide(null))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.sizeGuide).toBeNull()
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('useDeliveryEstimate', () => {
    it('should fetch and cache delivery estimates', async () => {
      const mockEstimates = {
        estimates: [
          {
            minDate: '2024-01-10',
            maxDate: '2024-01-12',
            shippingOption: {
              id: 'standard',
              name: 'Standard Shipping',
              price: 5.99,
              estimatedDays: 5,
              description: 'Delivery in 5-7 business days',
            },
            processingDays: 2,
          },
        ],
        location: { country: 'France' },
        isBackordered: false,
        cached: false,
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEstimates,
      })

      const { result } = renderHook(() =>
        useDeliveryEstimate('prod-1', {
          location: { country: 'France' },
        })
      )

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.estimates).toHaveLength(1)
      expect(result.current.estimates?.[0].shippingOption.id).toBe('standard')
      expect(result.current.location).toEqual({ country: 'France' })
      expect(result.current.isBackordered).toBe(false)
    })

    it('should not fetch when productId is null', () => {
      const { result } = renderHook(() => useDeliveryEstimate(null))

      expect(result.current.isLoading).toBe(false)
      expect(result.current.estimates).toBeUndefined()
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it('should include variant and shipping method in request', async () => {
      const mockEstimates = {
        estimates: [],
        location: { country: 'France' },
        cached: false,
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockEstimates,
      })

      renderHook(() =>
        useDeliveryEstimate('prod-1', {
          variantId: 'var-1',
          shippingMethod: 'express',
          location: { country: 'France', city: 'Paris' },
        })
      )

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/delivery/estimate',
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        )
      })

      // Verify the body contains the expected data (order-independent)
      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      const body = JSON.parse(callArgs[1].body)
      expect(body).toEqual({
        productId: 'prod-1',
        variantId: 'var-1',
        shippingMethod: 'express',
        location: { country: 'France', city: 'Paris' },
      })
    })
  })
})

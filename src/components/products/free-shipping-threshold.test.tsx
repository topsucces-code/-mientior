/**
 * Property-Based Test: Free shipping threshold display
 * Feature: immersive-product-page, Property 36: Free shipping threshold display
 * Validates: Requirements 12.2
 * 
 * Property: For any shipping configuration with a free shipping threshold T, 
 * the value T should be displayed to users.
 * 
 * @vitest-environment jsdom
 */

import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as fc from 'fast-check'
import { ProductTabs } from './product-tabs'
import type { Product, ShippingInfo } from '@/types'

// Minimal product generator
const minimalProductArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.stringMatching(/^[A-Z][a-z ]{5,50}$/),
  slug: fc.stringMatching(/^[a-z-]{5,50}$/),
  description: fc.stringMatching(/^[A-Z][a-z .,]{10,200}$/),
  price: fc.float({ min: 1, max: 10000, noNaN: true }),
  images: fc.constant([{ url: '/test.jpg', alt: 'Test', order: 0 }]),
  categoryId: fc.uuid(),
  vendorId: fc.uuid(),
  status: fc.constant('ACTIVE' as const),
  stock: fc.integer({ min: 0, max: 1000 }),
  createdAt: fc.constant(new Date()),
  updatedAt: fc.constant(new Date())
})

// Shipping info generator with free shipping threshold
const shippingInfoWithThresholdArbitrary = fc.record({
  options: fc.constant([{
    name: 'Standard Shipping',
    price: 5.99,
    estimatedDays: 5,
    description: 'Standard delivery'
  }]),
  freeShippingThreshold: fc.float({ min: 50, max: 500, noNaN: true }),
  internationalShipping: fc.boolean(),
  returnPolicy: fc.constant('Returns accepted within 30 days')
})

describe('Property 36: Free shipping threshold display', () => {
  it('should display free shipping threshold T when configured', async () => {
    await fc.assert(
      fc.asyncProperty(
        minimalProductArbitrary,
        shippingInfoWithThresholdArbitrary,
        async (product, shippingInfo) => {
          const user = userEvent.setup()
          const { container, unmount } = render(
            <ProductTabs 
              product={product as Product} 
              shippingInfo={shippingInfo}
              reviews={[]}
              qa={[]}
            />
          )

          try {
            // Find and click the shipping tab to activate it
            const shippingTab = screen.getByRole('tab', { name: /livraison/i })
            await user.click(shippingTab)

            // Wait for content to be rendered
            await waitFor(() => {
              const htmlContent = container.innerHTML
              const threshold = shippingInfo.freeShippingThreshold!

              // Verify the threshold value is displayed
              const thresholdText = `${threshold} €`
              const hasThreshold = htmlContent.includes(thresholdText)
              expect(hasThreshold).toBe(true)

              // Verify there's messaging about free shipping
              const hasFreeShippingMessage = 
                htmlContent.includes('Livraison gratuite') || 
                htmlContent.includes('livraison gratuite') ||
                htmlContent.includes('gratuite')
              expect(hasFreeShippingMessage).toBe(true)
            })
          } finally {
            unmount()
          }
        }
      ),
      { numRuns: 20 } // Reduced from 100 for UI tests
    )
  }, 15000) // Increased timeout for async UI tests

  it('should not display threshold when not configured', async () => {
    const user = userEvent.setup()
    const shippingInfoWithoutThreshold: ShippingInfo = {
      options: [{
        name: 'Standard Shipping',
        price: 5.99,
        estimatedDays: 5,
        description: 'Standard delivery'
      }],
      freeShippingThreshold: undefined,
      internationalShipping: false,
      returnPolicy: 'Returns accepted within 30 days'
    }

    const product: Partial<Product> = {
      id: '1',
      name: 'Test Product',
      slug: 'test',
      description: 'Test',
      price: 100,
      images: [{ url: '/test.jpg', alt: 'Test', order: 0 }],
      categoryId: '1',
      vendorId: '1',
      status: 'ACTIVE',
      stock: 10,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const { container } = render(
      <ProductTabs 
        product={product as Product} 
        shippingInfo={shippingInfoWithoutThreshold}
        reviews={[]}
        qa={[]}
      />
    )

    // Activate the Shipping tab
    const shippingTab = screen.getByRole('tab', { name: /livraison/i })
    await user.click(shippingTab)

    // Wait for content to be rendered
    await waitFor(() => {
      const htmlContent = container.innerHTML
      // When threshold is undefined, the free shipping banner should not appear
      const hasFreeShippingBanner = htmlContent.includes('bg-green-50') && htmlContent.includes('border-green-200')
      expect(hasFreeShippingBanner).toBe(false)
    })
  })

  it('should display threshold with correct formatting', async () => {
    const testCases = [
      { threshold: 50, expected: '50 €' },
      { threshold: 100.50, expected: '100.5 €' },
      { threshold: 250, expected: '250 €' },
      { threshold: 99.99, expected: '99.99 €' }
    ]

    for (const { threshold, expected } of testCases) {
      const user = userEvent.setup()
      const shippingInfo: ShippingInfo = {
        options: [{
          name: 'Standard Shipping',
          price: 5.99,
          estimatedDays: 5
        }],
        freeShippingThreshold: threshold,
        internationalShipping: false,
        returnPolicy: 'Returns accepted'
      }

      const product: Partial<Product> = {
        id: '1',
        name: 'Test Product',
        slug: 'test',
        description: 'Test',
        price: 100,
        images: [{ url: '/test.jpg', alt: 'Test', order: 0 }],
        categoryId: '1',
        vendorId: '1',
        status: 'ACTIVE',
        stock: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const { container, unmount } = render(
        <ProductTabs 
          product={product as Product} 
          shippingInfo={shippingInfo}
          reviews={[]}
          qa={[]}
        />
      )

      // Activate the Shipping tab
      const shippingTab = screen.getByRole('tab', { name: /livraison/i })
      await user.click(shippingTab)

      // Wait for content to be rendered
      await waitFor(() => {
        const htmlContent = container.innerHTML
        expect(htmlContent.includes(expected)).toBe(true)
      })
      
      unmount()
    }
  })
})

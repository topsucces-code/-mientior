/**
 * Property-Based Test: Shipping methods completeness
 * Feature: immersive-product-page, Property 35: Shipping methods completeness
 * Validates: Requirements 12.1
 * 
 * Property: For any product with N shipping methods configured, all N methods 
 * should be displayed with their costs and delivery times.
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

// Generator for shipping options
const shippingOptionArbitrary = fc.record({
  name: fc.stringMatching(/^[A-Z][a-z]+ [A-Z][a-z]+$/), // e.g., "Standard Shipping"
  price: fc.float({ min: 0, max: 100, noNaN: true }),
  estimatedDays: fc.integer({ min: 1, max: 30 }),
  description: fc.option(fc.stringMatching(/^[A-Z][a-z ]{10,100}$/), { nil: undefined })
})

// Generator for shipping info with N options
const shippingInfoArbitrary = fc.record({
  options: fc.array(shippingOptionArbitrary, { minLength: 1, maxLength: 10 }),
  freeShippingThreshold: fc.option(fc.float({ min: 50, max: 500, noNaN: true }), { nil: undefined }),
  internationalShipping: fc.boolean(),
  returnPolicy: fc.string({ minLength: 20, maxLength: 200 })
})

// Minimal product generator for testing
const minimalProductArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.stringMatching(/^[A-Z][a-z ]{5,50}$/), // Readable product names
  slug: fc.stringMatching(/^[a-z-]{5,50}$/), // Valid slugs
  description: fc.stringMatching(/^[A-Z][a-z .,]{10,200}$/), // Readable descriptions
  price: fc.float({ min: 1, max: 10000, noNaN: true }),
  images: fc.constant([{ url: '/test.jpg', alt: 'Test', order: 0 }]),
  categoryId: fc.uuid(),
  vendorId: fc.uuid(),
  status: fc.constant('ACTIVE' as const),
  stock: fc.integer({ min: 0, max: 1000 }),
  createdAt: fc.constant(new Date()),
  updatedAt: fc.constant(new Date())
})

describe('Property 35: Shipping methods completeness', () => {
  it('should render component with all N shipping methods data', async () => {
    await fc.assert(
      fc.asyncProperty(
        minimalProductArbitrary,
        shippingInfoArbitrary,
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
            expect(shippingTab).toBeTruthy()
            
            // Click the tab to render its content using userEvent
            await user.click(shippingTab)
            
            // Wait for content to be rendered
            await waitFor(() => {
              const htmlContent = container.innerHTML
              // Check for shipping section heading
              expect(htmlContent.includes('Modes de livraison')).toBe(true)
            })

            // Now verify all shipping options data is present in the DOM
            const N = shippingInfo.options.length
            const htmlContent = container.innerHTML
            
            shippingInfo.options.forEach((option) => {
              // Check that the shipping method name is in the DOM
              const hasName = htmlContent.includes(option.name)
              expect(hasName).toBe(true)

              // Check that the price is in the DOM
              const priceText = option.price === 0 ? 'GRATUIT' : `${option.price.toFixed(2)} €`
              const hasPrice = htmlContent.includes(priceText)
              expect(hasPrice).toBe(true)

              // Check that delivery time is in the DOM
              const deliveryText = `${option.estimatedDays} jours ouvrés`
              const hasDeliveryTime = htmlContent.includes(deliveryText)
              expect(hasDeliveryTime).toBe(true)
            })

            // Verify the count matches by counting shipping option cards in the HTML
            const shippingCardMatches = htmlContent.match(/border-2.*?border-platinum-300/g)
            const cardCount = shippingCardMatches ? shippingCardMatches.length : 0
            expect(cardCount).toBe(N)
          } finally {
            unmount()
          }
        }
      ),
      { numRuns: 20 } // Reduced from 100 for UI tests
    )
  }, 15000) // Increased timeout for async UI tests

  it('should include description in DOM when provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        minimalProductArbitrary,
        shippingInfoArbitrary,
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
            // Click the shipping tab to activate it
            const shippingTab = screen.getByRole('tab', { name: /livraison/i })
            await user.click(shippingTab)
            
            // Wait for content to be rendered
            await waitFor(() => {
              const htmlContent = container.innerHTML
              expect(htmlContent.includes('Modes de livraison')).toBe(true)
            })

            const htmlContent = container.innerHTML

            // Check descriptions are in the DOM when present
            shippingInfo.options.forEach((option) => {
              if (option.description) {
                const hasDescription = htmlContent.includes(option.description)
                expect(hasDescription).toBe(true)
              }
            })
          } finally {
            unmount()
          }
        }
      ),
      { numRuns: 20 } // Reduced from 100 for UI tests
    )
  }, 15000) // Increased timeout for async UI tests

  it('should handle edge case of single shipping method', async () => {
    const user = userEvent.setup()
    const singleOptionShipping: ShippingInfo = {
      options: [{
        name: 'Standard Shipping',
        price: 5.99,
        estimatedDays: 5,
        description: 'Standard delivery'
      }],
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
        shippingInfo={singleOptionShipping}
        reviews={[]}
        qa={[]}
      />
    )

    // Click the shipping tab to activate it
    const shippingTab = screen.getByRole('tab', { name: /livraison/i })
    await user.click(shippingTab)
    
    // Wait for content to be rendered
    await waitFor(() => {
      const htmlContent = container.innerHTML
      expect(htmlContent.includes('Standard Shipping')).toBe(true)
    })

    const htmlContent = container.innerHTML

    // Verify single method is in the DOM
    expect(htmlContent.includes('Standard Shipping')).toBe(true)
    expect(htmlContent.includes('5.99 €')).toBe(true)
    
    const shippingCardMatches = htmlContent.match(/border-2.*?border-platinum-300/g)
    const cardCount = shippingCardMatches ? shippingCardMatches.length : 0
    expect(cardCount).toBe(1)
  })

  it('should handle free shipping (price = 0)', async () => {
    const user = userEvent.setup()
    const freeShipping: ShippingInfo = {
      options: [{
        name: 'Free Standard Shipping',
        price: 0,
        estimatedDays: 7,
        description: 'Free delivery'
      }],
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
        shippingInfo={freeShipping}
        reviews={[]}
        qa={[]}
      />
    )

    // Click the shipping tab to activate it
    const shippingTab = screen.getByRole('tab', { name: /livraison/i })
    await user.click(shippingTab)
    
    // Wait for content to be rendered
    await waitFor(() => {
      const htmlContent = container.innerHTML
      expect(htmlContent.includes('GRATUIT')).toBe(true)
    })

    const htmlContent = container.innerHTML

    // Verify "GRATUIT" is in the DOM for free shipping
    expect(htmlContent.includes('GRATUIT')).toBe(true)
  })
})

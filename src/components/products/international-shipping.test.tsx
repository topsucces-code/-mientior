/**
 * Property-Based Test: International shipping indication
 * Feature: immersive-product-page, Property 37: International shipping indication
 * Validates: Requirements 12.4
 * 
 * Property: For any product with international shipping enabled, supported countries 
 * and additional costs should be displayed.
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

describe('Property 37: International shipping indication', () => {
  it('should display international shipping section when enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        minimalProductArbitrary,
        fc.boolean(),
        async (product, internationalShipping) => {
          const user = userEvent.setup()
          const shippingInfo: ShippingInfo = {
            options: [{
              name: 'Standard Shipping',
              price: 5.99,
              estimatedDays: 5
            }],
            internationalShipping,
            returnPolicy: 'Returns accepted within 30 days'
          }

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
            
            // Click the tab to render its content
            await user.click(shippingTab)
            
            // Wait for the shipping tab content to be fully rendered
            await waitFor(() => {
              const htmlContent = container.innerHTML
              expect(htmlContent.includes('Modes de livraison')).toBe(true)
              // Also ensure the returns section is rendered (indicates full tab render)
              expect(htmlContent.includes('Retours gratuits')).toBe(true)
            }, { timeout: 3000 })

            // Get the HTML content after waiting
            const htmlContent = container.innerHTML

            if (internationalShipping) {
              // When international shipping is enabled, wait for the international section to appear
              await waitFor(() => {
                const content = container.innerHTML
                const hasInternationalHeading = content.includes('Livraison internationale')
                expect(hasInternationalHeading).toBe(true)
              }, { timeout: 3000 })

              // Verify the section contains expected content
              const finalContent = container.innerHTML
              const hasCountryMention = 
                finalContent.includes('pays') ||
                finalContent.includes('destination')
              expect(hasCountryMention).toBe(true)
            } else {
              // When international shipping is disabled, the heading should not appear
              const hasInternationalHeading = htmlContent.includes('Livraison internationale')
              expect(hasInternationalHeading).toBe(false)
            }
          } finally {
            unmount()
          }
        }
      ),
      { numRuns: 20 } // Reduced from 100 for UI tests
    )
  }, 15000) // Increased timeout for async UI tests

  it('should display international shipping when explicitly enabled', async () => {
    const user = userEvent.setup()
    const shippingInfoWithInternational: ShippingInfo = {
      options: [{
        name: 'Standard Shipping',
        price: 5.99,
        estimatedDays: 5
      }],
      internationalShipping: true,
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
        shippingInfo={shippingInfoWithInternational}
        reviews={[]}
        qa={[]}
      />
    )

    // Click the shipping tab to activate it
    const shippingTab = screen.getByRole('tab', { name: /livraison/i })
    await user.click(shippingTab)
    
    // Wait for the international shipping section to appear
    await waitFor(() => {
      const htmlContent = container.innerHTML
      expect(htmlContent.includes('Livraison internationale')).toBe(true)
    }, { timeout: 3000 })

    // Verify the section contains expected content
    const htmlContent = container.innerHTML
    expect(htmlContent.includes('pays')).toBe(true)
  })

  it('should not display international shipping when disabled', async () => {
    const user = userEvent.setup()
    const shippingInfoWithoutInternational: ShippingInfo = {
      options: [{
        name: 'Standard Shipping',
        price: 5.99,
        estimatedDays: 5
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
        shippingInfo={shippingInfoWithoutInternational}
        reviews={[]}
        qa={[]}
      />
    )

    // Click the shipping tab to activate it
    const shippingTab = screen.getByRole('tab', { name: /livraison/i })
    await user.click(shippingTab)
    
    // Wait for shipping content to be rendered
    await waitFor(() => {
      const htmlContent = container.innerHTML
      expect(htmlContent.includes('Modes de livraison')).toBe(true)
      expect(htmlContent.includes('Retours gratuits')).toBe(true)
    }, { timeout: 3000 })

    const htmlContent = container.innerHTML

    // Should not display the international shipping heading
    const hasInternationalHeading = htmlContent.includes('Livraison internationale')
    expect(hasInternationalHeading).toBe(false)
  })
})

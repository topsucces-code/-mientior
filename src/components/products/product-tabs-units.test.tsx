/**
 * Property-based tests for measurement units display
 * Feature: immersive-product-page, Property 11: Measurement units display
 * Validates: Requirements 4.5
 * 
 * @vitest-environment jsdom
 */

import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductTabs } from './product-tabs'
import type { Product } from '@/types'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Helper to create a minimal product with specifications
function createProductWithSpecs(specifications: Record<string, string>): Product {
  return {
    id: 'test-product',
    name: 'Test Product',
    slug: 'test-product',
    price: 99.99,
    images: [],
    category: { id: 'cat-1', name: 'Category', slug: 'category' },
    rating: 4.5,
    reviewCount: 10,
    stock: 5,
    specifications,
  } as Product
}

describe('ProductTabs - Measurement Units Display', () => {
  /**
   * Property 11: Measurement units display
   * For any product dimension or measurement, the value should be displayed 
   * with its corresponding unit (cm, kg, etc.).
   * 
   * Feature: immersive-product-page, Property 11: Measurement units display
   * Validates: Requirements 4.5
   */
  it('should display measurements with their units', async () => {
    const user = userEvent.setup()
    
    const specifications = {
      'Dimensions': '30 x 20 x 10 cm',
      'Poids': '2.5 kg',
      'Capacité': '500 ml',
      'Puissance': '100 W',
      'Tension': '220 V',
      'Fréquence': '50 Hz',
    }
    
    const product = createProductWithSpecs(specifications)
    
    render(
      <ProductTabs 
        product={product}
        reviews={[]}
        qa={[]}
      />
    )
    
    // Click on specifications tab
    const specsTab = screen.getAllByRole('tab', { name: /caractéristiques/i })[0]
    await user.click(specsTab)
    
    // Verify all measurements are displayed with units
    for (const [key, value] of Object.entries(specifications)) {
      // Check that the value with unit is present
      const valueElement = screen.getByText(value)
      expect(valueElement).toBeTruthy()
      
      // Verify the unit is part of the value
      expect(value).toMatch(/\d+\s*(cm|kg|ml|W|V|Hz|x)/)
    }
  })

  it('should handle various unit types correctly', async () => {
    const user = userEvent.setup()
    
    const testCases = [
      {
        specs: {
          'Length': '100 cm',
          'Weight': '5 kg',
          'Volume': '1 l',
        },
        expectedUnits: ['cm', 'kg', 'l']
      },
      {
        specs: {
          'Power': '1500 W',
          'Voltage': '230 V',
          'Current': '6.5 A',
        },
        expectedUnits: ['W', 'V', 'A']
      },
      {
        specs: {
          'Storage': '512 GB',
          'RAM': '16 GB',
          'Speed': '3.2 GHz',
        },
        expectedUnits: ['GB', 'GB', 'GHz']
      },
    ]
    
    for (const testCase of testCases) {
      const product = createProductWithSpecs(testCase.specs)
      
      render(
        <ProductTabs 
          product={product}
          reviews={[]}
          qa={[]}
        />
      )
      
      // Click on specifications tab
      const specsTab = screen.getAllByRole('tab', { name: /caractéristiques/i })[0]
      await user.click(specsTab)
      
      // Verify each specification has its unit
      for (const [key, value] of Object.entries(testCase.specs)) {
        const valueElement = screen.getByText(value)
        expect(valueElement).toBeTruthy()
        
        // Check that at least one expected unit is present in the value
        const hasExpectedUnit = testCase.expectedUnits.some(unit => 
          value.toLowerCase().includes(unit.toLowerCase())
        )
        expect(hasExpectedUnit).toBe(true)
      }
      
      cleanup()
    }
  })

  it('should handle dimension formats correctly', async () => {
    const user = userEvent.setup()
    
    const specifications = {
      'Dimensions (cm)': '30 x 20 x 10',
      'Dimensions with unit': '30 x 20 x 10 cm',
      'Single dimension': '50 cm',
      'Area': '100 cm²',
    }
    
    const product = createProductWithSpecs(specifications)
    
    render(
      <ProductTabs 
        product={product}
        reviews={[]}
        qa={[]}
      />
    )
    
    // Click on specifications tab
    const specsTab = screen.getAllByRole('tab', { name: /caractéristiques/i })[0]
    await user.click(specsTab)
    
    // Verify all dimension formats are displayed
    for (const value of Object.values(specifications)) {
      const valueElement = screen.getByText(value)
      expect(valueElement).toBeTruthy()
    }
  })

  it('should preserve unit formatting in values', async () => {
    const user = userEvent.setup()
    
    const specifications = {
      'Temperature': '25 °C',
      'Percentage': '95 %',
      'Resolution': '1920 x 1080 px',
      'DPI': '300 dpi',
    }
    
    const product = createProductWithSpecs(specifications)
    
    render(
      <ProductTabs 
        product={product}
        reviews={[]}
        qa={[]}
      />
    )
    
    // Click on specifications tab
    const specsTab = screen.getAllByRole('tab', { name: /caractéristiques/i })[0]
    await user.click(specsTab)
    
    // Verify all values with special units are preserved
    for (const [key, value] of Object.entries(specifications)) {
      const valueElement = screen.getByText(value)
      expect(valueElement).toBeTruthy()
    }
  })
})

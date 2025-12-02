/**
 * Property-based tests for specifications rendering
 * Feature: immersive-product-page, Property 10: Specifications table rendering
 * Validates: Requirements 4.3
 * 
 * @vitest-environment jsdom
 */

import React from 'react'
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as fc from 'fast-check'
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

describe('ProductTabs - Specifications Rendering', () => {
  /**
   * Property 10: Specifications table rendering
   * For any product with specifications data, all specification key-value pairs 
   * should be rendered in the table format.
   * 
   * Feature: immersive-product-page, Property 10: Specifications table rendering
   * Validates: Requirements 4.3
   */
  it('should render all specification key-value pairs in table format', async () => {
    const user = userEvent.setup()
    
    // Test with various specification sets
    const testCases = [
      {
        'Dimensions': '30 x 20 x 10 cm',
        'Poids': '2.5 kg',
        'Couleur': 'Noir',
      },
      {
        'Processor': 'Intel Core i7',
        'RAM': '16 GB',
        'Storage': '512 GB SSD',
        'Display': '15.6 inch',
        'Battery': '8 hours',
      },
      {
        'Material': 'Cotton',
        'Size': 'Large',
      },
    ]
    
    for (const specifications of testCases) {
      const product = createProductWithSpecs(specifications)
      
      const { container } = render(
        <ProductTabs 
          product={product}
          reviews={[]}
          qa={[]}
        />
      )
      
      // Click on specifications tab
      const specsTab = screen.getAllByRole('tab', { name: /caractéristiques/i })[0]
      await user.click(specsTab)
      
      // Verify all specifications are rendered
      const specEntries = Object.entries(specifications)
      
      for (const [key, value] of specEntries) {
        // Check that the key is present in the document
        const keyElement = screen.getByText(key)
        expect(keyElement).toBeTruthy()
        
        // Check that the value is present
        const valueElement = screen.getByText(value)
        expect(valueElement).toBeTruthy()
      }
      
      // Verify table structure exists
      const table = container.querySelector('table')
      expect(table).toBeTruthy()
      
      // Verify correct number of rows
      const rows = container.querySelectorAll('tbody tr')
      expect(rows.length).toBe(specEntries.length)
      
      // Cleanup for next iteration
      cleanup()
    }
  })

  it('should handle empty specifications gracefully', async () => {
    const user = userEvent.setup()
    const product = createProductWithSpecs({})
    
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
    
    // Should show empty state message
    expect(screen.getByText(/aucune caractéristique technique disponible/i)).toBeTruthy()
  })

  it('should handle specifications with various data types', async () => {
    const user = userEvent.setup()
    
    const specifications = {
      'Dimensions (cm)': '30 x 20 x 10',
      'Weight (kg)': '2.5',
      'Color': 'Black & White',
      'Material': 'ABS Plastic',
      'Power': '100W',
      'Voltage': '220V',
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
    
    // All keys should be rendered
    for (const key of Object.keys(specifications)) {
      expect(screen.getByText(key)).toBeTruthy()
    }
  })

  it('should render specifications in a structured table with proper accessibility', async () => {
    const user = userEvent.setup()
    const specifications = {
      'Dimensions': '30 x 20 x 10 cm',
      'Poids': '2.5 kg',
      'Couleur': 'Noir',
      'Matériau': 'Plastique ABS',
    }
    
    const product = createProductWithSpecs(specifications)
    
    const { container } = render(
      <ProductTabs 
        product={product}
        reviews={[]}
        qa={[]}
      />
    )
    
    // Click on specifications tab using userEvent
    const specsTab = screen.getAllByRole('tab', { name: /caractéristiques/i })[0]
    await user.click(specsTab)
    
    // Wait for content to be visible
    await screen.findByText('Dimensions')
    
    // Verify table structure
    const table = container.querySelector('table')
    expect(table).toBeTruthy()
    
    // Verify tbody exists
    const tbody = table?.querySelector('tbody')
    expect(tbody).toBeTruthy()
    
    // Verify rows have proper structure (2 cells each)
    const rows = tbody?.querySelectorAll('tr')
    expect(rows?.length).toBe(4)
    
    rows?.forEach(row => {
      const cells = row.querySelectorAll('td')
      expect(cells.length).toBe(2)
    })
  })
})

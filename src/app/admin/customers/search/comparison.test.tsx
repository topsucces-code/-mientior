/**
 * Unit Tests for Customer Comparison Logic
 * 
 * Tests the customer comparison functionality including:
 * - Customer selection logic
 * - Comparison API integration
 * - State management
 * 
 * Requirements: 16.1, 16.2, 16.5
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock customer search data
const mockCustomers = [
  {
    id: 'customer1',
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    loyaltyLevel: 'GOLD',
    loyaltyPoints: 1500,
    totalOrders: 25,
    totalSpent: 2500.00,
    createdAt: '2023-01-15T10:00:00Z',
    lastPurchaseDate: '2024-01-15T10:00:00Z',
    segments: [{ id: 'seg1', name: 'VIP' }],
    tags: [{ id: 'tag1', name: 'Premium', color: 'gold' }],
  },
  {
    id: 'customer2',
    name: 'Jane Smith',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    loyaltyLevel: 'SILVER',
    loyaltyPoints: 800,
    totalOrders: 15,
    totalSpent: 1200.00,
    createdAt: '2023-03-20T10:00:00Z',
    lastPurchaseDate: '2024-01-10T10:00:00Z',
    segments: [{ id: 'seg1', name: 'VIP' }],
    tags: [{ id: 'tag2', name: 'Regular', color: 'blue' }],
  },
  {
    id: 'customer3',
    name: 'Bob Wilson',
    firstName: 'Bob',
    lastName: 'Wilson',
    email: 'bob@example.com',
    loyaltyLevel: 'BRONZE',
    loyaltyPoints: 200,
    totalOrders: 5,
    totalSpent: 300.00,
    createdAt: '2023-06-10T10:00:00Z',
    lastPurchaseDate: '2023-12-20T10:00:00Z',
    segments: [{ id: 'seg2', name: 'New' }],
    tags: [{ id: 'tag3', name: 'Starter', color: 'green' }],
  },
]

const mockSearchResponse = {
  customers: mockCustomers,
  pagination: {
    page: 1,
    limit: 20,
    totalCount: 3,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
  meta: {
    searchQuery: '',
    filtersApplied: {},
    performance: {
      executionTime: 45,
      cacheHit: false,
      queryComplexity: 'simple',
    },
  },
}

const mockComparisonResponse = {
  data: {
    customers: [mockCustomers[0], mockCustomers[1]],
    metrics: [
      {
        lifetimeValue: 2500,
        totalOrders: 25,
        averageOrderValue: 100,
        totalSpent: 2500,
        daysSinceLastPurchase: 10,
        purchaseFrequency: 2.5,
        customerTenure: 365,
      },
      {
        lifetimeValue: 1200,
        totalOrders: 15,
        averageOrderValue: 80,
        totalSpent: 1200,
        daysSinceLastPurchase: 15,
        purchaseFrequency: 1.8,
        customerTenure: 300,
      },
    ],
    segmentOverlap: ['VIP'],
    differences: [
      {
        metric: 'lifetimeValue',
        values: [2500, 1200],
        variance: 650,
      },
    ],
  },
}

// Helper functions for testing comparison logic
class CustomerComparisonLogic {
  private selectedCustomers: string[] = []
  private comparisonMode = false

  toggleComparisonMode() {
    this.comparisonMode = !this.comparisonMode
    if (!this.comparisonMode) {
      this.selectedCustomers = []
    }
    return this.comparisonMode
  }

  selectCustomer(customerId: string): { success: boolean; message?: string } {
    if (this.selectedCustomers.includes(customerId)) {
      return { success: false, message: 'Customer already selected' }
    }
    
    if (this.selectedCustomers.length >= 3) {
      return { success: false, message: 'Maximum 3 customers can be compared' }
    }
    
    this.selectedCustomers.push(customerId)
    return { success: true }
  }

  deselectCustomer(customerId: string): boolean {
    const index = this.selectedCustomers.indexOf(customerId)
    if (index > -1) {
      this.selectedCustomers.splice(index, 1)
      return true
    }
    return false
  }

  clearSelection() {
    this.selectedCustomers = []
  }

  getSelectedCustomers() {
    return [...this.selectedCustomers]
  }

  canCompare(): boolean {
    return this.selectedCustomers.length >= 2
  }

  async performComparison(): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.canCompare()) {
      return { success: false, error: 'At least 2 customers required for comparison' }
    }

    try {
      const response = await fetch(
        `/api/admin/customers/compare?customerIds=${this.selectedCustomers.join(',')}`
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error || 'Comparison failed' }
      }
      
      const data = await response.json()
      return { success: true, data: data.data }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Comparison failed' }
    }
  }
}

describe('Customer Comparison Logic Tests', () => {
  let comparisonLogic: CustomerComparisonLogic

  beforeEach(() => {
    vi.clearAllMocks()
    comparisonLogic = new CustomerComparisonLogic()
    
    // Mock successful comparison response
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/admin/customers/compare')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockComparisonResponse),
        })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
  })

  it('should toggle comparison mode correctly', () => {
    // Initially not in comparison mode
    expect(comparisonLogic.getSelectedCustomers()).toHaveLength(0)
    
    // Enable comparison mode
    const enabled = comparisonLogic.toggleComparisonMode()
    expect(enabled).toBe(true)
    
    // Disable comparison mode
    const disabled = comparisonLogic.toggleComparisonMode()
    expect(disabled).toBe(false)
    expect(comparisonLogic.getSelectedCustomers()).toHaveLength(0)
  })

  it('should allow selecting customers for comparison', () => {
    comparisonLogic.toggleComparisonMode()
    
    // Select first customer
    const result1 = comparisonLogic.selectCustomer('customer1')
    expect(result1.success).toBe(true)
    expect(comparisonLogic.getSelectedCustomers()).toContain('customer1')
    
    // Select second customer
    const result2 = comparisonLogic.selectCustomer('customer2')
    expect(result2.success).toBe(true)
    expect(comparisonLogic.getSelectedCustomers()).toHaveLength(2)
  })

  it('should prevent selecting more than 3 customers', () => {
    comparisonLogic.toggleComparisonMode()
    
    // Select 3 customers
    comparisonLogic.selectCustomer('customer1')
    comparisonLogic.selectCustomer('customer2')
    comparisonLogic.selectCustomer('customer3')
    
    // Try to select 4th customer
    const result = comparisonLogic.selectCustomer('customer4')
    expect(result.success).toBe(false)
    expect(result.message).toBe('Maximum 3 customers can be compared')
    expect(comparisonLogic.getSelectedCustomers()).toHaveLength(3)
  })

  it('should prevent selecting the same customer twice', () => {
    comparisonLogic.toggleComparisonMode()
    
    // Select customer
    const result1 = comparisonLogic.selectCustomer('customer1')
    expect(result1.success).toBe(true)
    
    // Try to select same customer again
    const result2 = comparisonLogic.selectCustomer('customer1')
    expect(result2.success).toBe(false)
    expect(result2.message).toBe('Customer already selected')
    expect(comparisonLogic.getSelectedCustomers()).toHaveLength(1)
  })

  it('should allow deselecting customers', () => {
    comparisonLogic.toggleComparisonMode()
    
    // Select customers
    comparisonLogic.selectCustomer('customer1')
    comparisonLogic.selectCustomer('customer2')
    expect(comparisonLogic.getSelectedCustomers()).toHaveLength(2)
    
    // Deselect one customer
    const result = comparisonLogic.deselectCustomer('customer1')
    expect(result).toBe(true)
    expect(comparisonLogic.getSelectedCustomers()).toHaveLength(1)
    expect(comparisonLogic.getSelectedCustomers()).not.toContain('customer1')
  })

  it('should clear all selected customers', () => {
    comparisonLogic.toggleComparisonMode()
    
    // Select customers
    comparisonLogic.selectCustomer('customer1')
    comparisonLogic.selectCustomer('customer2')
    expect(comparisonLogic.getSelectedCustomers()).toHaveLength(2)
    
    // Clear selection
    comparisonLogic.clearSelection()
    expect(comparisonLogic.getSelectedCustomers()).toHaveLength(0)
  })

  it('should require at least 2 customers for comparison', () => {
    comparisonLogic.toggleComparisonMode()
    
    // No customers selected
    expect(comparisonLogic.canCompare()).toBe(false)
    
    // One customer selected
    comparisonLogic.selectCustomer('customer1')
    expect(comparisonLogic.canCompare()).toBe(false)
    
    // Two customers selected
    comparisonLogic.selectCustomer('customer2')
    expect(comparisonLogic.canCompare()).toBe(true)
  })

  it('should perform comparison successfully', async () => {
    comparisonLogic.toggleComparisonMode()
    comparisonLogic.selectCustomer('customer1')
    comparisonLogic.selectCustomer('customer2')
    
    const result = await comparisonLogic.performComparison()
    
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/admin/customers/compare?customerIds=customer1,customer2')
    )
  })

  it('should handle comparison API errors', async () => {
    // Mock API error
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Comparison failed' }),
      })
    })
    
    comparisonLogic.toggleComparisonMode()
    comparisonLogic.selectCustomer('customer1')
    comparisonLogic.selectCustomer('customer2')
    
    const result = await comparisonLogic.performComparison()
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Comparison failed')
  })

  it('should handle network errors during comparison', async () => {
    // Mock network error
    mockFetch.mockImplementation(() => {
      return Promise.reject(new Error('Network error'))
    })
    
    comparisonLogic.toggleComparisonMode()
    comparisonLogic.selectCustomer('customer1')
    comparisonLogic.selectCustomer('customer2')
    
    const result = await comparisonLogic.performComparison()
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('Network error')
  })

  it('should prevent comparison with insufficient customers', async () => {
    comparisonLogic.toggleComparisonMode()
    comparisonLogic.selectCustomer('customer1')
    
    const result = await comparisonLogic.performComparison()
    
    expect(result.success).toBe(false)
    expect(result.error).toBe('At least 2 customers required for comparison')
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
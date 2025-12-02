import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { triggerCustomer360Update } from './real-time-updates'
import type { Customer360UpdateData } from '@/types/customer-360'

// Mock the pusher module
const mockPusher = {
  trigger: vi.fn().mockResolvedValue(undefined),
}

vi.mock('./pusher', () => ({
  getPusherServer: vi.fn(() => mockPusher),
}))

describe('Real-time Updates Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPusher.trigger.mockResolvedValue(undefined)
  })

  /**
   * **Feature: customer-360-dashboard, Property 6: Real-time update propagation**
   * **Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5**
   * 
   * For any customer data change, all open dashboard sessions viewing that customer 
   * should receive the update within 5 seconds.
   */
  it('should propagate updates to customer-specific channel', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }), // customerId
      fc.constantFrom('order', 'loyalty', 'support', 'profile', 'notes', 'tags'), // updateType
      fc.record({
        timestamp: fc.date(),
        data: fc.record({
          id: fc.string(),
          type: fc.string(),
          description: fc.string(),
        }),
      }), // updateData
      async (customerId, updateType, updateData) => {
        // Clear mocks for this iteration
        mockPusher.trigger.mockClear()
        
        // Arrange
        const customer360Update: Customer360UpdateData = {
          customerId,
          updateType,
          ...updateData,
        }

        // Act
        await triggerCustomer360Update(customer360Update)

        // Assert - Update should be sent to customer-specific channel
        expect(mockPusher.trigger).toHaveBeenCalledWith(
          `customer-360-${customerId}`,
          'customer-updated',
          customer360Update
        )
      }
    ), { numRuns: 100 })
  })

  it('should handle update propagation failures gracefully', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }), // customerId
      fc.constantFrom('order', 'loyalty', 'support', 'profile', 'notes', 'tags'), // updateType
      async (customerId, updateType) => {
        // Clear mocks for this iteration
        mockPusher.trigger.mockClear()
        
        // Arrange - Mock Pusher to throw an error
        mockPusher.trigger.mockRejectedValueOnce(new Error('Network error'))

        const updateData: Customer360UpdateData = {
          customerId,
          updateType,
          timestamp: new Date(),
          data: { id: 'test', type: 'test' },
        }

        // Act & Assert - Should not throw error
        await expect(triggerCustomer360Update(updateData)).resolves.not.toThrow()
      }
    ), { numRuns: 100 })
  })

  // Unit test for multiple customers (not property-based due to complexity)
  it('should propagate updates to multiple customer channels', async () => {
    // Clear mocks
    mockPusher.trigger.mockClear()
    
    const customerIds = ['customer1', 'customer2', 'customer3']
    const updateType = 'order'
    const updateData = {
      timestamp: new Date(),
      data: { id: 'test', type: 'test' },
    }

    // Act - Trigger updates for multiple customers
    const updatePromises = customerIds.map(customerId =>
      triggerCustomer360Update({
        customerId,
        updateType,
        ...updateData,
      })
    )

    await Promise.all(updatePromises)

    // Assert - Each customer should receive their update
    expect(mockPusher.trigger).toHaveBeenCalledTimes(customerIds.length)
    
    customerIds.forEach(customerId => {
      expect(mockPusher.trigger).toHaveBeenCalledWith(
        `customer-360-${customerId}`,
        'customer-updated',
        expect.objectContaining({
          customerId,
          updateType,
        })
      )
    })
  })

  // Unit test for sequential updates (not property-based due to complexity)
  it('should maintain update order for sequential updates', async () => {
    // Clear mocks
    mockPusher.trigger.mockClear()
    
    const customerId = 'test-customer'
    const updateTypes = ['order', 'loyalty', 'support']

    // Act - Send multiple updates sequentially
    const updates = updateTypes.map((updateType, index) => ({
      customerId,
      updateType,
      timestamp: new Date(Date.now() + index * 1000), // Ensure chronological order
      data: { id: `update-${index}`, sequence: index },
    }))

    for (const update of updates) {
      await triggerCustomer360Update(update)
    }

    // Assert - All updates should be sent in order
    expect(mockPusher.trigger).toHaveBeenCalledTimes(updateTypes.length)
    
    updates.forEach((update, index) => {
      expect(mockPusher.trigger).toHaveBeenNthCalledWith(
        index + 1,
        `customer-360-${customerId}`,
        'customer-updated',
        update
      )
    })
  })
})
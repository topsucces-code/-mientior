import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  triggerCustomerOrderUpdate,
  triggerCustomerLoyaltyUpdate,
  triggerCustomerSupportUpdate,
  triggerCustomerProfileUpdate,
  triggerCustomerNotesUpdate,
  triggerCustomerTagsUpdate,
} from './real-time-updates'

// Mock the pusher module
const mockPusher = {
  trigger: vi.fn().mockResolvedValue(undefined),
}

vi.mock('./pusher', () => ({
  getPusherServer: vi.fn(() => mockPusher),
}))

describe('Real-time Updates Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPusher.trigger.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Order Update Broadcasting', () => {
    it('should broadcast order updates with correct format', async () => {
      // Arrange
      const customerId = 'customer-123'
      const orderData = {
        orderId: 'order-456',
        orderNumber: 'ORD-2023-001',
        status: 'shipped',
        total: 99.99,
        timestamp: new Date('2023-12-01T10:00:00Z'),
      }

      // Act
      await triggerCustomerOrderUpdate(customerId, orderData)

      // Assert
      expect(mockPusher.trigger).toHaveBeenCalledWith(
        'customer-360-customer-123',
        'customer-updated',
        {
          customerId: 'customer-123',
          updateType: 'order',
          timestamp: orderData.timestamp,
          data: {
            id: 'order-456',
            type: 'order_updated',
            description: 'Order ORD-2023-001 status changed to shipped',
            orderNumber: 'ORD-2023-001',
            status: 'shipped',
            total: 99.99,
          },
        }
      )
    })

    it('should handle multiple order updates for same customer', async () => {
      // Arrange
      const customerId = 'customer-123'
      const orders = [
        {
          orderId: 'order-1',
          orderNumber: 'ORD-001',
          status: 'processing',
          total: 50.00,
          timestamp: new Date('2023-12-01T10:00:00Z'),
        },
        {
          orderId: 'order-2',
          orderNumber: 'ORD-002',
          status: 'shipped',
          total: 75.00,
          timestamp: new Date('2023-12-01T11:00:00Z'),
        },
      ]

      // Act
      for (const order of orders) {
        await triggerCustomerOrderUpdate(customerId, order)
      }

      // Assert
      expect(mockPusher.trigger).toHaveBeenCalledTimes(2)
      expect(mockPusher.trigger).toHaveBeenNthCalledWith(
        1,
        'customer-360-customer-123',
        'customer-updated',
        expect.objectContaining({
          customerId: 'customer-123',
          updateType: 'order',
          data: expect.objectContaining({
            orderNumber: 'ORD-001',
            status: 'processing',
          }),
        })
      )
      expect(mockPusher.trigger).toHaveBeenNthCalledWith(
        2,
        'customer-360-customer-123',
        'customer-updated',
        expect.objectContaining({
          customerId: 'customer-123',
          updateType: 'order',
          data: expect.objectContaining({
            orderNumber: 'ORD-002',
            status: 'shipped',
          }),
        })
      )
    })
  })

  describe('Loyalty Update Broadcasting', () => {
    it('should broadcast loyalty updates with correct format', async () => {
      // Arrange
      const customerId = 'customer-123'
      const loyaltyData = {
        pointsChange: 100,
        newBalance: 1500,
        tier: 'Gold',
        reason: 'Purchase reward',
        timestamp: new Date('2023-12-01T10:00:00Z'),
      }

      // Act
      await triggerCustomerLoyaltyUpdate(customerId, loyaltyData)

      // Assert
      expect(mockPusher.trigger).toHaveBeenCalledWith(
        'customer-360-customer-123',
        'customer-updated',
        {
          customerId: 'customer-123',
          updateType: 'loyalty',
          timestamp: loyaltyData.timestamp,
          data: {
            id: expect.stringMatching(/^loyalty-\d+$/),
            type: 'loyalty_updated',
            description: 'Purchase reward: +100 points',
            pointsChange: 100,
            newBalance: 1500,
            tier: 'Gold',
          },
        }
      )
    })

    it('should handle negative points changes', async () => {
      // Arrange
      const customerId = 'customer-123'
      const loyaltyData = {
        pointsChange: -50,
        newBalance: 950,
        reason: 'Points redemption',
        timestamp: new Date('2023-12-01T10:00:00Z'),
      }

      // Act
      await triggerCustomerLoyaltyUpdate(customerId, loyaltyData)

      // Assert
      expect(mockPusher.trigger).toHaveBeenCalledWith(
        'customer-360-customer-123',
        'customer-updated',
        expect.objectContaining({
          data: expect.objectContaining({
            description: 'Points redemption: -50 points',
            pointsChange: -50,
            newBalance: 950,
          }),
        })
      )
    })
  })

  describe('Support Update Broadcasting', () => {
    it('should broadcast support ticket updates with correct format', async () => {
      // Arrange
      const customerId = 'customer-123'
      const supportData = {
        ticketId: 'ticket-789',
        ticketNumber: 'SUP-2023-001',
        status: 'resolved',
        priority: 'high',
        subject: 'Payment issue',
        timestamp: new Date('2023-12-01T10:00:00Z'),
      }

      // Act
      await triggerCustomerSupportUpdate(customerId, supportData)

      // Assert
      expect(mockPusher.trigger).toHaveBeenCalledWith(
        'customer-360-customer-123',
        'customer-updated',
        {
          customerId: 'customer-123',
          updateType: 'support',
          timestamp: supportData.timestamp,
          data: {
            id: 'ticket-789',
            type: 'support_updated',
            description: 'Support ticket SUP-2023-001: Payment issue',
            ticketNumber: 'SUP-2023-001',
            status: 'resolved',
            priority: 'high',
            subject: 'Payment issue',
          },
        }
      )
    })
  })

  describe('Profile Update Broadcasting', () => {
    it('should broadcast profile updates with correct format', async () => {
      // Arrange
      const customerId = 'customer-123'
      const profileData = {
        field: 'email',
        oldValue: 'old@example.com',
        newValue: 'new@example.com',
        timestamp: new Date('2023-12-01T10:00:00Z'),
      }

      // Act
      await triggerCustomerProfileUpdate(customerId, profileData)

      // Assert
      expect(mockPusher.trigger).toHaveBeenCalledWith(
        'customer-360-customer-123',
        'customer-updated',
        {
          customerId: 'customer-123',
          updateType: 'profile',
          timestamp: profileData.timestamp,
          data: {
            id: expect.stringMatching(/^profile-\d+$/),
            type: 'profile_updated',
            description: 'Profile email updated',
            field: 'email',
            oldValue: 'old@example.com',
            newValue: 'new@example.com',
          },
        }
      )
    })
  })

  describe('Notes Update Broadcasting', () => {
    it('should broadcast note updates with correct format', async () => {
      // Arrange
      const customerId = 'customer-123'
      const noteData = {
        noteId: 'note-456',
        content: 'Customer called about shipping delay',
        authorName: 'John Admin',
        timestamp: new Date('2023-12-01T10:00:00Z'),
      }

      // Act
      await triggerCustomerNotesUpdate(customerId, noteData)

      // Assert
      expect(mockPusher.trigger).toHaveBeenCalledWith(
        'customer-360-customer-123',
        'customer-updated',
        {
          customerId: 'customer-123',
          updateType: 'notes',
          timestamp: noteData.timestamp,
          data: {
            id: 'note-456',
            type: 'note_added',
            description: 'New note added by John Admin',
            content: 'Customer called about shipping delay',
            authorName: 'John Admin',
          },
        }
      )
    })
  })

  describe('Tags Update Broadcasting', () => {
    it('should broadcast tag addition with correct format', async () => {
      // Arrange
      const customerId = 'customer-123'
      const tagData = {
        tagId: 'tag-789',
        tagName: 'VIP Customer',
        action: 'added' as const,
        timestamp: new Date('2023-12-01T10:00:00Z'),
      }

      // Act
      await triggerCustomerTagsUpdate(customerId, tagData)

      // Assert
      expect(mockPusher.trigger).toHaveBeenCalledWith(
        'customer-360-customer-123',
        'customer-updated',
        {
          customerId: 'customer-123',
          updateType: 'tags',
          timestamp: tagData.timestamp,
          data: {
            id: 'tag-789',
            type: 'tag_added',
            description: 'Tag "VIP Customer" added',
            tagName: 'VIP Customer',
            action: 'added',
          },
        }
      )
    })

    it('should broadcast tag removal with correct format', async () => {
      // Arrange
      const customerId = 'customer-123'
      const tagData = {
        tagId: 'tag-789',
        tagName: 'VIP Customer',
        action: 'removed' as const,
        timestamp: new Date('2023-12-01T10:00:00Z'),
      }

      // Act
      await triggerCustomerTagsUpdate(customerId, tagData)

      // Assert
      expect(mockPusher.trigger).toHaveBeenCalledWith(
        'customer-360-customer-123',
        'customer-updated',
        {
          customerId: 'customer-123',
          updateType: 'tags',
          timestamp: tagData.timestamp,
          data: {
            id: 'tag-789',
            type: 'tag_removed',
            description: 'Tag "VIP Customer" removed',
            tagName: 'VIP Customer',
            action: 'removed',
          },
        }
      )
    })
  })

  describe('Multi-session Synchronization', () => {
    it('should broadcast updates to all sessions viewing the same customer', async () => {
      // Arrange
      const customerId = 'customer-123'
      const orderData = {
        orderId: 'order-456',
        orderNumber: 'ORD-2023-001',
        status: 'shipped',
        total: 99.99,
        timestamp: new Date('2023-12-01T10:00:00Z'),
      }

      // Act - Simulate multiple updates that would affect multiple admin sessions
      await Promise.all([
        triggerCustomerOrderUpdate(customerId, orderData),
        triggerCustomerLoyaltyUpdate(customerId, {
          pointsChange: 100,
          newBalance: 1500,
          reason: 'Purchase reward',
          timestamp: new Date('2023-12-01T10:00:00Z'),
        }),
        triggerCustomerNotesUpdate(customerId, {
          noteId: 'note-456',
          content: 'Order shipped successfully',
          authorName: 'System',
          timestamp: new Date('2023-12-01T10:00:00Z'),
        }),
      ])

      // Assert - All updates should be sent to the same customer channel
      expect(mockPusher.trigger).toHaveBeenCalledTimes(3)
      
      // All calls should target the same customer channel
      const calls = mockPusher.trigger.mock.calls
      calls.forEach(call => {
        expect(call[0]).toBe('customer-360-customer-123')
        expect(call[1]).toBe('customer-updated')
        expect(call[2]).toHaveProperty('customerId', 'customer-123')
      })

      // Verify different update types
      const updateTypes = calls.map(call => call[2].updateType)
      expect(updateTypes).toContain('order')
      expect(updateTypes).toContain('loyalty')
      expect(updateTypes).toContain('notes')
    })

    it('should handle concurrent updates without interference', async () => {
      // Arrange
      const customerIds = ['customer-1', 'customer-2', 'customer-3']
      
      // Act - Simulate concurrent updates for different customers
      const updatePromises = customerIds.map(customerId =>
        triggerCustomerOrderUpdate(customerId, {
          orderId: `order-${customerId}`,
          orderNumber: `ORD-${customerId}`,
          status: 'processing',
          total: 100.00,
          timestamp: new Date('2023-12-01T10:00:00Z'),
        })
      )

      await Promise.all(updatePromises)

      // Assert - Each customer should receive their own update
      expect(mockPusher.trigger).toHaveBeenCalledTimes(3)
      
      customerIds.forEach(customerId => {
        expect(mockPusher.trigger).toHaveBeenCalledWith(
          `customer-360-${customerId}`,
          'customer-updated',
          expect.objectContaining({
            customerId,
            updateType: 'order',
          })
        )
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle Pusher failures gracefully', async () => {
      // Arrange
      mockPusher.trigger.mockRejectedValueOnce(new Error('Pusher connection failed'))
      
      const customerId = 'customer-123'
      const orderData = {
        orderId: 'order-456',
        orderNumber: 'ORD-2023-001',
        status: 'shipped',
        total: 99.99,
        timestamp: new Date('2023-12-01T10:00:00Z'),
      }

      // Act & Assert - Should not throw error
      await expect(triggerCustomerOrderUpdate(customerId, orderData)).resolves.not.toThrow()
    })

    it('should continue processing other updates after one fails', async () => {
      // Arrange
      mockPusher.trigger
        .mockRejectedValueOnce(new Error('First update failed'))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)

      const customerId = 'customer-123'

      // Act
      await Promise.all([
        triggerCustomerOrderUpdate(customerId, {
          orderId: 'order-1',
          orderNumber: 'ORD-001',
          status: 'processing',
          total: 50.00,
          timestamp: new Date('2023-12-01T10:00:00Z'),
        }),
        triggerCustomerLoyaltyUpdate(customerId, {
          pointsChange: 100,
          newBalance: 1500,
          reason: 'Purchase reward',
          timestamp: new Date('2023-12-01T10:00:00Z'),
        }),
        triggerCustomerNotesUpdate(customerId, {
          noteId: 'note-456',
          content: 'Test note',
          authorName: 'Admin',
          timestamp: new Date('2023-12-01T10:00:00Z'),
        }),
      ])

      // Assert - All three updates should have been attempted
      expect(mockPusher.trigger).toHaveBeenCalledTimes(3)
    })
  })
})
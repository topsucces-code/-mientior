import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TimelineService, TimelineEvent } from './timeline-service'
import { prisma } from './prisma'
import fc from 'fast-check'

// Mock Prisma
vi.mock('./prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn()
    },
    order: {
      findMany: vi.fn()
    },
    customerNote: {
      findMany: vi.fn()
    },
    newsletterSubscription: {
      findMany: vi.fn()
    }
  }
}))

describe('TimelineService', () => {
  let service: TimelineService

  beforeEach(() => {
    service = new TimelineService()
    vi.clearAllMocks()
  })

  describe('Property 3: Timeline chronological ordering', () => {
    /**
     * **Feature: customer-360-dashboard, Property 3: Timeline chronological ordering**
     * **Validates: Requirements 7.1, 7.3**
     * 
     * For any timeline view, events should be displayed in reverse chronological order (newest first).
     */
    it('should always return events in reverse chronological order', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary customer data
          fc.record({
            id: fc.uuid(),
            email: fc.emailAddress(),
            createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-01-01') })
          }),
          // Generate arbitrary orders with random timestamps
          fc.array(
            fc.record({
              id: fc.uuid(),
              orderNumber: fc.string({ minLength: 6, maxLength: 10 }),
              status: fc.constantFrom('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'),
              total: fc.double({ min: 10, max: 1000 }),
              createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-11-01') }),
              updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-01') })
            }).filter(order => order.updatedAt >= order.createdAt),
            { minLength: 0, maxLength: 20 }
          ),
          // Generate arbitrary notes with random timestamps
          fc.array(
            fc.record({
              id: fc.uuid(),
              customerId: fc.uuid(),
              content: fc.string({ minLength: 10, maxLength: 200 }),
              createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-01') }),
              author: fc.record({
                name: fc.string({ minLength: 3, maxLength: 20 }),
                email: fc.emailAddress()
              })
            }),
            { minLength: 0, maxLength: 10 }
          ),
          // Generate arbitrary newsletter subscriptions
          fc.array(
            fc.record({
              id: fc.uuid(),
              email: fc.emailAddress(),
              isActive: fc.boolean(),
              createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-01') })
            }),
            { minLength: 0, maxLength: 5 }
          ),
          async (customer, orders, notes, subscriptions) => {
            // Skip if any dates are invalid (NaN)
            const isValidDate = (date: Date) => !isNaN(date.getTime())
            if (!isValidDate(customer.createdAt)) return
            if (orders.some(o => !isValidDate(o.createdAt) || !isValidDate(o.updatedAt))) return
            if (notes.some(n => !isValidDate(n.createdAt))) return
            if (subscriptions.some(s => !isValidDate(s.createdAt))) return

            // Mock Prisma responses
            vi.mocked(prisma.user.findUnique).mockResolvedValue(customer as any)
            vi.mocked(prisma.order.findMany).mockResolvedValue(orders as any)
            vi.mocked(prisma.customerNote.findMany).mockResolvedValue(notes as any)
            vi.mocked(prisma.newsletterSubscription.findMany).mockResolvedValue(
              subscriptions.map(sub => ({ ...sub, email: customer.email })) as any
            )

            // Get timeline
            const result = await service.getCustomerTimeline(customer.id)

            // Property: All events should be in reverse chronological order (newest first)
            for (let i = 0; i < result.events.length - 1; i++) {
              const currentEvent = result.events[i]
              const nextEvent = result.events[i + 1]
              
              expect(
                currentEvent.timestamp.getTime()
              ).toBeGreaterThanOrEqual(
                nextEvent.timestamp.getTime()
              )
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('getCustomerTimeline', () => {
    it('should aggregate events from multiple sources', async () => {
      const customerId = 'test-customer-id'
      const customer = {
        id: customerId,
        email: 'test@example.com',
        createdAt: new Date('2023-01-01')
      }

      const orders = [
        {
          id: 'order-1',
          orderNumber: 'ORD-001',
          status: 'COMPLETED',
          total: 100,
          createdAt: new Date('2023-06-01'),
          updatedAt: new Date('2023-06-01')
        }
      ]

      const notes = [
        {
          id: 'note-1',
          customerId,
          content: 'Test note',
          createdAt: new Date('2023-07-01'),
          author: {
            name: 'Admin User',
            email: 'admin@example.com'
          }
        }
      ]

      vi.mocked(prisma.user.findUnique).mockResolvedValue(customer as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(orders as any)
      vi.mocked(prisma.customerNote.findMany).mockResolvedValue(notes as any)
      vi.mocked(prisma.newsletterSubscription.findMany).mockResolvedValue([])

      const result = await service.getCustomerTimeline(customerId)

      expect(result.events.length).toBeGreaterThan(0)
      expect(result.events.some(e => e.type === 'order')).toBe(true)
      expect(result.events.some(e => e.type === 'note')).toBe(true)
      expect(result.events.some(e => e.type === 'account')).toBe(true)
    })

    it('should filter events by type', async () => {
      const customerId = 'test-customer-id'
      const customer = {
        id: customerId,
        email: 'test@example.com',
        createdAt: new Date('2023-01-01')
      }

      const orders = [
        {
          id: 'order-1',
          orderNumber: 'ORD-001',
          status: 'COMPLETED',
          total: 100,
          createdAt: new Date('2023-06-01'),
          updatedAt: new Date('2023-06-01')
        }
      ]

      vi.mocked(prisma.user.findUnique).mockResolvedValue(customer as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(orders as any)
      vi.mocked(prisma.customerNote.findMany).mockResolvedValue([])
      vi.mocked(prisma.newsletterSubscription.findMany).mockResolvedValue([])

      const result = await service.getCustomerTimeline(customerId, { type: 'order' })

      expect(result.events.every(e => e.type === 'order')).toBe(true)
    })

    it('should filter events by date range', async () => {
      const customerId = 'test-customer-id'
      const customer = {
        id: customerId,
        email: 'test@example.com',
        createdAt: new Date('2023-01-01')
      }

      const from = new Date('2023-05-01')
      const to = new Date('2023-07-01')

      // Only return orders within the date range (simulating Prisma's date filtering)
      const ordersInRange = [
        {
          id: 'order-1',
          orderNumber: 'ORD-001',
          status: 'COMPLETED',
          total: 100,
          createdAt: new Date('2023-06-01'),
          updatedAt: new Date('2023-06-01')
        }
      ]

      vi.mocked(prisma.user.findUnique).mockResolvedValue(customer as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(ordersInRange as any)
      vi.mocked(prisma.customerNote.findMany).mockResolvedValue([])
      vi.mocked(prisma.newsletterSubscription.findMany).mockResolvedValue([])

      const result = await service.getCustomerTimeline(customerId, { from, to })

      // All events should be within the date range
      result.events.forEach(event => {
        expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(from.getTime())
        expect(event.timestamp.getTime()).toBeLessThanOrEqual(to.getTime())
      })
    })

    it('should implement pagination correctly', async () => {
      const customerId = 'test-customer-id'
      const customer = {
        id: customerId,
        email: 'test@example.com',
        createdAt: new Date('2023-01-01')
      }

      // Create 10 orders
      const orders = Array.from({ length: 10 }, (_, i) => ({
        id: `order-${i}`,
        orderNumber: `ORD-${i.toString().padStart(3, '0')}`,
        status: 'COMPLETED',
        total: 100,
        createdAt: new Date(`2023-${(i + 1).toString().padStart(2, '0')}-01`),
        updatedAt: new Date(`2023-${(i + 1).toString().padStart(2, '0')}-01`)
      }))

      vi.mocked(prisma.user.findUnique).mockResolvedValue(customer as any)
      vi.mocked(prisma.order.findMany).mockResolvedValue(orders as any)
      vi.mocked(prisma.customerNote.findMany).mockResolvedValue([])
      vi.mocked(prisma.newsletterSubscription.findMany).mockResolvedValue([])

      // Get first page
      const page1 = await service.getCustomerTimeline(customerId, { limit: 5, offset: 0 })
      expect(page1.events.length).toBe(5)
      expect(page1.hasMore).toBe(true)

      // Get second page
      const page2 = await service.getCustomerTimeline(customerId, { limit: 5, offset: 5 })
      expect(page2.events.length).toBe(5)
      expect(page2.hasMore).toBe(true)

      // Get third page (should have remaining events)
      const page3 = await service.getCustomerTimeline(customerId, { limit: 5, offset: 10 })
      expect(page3.events.length).toBeGreaterThan(0)
    })

    it('should throw error for non-existent customer', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      await expect(
        service.getCustomerTimeline('non-existent-id')
      ).rejects.toThrow('Customer not found')
    })
  })

  describe('formatEventForDisplay', () => {
    it('should add display properties to events', () => {
      const event: TimelineEvent = {
        id: 'test-1',
        type: 'order',
        title: 'Test Order',
        description: 'Test description',
        timestamp: new Date()
      }

      const formatted = service.formatEventForDisplay(event)

      expect(formatted.icon).toBeDefined()
      expect(formatted.color).toBeDefined()
      expect(formatted.formattedTime).toBeDefined()
    })

    it('should format recent timestamps correctly', () => {
      const now = new Date()
      const event: TimelineEvent = {
        id: 'test-1',
        type: 'order',
        title: 'Test Order',
        description: 'Test description',
        timestamp: new Date(now.getTime() - 30 * 60000) // 30 minutes ago
      }

      const formatted = service.formatEventForDisplay(event)
      expect(formatted.formattedTime).toContain('minute')
    })
  })
})

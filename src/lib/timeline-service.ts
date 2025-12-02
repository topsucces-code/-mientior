import { prisma } from '@/lib/prisma'

export interface TimelineEvent {
  id: string
  type: 'order' | 'support' | 'loyalty' | 'marketing' | 'account' | 'note'
  title: string
  description: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface TimelineFilters {
  type?: string
  from?: Date
  to?: Date
  limit?: number
  offset?: number
}

export interface TimelineResult {
  events: TimelineEvent[]
  hasMore: boolean
  total: number
}

/**
 * Timeline service for aggregating customer events
 * 
 * Requirements:
 * - 7.1: Display interaction timeline with all customer activities
 * - 7.2: Include orders, support tickets, loyalty events, marketing interactions, and account changes
 * - 7.3: Show event type, description, timestamp, and relevant details
 * - 7.4: Allow filtering by event type and date range
 * - 7.5: Load events with infinite scroll or pagination
 */
export class TimelineService {
  /**
   * Get customer timeline events with filtering and pagination
   * 
   * @param customerId - Customer ID
   * @param filters - Filtering options
   * @returns Timeline events with pagination info
   */
  async getCustomerTimeline(
    customerId: string,
    filters: TimelineFilters = {}
  ): Promise<TimelineResult> {
    const {
      type,
      from,
      to,
      limit = 50,
      offset = 0
    } = filters

    // Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { id: true, createdAt: true, email: true }
    })

    if (!customer) {
      throw new Error('Customer not found')
    }

    const events: TimelineEvent[] = []

    // Build date filter for queries
    const dateFilter: { gte?: Date; lte?: Date } = {}
    if (from) dateFilter.gte = from
    if (to) dateFilter.lte = to

    // Fetch order events
    if (!type || type === 'order') {
      const orderEvents = await this.getOrderEvents(customerId, dateFilter)
      events.push(...orderEvents)
    }

    // Fetch note events
    if (!type || type === 'note') {
      const noteEvents = await this.getNoteEvents(customerId, dateFilter)
      events.push(...noteEvents)
    }

    // Fetch account events
    if (!type || type === 'account') {
      const accountEvents = this.getAccountEvents(customer, dateFilter)
      events.push(...accountEvents)
    }

    // Fetch marketing events (newsletter subscriptions)
    if (!type || type === 'marketing') {
      const marketingEvents = await this.getMarketingEvents(customer.email, dateFilter)
      events.push(...marketingEvents)
    }

    // Sort all events by timestamp (newest first) - Requirement 7.1, 7.3
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // Calculate pagination
    const total = events.length
    const paginatedEvents = events.slice(offset, offset + limit)
    const hasMore = offset + limit < total

    return {
      events: paginatedEvents,
      hasMore,
      total
    }
  }

  /**
   * Get order events for timeline
   */
  private async getOrderEvents(
    customerId: string,
    dateFilter: { gte?: Date; lte?: Date }
  ): Promise<TimelineEvent[]> {
    const orders = await prisma.order.findMany({
      where: {
        userId: customerId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        updatedAt: true
      }
    })

    const events: TimelineEvent[] = []

    for (const order of orders) {
      // Order creation event
      events.push({
        id: `order-created-${order.id}`,
        type: 'order',
        title: `Order ${order.orderNumber} Placed`,
        description: `Order placed for €${order.total.toFixed(2)}`,
        timestamp: order.createdAt,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          total: order.total,
          action: 'created'
        }
      })

      // Order status update event (if updated after creation)
      if (order.updatedAt && order.updatedAt.getTime() !== order.createdAt.getTime()) {
        const updateInRange = 
          (!dateFilter.gte || order.updatedAt >= dateFilter.gte) &&
          (!dateFilter.lte || order.updatedAt <= dateFilter.lte)

        if (updateInRange) {
          events.push({
            id: `order-updated-${order.id}`,
            type: 'order',
            title: `Order ${order.orderNumber} Updated`,
            description: `Order status changed to ${order.status}`,
            timestamp: order.updatedAt,
            metadata: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
              action: 'updated'
            }
          })
        }
      }
    }

    return events
  }

  /**
   * Get customer note events for timeline
   */
  private async getNoteEvents(
    customerId: string,
    dateFilter: { gte?: Date; lte?: Date }
  ): Promise<TimelineEvent[]> {
    const notes = await prisma.customerNote.findMany({
      where: {
        customerId,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    return notes.map(note => ({
      id: `note-${note.id}`,
      type: 'note' as const,
      title: 'Note Added',
      description: note.content.length > 100 
        ? `${note.content.substring(0, 100)}...` 
        : note.content,
      timestamp: note.createdAt,
      metadata: {
        noteId: note.id,
        authorName: note.author.name,
        authorEmail: note.author.email,
        fullContent: note.content
      }
    }))
  }

  /**
   * Get account-related events for timeline
   */
  private getAccountEvents(
    customer: { id: string; createdAt: Date },
    dateFilter: { gte?: Date; lte?: Date }
  ): TimelineEvent[] {
    const events: TimelineEvent[] = []

    // Account creation event
    const accountCreated = customer.createdAt
    const includeAccountCreation = 
      (!dateFilter.gte || accountCreated >= dateFilter.gte) &&
      (!dateFilter.lte || accountCreated <= dateFilter.lte)

    if (includeAccountCreation) {
      events.push({
        id: `account-created-${customer.id}`,
        type: 'account',
        title: 'Account Created',
        description: 'Customer registered on the platform',
        timestamp: accountCreated,
        metadata: {
          action: 'registration'
        }
      })
    }

    return events
  }

  /**
   * Get marketing events for timeline (newsletter subscriptions)
   */
  private async getMarketingEvents(
    email: string,
    dateFilter: { gte?: Date; lte?: Date }
  ): Promise<TimelineEvent[]> {
    const subscriptions = await prisma.newsletterSubscription.findMany({
      where: {
        email,
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      orderBy: { createdAt: 'desc' }
    })

    return subscriptions.map(sub => ({
      id: `newsletter-${sub.id}`,
      type: 'marketing' as const,
      title: 'Newsletter Subscription',
      description: sub.isActive 
        ? 'Subscribed to newsletter' 
        : 'Unsubscribed from newsletter',
      timestamp: sub.createdAt,
      metadata: {
        subscriptionId: sub.id,
        isActive: sub.isActive
      }
    }))
  }

  /**
   * Format timeline event for display
   * 
   * @param event - Timeline event
   * @returns Formatted event with display-friendly properties
   */
  formatEventForDisplay(event: TimelineEvent): TimelineEvent & {
    icon: string
    color: string
    formattedTime: string
  } {
    const icons: Record<TimelineEvent['type'], string> = {
      order: '🛒',
      support: '💬',
      loyalty: '⭐',
      marketing: '📧',
      account: '👤',
      note: '📝'
    }

    const colors: Record<TimelineEvent['type'], string> = {
      order: 'blue',
      support: 'orange',
      loyalty: 'gold',
      marketing: 'green',
      account: 'purple',
      note: 'gray'
    }

    return {
      ...event,
      icon: icons[event.type],
      color: colors[event.type],
      formattedTime: this.formatTimestamp(event.timestamp)
    }
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

// Export singleton instance
export const timelineService = new TimelineService()

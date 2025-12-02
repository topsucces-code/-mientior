import { getPusherServer } from './pusher'
import type { Customer360UpdateData } from '@/types/customer-360'

/**
 * Trigger a Customer 360 dashboard update for a specific customer
 */
export async function triggerCustomer360Update(
  updateData: Customer360UpdateData
): Promise<void> {
  try {
    const pusher = getPusherServer()
    const channelName = `customer-360-${updateData.customerId}`
    
    await pusher.trigger(channelName, 'customer-updated', updateData)
  } catch (error) {
    console.error('Failed to trigger Customer 360 update:', error)
    // Don't throw - real-time updates should fail gracefully
  }
}

/**
 * Trigger order update for Customer 360 dashboard
 */
export async function triggerCustomerOrderUpdate(
  customerId: string,
  orderData: {
    orderId: string
    orderNumber: string
    status: string
    total: number
    timestamp: Date
  }
): Promise<void> {
  await triggerCustomer360Update({
    customerId,
    updateType: 'order',
    timestamp: orderData.timestamp,
    data: {
      id: orderData.orderId,
      type: 'order_updated',
      description: `Order ${orderData.orderNumber} status changed to ${orderData.status}`,
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      total: orderData.total,
    },
  })
}

/**
 * Trigger loyalty update for Customer 360 dashboard
 */
export async function triggerCustomerLoyaltyUpdate(
  customerId: string,
  loyaltyData: {
    pointsChange: number
    newBalance: number
    tier?: string
    reason: string
    timestamp: Date
  }
): Promise<void> {
  await triggerCustomer360Update({
    customerId,
    updateType: 'loyalty',
    timestamp: loyaltyData.timestamp,
    data: {
      id: `loyalty-${Date.now()}`,
      type: 'loyalty_updated',
      description: `${loyaltyData.reason}: ${loyaltyData.pointsChange > 0 ? '+' : ''}${loyaltyData.pointsChange} points`,
      pointsChange: loyaltyData.pointsChange,
      newBalance: loyaltyData.newBalance,
      tier: loyaltyData.tier,
    },
  })
}

/**
 * Trigger support ticket update for Customer 360 dashboard
 */
export async function triggerCustomerSupportUpdate(
  customerId: string,
  supportData: {
    ticketId: string
    ticketNumber: string
    status: string
    priority: string
    subject: string
    timestamp: Date
  }
): Promise<void> {
  await triggerCustomer360Update({
    customerId,
    updateType: 'support',
    timestamp: supportData.timestamp,
    data: {
      id: supportData.ticketId,
      type: 'support_updated',
      description: `Support ticket ${supportData.ticketNumber}: ${supportData.subject}`,
      ticketNumber: supportData.ticketNumber,
      status: supportData.status,
      priority: supportData.priority,
      subject: supportData.subject,
    },
  })
}

/**
 * Trigger profile update for Customer 360 dashboard
 */
export async function triggerCustomerProfileUpdate(
  customerId: string,
  profileData: {
    field: string
    oldValue?: any
    newValue: any
    timestamp: Date
  }
): Promise<void> {
  await triggerCustomer360Update({
    customerId,
    updateType: 'profile',
    timestamp: profileData.timestamp,
    data: {
      id: `profile-${Date.now()}`,
      type: 'profile_updated',
      description: `Profile ${profileData.field} updated`,
      field: profileData.field,
      oldValue: profileData.oldValue,
      newValue: profileData.newValue,
    },
  })
}

/**
 * Trigger notes update for Customer 360 dashboard
 */
export async function triggerCustomerNotesUpdate(
  customerId: string,
  noteData: {
    noteId: string
    content: string
    authorName: string
    timestamp: Date
  }
): Promise<void> {
  await triggerCustomer360Update({
    customerId,
    updateType: 'notes',
    timestamp: noteData.timestamp,
    data: {
      id: noteData.noteId,
      type: 'note_added',
      description: `New note added by ${noteData.authorName}`,
      content: noteData.content,
      authorName: noteData.authorName,
    },
  })
}

/**
 * Trigger tags update for Customer 360 dashboard
 */
export async function triggerCustomerTagsUpdate(
  customerId: string,
  tagData: {
    tagId: string
    tagName: string
    action: 'added' | 'removed'
    timestamp: Date
  }
): Promise<void> {
  await triggerCustomer360Update({
    customerId,
    updateType: 'tags',
    timestamp: tagData.timestamp,
    data: {
      id: tagData.tagId,
      type: `tag_${tagData.action}`,
      description: `Tag "${tagData.tagName}" ${tagData.action}`,
      tagName: tagData.tagName,
      action: tagData.action,
    },
  })
}

// Re-export from pusher.ts for convenience
export { getPusherServer } from './pusher'
import { prisma } from './prisma';
import { NotificationType } from '@prisma/client';

// Types for notifications
export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  data?: Record<string, unknown>;
}

export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  limit?: number;
  offset?: number;
}

// Notification type labels (French)
export const notificationTypeLabels: Record<NotificationType, string> = {
  ORDER_UPDATE: 'Mise à jour commande',
  PAYMENT_UPDATE: 'Mise à jour paiement',
  DELIVERY_UPDATE: 'Mise à jour livraison',
  PROMO_OFFER: 'Offre promotionnelle',
  PRICE_DROP: 'Baisse de prix',
  BACK_IN_STOCK: 'Retour en stock',
  REVIEW_REQUEST: 'Demande d\'avis',
  SUPPORT_UPDATE: 'Mise à jour support',
  SYSTEM_ALERT: 'Alerte système',
};

// Notification type icons
export const notificationTypeIcons: Record<NotificationType, string> = {
  ORDER_UPDATE: 'package',
  PAYMENT_UPDATE: 'credit-card',
  DELIVERY_UPDATE: 'truck',
  PROMO_OFFER: 'tag',
  PRICE_DROP: 'trending-down',
  BACK_IN_STOCK: 'box',
  REVIEW_REQUEST: 'star',
  SUPPORT_UPDATE: 'message-circle',
  SYSTEM_ALERT: 'alert-circle',
};

/**
 * Create a new notification for a user
 */
export async function createNotification(input: CreateNotificationInput) {
  const notification = await prisma.userNotification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link,
      data: input.data as object | undefined,
    },
  });

  return notification;
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationInput, 'userId'>
) {
  const notifications = await prisma.userNotification.createMany({
    data: userIds.map(userId => ({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      data: notification.data as object | undefined,
    })),
  });

  return notifications;
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  filters: NotificationFilters = {}
) {
  const { type, read, limit = 20, offset = 0 } = filters;

  const where: Record<string, unknown> = { userId };

  if (type) {
    where.type = type;
  }

  if (read !== undefined) {
    where.read = read;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.userNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.userNotification.count({ where }),
    prisma.userNotification.count({
      where: { userId, read: false },
    }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    limit,
    offset,
  };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.userNotification.count({
    where: { userId, read: false },
  });
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  const notification = await prisma.userNotification.updateMany({
    where: {
      id: notificationId,
      userId, // Ensure user owns the notification
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  return notification.count > 0;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  const result = await prisma.userNotification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
      readAt: new Date(),
    },
  });

  return result.count;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
  const result = await prisma.userNotification.deleteMany({
    where: {
      id: notificationId,
      userId,
    },
  });

  return result.count > 0;
}

/**
 * Delete all read notifications older than X days
 */
export async function cleanupOldNotifications(daysOld: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.userNotification.deleteMany({
    where: {
      read: true,
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}

// ==================== NOTIFICATION TRIGGERS ====================

/**
 * Send order status update notification
 */
export async function notifyOrderUpdate(
  userId: string,
  orderId: string,
  orderNumber: string,
  status: string,
  message: string
) {
  return createNotification({
    userId,
    type: 'ORDER_UPDATE',
    title: `Commande #${orderNumber}`,
    message,
    link: `/account/orders/${orderId}`,
    data: { orderId, orderNumber, status },
  });
}

/**
 * Send payment update notification
 */
export async function notifyPaymentUpdate(
  userId: string,
  orderId: string,
  orderNumber: string,
  status: 'success' | 'failed' | 'pending',
  message: string
) {
  return createNotification({
    userId,
    type: 'PAYMENT_UPDATE',
    title: `Paiement ${status === 'success' ? 'confirmé' : status === 'failed' ? 'échoué' : 'en attente'}`,
    message,
    link: `/account/orders/${orderId}`,
    data: { orderId, orderNumber, paymentStatus: status },
  });
}

/**
 * Send delivery update notification
 */
export async function notifyDeliveryUpdate(
  userId: string,
  orderId: string,
  orderNumber: string,
  status: string,
  message: string
) {
  return createNotification({
    userId,
    type: 'DELIVERY_UPDATE',
    title: `Livraison - Commande #${orderNumber}`,
    message,
    link: `/account/orders/${orderId}`,
    data: { orderId, orderNumber, deliveryStatus: status },
  });
}

/**
 * Send promotional offer notification
 */
export async function notifyPromoOffer(
  userId: string,
  promoCode: string,
  discount: string,
  expiresAt?: Date
) {
  return createNotification({
    userId,
    type: 'PROMO_OFFER',
    title: 'Offre spéciale pour vous !',
    message: `Utilisez le code ${promoCode} pour bénéficier de ${discount} de réduction`,
    link: '/promotions',
    data: { promoCode, discount, expiresAt: expiresAt?.toISOString() },
  });
}

/**
 * Send price drop notification
 */
export async function notifyPriceDrop(
  userId: string,
  productId: string,
  productName: string,
  oldPrice: number,
  newPrice: number,
  currency: string = 'XOF'
) {
  const discount = Math.round(((oldPrice - newPrice) / oldPrice) * 100);
  
  return createNotification({
    userId,
    type: 'PRICE_DROP',
    title: 'Baisse de prix !',
    message: `${productName} est maintenant à ${newPrice} ${currency} (-${discount}%)`,
    link: `/products/${productId}`,
    data: { productId, productName, oldPrice, newPrice, discount, currency },
  });
}

/**
 * Send back in stock notification
 */
export async function notifyBackInStock(
  userId: string,
  productId: string,
  productName: string
) {
  return createNotification({
    userId,
    type: 'BACK_IN_STOCK',
    title: 'Retour en stock !',
    message: `${productName} est de nouveau disponible`,
    link: `/products/${productId}`,
    data: { productId, productName },
  });
}

/**
 * Send review request notification
 */
export async function notifyReviewRequest(
  userId: string,
  orderId: string,
  orderNumber: string,
  productId: string,
  productName: string
) {
  return createNotification({
    userId,
    type: 'REVIEW_REQUEST',
    title: 'Donnez votre avis',
    message: `Comment avez-vous trouvé "${productName}" ? Partagez votre expérience !`,
    link: `/products/${productId}#reviews`,
    data: { orderId, orderNumber, productId, productName },
  });
}

/**
 * Send support ticket update notification
 */
export async function notifySupportUpdate(
  userId: string,
  ticketId: string,
  ticketNumber: string,
  message: string
) {
  return createNotification({
    userId,
    type: 'SUPPORT_UPDATE',
    title: `Ticket #${ticketNumber}`,
    message,
    link: `/support/tickets/${ticketId}`,
    data: { ticketId, ticketNumber },
  });
}

/**
 * Send system alert notification
 */
export async function notifySystemAlert(
  userId: string,
  title: string,
  message: string,
  link?: string
) {
  return createNotification({
    userId,
    type: 'SYSTEM_ALERT',
    title,
    message,
    link,
  });
}

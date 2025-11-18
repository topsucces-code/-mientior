import Pusher from 'pusher';

// Server-side Pusher instance
let pusherServer: Pusher | null = null;

export function getPusherServer(): Pusher {
  if (!pusherServer) {
    if (
      !process.env.PUSHER_APP_ID ||
      !process.env.PUSHER_KEY ||
      !process.env.PUSHER_SECRET ||
      !process.env.PUSHER_CLUSTER
    ) {
      throw new Error(
        'Pusher environment variables are not configured. Please set PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, and PUSHER_CLUSTER.'
      );
    }

    pusherServer = new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return pusherServer;
}

/**
 * Trigger a notification to all admin users
 */
export async function triggerAdminNotification(
  event: string,
  data: any
): Promise<void> {
  try {
    const pusher = getPusherServer();
    await pusher.trigger('admin-notifications', event, data);
  } catch (error) {
    console.error('Failed to trigger admin notification:', error);
  }
}

/**
 * Trigger an order update notification
 */
export async function triggerOrderUpdate(
  orderId: string,
  data: {
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
  }
): Promise<void> {
  await triggerAdminNotification('order-updated', {
    orderId,
    ...data,
  });
}

/**
 * Trigger a new order notification
 */
export async function triggerNewOrder(data: {
  orderId: string;
  orderNumber: string;
  total: number;
  customerEmail: string;
}): Promise<void> {
  await triggerAdminNotification('order-created', data);
}

/**
 * Trigger a notification to a specific admin user
 */
export async function triggerUserNotification(
  adminUserId: string,
  event: string,
  data: any
): Promise<void> {
  try {
    const pusher = getPusherServer();
    await pusher.trigger(`admin-user-${adminUserId}`, event, data);
  } catch (error) {
    console.error('Failed to trigger user notification:', error);
  }
}

/**
 * Trigger a low stock alert
 */
export async function triggerLowStockAlert(data: {
  productId: string;
  productName: string;
  stock: number;
}): Promise<void> {
  await triggerAdminNotification('low-stock-alert', data);
}

/**
 * Trigger a bulk action completion notification
 */
export async function triggerBulkActionComplete(data: {
  action: string;
  resource: string;
  count: number;
  success: boolean;
}): Promise<void> {
  await triggerAdminNotification('bulk-action-complete', data);
}

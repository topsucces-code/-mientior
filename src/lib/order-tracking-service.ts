import { prisma } from './prisma';
import { TrackingEventType } from '@prisma/client';
import { notifyDeliveryUpdate, notifyOrderUpdate } from './notifications-service';

// Tracking event labels (French)
export const trackingEventLabels: Record<TrackingEventType, string> = {
  ORDER_PLACED: 'Commande passée',
  ORDER_CONFIRMED: 'Commande confirmée',
  PAYMENT_RECEIVED: 'Paiement reçu',
  PROCESSING: 'En préparation',
  PACKED: 'Emballée',
  SHIPPED: 'Expédiée',
  IN_TRANSIT: 'En transit',
  OUT_FOR_DELIVERY: 'En cours de livraison',
  DELIVERED: 'Livrée',
  DELIVERY_ATTEMPTED: 'Tentative de livraison',
  RETURNED_TO_SENDER: 'Retournée à l\'expéditeur',
  CANCELLED: 'Annulée',
};

// Tracking event descriptions
export const trackingEventDescriptions: Record<TrackingEventType, string> = {
  ORDER_PLACED: 'Votre commande a été enregistrée avec succès',
  ORDER_CONFIRMED: 'Votre commande a été confirmée par le vendeur',
  PAYMENT_RECEIVED: 'Votre paiement a été reçu et validé',
  PROCESSING: 'Votre commande est en cours de préparation',
  PACKED: 'Votre commande a été emballée et est prête à être expédiée',
  SHIPPED: 'Votre commande a été remise au transporteur',
  IN_TRANSIT: 'Votre colis est en route vers sa destination',
  OUT_FOR_DELIVERY: 'Votre colis est en cours de livraison',
  DELIVERED: 'Votre colis a été livré',
  DELIVERY_ATTEMPTED: 'Une tentative de livraison a été effectuée',
  RETURNED_TO_SENDER: 'Le colis a été retourné à l\'expéditeur',
  CANCELLED: 'La commande a été annulée',
};

// Tracking event icons
export const trackingEventIcons: Record<TrackingEventType, string> = {
  ORDER_PLACED: 'shopping-cart',
  ORDER_CONFIRMED: 'check-circle',
  PAYMENT_RECEIVED: 'credit-card',
  PROCESSING: 'clock',
  PACKED: 'package',
  SHIPPED: 'truck',
  IN_TRANSIT: 'map-pin',
  OUT_FOR_DELIVERY: 'navigation',
  DELIVERED: 'check-circle-2',
  DELIVERY_ATTEMPTED: 'alert-circle',
  RETURNED_TO_SENDER: 'rotate-ccw',
  CANCELLED: 'x-circle',
};

// Event order for progress calculation
const eventOrder: TrackingEventType[] = [
  'ORDER_PLACED',
  'ORDER_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PROCESSING',
  'PACKED',
  'SHIPPED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

export interface CreateTrackingEventInput {
  orderId: string;
  eventType: TrackingEventType;
  title?: string;
  description?: string;
  location?: string;
  carrier?: string;
  trackingNumber?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a new tracking event for an order
 */
export async function createTrackingEvent(input: CreateTrackingEventInput) {
  const {
    orderId,
    eventType,
    title = trackingEventLabels[eventType],
    description = trackingEventDescriptions[eventType],
    location,
    carrier,
    trackingNumber,
    metadata,
  } = input;

  // Create tracking event
  const trackingEvent = await prisma.orderTracking.create({
    data: {
      orderId,
      eventType,
      title,
      description,
      location,
      carrier,
      trackingNumber,
      metadata: metadata as object | undefined,
    },
  });

  // Get order details for notification
  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    select: {
      userId: true,
      orderNumber: true,
    },
  });

  // Send notification to user
  if (order) {
    const notificationMessage = description || trackingEventDescriptions[eventType];
    
    if (eventType.includes('DELIVERY') || eventType === 'SHIPPED' || eventType === 'IN_TRANSIT' || eventType === 'OUT_FOR_DELIVERY') {
      await notifyDeliveryUpdate(
        order.userId,
        orderId,
        order.orderNumber,
        eventType,
        notificationMessage
      );
    } else {
      await notifyOrderUpdate(
        order.userId,
        orderId,
        order.orderNumber,
        eventType,
        notificationMessage
      );
    }
  }

  return trackingEvent;
}

/**
 * Get all tracking events for an order
 */
export async function getOrderTracking(orderId: string) {
  const events = await prisma.orderTracking.findMany({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate progress
  const latestEvent = events[0];
  let progress = 0;
  
  if (latestEvent) {
    const eventIndex = eventOrder.indexOf(latestEvent.eventType);
    if (eventIndex !== -1) {
      progress = Math.round(((eventIndex + 1) / eventOrder.length) * 100);
    }
    
    // Handle terminal states
    if (latestEvent.eventType === 'DELIVERED') {
      progress = 100;
    } else if (latestEvent.eventType === 'CANCELLED' || latestEvent.eventType === 'RETURNED_TO_SENDER') {
      progress = -1; // Indicates failed/cancelled
    }
  }

  return {
    events,
    latestEvent,
    progress,
    isDelivered: latestEvent?.eventType === 'DELIVERED',
    isCancelled: latestEvent?.eventType === 'CANCELLED',
    isReturned: latestEvent?.eventType === 'RETURNED_TO_SENDER',
  };
}

/**
 * Get tracking by tracking number
 */
export async function getTrackingByNumber(trackingNumber: string) {
  const events = await prisma.orderTracking.findMany({
    where: { trackingNumber },
    orderBy: { createdAt: 'desc' },
  });

  if (events.length === 0 || !events[0]) {
    return null;
  }

  const orderId = events[0].orderId;
  return getOrderTracking(orderId);
}

/**
 * Get latest tracking event for an order
 */
export async function getLatestTrackingEvent(orderId: string) {
  return prisma.orderTracking.findFirst({
    where: { orderId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Update tracking with external carrier data
 */
export async function syncExternalTracking(
  orderId: string,
  carrier: string,
  trackingNumber: string,
  externalEvents: Array<{
    eventType: TrackingEventType;
    title: string;
    description?: string;
    location?: string;
    timestamp: Date;
  }>
) {
  // Get existing events
  const existingEvents = await prisma.orderTracking.findMany({
    where: { orderId },
    select: { eventType: true, createdAt: true },
  });

  const existingEventKeys = new Set(
    existingEvents.map(e => `${e.eventType}-${e.createdAt.toISOString().split('T')[0]}`)
  );

  // Add new events that don't exist
  const newEvents = externalEvents.filter(
    e => !existingEventKeys.has(`${e.eventType}-${e.timestamp.toISOString().split('T')[0]}`)
  );

  if (newEvents.length > 0) {
    await prisma.orderTracking.createMany({
      data: newEvents.map(e => ({
        orderId,
        eventType: e.eventType,
        title: e.title,
        description: e.description,
        location: e.location,
        carrier,
        trackingNumber,
        createdAt: e.timestamp,
      })),
    });
  }

  return getOrderTracking(orderId);
}

/**
 * Get estimated delivery date based on current status
 */
export function getEstimatedDelivery(
  latestEventType: TrackingEventType,
  shippedAt?: Date,
  countryCode: string = 'SN'
): { min: Date; max: Date } | null {
  if (!shippedAt) return null;

  // Delivery estimates by country (in days)
  const deliveryEstimates: Record<string, { min: number; max: number }> = {
    // West Africa
    SN: { min: 2, max: 5 },
    CI: { min: 2, max: 5 },
    ML: { min: 3, max: 7 },
    BF: { min: 3, max: 7 },
    GN: { min: 3, max: 7 },
    TG: { min: 3, max: 6 },
    BJ: { min: 3, max: 6 },
    NE: { min: 4, max: 8 },
    // Central Africa
    CM: { min: 3, max: 7 },
    GA: { min: 4, max: 8 },
    CG: { min: 4, max: 8 },
    CD: { min: 5, max: 10 },
    // East Africa
    KE: { min: 3, max: 7 },
    TZ: { min: 4, max: 8 },
    UG: { min: 4, max: 8 },
    RW: { min: 4, max: 8 },
    // North Africa
    MA: { min: 3, max: 6 },
    DZ: { min: 3, max: 7 },
    TN: { min: 3, max: 6 },
    EG: { min: 4, max: 8 },
    // Southern Africa
    ZA: { min: 3, max: 7 },
    // Nigeria
    NG: { min: 3, max: 7 },
    // Ghana
    GH: { min: 3, max: 6 },
    // Default
    DEFAULT: { min: 5, max: 14 },
  };

  const estimate = deliveryEstimates[countryCode] ?? deliveryEstimates.DEFAULT ?? { min: 5, max: 14 };

  // Adjust based on current status
  let adjustment = 0;
  switch (latestEventType) {
    case 'SHIPPED':
      adjustment = 0;
      break;
    case 'IN_TRANSIT':
      adjustment = -1;
      break;
    case 'OUT_FOR_DELIVERY':
      adjustment = -estimate.min + 1;
      break;
    default:
      adjustment = 0;
  }

  const minDate = new Date(shippedAt);
  minDate.setDate(minDate.getDate() + Math.max(1, estimate.min + adjustment));

  const maxDate = new Date(shippedAt);
  maxDate.setDate(maxDate.getDate() + Math.max(2, estimate.max + adjustment));

  return { min: minDate, max: maxDate };
}

/**
 * Format tracking timeline for display
 */
export function formatTrackingTimeline(events: Array<{
  id: string;
  eventType: TrackingEventType;
  title: string;
  description?: string | null;
  location?: string | null;
  carrier?: string | null;
  createdAt: Date;
}>) {
  return events.map((event, index) => ({
    ...event,
    label: trackingEventLabels[event.eventType],
    icon: trackingEventIcons[event.eventType],
    isLatest: index === 0,
    formattedDate: new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(event.createdAt)),
  }));
}

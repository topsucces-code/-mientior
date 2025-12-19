import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-server';
import { 
  getOrderTracking,
  getEstimatedDelivery,
  formatTrackingTimeline,
} from '@/lib/order-tracking-service';
import { prisma } from '@/lib/prisma';

// GET /api/orders/[id]/tracking - Get order tracking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify order belongs to user
    const order = await prisma.orders.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        orderNumber: true,
        status: true,
        countryCode: true,
        createdAt: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Get tracking data
    const tracking = await getOrderTracking(id);
    
    // Format timeline
    const timeline = formatTrackingTimeline(tracking.events);

    // Get estimated delivery if applicable
    let estimatedDelivery = null;
    if (tracking.latestEvent && !tracking.isDelivered && !tracking.isCancelled) {
      const shippedEvent = tracking.events.find(e => e.eventType === 'SHIPPED');
      if (shippedEvent) {
        estimatedDelivery = getEstimatedDelivery(
          tracking.latestEvent.eventType,
          shippedEvent.createdAt,
          order.countryCode || 'SN'
        );
      }
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      timeline,
      latestEvent: tracking.latestEvent,
      progress: tracking.progress,
      isDelivered: tracking.isDelivered,
      isCancelled: tracking.isCancelled,
      isReturned: tracking.isReturned,
      estimatedDelivery: estimatedDelivery ? {
        min: estimatedDelivery.min.toISOString(),
        max: estimatedDelivery.max.toISOString(),
      } : null,
      trackingNumber: tracking.latestEvent?.trackingNumber,
      carrier: tracking.latestEvent?.carrier,
    });
  } catch (error) {
    console.error('Error fetching order tracking:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du suivi' },
      { status: 500 }
    );
  }
}

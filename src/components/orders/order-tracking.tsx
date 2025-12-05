'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ShoppingCart, 
  CheckCircle, 
  CreditCard, 
  Clock, 
  Package, 
  Truck, 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrackingEventType } from '@prisma/client';
import { useTranslations } from 'next-intl';

interface TrackingEvent {
  id: string;
  eventType: TrackingEventType;
  title: string;
  description?: string | null;
  location?: string | null;
  carrier?: string | null;
  createdAt: string;
  label: string;
  icon: string;
  isLatest: boolean;
  formattedDate: string;
}

interface OrderTrackingProps {
  orderId: string;
  orderNumber: string;
  initialData?: {
    timeline: TrackingEvent[];
    progress: number;
    isDelivered: boolean;
    isCancelled: boolean;
    isReturned: boolean;
    estimatedDelivery?: { min: string; max: string } | null;
    trackingNumber?: string | null;
    carrier?: string | null;
  };
}

// Icon mapping
const eventIcons: Record<string, React.ElementType> = {
  'shopping-cart': ShoppingCart,
  'check-circle': CheckCircle,
  'credit-card': CreditCard,
  'clock': Clock,
  'package': Package,
  'truck': Truck,
  'map-pin': MapPin,
  'navigation': Navigation,
  'check-circle-2': CheckCircle2,
  'alert-circle': AlertCircle,
  'rotate-ccw': RotateCcw,
  'x-circle': XCircle,
};

// Status colors
const eventColors: Record<TrackingEventType, { bg: string; text: string; border: string }> = {
  ORDER_PLACED: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  ORDER_CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300' },
  PAYMENT_RECEIVED: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-300' },
  PROCESSING: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-300' },
  PACKED: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-300' },
  SHIPPED: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-300' },
  IN_TRANSIT: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-300' },
  OUT_FOR_DELIVERY: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300' },
  DELIVERED: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300' },
  DELIVERY_ATTEMPTED: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-300' },
  RETURNED_TO_SENDER: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' },
  CANCELLED: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-300' },
};

export default function OrderTracking({ orderId, orderNumber, initialData }: OrderTrackingProps) {
  const t = useTranslations('tracking');
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch tracking data
  const fetchTracking = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const response = await fetch(`/api/orders/${orderId}/tracking`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement du suivi');
      }

      const trackingData = await response.json();
      setData(trackingData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!initialData) {
      fetchTracking();
    }
  }, [orderId, initialData, fetchTracking]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-gray-600">{error}</p>
        <button
          onClick={() => fetchTracking()}
          className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
        >
          {t('refresh')}
        </button>
      </div>
    );
  }

  if (!data || data.timeline.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{t('title')}</p>
      </div>
    );
  }

  const { timeline, progress, isDelivered, isCancelled, isReturned, estimatedDelivery, trackingNumber, carrier } = data;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 sm:px-6 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {t('orderNumber', { number: orderNumber })}
            </h3>
            {trackingNumber && carrier && (
              <p className="text-sm text-gray-500 mt-1">
                {carrier} - {trackingNumber}
              </p>
            )}
          </div>
          <button
            onClick={() => fetchTracking(false)}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 rounded-full transition-colors"
            title={t('refresh')}
          >
            <RefreshCw className={cn('h-5 w-5', isRefreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {!isCancelled && !isReturned && (
        <div className="px-4 py-4 sm:px-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{t('progress')}</span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={cn(
                'h-2.5 rounded-full transition-all duration-500',
                isDelivered ? 'bg-green-500' : 'bg-emerald-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Estimated delivery */}
          {estimatedDelivery && !isDelivered && (
            <p className="text-sm text-gray-500 mt-3">
              <span className="font-medium">Livraison estimée :</span>{' '}
              {new Date(estimatedDelivery.min).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              {' - '}
              {new Date(estimatedDelivery.max).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            </p>
          )}
        </div>
      )}

      {/* Status banner */}
      {isDelivered && (
        <div className="px-4 py-3 bg-green-50 border-b border-green-100">
          <div className="flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">
              Votre commande a été livrée avec succès !
            </span>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-100">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              Cette commande a été annulée
            </span>
          </div>
        </div>
      )}

      {isReturned && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
          <div className="flex items-center">
            <RotateCcw className="h-5 w-5 text-amber-600 mr-2" />
            <span className="text-sm font-medium text-amber-800">
              Le colis a été retourné à l'expéditeur
            </span>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="px-4 py-4 sm:px-6">
        <div className="flow-root">
          <ul className="-mb-8">
            {timeline.map((event, eventIdx) => {
              const Icon = eventIcons[event.icon] || Package;
              const colors = eventColors[event.eventType] || eventColors.ORDER_PLACED;
              const isLast = eventIdx === timeline.length - 1;

              return (
                <li key={event.id}>
                  <div className="relative pb-8">
                    {/* Connector line */}
                    {!isLast && (
                      <span
                        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}

                    <div className="relative flex space-x-3">
                      {/* Icon */}
                      <div>
                        <span
                          className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white',
                            event.isLatest ? colors.bg : 'bg-gray-100',
                            event.isLatest ? colors.text : 'text-gray-400'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1.5">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={cn(
                              'text-sm',
                              event.isLatest ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                            )}>
                              {event.title}
                            </p>
                            {event.description && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                {event.description}
                              </p>
                            )}
                            {event.location && (
                              <p className="text-sm text-gray-400 mt-0.5 flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {event.location}
                              </p>
                            )}
                          </div>
                          <time className="text-xs text-gray-400 whitespace-nowrap ml-2">
                            {event.formattedDate}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* External tracking link */}
      {trackingNumber && carrier && (
        <div className="px-4 py-3 sm:px-6 border-t border-gray-100 bg-gray-50">
          <a
            href={getCarrierTrackingUrl(carrier, trackingNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Suivre sur le site du transporteur
            <ExternalLink className="h-4 w-4 ml-1" />
          </a>
        </div>
      )}
    </div>
  );
}

// Helper to get carrier tracking URL
function getCarrierTrackingUrl(carrier: string, trackingNumber: string): string {
  const carrierUrls: Record<string, string> = {
    'DHL': `https://www.dhl.com/fr-fr/home/tracking.html?tracking-id=${trackingNumber}`,
    'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`,
    'UPS': `https://www.ups.com/track?tracknum=${trackingNumber}`,
    'Chronopost': `https://www.chronopost.fr/tracking-no-cms/suivi-page?liession=${trackingNumber}`,
    'Colissimo': `https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`,
  };

  return carrierUrls[carrier] || `https://www.google.com/search?q=${carrier}+tracking+${trackingNumber}`;
}

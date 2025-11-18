'use client';

import { Package, Truck, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustFeature {
  icon: React.ReactNode;
  text: string;
  highlight?: boolean;
}

interface TrustBadgesProps {
  features: TrustFeature[];
  estimatedDelivery?: { min: Date; max: Date };
  shippingOrigin?: string;
  internationalShipping?: boolean;
}

export function TrustBadges({
  features,
  estimatedDelivery,
  shippingOrigin = 'France',
  internationalShipping = true,
}: TrustBadgesProps) {
  const formatDeliveryDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);
  };

  return (
    <div className="border-t border-b border-platinum-300 py-6">
      {/* Trust Features Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className={cn(
              'flex items-center gap-3 p-4 rounded-lg transition-all duration-200',
              'hover:-translate-y-0.5 hover:shadow-md',
              feature.highlight
                ? 'bg-orange-50 border-2 border-orange-500'
                : 'bg-platinum-50 border border-platinum-200'
            )}
          >
            <div
              className={cn(
                'flex-shrink-0',
                feature.highlight ? 'text-orange-500' : 'text-success'
              )}
            >
              {feature.icon}
            </div>
            <span
              className={cn(
                'text-sm font-medium',
                feature.highlight ? 'text-orange-600' : 'text-anthracite-500'
              )}
            >
              {feature.text}
            </span>
          </div>
        ))}
      </div>

      {/* Shipping Information */}
      {estimatedDelivery && (
        <div className="border-t border-platinum-200 pt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-nuanced-700">
            <Truck className="w-4 h-4 text-success" />
            <span>
              <strong>Livraison estimée:</strong>{' '}
              {formatDeliveryDate(estimatedDelivery.min)} -{' '}
              {formatDeliveryDate(estimatedDelivery.max)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-nuanced-700">
            <Package className="w-4 h-4 text-success" />
            <span>
              <strong>Expédié depuis:</strong> {shippingOrigin}
            </span>
          </div>
          {internationalShipping && (
            <div className="flex items-center gap-2 text-sm text-nuanced-700">
              <Globe className="w-4 h-4 text-success" />
              <span>
                <strong>Livraison internationale disponible</strong>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

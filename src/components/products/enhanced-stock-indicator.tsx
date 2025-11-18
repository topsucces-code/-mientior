'use client';

import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedStockIndicatorProps {
  stock: number;
  threshold?: number;
  lowStockThreshold?: number;
}

export function EnhancedStockIndicator({
  stock,
  threshold = 20,
  lowStockThreshold = 10,
}: EnhancedStockIndicatorProps) {
  // Only show indicator when stock is below threshold
  if (stock >= threshold) {
    return null;
  }

  const isLowStock = stock <= lowStockThreshold;
  const percentage = Math.min((stock / threshold) * 100, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {isLowStock ? (
          <AlertCircle className="h-4 w-4 text-orange-600" />
        ) : (
          <Check className="h-4 w-4 text-green-600" />
        )}
        <span
          className={cn(
            'text-[13px] font-semibold',
            isLowStock ? 'text-orange-600' : 'text-green-600'
          )}
        >
          {isLowStock
            ? `Plus que ${stock} en stock - Dépêchez-vous !`
            : `${stock} en stock`}
        </span>
      </div>
      <div className="h-1.5 w-full bg-platinum-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 rounded-full',
            isLowStock
              ? 'bg-gradient-to-r from-orange-600 to-orange-700'
              : 'bg-gradient-to-r from-green-500 to-green-600'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

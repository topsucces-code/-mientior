'use client';

import { Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Size {
  value: string;
  available: boolean;
  stock?: number;
}

interface EnhancedSizeSelectorProps {
  sizes: Size[];
  selected: string;
  onChange: (size: string) => void;
  onGuideClick: () => void;
  disabled?: boolean;
}

export function EnhancedSizeSelector({
  sizes,
  selected,
  onChange,
  onGuideClick,
  disabled = false,
}: EnhancedSizeSelectorProps) {
  const lowStockThreshold = 5;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-graphite-900">Taille</label>
        <button
          type="button"
          onClick={onGuideClick}
          className="flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 transition-colors"
        >
          <Ruler className="h-4 w-4" />
          Guide des tailles
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isLowStock = size.available && size.stock && size.stock > 0 && size.stock <= lowStockThreshold;
          const isUnavailable = !size.available || (size.stock !== undefined && size.stock === 0);

          return (
            <div key={size.value} className="relative">
              <button
                type="button"
                onClick={() => !isUnavailable && !disabled && onChange(size.value)}
                disabled={isUnavailable || disabled}
                className={cn(
                  'relative min-w-[56px] h-[56px] px-4 rounded-lg border-2 transition-all duration-200',
                  'text-[15px] font-semibold',
                  'hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                  selected === size.value
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'bg-white text-graphite-900 border-platinum-300',
                  isUnavailable && 'hover:bg-white'
                )}
              >
                {size.value}
                {isUnavailable && (
                  <span
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    aria-hidden="true"
                  >
                    <span className="absolute w-full h-[2px] bg-graphite-400 rotate-[-45deg]" />
                  </span>
                )}
              </button>
              {isLowStock && !isUnavailable && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                  Bientôt épuisé
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

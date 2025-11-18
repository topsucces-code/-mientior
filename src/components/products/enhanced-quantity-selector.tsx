'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedQuantitySelectorProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function EnhancedQuantitySelector({
  value,
  min = 1,
  max = 10,
  onChange,
  disabled = false,
}: EnhancedQuantitySelectorProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-graphite-900">Quantité</label>
      <div className="inline-flex items-center border-2 border-platinum-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className={cn(
            'h-11 w-11 flex items-center justify-center transition-all duration-150',
            'hover:bg-platinum-100 hover:text-orange-600',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current',
            'focus:outline-none focus:bg-platinum-100'
          )}
          aria-label="Diminuer la quantité"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          disabled={disabled}
          className={cn(
            'w-[60px] h-11 text-center font-semibold text-graphite-900 border-x-2 border-platinum-300',
            'focus:outline-none focus:bg-platinum-50',
            'disabled:opacity-60 disabled:cursor-not-allowed',
            // Hide number input spinner controls
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          )}
          aria-label="Quantité"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className={cn(
            'h-11 w-11 flex items-center justify-center transition-all duration-150',
            'hover:bg-platinum-100 hover:text-orange-600',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-current',
            'focus:outline-none focus:bg-platinum-100'
          )}
          aria-label="Augmenter la quantité"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

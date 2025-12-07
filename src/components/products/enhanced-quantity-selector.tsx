'use client';

import * as React from 'react';
import { Minus, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedQuantitySelectorProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  debounceMs?: number;
}

export function EnhancedQuantitySelector({
  value,
  min = 1,
  max = 10,
  onChange,
  disabled = false,
  debounceMs = 500,
}: EnhancedQuantitySelectorProps) {
  const [localValue, setLocalValue] = React.useState(value);
  const [isSaving, setIsSaving] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync local value with prop value
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange handler
  const debouncedOnChange = React.useCallback((newValue: number) => {
    setLocalValue(newValue);
    setIsSaving(true);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
      setIsSaving(false);
    }, debounceMs);
  }, [onChange, debounceMs]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleDecrement = () => {
    if (localValue > min) {
      debouncedOnChange(localValue - 1);
    }
  };

  const handleIncrement = () => {
    if (localValue < max) {
      debouncedOnChange(localValue + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      debouncedOnChange(newValue);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-graphite-900">Quantité</label>
        {isSaving && (
          <span className="flex items-center gap-1 text-xs text-nuanced-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Enregistrement...
          </span>
        )}
      </div>
      <div className="inline-flex items-center border-2 border-platinum-300 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || localValue <= min}
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
          value={localValue}
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
          disabled={disabled || localValue >= max}
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

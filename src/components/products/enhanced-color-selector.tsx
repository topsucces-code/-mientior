'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Color {
  id: string;
  name: string;
  hex: string;
  image?: string;
}

interface EnhancedColorSelectorProps {
  colors: Color[];
  selected: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export function EnhancedColorSelector({
  colors,
  selected,
  onChange,
  disabled = false,
}: EnhancedColorSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-graphite-900">
          Couleur
        </label>
        {selected && (
          <span className="text-sm text-graphite-600">
            {colors.find((c) => c.id === selected)?.name}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => (
          <button
            key={color.id}
            type="button"
            onClick={() => !disabled && onChange(color.id)}
            disabled={disabled}
            aria-label={`Sélectionner la couleur ${color.name}`}
            className={cn(
              'relative h-11 w-11 rounded-full transition-all duration-200',
              'hover:scale-115 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
              selected === color.id
                ? 'ring-4 ring-orange-500/20 border-[3px] border-orange-500 shadow-elevation-2'
                : 'border-[3px] border-transparent shadow-elevation-1'
            )}
            style={{
              backgroundColor: color.hex,
              backgroundImage: color.image ? `url(${color.image})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {selected === color.id && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Check className="h-5 w-5 text-white drop-shadow-md" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

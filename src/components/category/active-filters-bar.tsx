'use client'

import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COLOR_HEX_MAP } from '@/lib/constants'
import type { Filter, AvailableFilters } from '@/types'

export interface ActiveFiltersBarProps {
  filters: Filter
  availableFilters: AvailableFilters
  onRemoveFilter: (filterType: keyof Filter, value?: string) => void
  onClearAll: () => void
}

export function ActiveFiltersBar({
  filters,
  availableFilters,
  onRemoveFilter,
  onClearAll
}: ActiveFiltersBarProps) {
  const activeFiltersList: Array<{
    type: keyof Filter
    value?: string
    label: string
  }> = []

  // Price range
  if (filters.priceRange && (
    filters.priceRange.min !== availableFilters.priceRange.min ||
    filters.priceRange.max !== availableFilters.priceRange.max
  )) {
    activeFiltersList.push({
      type: 'priceRange',
      label: `Prix: ${filters.priceRange.min}€ - ${filters.priceRange.max}€`
    })
  }

  // Categories
  filters.categories?.forEach(categoryId => {
    const category = availableFilters.categories.find(c => c.id === categoryId)
    if (category) {
      activeFiltersList.push({
        type: 'categories',
        value: categoryId,
        label: category.name
      })
    }
  })

  // Brands
  filters.brands?.forEach(brandId => {
    const brand = availableFilters.brands.find(b => b.id === brandId)
    if (brand) {
      activeFiltersList.push({
        type: 'brands',
        value: brandId,
        label: brand.name
      })
    }
  })

  // Colors
  filters.colors?.forEach(color => {
    activeFiltersList.push({
      type: 'colors',
      value: color,
      label: color
    })
  })

  // Sizes
  filters.sizes?.forEach(size => {
    activeFiltersList.push({
      type: 'sizes',
      value: size,
      label: `Taille: ${size}`
    })
  })

  // Rating
  if (filters.rating && filters.rating > 0) {
    const stars = '⭐'.repeat(filters.rating)
    activeFiltersList.push({
      type: 'rating',
      label: `${stars}+`
    })
  }

  // In stock
  if (filters.inStock) {
    activeFiltersList.push({
      type: 'inStock',
      label: 'En stock'
    })
  }

  // On sale
  if (filters.onSale) {
    activeFiltersList.push({
      type: 'onSale',
      label: 'En promotion'
    })
  }

  // Don't render if no active filters
  if (activeFiltersList.length === 0) {
    return null
  }

  return (
    <div className="sticky top-[120px] z-20 bg-white border-b border-platinum-300 py-3 px-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-nuanced-600 mr-2">
          {activeFiltersList.length} {activeFiltersList.length === 1 ? 'filtre actif' : 'filtres actifs'}:
        </span>

        {/* Filter Pills */}
        {activeFiltersList.map((filter, index) => (
          <div
            key={`${filter.type}-${filter.value || 'single'}-${index}`}
            className="filter-pill-enter inline-flex items-center gap-2 bg-orange-50 border border-orange-500 rounded-full px-3 py-1.5 text-sm text-orange-700 font-medium"
          >
            {/* Show color swatch for color filters */}
            {filter.type === 'colors' && filter.value && COLOR_HEX_MAP[filter.value] && (
              <span
                className="inline-block w-3 h-3 rounded-full border border-orange-500"
                style={{ backgroundColor: COLOR_HEX_MAP[filter.value] }}
              />
            )}

            <span>{filter.label}</span>

            <button
              onClick={() => onRemoveFilter(filter.type, filter.value)}
              className={cn(
                'flex items-center justify-center w-4 h-4 rounded-full',
                'bg-orange-500 text-white hover:bg-orange-600',
                'transition-colors'
              )}
              aria-label={`Retirer le filtre ${filter.label}`}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {/* Clear All Button */}
        {activeFiltersList.length > 1 && (
          <button
            onClick={onClearAll}
            className={cn(
              'ml-auto px-4 py-1.5 rounded-full text-sm font-medium',
              'border border-platinum-400 text-nuanced-600',
              'hover:border-orange-500 hover:text-orange-500',
              'transition-colors'
            )}
          >
            Tout effacer
          </button>
        )}
      </div>
    </div>
  )
}

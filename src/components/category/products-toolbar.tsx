'use client'

import { Grid, List, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PLP_CONFIG } from '@/lib/constants'
import type { SortOption } from '@/types'

export interface ProductsToolbarProps {
  totalCount: number
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  itemsPerPage?: number
  onItemsPerPageChange?: (count: number) => void
}

const SORT_OPTIONS: Array<{ value: SortOption; key: string }> = [
  { value: 'relevance', key: 'relevance' },
  { value: 'price-asc', key: 'priceAsc' },
  { value: 'price-desc', key: 'priceDesc' },
  { value: 'rating', key: 'rating' },
  { value: 'newest', key: 'newest' },
  { value: 'bestseller', key: 'bestseller' }
]

export function ProductsToolbar({
  totalCount,
  currentSort,
  onSortChange,
  viewMode,
  onViewModeChange,
  itemsPerPage = PLP_CONFIG.defaultItemsPerPage,
  onItemsPerPageChange
}: ProductsToolbarProps) {
  const t = useTranslations('products.catalog.toolbar')

  return (
    <div className="sticky top-[120px] z-10 bg-white/95 backdrop-blur-md border-b border-platinum-300 p-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Section - Results Count */}
        <div className="text-base font-semibold text-anthracite-700">
          {t('productsFound', { count: totalCount })}
        </div>

        {/* Right Section - Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-nuanced-600 hidden sm:inline">{t('sortBy')}</span>
            <Select value={currentSort} onValueChange={(value) => onSortChange(value as SortOption)}>
              <SelectTrigger className="w-[200px] h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="shadow-elevation-3 rounded-lg">
                {SORT_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      {t(`sortOptions.${option.key}`)}
                      {currentSort === option.value && (
                        <Check className="h-4 w-4 text-orange-500" />
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Toggle (Desktop Only) */}
          <div className="hidden sm:flex items-center border border-platinum-300 rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'w-10 h-10 flex items-center justify-center transition-colors',
                viewMode === 'grid'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-nuanced-600 hover:bg-platinum-50'
              )}
              aria-label={t('viewGrid')}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={cn(
                'w-10 h-10 flex items-center justify-center transition-colors',
                viewMode === 'list'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-nuanced-600 hover:bg-platinum-50'
              )}
              aria-label={t('viewList')}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Items Per Page Selector (Desktop Only) */}
          {onItemsPerPageChange && (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-nuanced-600">{t('show')}</span>
              <div className="flex items-center border border-platinum-300 rounded-lg overflow-hidden">
                {PLP_CONFIG.itemsPerPageOptions.map((count) => (
                  <button
                    key={count}
                    onClick={() => onItemsPerPageChange(count)}
                    className={cn(
                      'px-3 h-10 text-sm font-medium transition-all',
                      itemsPerPage === count
                        ? 'bg-orange-50 border-orange-500 text-orange-700'
                        : 'bg-white text-nuanced-600 hover:bg-platinum-50',
                      count !== PLP_CONFIG.itemsPerPageOptions[0] && 'border-l border-platinum-300'
                    )}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

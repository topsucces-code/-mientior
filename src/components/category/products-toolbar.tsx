'use client'

import * as React from 'react'
import { Grid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { SortOption } from '@/types'

export interface ProductsToolbarProps {
  totalCount: number
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  showViewToggle?: boolean
  className?: string
}

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest First' },
  { value: 'bestseller', label: 'Best Sellers' },
]

export function ProductsToolbar({
  totalCount,
  currentSort,
  onSortChange,
  viewMode = 'grid',
  onViewModeChange,
  showViewToggle = true,
  className,
}: ProductsToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        'rounded-lg border border-platinum-300 bg-white p-4 shadow-sm',
        className
      )}
    >
      {/* Results Count */}
      <div className="flex items-center gap-2">
        <p className="text-sm text-anthracite-600">
          <span className="font-semibold text-anthracite-700">{totalCount.toLocaleString()}</span>{' '}
          {totalCount === 1 ? 'product' : 'products'}
        </p>
      </div>

      {/* Sort & View Controls */}
      <div className="flex items-center gap-3">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm font-medium text-anthracite-600 hidden sm:block">
            Sort by:
          </label>
          <Select value={currentSort} onValueChange={(value) => onSortChange(value as SortOption)}>
            <SelectTrigger
              id="sort-select"
              className="w-[180px] sm:w-[200px] h-9 text-sm border-platinum-400 focus:border-orange-500 focus:ring-orange-500"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-sm">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Toggle */}
        {showViewToggle && onViewModeChange && (
          <div className="hidden sm:flex items-center gap-1 rounded-md border border-platinum-300 p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'h-7 w-7 p-0 transition-colors',
                viewMode === 'grid'
                  ? 'bg-orange-500 text-white hover:bg-orange-600 hover:text-white'
                  : 'text-nuanced-500 hover:text-anthracite-600 hover:bg-platinum-50'
              )}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={cn(
                'h-7 w-7 p-0 transition-colors',
                viewMode === 'list'
                  ? 'bg-orange-500 text-white hover:bg-orange-600 hover:text-white'
                  : 'text-nuanced-500 hover:text-anthracite-600 hover:bg-platinum-50'
              )}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

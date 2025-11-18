'use client'

import { useState } from 'react'
import { Filter } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { FiltersSidebar } from './filters-sidebar'
import type { Filter as FilterType, AvailableFilters } from '@/types'

export interface MobileFilterDrawerProps {
  filters: FilterType
  availableFilters: AvailableFilters
  onFilterChange: (filters: FilterType) => void
  onClearFilters: () => void
  productCount: number
}

export function MobileFilterDrawer({
  filters,
  availableFilters,
  onFilterChange,
  onClearFilters,
  productCount
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  // Count active filters
  const activeFiltersCount = [
    filters.categories?.length ?? 0,
    filters.brands?.length ?? 0,
    filters.colors?.length ?? 0,
    filters.sizes?.length ?? 0,
    filters.rating ? 1 : 0,
    filters.inStock ? 1 : 0,
    filters.onSale ? 1 : 0,
    filters.priceRange ? 1 : 0
  ].reduce((sum, count) => sum + count, 0)

  const handleApply = async () => {
    setIsApplying(true)
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 300))
    setIsApplying(false)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-20 right-4 z-30 lg:hidden gap-2 shadow-elevation-3"
        >
          <Filter className="h-4 w-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[90vh] flex flex-col p-0"
      >
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-platinum-300">
          <SheetTitle className="text-lg font-semibold uppercase">
            FILTRES
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
          <FiltersSidebar
            filters={filters}
            availableFilters={availableFilters}
            onFilterChange={onFilterChange}
            onClearFilters={onClearFilters}
            isMobile={true}
          />
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-platinum-300 bg-white p-4 shadow-elevation-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onClearFilters}
              disabled={activeFiltersCount === 0}
              className="h-12 font-medium"
            >
              Réinitialiser
            </Button>
            <Button
              onClick={handleApply}
              disabled={isApplying}
              className="h-12 font-medium bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              {isApplying ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Chargement...
                </span>
              ) : (
                `Appliquer (${productCount})`
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

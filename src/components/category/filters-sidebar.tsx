'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { Filter, AvailableFilters } from '@/types'

export interface FiltersSidebarProps {
  filters: Filter
  availableFilters: AvailableFilters
  onFilterChange: (filters: Filter) => void
  onClearFilters: () => void
  className?: string
  isMobile?: boolean
}

export function FiltersSidebar({
  filters,
  availableFilters,
  onFilterChange,
  onClearFilters,
  className,
  isMobile = false,
}: FiltersSidebarProps) {
  const [priceRange, setPriceRange] = React.useState([
    filters.priceRange?.min ?? availableFilters.priceRange.min,
    filters.priceRange?.max ?? availableFilters.priceRange.max,
  ])

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value)
  }

  const handlePriceCommit = (value: number[]) => {
    onFilterChange({
      ...filters,
      priceRange: { min: value[0], max: value[1] },
    })
  }

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategories = filters.categories ?? []
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter((id) => id !== categoryId)
      : [...currentCategories, categoryId]

    onFilterChange({
      ...filters,
      categories: newCategories.length > 0 ? newCategories : undefined,
    })
  }

  const handleBrandToggle = (brandId: string) => {
    const currentBrands = filters.brands ?? []
    const newBrands = currentBrands.includes(brandId)
      ? currentBrands.filter((id) => id !== brandId)
      : [...currentBrands, brandId]

    onFilterChange({
      ...filters,
      brands: newBrands.length > 0 ? newBrands : undefined,
    })
  }

  const handleColorToggle = (color: string) => {
    const currentColors = filters.colors ?? []
    const newColors = currentColors.includes(color)
      ? currentColors.filter((c) => c !== color)
      : [...currentColors, color]

    onFilterChange({
      ...filters,
      colors: newColors.length > 0 ? newColors : undefined,
    })
  }

  const handleSizeToggle = (size: string) => {
    const currentSizes = filters.sizes ?? []
    const newSizes = currentSizes.includes(size)
      ? currentSizes.filter((s) => s !== size)
      : [...currentSizes, size]

    onFilterChange({
      ...filters,
      sizes: newSizes.length > 0 ? newSizes : undefined,
    })
  }

  const handleRatingChange = (rating: number) => {
    onFilterChange({
      ...filters,
      rating: filters.rating === rating ? undefined : rating,
    })
  }

  const handleStockToggle = () => {
    onFilterChange({
      ...filters,
      inStock: !filters.inStock,
    })
  }

  const handleSaleToggle = () => {
    onFilterChange({
      ...filters,
      onSale: !filters.onSale,
    })
  }

  const activeFiltersCount = [
    filters.categories?.length ?? 0,
    filters.brands?.length ?? 0,
    filters.colors?.length ?? 0,
    filters.sizes?.length ?? 0,
    filters.rating ? 1 : 0,
    filters.inStock ? 1 : 0,
    filters.onSale ? 1 : 0,
    filters.priceRange ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0)

  const FilterContent = (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-anthracite-700">Filters</h2>
          {activeFiltersCount > 0 && (
            <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8 text-xs text-nuanced-500 hover:text-orange-500"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Filters Accordion */}
      <Accordion type="multiple" defaultValue={['price', 'categories', 'brands', 'colors', 'sizes']} className="w-full">
        {/* Price Range */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-sm font-semibold text-anthracite-700">
            Price Range
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 py-2">
              <Slider
                min={availableFilters.priceRange.min}
                max={availableFilters.priceRange.max}
                step={100}
                value={priceRange}
                onValueChange={handlePriceChange}
                onValueCommit={handlePriceCommit}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-anthracite-600">
                  ${(priceRange[0] / 100).toFixed(2)}
                </span>
                <span className="text-nuanced-500">to</span>
                <span className="font-medium text-anthracite-600">
                  ${(priceRange[1] / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Categories */}
        {availableFilters.categories.length > 0 && (
          <AccordionItem value="categories">
            <AccordionTrigger className="text-sm font-semibold text-anthracite-700">
              Categories
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 py-2">
                {availableFilters.categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.categories?.includes(category.id) ?? false}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="h-4 w-4 rounded border-platinum-400 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      />
                      <span className="text-sm text-anthracite-600 group-hover:text-orange-500 transition-colors">
                        {category.name}
                      </span>
                    </div>
                    <span className="text-xs text-nuanced-500">({category.count})</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Brands */}
        {availableFilters.brands.length > 0 && (
          <AccordionItem value="brands">
            <AccordionTrigger className="text-sm font-semibold text-anthracite-700">
              Brands
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 py-2">
                {availableFilters.brands.map((brand) => (
                  <label
                    key={brand.id}
                    className="flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.brands?.includes(brand.id) ?? false}
                        onChange={() => handleBrandToggle(brand.id)}
                        className="h-4 w-4 rounded border-platinum-400 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      />
                      <span className="text-sm text-anthracite-600 group-hover:text-orange-500 transition-colors">
                        {brand.name}
                      </span>
                    </div>
                    <span className="text-xs text-nuanced-500">({brand.count})</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Colors */}
        {availableFilters.colors.length > 0 && (
          <AccordionItem value="colors">
            <AccordionTrigger className="text-sm font-semibold text-anthracite-700">
              Colors
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-4 gap-3 py-2">
                {availableFilters.colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorToggle(color.value)}
                    className={cn(
                      'relative h-10 w-10 rounded-full border-2 transition-all',
                      filters.colors?.includes(color.value)
                        ? 'border-orange-500 scale-110 shadow-md'
                        : 'border-platinum-300 hover:border-platinum-400'
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    aria-label={color.name}
                  >
                    {filters.colors?.includes(color.value) && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="h-5 w-5 text-white drop-shadow-md"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Sizes */}
        {availableFilters.sizes.length > 0 && (
          <AccordionItem value="sizes">
            <AccordionTrigger className="text-sm font-semibold text-anthracite-700">
              Sizes
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-4 gap-2 py-2">
                {availableFilters.sizes.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => handleSizeToggle(size.value)}
                    className={cn(
                      'flex h-10 items-center justify-center rounded-md border-2 text-sm font-medium transition-all',
                      filters.sizes?.includes(size.value)
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-platinum-300 text-anthracite-600 hover:border-platinum-400 hover:bg-platinum-50'
                    )}
                  >
                    {size.value}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Rating */}
        <AccordionItem value="rating">
          <AccordionTrigger className="text-sm font-semibold text-anthracite-700">
            Rating
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 py-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingChange(rating)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                    filters.rating === rating
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-anthracite-600 hover:bg-platinum-50'
                  )}
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={cn(
                          'h-4 w-4',
                          i < rating ? 'fill-orange-500 text-orange-500' : 'fill-platinum-300 text-platinum-300'
                        )}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span>& up</span>
                </button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Availability & Special Offers */}
        <AccordionItem value="other">
          <AccordionTrigger className="text-sm font-semibold text-anthracite-700">
            Availability
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 py-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.inStock ?? false}
                  onChange={handleStockToggle}
                  className="h-4 w-4 rounded border-platinum-400 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                />
                <span className="text-sm text-anthracite-600 group-hover:text-orange-500 transition-colors">
                  In Stock Only
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.onSale ?? false}
                  onChange={handleSaleToggle}
                  className="h-4 w-4 rounded border-platinum-400 text-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                />
                <span className="text-sm text-anthracite-600 group-hover:text-orange-500 transition-colors">
                  On Sale
                </span>
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M3 4h18M3 10h18M3 16h18" />
            </svg>
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6">{FilterContent}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="sticky top-24 h-fit rounded-lg border border-platinum-300 bg-white p-6 shadow-sm">
      {FilterContent}
    </div>
  )
}

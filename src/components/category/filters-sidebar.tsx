'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, RotateCcw, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { COLOR_HEX_MAP, PLP_CONFIG } from '@/lib/constants'
import { Slider } from '@/components/ui/slider'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import type { Filter, AvailableFilters } from '@/types'

export interface FiltersSidebarProps {
  filters: Filter
  availableFilters: AvailableFilters
  onFilterChange: (filters: Filter) => void
  onClearFilters: () => void
  isMobile?: boolean
}

export function FiltersSidebar({
  filters,
  availableFilters,
  onFilterChange,
  onClearFilters,
  isMobile = false
}: FiltersSidebarProps) {
  // Internal search state (currently for UI only - search filtering not implemented)
  const [searchQuery, setSearchQuery] = useState('')

  // Brand search state
  const [brandSearch, setBrandSearch] = useState('')

  // Expand/collapse states
  const [openSections, setOpenSections] = useLocalStorage<string[]>('filter-sections-open', [
    'price',
    'category',
    'brand',
    'color'
  ])

  // Show more states
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [showAllBrands, setShowAllBrands] = useState(false)
  const [showUnavailableSizes, setShowUnavailableSizes] = useState(false)

  // Price range local state (for slider)
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.priceRange?.min ?? availableFilters.priceRange.min,
    filters.priceRange?.max ?? availableFilters.priceRange.max
  ])
  const debouncedPriceRange = useDebounce<[number, number]>(priceRange, 300)

  // Sync local state when external filters change (e.g., from clear filters)
  useEffect(() => {
    const externalMin = filters.priceRange?.min ?? availableFilters.priceRange.min
    const externalMax = filters.priceRange?.max ?? availableFilters.priceRange.max

    if (priceRange[0] !== externalMin || priceRange[1] !== externalMax) {
      setPriceRange([externalMin, externalMax])
    }
  }, [filters.priceRange, availableFilters.priceRange]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update filters when debounced price changes
  useEffect(() => {
    // Guard against undefined or invalid array
    if (!debouncedPriceRange || debouncedPriceRange.length !== 2) return

    // Swap values if min > max
    let [min, max] = debouncedPriceRange
    if (min > max) {
      [min, max] = [max, min]
      setPriceRange([min, max])
      return
    }

    if (
      min !== filters.priceRange?.min ||
      max !== filters.priceRange?.max
    ) {
      onFilterChange({
        ...filters,
        priceRange: { min, max }
      })
    }
  }, [debouncedPriceRange, filters, onFilterChange])

  // Filter brands by search
  const filteredBrands = useMemo(() => {
    if (!brandSearch) return availableFilters.brands
    const query = brandSearch.toLowerCase()
    return availableFilters.brands.filter(brand =>
      brand.name.toLowerCase().includes(query)
    )
  }, [brandSearch, availableFilters.brands])

  // Display brands (top 5 or all)
  const displayBrands = showAllBrands
    ? filteredBrands
    : filteredBrands.slice(0, PLP_CONFIG.maxFiltersShown)

  // Display categories
  const displayCategories = showAllCategories
    ? availableFilters.categories
    : availableFilters.categories.slice(0, PLP_CONFIG.maxFiltersShown)

  const hasActiveFilters =
    filters.categories?.length ||
    filters.brands?.length ||
    filters.colors?.length ||
    filters.sizes?.length ||
    filters.rating ||
    filters.inStock ||
    filters.onSale ||
    (filters.priceRange &&
      (filters.priceRange.min !== availableFilters.priceRange.min ||
        filters.priceRange.max !== availableFilters.priceRange.max))

  return (
    <div
      className={cn(
        'bg-white border border-platinum-300 rounded-lg p-4',
        !isMobile && 'sticky top-[140px] w-[300px] max-h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar'
      )}
    >
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold uppercase text-anthracite-700 mb-3">
          FILTRER PAR
        </h2>
        <div className="h-px bg-platinum-300" />
      </div>

      {/* Internal Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nuanced-500" />
        <Input
          type="text"
          placeholder="Rechercher dans les résultats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8 h-10 rounded-md border-platinum-300 focus:border-orange-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-nuanced-500 hover:text-anthracite-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapsible Filter Sections */}
      <Accordion type="multiple" value={openSections} onValueChange={setOpenSections}>
        {/* 1. Price Range Filter */}
        <AccordionItem value="price">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-semibold">Prix</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="text-sm text-anthracite-700 font-medium text-center">
                {priceRange[0]}€ - {priceRange[1]}€
              </div>

              <Slider
                min={availableFilters.priceRange.min}
                max={availableFilters.priceRange.max}
                step={1}
                value={[priceRange[0], priceRange[1]]}
                onValueChange={(value: number[]) => {
                  if (value.length === 2) {
                    setPriceRange([value[0], value[1]] as [number, number])
                  }
                }}
                className="py-4"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-nuanced-600 mb-1 block">Min</label>
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => {
                      const newMin = Math.max(
                        availableFilters.priceRange.min,
                        Math.min(parseInt(e.target.value) || 0, priceRange[1])
                      )
                      setPriceRange([newMin, priceRange[1]])
                    }}
                    min={availableFilters.priceRange.min}
                    max={priceRange[1]}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-nuanced-600 mb-1 block">Max</label>
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => {
                      const newMax = Math.min(
                        availableFilters.priceRange.max,
                        Math.max(parseInt(e.target.value) || 0, priceRange[0])
                      )
                      setPriceRange([priceRange[0], newMax])
                    }}
                    min={priceRange[0]}
                    max={availableFilters.priceRange.max}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Category Filter */}
        <AccordionItem value="category">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-semibold">Catégories</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 pt-2">
              {displayCategories.map((category) => {
                const isChecked = filters.categories?.includes(category.id) ?? false

                return (
                  <label
                    key={category.id}
                    className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-platinum-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          const newCategories = e.target.checked
                            ? [...(filters.categories || []), category.id]
                            : filters.categories?.filter(c => c !== category.id) || []
                          onFilterChange({ ...filters, categories: newCategories })
                        }}
                        className="w-4 h-4 rounded border-platinum-400 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-anthracite-700">{category.name}</span>
                    </div>
                    <span className="text-sm text-nuanced-500">({category.count})</span>
                  </label>
                )
              })}

              {availableFilters.categories.length > PLP_CONFIG.maxFiltersShown && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium mt-2"
                >
                  {showAllCategories
                    ? '- Voir moins'
                    : `+ ${availableFilters.categories.length - PLP_CONFIG.maxFiltersShown} autres`}
                </button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 3. Brand Filter */}
        <AccordionItem value="brand">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-semibold">Marques</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {/* Brand Search */}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-nuanced-500" />
                <Input
                  type="text"
                  placeholder="Rechercher..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>

              {/* Brand List */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                {displayBrands.length > 0 ? (
                  displayBrands.map((brand) => {
                    const isChecked = filters.brands?.includes(brand.id) ?? false

                    return (
                      <label
                        key={brand.id}
                        className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-platinum-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const newBrands = e.target.checked
                                ? [...(filters.brands || []), brand.id]
                                : filters.brands?.filter(b => b !== brand.id) || []
                              onFilterChange({ ...filters, brands: newBrands })
                            }}
                            className="w-4 h-4 rounded border-platinum-400 text-orange-500 focus:ring-orange-500"
                          />
                          <span className="text-sm text-anthracite-700">{brand.name}</span>
                        </div>
                        <span className="text-sm text-nuanced-500">({brand.count})</span>
                      </label>
                    )
                  })
                ) : (
                  <p className="text-sm text-nuanced-500 text-center py-4">
                    Aucune marque trouvée
                  </p>
                )}
              </div>

              {!brandSearch && filteredBrands.length > PLP_CONFIG.maxFiltersShown && (
                <button
                  onClick={() => setShowAllBrands(!showAllBrands)}
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  {showAllBrands
                    ? '- Voir moins'
                    : `+ ${filteredBrands.length - PLP_CONFIG.maxFiltersShown} autres`}
                </button>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 4. Color Filter */}
        <AccordionItem value="color">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-semibold">Couleurs</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-[repeat(auto-fill,36px)] gap-3 pt-2">
              {availableFilters.colors.map((color) => {
                const isSelected = filters.colors?.includes(color.value) ?? false
                const hexColor = COLOR_HEX_MAP[color.value] || '#CCCCCC'
                const isWhite = hexColor === '#FFFFFF'

                return (
                  <button
                    key={color.value}
                    onClick={() => {
                      const newColors = isSelected
                        ? filters.colors?.filter(c => c !== color.value) || []
                        : [...(filters.colors || []), color.value]
                      onFilterChange({ ...filters, colors: newColors })
                    }}
                    className={cn(
                      'color-swatch w-8 h-8 rounded-full border-2 relative',
                      isSelected ? 'selected border-orange-500' : isWhite ? 'border-platinum-300' : 'border-transparent',
                      'hover:scale-110 transition-transform'
                    )}
                    style={{ backgroundColor: hexColor }}
                    title={`${color.name} (${color.count})`}
                    aria-label={`${color.name} - ${color.count} produits`}
                  >
                    {isSelected && (
                      <Check
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4"
                        style={{
                          color: hexColor === '#FFFFFF' || hexColor === '#F59E0B' ? '#000' : '#FFF',
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 5. Size Filter */}
        <AccordionItem value="size">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-semibold">Tailles</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-[repeat(auto-fill,48px)] gap-2">
                {availableFilters.sizes
                  .filter(size => showUnavailableSizes || size.count > 0)
                  .map((size) => {
                    const isSelected = filters.sizes?.includes(size.value) ?? false
                    const isAvailable = size.count > 0

                    return (
                      <button
                        key={size.value}
                        onClick={() => {
                          if (!isAvailable) return
                          const newSizes = isSelected
                            ? filters.sizes?.filter(s => s !== size.value) || []
                            : [...(filters.sizes || []), size.value]
                          onFilterChange({ ...filters, sizes: newSizes })
                        }}
                        disabled={!isAvailable}
                        className={cn(
                          'h-12 rounded-md border-2 text-sm font-medium transition-all relative',
                          isSelected && 'bg-orange-500 text-white border-orange-500',
                          !isSelected && isAvailable && 'border-platinum-300 hover:border-orange-500 hover:bg-orange-50',
                          !isAvailable && 'size-button-unavailable bg-platinum-100 text-platinum-400 border-platinum-200 cursor-not-allowed'
                        )}
                      >
                        {size.value}
                      </button>
                    )
                  })}
              </div>

              <label className="flex items-center gap-2 text-sm text-nuanced-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showUnavailableSizes}
                  onChange={(e) => setShowUnavailableSizes(e.target.checked)}
                  className="w-4 h-4 rounded border-platinum-400 text-orange-500 focus:ring-orange-500"
                />
                Afficher uniquement tailles disponibles
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 6. Rating Filter */}
        <AccordionItem value="rating">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-semibold">Note minimum</span>
          </AccordionTrigger>
          <AccordionContent>
            <RadioGroup
              value={filters.rating?.toString() || '0'}
              onValueChange={(value) => onFilterChange({ ...filters, rating: parseInt(value) })}
              className="space-y-2 pt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id="rating-all" />
                <label htmlFor="rating-all" className="text-sm cursor-pointer flex-1">
                  Toutes les notes
                </label>
              </div>
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                  <label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer flex-1">
                    <span className="text-aurore-500">{'★'.repeat(rating)}</span>
                    <span className="text-platinum-400">{'★'.repeat(5 - rating)}</span>
                    <span className="ml-2 text-nuanced-500">et plus</span>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </AccordionContent>
        </AccordionItem>

        {/* 7. Availability Filter */}
        <AccordionItem value="availability">
          <AccordionTrigger className="hover:no-underline">
            <span className="text-sm font-semibold">Disponibilité</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pt-2">
              {[
                { key: 'inStock' as const, label: 'En stock' },
                { key: 'onSale' as const, label: 'En promotion' }
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <span className="text-sm text-anthracite-700">{label}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={filters[key] ?? false}
                    onClick={() => onFilterChange({ ...filters, [key]: !filters[key] })}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      filters[key] ? 'bg-orange-500' : 'bg-platinum-300'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-5 w-5 transform rounded-full bg-white shadow-elevation-1 transition-transform',
                        filters[key] ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Reset Button */}
      <button
        onClick={onClearFilters}
        disabled={!hasActiveFilters}
        className={cn(
          'w-full mt-6 py-3 rounded-lg border-2 font-medium text-sm transition-all',
          'flex items-center justify-center gap-2',
          hasActiveFilters
            ? 'border-platinum-300 hover:border-orange-500 hover:text-orange-500 text-anthracite-700'
            : 'border-platinum-200 text-platinum-400 cursor-not-allowed'
        )}
      >
        <RotateCcw className="h-4 w-4" />
        Réinitialiser les filtres
      </button>
    </div>
  )
}

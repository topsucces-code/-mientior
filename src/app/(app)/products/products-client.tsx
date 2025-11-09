'use client'

import * as React from 'react'
import { FiltersSidebar } from '@/components/category/filters-sidebar'
import { ProductsToolbar } from '@/components/category/products-toolbar'
import { ProductsGrid } from '@/components/category/products-grid'
import type { Product, Filter, AvailableFilters, SortOption } from '@/types'

interface ProductsPageClientProps {
  initialProducts: Product[]
  availableFilters: AvailableFilters
}

export function ProductsPageClient({
  initialProducts,
  availableFilters,
}: ProductsPageClientProps) {
  const [filters, setFilters] = React.useState<Filter>({})
  const [sortOption, setSortOption] = React.useState<SortOption>('relevance')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')

  // Filter products
  const filteredProducts = React.useMemo(() => {
    let result = [...initialProducts]

    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter((product) =>
        filters.categories!.includes(product.category.id)
      )
    }

    // Filter by price range
    if (filters.priceRange) {
      result = result.filter(
        (product) =>
          product.price >= filters.priceRange!.min &&
          product.price <= filters.priceRange!.max
      )
    }

    // Filter by colors
    if (filters.colors && filters.colors.length > 0) {
      result = result.filter((product) =>
        product.variants?.some((variant) =>
          filters.colors!.includes(variant.color || '')
        )
      )
    }

    // Filter by sizes
    if (filters.sizes && filters.sizes.length > 0) {
      result = result.filter((product) =>
        product.variants?.some((variant) =>
          filters.sizes!.includes(variant.size || '')
        )
      )
    }

    // Filter by rating
    if (filters.rating) {
      result = result.filter((product) => product.rating >= filters.rating!)
    }

    // Filter by stock
    if (filters.inStock) {
      result = result.filter((product) => product.stock > 0)
    }

    // Filter by sale
    if (filters.onSale) {
      result = result.filter((product) => product.onSale)
    }

    return result
  }, [initialProducts, filters])

  // Sort products
  const sortedProducts = React.useMemo(() => {
    const result = [...filteredProducts]

    switch (sortOption) {
      case 'price-asc':
        return result.sort((a, b) => a.price - b.price)
      case 'price-desc':
        return result.sort((a, b) => b.price - a.price)
      case 'rating':
        return result.sort((a, b) => b.rating - a.rating)
      case 'newest':
        return result
      case 'bestseller':
        return result.sort((a, b) => b.reviewCount - a.reviewCount)
      case 'relevance':
      default:
        return result
    }
  }, [filteredProducts, sortOption])

  const handleFilterChange = (newFilters: Filter) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Filters Sidebar - Desktop */}
      <aside className="hidden lg:block">
        <FiltersSidebar
          filters={filters}
          availableFilters={availableFilters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </aside>

      {/* Main Content */}
      <div className="flex flex-col gap-6">
        {/* Toolbar with mobile filters */}
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <FiltersSidebar
              filters={filters}
              availableFilters={availableFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              isMobile
            />
          </div>

          <div className="flex-1">
            <ProductsToolbar
              totalCount={sortedProducts.length}
              currentSort={sortOption}
              onSortChange={setSortOption}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
        </div>

        {/* Products Grid */}
        <ProductsGrid
          products={sortedProducts}
          viewMode={viewMode}
        />
      </div>
    </div>
  )
}

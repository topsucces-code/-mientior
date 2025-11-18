'use client'

import * as React from 'react'
import { BreadcrumbNavigation } from '@/components/category/breadcrumb-navigation'
import { CategoryHeroBanner } from '@/components/category/category-hero-banner'
import { ActiveFiltersBar } from '@/components/category/active-filters-bar'
import { FiltersSidebar } from '@/components/category/filters-sidebar'
import { MobileFilterDrawer } from '@/components/category/mobile-filter-drawer'
import { ProductsToolbar } from '@/components/category/products-toolbar'
import { ProductsGrid } from '@/components/category/products-grid'
import { RecentlyViewedProducts } from '@/components/category/recently-viewed-products'
import { SEOContentSection } from '@/components/category/seo-content-section'
import { PLP_CONFIG } from '@/lib/constants'
import type { Product, Filter, AvailableFilters, SortOption, BreadcrumbItem, CategoryHeroData } from '@/types'

interface ProductsPageClientProps {
  initialProducts: Product[]
  availableFilters: AvailableFilters
  breadcrumbs: BreadcrumbItem[]
  categoryHeroData: CategoryHeroData
  seoContent: {
    title: string
    content: string
  }
}

export function ProductsPageClient({
  initialProducts,
  availableFilters,
  breadcrumbs,
  categoryHeroData,
  seoContent,
}: ProductsPageClientProps) {
  const [filters, setFilters] = React.useState<Filter>({})
  const [sortOption, setSortOption] = React.useState<SortOption>('relevance')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')

  // Pagination state
  const [itemsPerPage, setItemsPerPage] = React.useState(PLP_CONFIG.defaultItemsPerPage)
  const [page, setPage] = React.useState(1)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)

  // Filter products
  const filteredProducts = React.useMemo(() => {
    let result = [...initialProducts]

    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      result = result.filter((product) =>
        filters.categories!.includes(product.category.id)
      )
    }

    // Filter by brands (vendors)
    if (filters.brands && filters.brands.length > 0) {
      result = result.filter((product) =>
        product.vendor && filters.brands!.includes(product.vendor.id)
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

  const handleFilterChange = React.useCallback((newFilters: Filter) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }, [])

  const handleClearFilters = React.useCallback(() => {
    setFilters({})
    setPage(1) // Reset to first page when clearing filters
  }, [])

  const handleRemoveFilter = React.useCallback((filterType: keyof Filter, value?: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev }

      if (value) {
        // Remove specific value from array filters
        if (Array.isArray(newFilters[filterType])) {
          const filtered = (newFilters[filterType] as string[]).filter(v => v !== value)
          if (filtered.length === 0) {
            delete newFilters[filterType]
          } else {
            (newFilters as Record<string, string[]>)[filterType] = filtered
          }
        }
      } else {
        // Remove entire filter
        delete newFilters[filterType]
      }

      return newFilters
    })
  }, [])

  const handleQuickFilterClick = React.useCallback((value: string) => {
    if (value === 'newest') {
      setSortOption('newest')
    } else if (value === 'onSale') {
      setFilters(prev => ({ ...prev, onSale: !prev.onSale }))
    } else if (value === 'bestseller') {
      setSortOption('bestseller')
    }
  }, [])

  const hasActiveFilters = React.useMemo(() =>
    !!(filters.categories?.length ||
    filters.brands?.length ||
    filters.colors?.length ||
    filters.sizes?.length ||
    filters.rating ||
    filters.inStock ||
    filters.onSale ||
    (filters.priceRange &&
      (filters.priceRange.min !== availableFilters.priceRange.min ||
        filters.priceRange.max !== availableFilters.priceRange.max)))
  , [filters, availableFilters])

  // Pagination logic
  const visibleProducts = React.useMemo(() => {
    return sortedProducts.slice(0, page * itemsPerPage)
  }, [sortedProducts, page, itemsPerPage])

  const hasMore = React.useMemo(() => {
    return sortedProducts.length > page * itemsPerPage
  }, [sortedProducts.length, page, itemsPerPage])

  const handleLoadMore = React.useCallback(() => {
    setIsLoadingMore(true)
    // Simulate loading for better UX
    setTimeout(() => {
      setPage(prev => prev + 1)
      setIsLoadingMore(false)
    }, 300)
  }, [])

  const handleItemsPerPageChange = React.useCallback((count: number) => {
    setItemsPerPage(count)
    setPage(1) // Reset to first page when changing items per page
  }, [])

  return (
    <div>
      {/* Hero Banner */}
      <CategoryHeroBanner
        title={categoryHeroData.title}
        description={categoryHeroData.description}
        productCount={categoryHeroData.productCount}
        quickFilters={categoryHeroData.quickFilters}
        onQuickFilterClick={handleQuickFilterClick}
        activeQuickFilter={filters.onSale ? 'onSale' : sortOption}
      />

      {/* Breadcrumb + Main Content */}
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <BreadcrumbNavigation items={breadcrumbs} />

        {/* Main Grid Layout */}
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
            {/* Active Filters Bar */}
            <ActiveFiltersBar
              filters={filters}
              availableFilters={availableFilters}
              onRemoveFilter={handleRemoveFilter}
              onClearAll={handleClearFilters}
            />

            {/* Toolbar */}
            <ProductsToolbar
              totalCount={sortedProducts.length}
              currentSort={sortOption}
              onSortChange={setSortOption}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
            />

            {/* Products Grid */}
            <ProductsGrid
              products={visibleProducts}
              viewMode={viewMode}
              hasActiveFilters={hasActiveFilters}
              onResetFilters={handleClearFilters}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              itemsPerPage={itemsPerPage}
              isLoading={isLoadingMore}
              displayedCount={visibleProducts.length}
              totalCount={sortedProducts.length}
            />

            {/* Recently Viewed Products */}
            <RecentlyViewedProducts />

            {/* SEO Content Section */}
            <SEOContentSection
              title={seoContent.title}
              content={seoContent.content}
            />
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        filters={filters}
        availableFilters={availableFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        productCount={sortedProducts.length}
      />
    </div>
  )
}

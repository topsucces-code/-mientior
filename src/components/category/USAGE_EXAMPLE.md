# Category Components Usage Guide

This directory contains three main components for building category/product listing pages:

## Components

### 1. FiltersSidebar
A comprehensive filter sidebar with price range, categories, brands, colors, sizes, rating, and availability filters.

**Features:**
- Price range slider
- Multi-select checkboxes for categories, brands
- Color swatches with visual selection
- Size selector buttons
- Star rating filter
- In Stock and On Sale toggles
- Active filter count badge
- Clear all filters button
- Mobile-responsive (renders as Sheet/Drawer on mobile)
- Collapsible sections using Accordion

### 2. ProductsToolbar
A toolbar for sorting and view mode controls.

**Features:**
- Results count display
- Sort dropdown (relevance, price, rating, newest, bestseller)
- Grid/List view toggle
- Responsive design

### 3. ProductsGrid
A responsive product grid/list with loading states.

**Features:**
- Grid view (1-4 columns responsive)
- List view (detailed cards)
- Loading skeletons
- Empty state
- Quick view integration
- Supports all product features (badges, discounts, ratings)

## Basic Usage Example

```tsx
'use client'

import * as React from 'react'
import { FiltersSidebar, ProductsToolbar, ProductsGrid } from '@/components/category'
import type { Filter, AvailableFilters, SortOption, Product } from '@/types'

export default function CategoryPage() {
  const [filters, setFilters] = React.useState<Filter>({})
  const [sortOption, setSortOption] = React.useState<SortOption>('relevance')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = React.useState(false)
  const [products, setProducts] = React.useState<Product[]>([])

  // Example available filters (would come from API)
  const availableFilters: AvailableFilters = {
    priceRange: { min: 0, max: 50000 },
    categories: [
      { id: '1', name: 'Electronics', count: 45 },
      { id: '2', name: 'Clothing', count: 120 },
      { id: '3', name: 'Home & Garden', count: 78 },
    ],
    brands: [
      { id: '1', name: 'Brand A', count: 32 },
      { id: '2', name: 'Brand B', count: 28 },
      { id: '3', name: 'Brand C', count: 19 },
    ],
    colors: [
      { value: '#000000', name: 'Black', count: 45 },
      { value: '#FFFFFF', name: 'White', count: 38 },
      { value: '#FF0000', name: 'Red', count: 22 },
      { value: '#0000FF', name: 'Blue', count: 30 },
    ],
    sizes: [
      { value: 'XS', count: 15 },
      { value: 'S', count: 25 },
      { value: 'M', count: 35 },
      { value: 'L', count: 30 },
      { value: 'XL', count: 20 },
    ],
  }

  const handleFilterChange = (newFilters: Filter) => {
    setFilters(newFilters)
    // Fetch products with new filters
    fetchProducts(newFilters, sortOption)
  }

  const handleClearFilters = () => {
    setFilters({})
    fetchProducts({}, sortOption)
  }

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort)
    fetchProducts(filters, sort)
  }

  const fetchProducts = async (filters: Filter, sort: SortOption) => {
    setIsLoading(true)
    try {
      // Your API call here
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, sort }),
      })
      const data = await response.json()
      setProducts(data.products)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchProducts(filters, sortOption)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-80 flex-shrink-0">
          <FiltersSidebar
            filters={filters}
            availableFilters={availableFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="space-y-6">
            {/* Mobile Filters + Toolbar */}
            <div className="flex items-center gap-3">
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
                  totalCount={products.length}
                  currentSort={sortOption}
                  onSortChange={handleSortChange}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </div>
            </div>

            {/* Products Grid */}
            <ProductsGrid
              products={products}
              isLoading={isLoading}
              viewMode={viewMode}
              onQuickView={(productId) => {
                console.log('Quick view:', productId)
                // Open quick view modal
              }}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
```

## API Integration Example

### Payload CMS Integration

```tsx
import { getPayload } from '@/lib/payload'
import type { Filter, SortOption } from '@/types'

async function fetchProductsFromPayload(filters: Filter, sort: SortOption) {
  const payload = await getPayload()

  // Build Payload query from filters
  const where: any = {}

  if (filters.categories?.length) {
    where.category = { in: filters.categories }
  }

  if (filters.priceRange) {
    where.price = {
      greater_than_equal: filters.priceRange.min,
      less_than_equal: filters.priceRange.max,
    }
  }

  if (filters.inStock) {
    where.stock = { greater_than: 0 }
  }

  if (filters.onSale) {
    where.compareAtPrice = { exists: true }
  }

  // Sort mapping
  const sortMap = {
    'price-asc': 'price',
    'price-desc': '-price',
    'rating': '-rating',
    'newest': '-createdAt',
    'bestseller': '-salesCount',
    'relevance': '-featured',
  }

  const result = await payload.find({
    collection: 'products',
    where,
    sort: sortMap[sort] || '-featured',
    limit: 100,
  })

  return result.docs
}
```

## Customization

### Styling

All components use Tailwind CSS classes and follow the project's design system:
- Primary color: Orange (orange-500, orange-600)
- Neutral colors: anthracite, platinum, nuanced
- Shadows: shadow-elevation-1, shadow-elevation-2, shadow-elevation-3

### Props

Each component exports TypeScript interfaces:
- `FiltersSidebarProps`
- `ProductsToolbarProps`
- `ProductsGridProps`

### Mobile Responsiveness

The components are fully responsive:
- **FiltersSidebar**: Renders as sidebar on desktop (lg+), sheet/drawer on mobile
- **ProductsToolbar**: Stacks vertically on mobile, horizontal on desktop
- **ProductsGrid**: 1 column on mobile, 2 on tablet, 3-4 on desktop

### View Modes

ProductsGrid supports two view modes:
- **Grid**: Compact product cards in a responsive grid
- **List**: Detailed horizontal cards with more information

## Advanced Features

### Active Filter Count
The sidebar automatically tracks and displays the number of active filters.

### Filter Persistence
You can persist filters to URL query params:

```tsx
import { useRouter, useSearchParams } from 'next/navigation'

function useFiltersFromURL() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const filters: Filter = {
    categories: searchParams.get('categories')?.split(','),
    priceRange: {
      min: Number(searchParams.get('minPrice')) || 0,
      max: Number(searchParams.get('maxPrice')) || 100000,
    },
    // ... other filters
  }

  const updateFilters = (newFilters: Filter) => {
    const params = new URLSearchParams()
    if (newFilters.categories) params.set('categories', newFilters.categories.join(','))
    if (newFilters.priceRange) {
      params.set('minPrice', newFilters.priceRange.min.toString())
      params.set('maxPrice', newFilters.priceRange.max.toString())
    }
    router.push(`?${params.toString()}`)
  }

  return { filters, updateFilters }
}
```

### Loading States
ProductsGrid includes skeleton loaders that match the card layout for smooth loading UX.

### Empty States
Displays a friendly message when no products match the filters.

## File Structure

```
src/components/category/
├── filters-sidebar.tsx    # Filter sidebar component
├── products-toolbar.tsx   # Sort & view controls
├── products-grid.tsx      # Product grid/list
├── index.ts              # Barrel export
└── USAGE_EXAMPLE.md      # This file
```

## Dependencies

Required UI components (already in project):
- Button, Badge, Slider, Label
- Accordion, Select, Sheet
- Skeleton

Required types (from @/types):
- Filter, AvailableFilters
- SortOption, Product

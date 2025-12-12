'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2 } from 'lucide-react'
import { ProductCard, ProductCardProps } from '@/components/ui/product-card'
import { RippleButton } from '@/components/ui/ripple-button'
import { Skeleton } from '@/components/ui/skeleton'
import { FiltersSidebar } from '@/components/category/filters-sidebar'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useQuickView } from '@/contexts/quick-view-context'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { toast } from 'sonner'
import { useHeaderSafe } from '@/contexts/header-context'
import type { Filter, AvailableFilters } from '@/types'

interface MainProductGridProps {
  initialProducts?: (Omit<ProductCardProps, 'onQuickView'> & { stock?: number })[]
  title?: string
  subtitle?: string
  viewAllHref?: string
  enableInfiniteScroll?: boolean
  availableFilters?: AvailableFilters
  className?: string
}

export default function MainProductGrid({
  initialProducts = [],
  title = 'Nos Produits',
  subtitle = 'Découvrez notre sélection complète',
  viewAllHref = '/products',
  enableInfiniteScroll = true,
  availableFilters,
  className,
}: MainProductGridProps) {
  const [products, setProducts] = React.useState(initialProducts)
  const [page, setPage] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(true)
  const [filters, setFilters] = React.useState<Filter>({})
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const { ref: loadMoreRef, isIntersecting: isLoadMoreVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()
  const { openQuickView } = useQuickView()
  const addToCart = useCartStore((state) => state.addItem)
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const headerContext = useHeaderSafe()

  // Check if on mobile (simplified for now)
  const [isMobile, setIsMobile] = React.useState(false)
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleQuickView = (productId: string) => {
    openQuickView(productId)
  }

  const handleWishlistToggle = (product: Omit<ProductCardProps, 'onQuickView'> & { stock?: number }) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
      toast.success('Retiré des favoris', {
        description: `${product.name} a été retiré de vos favoris.`,
      })
    } else {
      addToWishlist({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        addedAt: new Date().toISOString(),
      })
      toast.success('Ajouté aux favoris', {
        description: `${product.name} a été ajouté à vos favoris.`,
      })
    }
  }

  const handleAddToCart = (product: Omit<ProductCardProps, 'onQuickView'> & { stock?: number }) => {
     addToCart({
       id: product.id,
       productId: product.id,
       productName: product.name,
       productSlug: product.slug,
       productImage: product.image || '/placeholder-product.jpg',
       price: product.price,
       quantity: 1,
       stock: product.stock || 0,
     })
     
     toast.success("Ajouté au panier !", {
       description: `${product.name} a été ajouté à votre panier.`,
       action: {
         label: "Voir le panier",
         onClick: () => window.location.href = '/cart'
       }
     })
     
     // Open cart preview after adding item
     if (headerContext?.openCart) {
       setTimeout(() => headerContext.openCart(), 300)
     }
  }

  // Load more products
  const loadMoreProducts = React.useCallback(async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)

    try {
      // Build query params
      const params = new URLSearchParams({
        page: String(page + 1),
        limit: '20',
      })

      // Add filter params
      if (filters.categories?.length && filters.categories[0]) {
        params.append('categoryId', filters.categories[0]) // Use first category
      }
      if (filters.priceRange) {
        params.append('minPrice', String(filters.priceRange.min))
        params.append('maxPrice', String(filters.priceRange.max))
      }
      if (filters.inStock) {
        params.append('inStock', 'true')
      }
      if (filters.rating) {
        params.append('rating', String(filters.rating))
      }

      const response = await fetch(`/api/public/products?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()

      if (data.products && data.products.length > 0) {
        setProducts((prev) => [...prev, ...data.products])
        setPage((prev) => prev + 1)
        setHasMore(data.hasMore ?? data.products.length === 20)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading products:', error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [page, isLoading, hasMore, filters])

  // Refetch products when filters change
  React.useEffect(() => {
    const refetchWithFilters = async () => {
      setIsLoading(true)
      setProducts([])
      setPage(1)
      setHasMore(true)

      try {
        // Build query params
        const params = new URLSearchParams({
          page: '1',
          limit: '20',
          filter: 'featured',
        })

        // Add filter params
        if (filters.categories?.length) {
          params.append('categories', filters.categories.join(','))
        }
        if (filters.brands?.length) {
          params.append('brands', filters.brands.join(','))
        }
        if (filters.priceRange) {
          params.append('minPrice', String(filters.priceRange.min))
          params.append('maxPrice', String(filters.priceRange.max))
        }
        if (filters.colors?.length) {
          params.append('colors', filters.colors.join(','))
        }
        if (filters.sizes?.length) {
          params.append('sizes', filters.sizes.join(','))
        }
        if (filters.rating) {
          params.append('rating', String(filters.rating))
        }
        if (filters.inStock) {
          params.append('inStock', 'true')
        }

        const response = await fetch(`/api/public/products?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error('Failed to refetch products')
        }
        
        const data = await response.json()

        if (data.products) {
          setProducts(data.products)
          setHasMore(data.hasMore ?? data.products.length === 20)
        }
      } catch (error) {
        console.error('Error refetching products:', error)
        // Fallback to initial products on error
        setProducts(initialProducts)
        setHasMore(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Only refetch if filters have changed (not on initial mount)
    const hasActiveFilters = Object.keys(filters).length > 0
    if (hasActiveFilters) {
      refetchWithFilters()
    }
  }, [filters, initialProducts])

  const handleFilterChange = (newFilters: Filter) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    setProducts(initialProducts)
    setPage(1)
    setHasMore(true)
  }

  // Infinite scroll trigger
  React.useEffect(() => {
    if (enableInfiniteScroll && isLoadMoreVisible && !isLoading && hasMore) {
      loadMoreProducts()
    }
  }, [isLoadMoreVisible, enableInfiniteScroll, isLoading, hasMore, loadMoreProducts])

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      className={cn('py-10 md:py-14', className)}
    >
      <div className="container mx-auto px-3 md:px-4 lg:px-6">
        {/* Header */}
        <div
          className={cn(
            'mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <div className="max-w-2xl">
            <h2 className="mb-2 font-display text-display-md md:text-display-lg text-anthracite-700">
              {title}
            </h2>
            <p className="text-lg text-nuanced-600">
              {subtitle}
            </p>
          </div>

          <Link href={viewAllHref}>
            <RippleButton variant="outline" className="group flex items-center gap-2">
              Voir Tous les Produits
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </RippleButton>
          </Link>
        </div>

        {/* Two-Column Layout: Sidebar + Grid */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Filters Sidebar */}
          {availableFilters && (
            <aside className="w-full lg:w-[260px] xl:w-[300px] lg:sticky lg:top-24 lg:self-start">
              <FiltersSidebar
                filters={filters}
                availableFilters={availableFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                isMobile={isMobile}
              />
            </aside>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  compareAtPrice={product.compareAtPrice}
                  image={product.image || '/placeholder-product.jpg'}
                  images={product.images || []}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  badge={product.badge}
                  stock={product.stock}
                  inStock={product.stock !== undefined ? product.stock > 0 : product.inStock}
                  vendor={(product as any).vendor?.name || (typeof product.vendor === 'string' ? product.vendor : undefined)}
                  freeShipping={product.price > 5000} // Mock rule
                  onQuickView={handleQuickView}
                  onAddToCart={() => handleAddToCart(product)}
                  onWishlistToggle={() => handleWishlistToggle(product)}
                  isInWishlist={isInWishlist(product.id)}
                  priority={index < 12}
                  className={cn(
                    !prefersReducedMotion && isVisible && 'animate-fade-in-up'
                  )}
                  style={{
                    animationDelay: !prefersReducedMotion ? `${index * 50}ms` : undefined,
                  } as React.CSSProperties}
                />
              ))}
            </div>

            {/* Loading Skeletons */}
            {isLoading && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-lg border border-platinum-300">
                    <Skeleton className="aspect-[4/5] w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-6 w-1/2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Infinite Scroll Trigger */}
            {enableInfiniteScroll && hasMore && (
              <div ref={loadMoreRef as React.Ref<HTMLDivElement>} className="mt-6 flex justify-center">
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-nuanced-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Chargement...</span>
                  </div>
                )}
              </div>
            )}

            {/* No More Products Message */}
            {!hasMore && products.length > 0 && (
              <div className="mt-8 text-center">
                <p className="text-sm text-nuanced-500">
                  Vous avez vu tous les produits
                </p>
              </div>
            )}

            {/* Empty State */}
            {products.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 h-24 w-24 rounded-full bg-platinum-200" />
                <h3 className="mb-2 text-xl font-semibold text-anthracite-700">
                  Aucun produit trouvé
                </h3>
                <p className="text-nuanced-600 mb-4">
                  Essayez de modifier vos filtres
                </p>
                <RippleButton onClick={handleClearFilters} variant="outline">
                  Réinitialiser les filtres
                </RippleButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

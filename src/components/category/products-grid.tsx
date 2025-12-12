'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/components/ui/product-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { EmptyState } from './empty-state'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import type { Product } from '@/types'
import { useCartStore } from '@/stores/cart.store'
import { toast } from 'sonner'
import { useHeaderSafe } from '@/contexts/header-context'

export interface ProductsGridProps {
  products: Product[]
  viewMode: 'grid' | 'list'
  isLoading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
  itemsPerPage?: number
  onResetFilters?: () => void
  hasActiveFilters?: boolean
  displayedCount?: number
  totalCount?: number
}

export function ProductsGrid({
  products,
  viewMode,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  itemsPerPage = 24,
  onResetFilters,
  hasActiveFilters = false,
  displayedCount,
  totalCount
}: ProductsGridProps) {
  const prefersReducedMotion = useReducedMotion()
  const addToCart = useCartStore((state) => state.addItem)
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())
  const headerContext = useHeaderSafe()

  const handleAddToCart = (product: Product) => {
    if (product.stock === 0) {
      toast.error("Rupture de stock", {
        description: "Ce produit n'est plus disponible.",
      })
      return
    }

    addToCart({
      id: product.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0]?.url || '/placeholder-product.jpg',
      price: product.price,
      quantity: 1,
      stock: product.stock,
    })
    
    // Visual feedback for list view
    setAddedProducts(prev => new Set(prev).add(product.id))
    setTimeout(() => {
      setAddedProducts(prev => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }, 2000)
    
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

  const { ref: loadMoreRef } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: '100px',
    onIntersect: () => {
      if (hasMore && onLoadMore && !isLoading) {
        onLoadMore()
      }
    }
  })

  // Loading Skeletons
  if (isLoading && products.length === 0) {
    return (
      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
            : 'flex flex-col gap-4'
        )}
      >
        {Array.from({ length: itemsPerPage }).map((_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-[4/5] w-full animate-shimmer" />
            <Skeleton className="h-4 w-3/4 animate-shimmer" />
            <Skeleton className="h-6 w-1/2 animate-shimmer" />
            <Skeleton className="h-10 w-full animate-shimmer" />
          </div>
        ))}
      </div>
    )
  }

  // Empty State
  if (products.length === 0 && !isLoading) {
    return (
      <EmptyState
        onReset={onResetFilters || (() => {})}
        hasActiveFilters={hasActiveFilters}
      />
    )
  }

  return (
    <div>
      {/* Products Grid/List */}
      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
            : 'flex flex-col gap-4'
        )}
      >
        {products.map((product, index) => {
          const delay = prefersReducedMotion ? 0 : Math.min(index * 50, 300)

          if (viewMode === 'list') {
            const badgeObject = typeof product.badge === 'string' && product.badge
              ? { text: product.badge, variant: 'new' as const }
              : product.badge

            return (
              <div
                key={product.id}
                className={cn(
                  'flex gap-4 bg-white border border-platinum-300 rounded-lg p-4',
                  'hover:shadow-elevation-3 hover:-translate-y-0.5 transition-all',
                  !prefersReducedMotion && 'animate-fade-in'
                )}
                style={{ animationDelay: `${delay}ms` }}
              >
                {/* Image */}
                <div className="flex-shrink-0 w-[180px] h-[180px] relative rounded-lg overflow-hidden bg-platinum-100">
                  <Image
                    src={product.images[0]?.url || '/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="180px"
                  />
                  {badgeObject && (
                    <div className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {typeof badgeObject === 'string' ? badgeObject : badgeObject.text}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-anthracite-700 mb-2">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-sm text-nuanced-600 line-clamp-2 mb-3">
                        {product.description}
                      </p>
                    )}
                    {/* Variants Preview */}
                    {product.variants && product.variants.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {Array.from(new Set(product.variants.map(v => v.color)))
                          .filter(Boolean)
                          .slice(0, 5)
                          .map((color, idx) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full border-2 border-platinum-300"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Price & CTA */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-anthracite-700">
                        {product.price.toFixed(2)}€
                      </div>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <div className="text-sm text-nuanced-500 line-through">
                          {product.compareAtPrice.toFixed(2)}€
                        </div>
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Button 
                            className={cn(
                              "h-10 w-10 p-0 flex items-center justify-center transition-all duration-300",
                              addedProducts.has(product.id)
                                ? "bg-green-500 hover:bg-green-500 scale-110 shadow-lg"
                                : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                            )}
                            aria-label={addedProducts.has(product.id) ? "Ajouté au panier" : "Ajouter au panier"}
                            onClick={(e) => {
                              e.preventDefault()
                              if (!addedProducts.has(product.id)) {
                                handleAddToCart(product)
                              }
                            }}
                            disabled={product.stock === 0 || addedProducts.has(product.id)}
                          >
                            {addedProducts.has(product.id) ? (
                              <Check className="h-5 w-5 text-white animate-in zoom-in duration-200" />
                            ) : (
                              <ShoppingCart className="h-5 w-5" />
                            )}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{addedProducts.has(product.id) ? "Ajouté !" : "Ajouter au panier"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>
            )
          }

          // Grid View
          return (
            <div
              key={product.id}
              className={!prefersReducedMotion ? 'animate-fade-in' : ''}
              style={{ animationDelay: `${delay}ms` }}
            >
              <ProductCard
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                image={product.images[0]?.url || '/placeholder-product.jpg'}
                images={product.images.map(img => img.url)}
                rating={product.rating}
                reviewCount={product.reviewCount}
                onSale={product.onSale}
                badge={product.badge}
                inStock={product.stock > 0}
                stock={product.stock}
                onAddToCart={() => handleAddToCart(product)}
                vendor={product.vendor?.name}
                // deliveryDays={product.shippingInfo?.options?.[0]?.estimatedDays} // Use if available
                freeShipping={product.price > 5000} // Mock rule: free shipping over 50€
              />
            </div>
          )
        })}
      </div>

      {/* Load More Section */}
      {hasMore && onLoadMore && (
        <div ref={loadMoreRef} className="mt-8 flex flex-col items-center gap-4">
          <Button
            onClick={onLoadMore}
            disabled={isLoading}
            className="w-full max-w-md py-4 border-2 border-platinum-300 hover:border-orange-500 text-anthracite-700 hover:text-orange-500 bg-white"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Chargement...
              </span>
            ) : (
              `CHARGER ${itemsPerPage} PRODUITS DE PLUS`
            )}
          </Button>

          {displayedCount !== undefined && totalCount !== undefined && (
            <p className="text-sm text-nuanced-600">
              Affichage {displayedCount} sur {totalCount.toLocaleString('fr-FR')} produits
            </p>
          )}
        </div>
      )}
    </div>
  )
}

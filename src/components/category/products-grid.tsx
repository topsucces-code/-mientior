'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/components/products/product-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Product } from '@/types'

export interface ProductsGridProps {
  products: Product[]
  isLoading?: boolean
  viewMode?: 'grid' | 'list'
  onQuickView?: (productId: string) => void
  className?: string
}

export function ProductsGrid({
  products,
  isLoading = false,
  viewMode = 'grid',
  onQuickView,
  className,
}: ProductsGridProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'grid gap-6',
          viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1',
          className
        )}
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} viewMode={viewMode} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="mb-4 rounded-full bg-platinum-100 p-6">
          <svg
            className="h-16 w-16 text-nuanced-400"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-semibold text-anthracite-700">No products found</h3>
        <p className="max-w-md text-sm text-nuanced-500">
          We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
        </p>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        {products.map((product) => (
          <ProductCardList key={product.id} product={product} onQuickView={onQuickView} />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          id={product.id}
          name={product.name}
          slug={product.slug}
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          image={product.images[0]?.url}
          rating={product.rating}
          reviewCount={product.reviewCount}
          badge={
            product.badge
              ? {
                  text: product.badge,
                  variant: product.onSale
                    ? 'sale'
                    : product.featured
                    ? 'featured'
                    : 'new',
                }
              : undefined
          }
          stock={product.stock}
          onQuickView={onQuickView}
        />
      ))}
    </div>
  )
}

function ProductCardSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'list') {
    return (
      <div className="flex gap-4 rounded-lg border border-platinum-300 bg-white p-4">
        <Skeleton className="h-32 w-32 flex-shrink-0 rounded-md" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="mt-auto flex items-center gap-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-platinum-300 bg-white">
      <Skeleton className="aspect-square w-full" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>
  )
}

interface ProductCardListProps {
  product: Product
  onQuickView?: (productId: string) => void
}

function ProductCardList({ product, onQuickView }: ProductCardListProps) {
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price
  const discountPercentage = hasDiscount
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  return (
    <div className="group flex gap-4 overflow-hidden rounded-lg border border-platinum-300 bg-white p-4 transition-all hover:border-platinum-400 hover:shadow-md">
      {/* Image */}
      <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-md bg-platinum-100">
        {product.images[0]?.url ? (
          <Image
            src={product.images[0].url}
            alt={product.name}
            fill
            sizes="128px"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs text-nuanced-500">No image</span>
          </div>
        )}
        {hasDiscount && (
          <div className="absolute right-2 top-2">
            <span className="inline-block rounded-full bg-error px-2 py-1 text-xs font-bold text-white">
              -{discountPercentage}%
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2">
        {/* Badge */}
        {product.badge && (
          <span
            className={cn(
              'inline-block w-fit rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide',
              product.onSale
                ? 'bg-error text-white'
                : product.featured
                ? 'bg-aurore-500 text-anthracite-700'
                : 'bg-blue-500 text-white'
            )}
          >
            {product.badge}
          </span>
        )}

        {/* Title */}
        <a
          href={`/products/${product.slug}`}
          className="text-base font-medium text-anthracite-700 hover:text-orange-500 transition-colors line-clamp-2"
        >
          {product.name}
        </a>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < Math.floor(product.rating)
                      ? 'fill-orange-500 text-orange-500'
                      : 'fill-platinum-300 text-platinum-300'
                  )}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {product.reviewCount > 0 && (
              <span className="text-xs text-nuanced-500">({product.reviewCount})</span>
            )}
          </div>
        )}

        {/* Description (optional) */}
        {product.description && (
          <p className="text-sm text-nuanced-500 line-clamp-2">{product.description}</p>
        )}

        {/* Price & Actions */}
        <div className="mt-auto flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-orange-500">
              ${(product.price / 100).toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-nuanced-500 line-through">
                ${(product.compareAtPrice / 100).toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onQuickView && (
              <button
                onClick={() => onQuickView(product.id)}
                className="rounded-md border border-platinum-400 px-4 py-2 text-sm font-medium text-anthracite-600 transition-colors hover:border-orange-500 hover:text-orange-500"
              >
                Quick View
              </button>
            )}
            <a
              href={`/products/${product.slug}`}
              className="rounded-md bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-orange-600 hover:to-orange-700 hover:shadow-md"
            >
              View Details
            </a>
          </div>
        </div>

        {/* Stock Indicator */}
        {product.stock === 0 ? (
          <p className="text-xs text-error font-medium">Out of Stock</p>
        ) : product.stock < 10 ? (
          <p className="text-xs text-warning">Only {product.stock} left in stock</p>
        ) : null}
      </div>
    </div>
  )
}

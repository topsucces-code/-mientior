'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StarRating } from '@/components/ui/star-rating'
import { RippleButton } from '@/components/ui/ripple-button'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'

export interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  image?: string
  rating?: number
  reviewCount?: number
  badge?: {
    text: string
    variant: 'new' | 'sale' | 'featured' | 'limited'
  }
  stock?: number
  onQuickView?: (id: string) => void
  className?: string
}

const badgeStyles = {
  new: 'bg-blue-500 text-white',
  sale: 'bg-error text-white',
  featured: 'bg-aurore-500 text-anthracite-700',
  limited: 'bg-orange-500 text-white',
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  image,
  rating = 0,
  reviewCount = 0,
  badge,
  stock = 999,
  onQuickView,
  className,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const prefersReducedMotion = useReducedMotion()
  const cardRef = React.useRef<HTMLDivElement>(null)
  const isVisible = useIntersectionObserver(cardRef, { threshold: 0.1 })

  const addToCart = useCartStore((state) => state.addItem)
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()

  const inWishlist = isInWishlist(id)
  const isOutOfStock = stock === 0
  const hasDiscount = compareAtPrice && compareAtPrice > price
  const discountPercentage = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return

    addToCart({
      id,
      name,
      price,
      quantity: 1,
      image,
    })
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (inWishlist) {
      removeFromWishlist(id)
    } else {
      addToWishlist({
        productId: id,
        name,
        price,
        image,
        addedAt: new Date().toISOString(),
      })
    }
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(id)
  }

  return (
    <div
      ref={cardRef}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg bg-white transition-all duration-300',
        'border border-platinum-300 hover:border-platinum-400',
        'hover:shadow-elevation-3',
        !prefersReducedMotion && isVisible && 'animate-fade-in-up',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute left-3 top-3 z-10">
          <span
            className={cn(
              'inline-block rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide',
              badgeStyles[badge.variant]
            )}
          >
            {badge.text}
          </span>
        </div>
      )}

      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute right-3 top-3 z-10">
          <span className="inline-block rounded-full bg-error px-2 py-1 text-xs font-bold text-white">
            -{discountPercentage}%
          </span>
        </div>
      )}

      {/* Wishlist Button */}
      <button
        onClick={handleToggleWishlist}
        className={cn(
          'absolute right-3 top-12 z-10 flex h-9 w-9 items-center justify-center rounded-full',
          'bg-white/90 backdrop-blur-sm transition-all duration-300',
          'hover:bg-white hover:scale-110',
          'opacity-0 group-hover:opacity-100',
          inWishlist && 'opacity-100'
        )}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <Heart
          className={cn(
            'h-5 w-5 transition-all',
            inWishlist ? 'fill-error text-error scale-110' : 'text-anthracite-500'
          )}
        />
      </button>

      {/* Image Container */}
      <Link href={`/products/${slug}`} className="relative aspect-square overflow-hidden bg-platinum-100">
        {image ? (
          <>
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                'object-cover transition-all duration-500',
                'group-hover:scale-110',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-platinum-200 via-platinum-300 to-platinum-200 bg-[length:200%_100%]" />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-platinum-200">
            <span className="text-sm text-nuanced-500">No image</span>
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-black/60 to-transparent p-4 transition-all duration-300',
            isHovered && !prefersReducedMotion ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          )}
        >
          <RippleButton
            size="sm"
            variant="gradient"
            className="flex-1 text-sm"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
          >
            <ShoppingCart className="mr-1.5 h-4 w-4" />
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </RippleButton>

          {onQuickView && (
            <button
              onClick={handleQuickView}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-white/90 backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
              aria-label="Quick view"
            >
              <Eye className="h-4 w-4 text-anthracite-600" />
            </button>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <span className="rounded-md bg-anthracite-600 px-4 py-2 text-sm font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Rating */}
        {rating > 0 && (
          <StarRating rating={rating} reviewCount={reviewCount} size="sm" showCount={reviewCount > 0} />
        )}

        {/* Title */}
        <Link href={`/products/${slug}`} className="group/title">
          <h3 className="line-clamp-2 text-sm font-medium text-anthracite-700 transition-colors group-hover/title:text-orange-500">
            {name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-bold text-orange-500">
            ${(price / 100).toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-nuanced-500 line-through">
              ${(compareAtPrice / 100).toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Indicator */}
        {!isOutOfStock && stock < 10 && (
          <p className="text-xs text-warning">
            Only {stock} left in stock
          </p>
        )}
      </div>
    </div>
  )
}

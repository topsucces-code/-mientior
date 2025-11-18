'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Eye, Star, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from './badge'
import { Button } from './button'
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip'

export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  originalPrice?: number // Legacy prop - use compareAtPrice instead
  image?: string
  images?: string[]
  rating?: number
  reviewCount?: number
  badge?: {
    text: string
    variant: 'flash' | 'urgent' | 'bestseller' | 'trending' | 'new'
  } | string
  onSale?: boolean
  inStock?: boolean
  freeShipping?: boolean
  compact?: boolean
  onAddToCart?: (id: string) => void
  onQuickView?: (id: string) => void
  onWishlistToggle?: (id: string) => void
  isInWishlist?: boolean
  style?: React.CSSProperties
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  originalPrice: _originalPrice, // Destructure to prevent DOM warning (unused)
  image,
  images = [],
  rating = 0,
  reviewCount = 0,
  badge,
  inStock = true,
  freeShipping = false,
  onAddToCart,
  onQuickView,
  onWishlistToggle,
  isInWishlist = false,
  className,
  style,
  ...props
}: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const [isImageLoaded, setIsImageLoaded] = React.useState(false)

  const allImages = [image, ...images].filter(Boolean) as string[]
  const displayImage = allImages[currentImageIndex] || '/placeholder-product.jpg'
  const hasDiscount = compareAtPrice && compareAtPrice > price
  const discountPercentage = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0

  // Convert string badge to object format
  const getBadgeObject = (
    badge: string | { text: string; variant: 'flash' | 'urgent' | 'bestseller' | 'trending' | 'new' } | undefined
  ): { text: string; variant: 'flash' | 'urgent' | 'bestseller' | 'trending' | 'new' } | undefined => {
    if (!badge) return undefined
    if (typeof badge === 'string') return { text: badge, variant: 'new' }
    return badge
  }
  const badgeObject = getBadgeObject(badge)

  // Rotate images on hover
  React.useEffect(() => {
    if (isHovered && allImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
      }, 1500)
      return () => clearInterval(interval)
    } else {
      setCurrentImageIndex(0)
      return undefined
    }
  }, [isHovered, allImages.length])

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAddToCart?.(id)
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(id)
  }

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onWishlistToggle?.(id)
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border border-platinum-300 bg-white transition-all duration-300',
        'hover:shadow-elevation-3 hover:-translate-y-1',
        !inStock && 'opacity-60',
        className
      )}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Image Container */}
      <Link href={`/products/${slug}`} className="relative aspect-[4/5] overflow-hidden bg-platinum-100">
        {/* Badges */}
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-2">
          {badgeObject && (
            <Badge variant={badgeObject.variant} size="sm">
              {badgeObject.text}
            </Badge>
          )}
          {hasDiscount && (
            <Badge variant="urgent" size="sm">
              -{discountPercentage}%
            </Badge>
          )}
          {!inStock && (
            <Badge variant="error" size="sm">
              Épuisé
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={cn(
            'absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm transition-all duration-300',
            'hover:bg-white hover:scale-110 hover:shadow-elevation-2',
            isInWishlist && 'bg-orange-500 text-white hover:bg-orange-600'
          )}
          aria-label={isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart
            className={cn('h-5 w-5 transition-all', isInWishlist && 'fill-current')}
          />
        </button>

        {/* Product Image */}
        <Image
          src={displayImage}
          alt={name}
          fill
          className={cn(
            'object-cover transition-all duration-500',
            isHovered && 'scale-105',
            !isImageLoaded && 'blur-sm',
            isImageLoaded && 'blur-0'
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          onLoad={() => setIsImageLoaded(true)}
        />

        {/* Quick View Overlay */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300',
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={handleQuickView}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Aperçu rapide
          </Button>
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3.5 w-3.5',
                    i < Math.floor(rating)
                      ? 'fill-aurore-500 text-aurore-500'
                      : 'text-platinum-400'
                  )}
                />
              ))}
            </div>
            <span className="text-nuanced-500">
              ({rating.toFixed(1)}) • {reviewCount > 1000 ? `${(reviewCount / 1000).toFixed(1)}k` : reviewCount}
            </span>
          </div>
        )}

        {/* Product Name */}
        <Link href={`/products/${slug}`}>
          <h3 className="line-clamp-2 text-sm font-medium text-anthracite-500 transition-colors hover:text-orange-500">
            {name}
          </h3>
        </Link>

        {/* Free Shipping Badge */}
        {freeShipping && (
          <div className="flex items-center gap-1.5 text-xs text-success">
            <Truck className="h-3.5 w-3.5" />
            <span className="font-medium">Livraison gratuite</span>
          </div>
        )}

        {/* Price and Add to Cart Button */}
        <div className="flex items-center justify-between gap-2">
          {/* Price */}
          <div className="flex items-baseline gap-2">
            {hasDiscount && (
              <span className="text-sm text-nuanced-500 line-through decoration-2" style={{ fontFeatureSettings: '"tnum"' }}>
                {(compareAtPrice / 100).toFixed(2)}€
              </span>
            )}
            <span className="font-display text-2xl font-extrabold text-orange-500" style={{ fontFeatureSettings: '"tnum"' }}>
              {(price / 100).toFixed(2)}€
            </span>
          </div>

          {/* Add to Cart Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  onClick={handleAddToCart}
                  disabled={!inStock}
                  className={cn(
                    'w-10 h-10 p-0 md:w-auto md:h-10 md:px-4 md:gap-2 flex items-center justify-center transition-all duration-300',
                    isHovered && 'shadow-elevation-2'
                  )}
                  variant={inStock ? 'default' : 'outline'}
                  aria-label={inStock ? 'Ajouter au panier' : 'Rupture de stock'}
                >
                  <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden md:inline whitespace-nowrap">
                    {inStock ? 'Ajouter au panier' : 'Rupture de stock'}
                  </span>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{inStock ? 'Ajouter au panier' : 'Rupture de stock'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}


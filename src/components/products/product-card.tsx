'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { StarRating } from '@/components/ui/star-rating'
import { RippleButton } from '@/components/ui/ripple-button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { toast } from '@/hooks/use-toast'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/hooks/use-currency'

export interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  image?: string
  rating?: number
  reviewCount?: number
  salesCount?: number
  freeShipping?: boolean
  deliveryDays?: number
  badge?: {
    text: string
    variant: 'new' | 'sale' | 'featured' | 'limited'
  }
  stock?: number
  showCartButtonInInfo?: boolean
  onQuickView?: (id: string) => void
  className?: string
}

const badgeStyles = {
  new: 'bg-turquoise-500 text-white',
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
  salesCount,
  freeShipping,
  deliveryDays,
  badge,
  stock = 0,
  showCartButtonInInfo = false,
  onQuickView,
  className,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const prefersReducedMotion = useReducedMotion()
  const { ref: cardRef, isIntersecting: isVisible } = useIntersectionObserver<HTMLDivElement>({ threshold: 0.1 })
  const t = useTranslations('wishlist')
  const { formatPrice } = useCurrency()

  const addToCart = useCartStore((state) => state.addItem)
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()

  const PLACEHOLDER_IMAGE = '/images/placeholder.svg'

  const normalizeImageSrc = (src: string) => {
    if (src.startsWith('http://') || src.startsWith('https://')) return src
    if (src.startsWith('/')) return src
    return `/${src}`
  }

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Avoid hydration mismatch: SSR/first client render should not depend on client stores.
  const inWishlist = isMounted ? isInWishlist(id) : false
  const isOutOfStock = stock === 0
  const hasDiscount = compareAtPrice && compareAtPrice > price
  const discountPercentage = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0

  const soldLabel = (() => {
    if (!salesCount || salesCount <= 0) return undefined
    if (salesCount >= 1000) return `${Math.floor(salesCount / 100) / 10}k+ vendus`
    return `${salesCount} vendus`
  })()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock) return

    addToCart({
      id,
      productId: id,
      productName: name,
      productSlug: slug,
      productImage: image || PLACEHOLDER_IMAGE,
      price,
      quantity: 1,
      stock,
    })
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (inWishlist) {
      removeFromWishlist(id)
      toast({
        title: t('removedFromWishlist'),
        description: t('removedFromWishlistDesc', { name }),
      })
    } else {
      addToWishlist({
        productId: id,
        slug,
        name,
        price,
        image,
        addedAt: new Date().toISOString(),
      })
      toast({
        title: t('addedToWishlist'),
        description: t('addedToWishlistDesc', { name }),
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
      data-testid="product-card"
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[3px] bg-white transition-all duration-200',
        'border border-platinum-200 hover:border-platinum-300',
        'hover:shadow-sm',
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
              'inline-block rounded-[3px] px-2 py-1 text-xs font-semibold uppercase tracking-wide',
              badgeStyles[badge.variant]
            )}
          >
            {badge.text}
          </span>
        </div>
      )}

      {/* Discount Badge */}
      {hasDiscount && (
        <div className="absolute left-2 top-2 z-10">
          <span className="inline-block rounded-[3px] bg-error px-2 py-1 text-xs font-semibold text-white">
            -{discountPercentage}%
          </span>
        </div>
      )}

      {/* Wishlist Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleToggleWishlist}
            className={cn(
              'absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-[3px]',
              'bg-white/90 backdrop-blur-sm transition-all duration-300',
              'hover:bg-white hover:scale-110',
              'opacity-100 md:opacity-0 md:group-hover:opacity-100',
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
        </TooltipTrigger>
        <TooltipContent>
          <p>{inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}</p>
        </TooltipContent>
      </Tooltip>

      {/* Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-platinum-100">
        <Link href={`/products/${slug}`} className="block h-full w-full">
          {image && !imageError ? (
            <>
              <Image
                src={normalizeImageSrc(image)}
                alt={name}
                width={400}
                height={400}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={cn(
                  'h-full w-full object-cover transition-all duration-500',
                  'group-hover:scale-110'
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                unoptimized={true}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 bg-platinum-200 animate-pulse" />
              )}
            </>
          ) : (
            <Image
              src={PLACEHOLDER_IMAGE}
              alt={name}
              width={400}
              height={400}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="h-full w-full object-contain p-6"
              unoptimized={true}
            />
          )}
        </Link>

        {freeShipping && (
          <div className="absolute bottom-2 left-2 z-10 pointer-events-none">
            <span className="rounded-[3px] bg-white/90 px-2 py-1 text-xs font-semibold text-anthracite-800 backdrop-blur-sm">
              Livraison offerte
            </span>
          </div>
        )}

        {/* Quick Actions Overlay */}
        <div
          className={cn(
            'absolute bottom-2 right-2 z-10 flex items-center gap-2 transition-all duration-200',
            isHovered && !prefersReducedMotion ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <RippleButton
                  size="sm"
                  variant="gradient"
                  className="h-9 w-9 rounded-[3px] p-0"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  aria-label={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                >
                  <ShoppingCart className="h-4 w-4" />
                </RippleButton>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</p>
            </TooltipContent>
          </Tooltip>

          {onQuickView && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleQuickView}
                  className="flex h-9 w-9 items-center justify-center rounded-[3px] bg-white/90 backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
                  aria-label="Quick view"
                >
                  <Eye className="h-4 w-4 text-anthracite-600" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Quick view</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none">
            <span className="rounded-[3px] bg-anthracite-600 px-4 py-2 text-sm font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Rating */}
        {(rating > 0 || soldLabel) && (
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              {rating > 0 && (
                <StarRating rating={rating} reviewCount={reviewCount} size="sm" showCount={reviewCount > 0} />
              )}
            </div>
            {soldLabel && (
              <span className="shrink-0 text-xs font-medium text-nuanced-600">{soldLabel}</span>
            )}
          </div>
        )}

        {/* Title */}
        <Link href={`/products/${slug}`} className="group/title">
          <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-anthracite-800 transition-colors group-hover/title:text-orange-500">
            {name}
          </h3>
        </Link>

        {/* Price and Add to Cart Button */}
        <div className={cn(
          "mt-auto",
          showCartButtonInInfo ? "flex items-center justify-between gap-2" : "flex items-baseline gap-2"
        )}>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold text-anthracite-800">
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-nuanced-500 line-through">
                {formatPrice(compareAtPrice)}
              </span>
            )}
          </div>

          {/* Add to Cart Button in Info Section */}
          {showCartButtonInInfo && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex">
                  <RippleButton
                    size="sm"
                    variant="gradient"
                    className="h-10 w-10 p-0"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    aria-label={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </RippleButton>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {(deliveryDays || deliveryDays === 0) && (
          <p className="text-xs font-medium text-nuanced-600">
            Livraison sous {Math.max(1, deliveryDays)} j
          </p>
        )}

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

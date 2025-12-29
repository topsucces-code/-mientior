'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Star, Check, Eye, Flame, Truck } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { toast } from '@/hooks/use-toast'
import { useCurrency } from '@/hooks/use-currency'

export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  originalPrice?: number // Legacy prop
  image?: string
  images?: string[]
  rating?: number
  reviewCount?: number
  salesCount?: number
  badge?: {
    text: string
    variant: 'local' | 'new' | 'hot' | 'sale' | 'featured' | 'limited' | 'bestseller' | 'trending' | 'flash' | 'urgent'
  } | string
  onSale?: boolean // Legacy prop
  inStock?: boolean // Legacy prop
  stock?: number
  freeShipping?: boolean
  deliveryDays?: number
  compact?: boolean
  brand?: string
  vendor?: string
  isVerifiedSeller?: boolean
  isOfficialStore?: boolean
  onAddToCart?: (id: string) => void
  onQuickView?: (id: string) => void
  onWishlistToggle?: (id: string) => void
  isInWishlist?: boolean
  style?: React.CSSProperties
  priority?: boolean
}

const badgeStyles: Record<string, string> = {
  local: 'bg-red-500 text-white',
  new: 'bg-red-500 text-white',
  hot: 'bg-red-500 text-white',
  sale: 'bg-red-600 text-white',
  featured: 'bg-red-500 text-white',
  limited: 'bg-red-500 text-white',
  bestseller: 'bg-red-500 text-white',
  trending: 'bg-red-500 text-white',
  flash: 'bg-red-600 text-white',
  urgent: 'bg-red-600 text-white',
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  originalPrice,
  image,
  images = [],
  rating = 0,
  reviewCount = 0,
  salesCount = 0,
  badge,
  onSale: _onSale,
  inStock = true,
  stock,
  freeShipping = false,
  deliveryDays,
  compact: _compact,
  brand,
  vendor,
  isVerifiedSeller = false,
  isOfficialStore = false,
  onAddToCart,
  onQuickView,
  onWishlistToggle,
  isInWishlist: initialIsInWishlist = false,
  className,
  style,
  priority = false,
  ...props
}: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [imageError, setImageError] = React.useState(false)
  const [isAddingToCart, setIsAddingToCart] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  const PLACEHOLDER_IMAGE = '/images/placeholder.svg'

  const normalizeImageSrc = (src: string) => {
    if (src.startsWith('http://') || src.startsWith('https://')) return src
    if (src.startsWith('/')) return src
    return `/${src}`
  }

  // Use effective stock if provided, otherwise fallback to inStock param
  const effectiveStock = stock !== undefined ? stock : (inStock ? 10 : 0)
  const isOutOfStock = effectiveStock === 0

  const t = useTranslations('products.card')
  const tw = useTranslations('wishlist')
  const { formatPrice } = useCurrency()

  const addToCart = useCartStore((state) => state.addItem)
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Use store state if mounted, otherwise fallback to props (SSR/Hydration mismatch prevention)
  const inWishlist = isMounted ? isInWishlist(id) : initialIsInWishlist

  // Determine pricing to display
  const displayPrice = price
  const displayCompareAtPrice = compareAtPrice || originalPrice
  
  const hasDiscount = displayCompareAtPrice && displayCompareAtPrice > displayPrice
  const discountPercentage = hasDiscount
    ? Math.round(((displayCompareAtPrice - displayPrice) / displayCompareAtPrice) * 100)
    : 0

  const allImages = [image, ...images].filter(Boolean) as string[]
  // Fallback if no images provided
  if (allImages.length === 0) {
    allImages.push(PLACEHOLDER_IMAGE)
  }
  
  const displayImage = allImages[currentImageIndex] || allImages[0] || PLACEHOLDER_IMAGE
  const resolvedImage = imageError ? PLACEHOLDER_IMAGE : normalizeImageSrc(displayImage)

  // Convert string badge to object format
  const getBadgeObject = (
    badgeInput: ProductCardProps['badge']
  ): { text: string; variant: string } | undefined => {
    if (!badgeInput) return undefined
    if (typeof badgeInput === 'string') return { text: badgeInput, variant: 'new' }
    return badgeInput
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
      return undefined // Explicit return to satisfy linter
    }
  }, [isHovered, allImages.length])

  const formatSalesCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace('.0', '')}k+ ${t('sales')}`
    }
    return `${count} ${t('sales')}`
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOutOfStock || isAddingToCart) return

    onAddToCart?.(id)

    setIsAddingToCart(true)
    
    // Add to internal store as backup/direct action if parent handler just syncs
    // But we rely on parent usually. If onAddToCart is just a notify, we do logic here:
    if (!onAddToCart) {
       addToCart({
        id,
        productId: id,
        productName: name,
        productSlug: slug,
        productImage: image || PLACEHOLDER_IMAGE,
        price: displayPrice,
        quantity: 1,
        stock: effectiveStock,
      })
      toast({
        title: t('addedToCart'),
        description: name,
      })
    }

    setTimeout(() => setIsAddingToCart(false), 1500)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onWishlistToggle?.(id)

    // Fallback logic if no handler provided
    if (!onWishlistToggle) {
        if (inWishlist) {
            removeFromWishlist(id)
            toast({
                title: tw('removedFromWishlist'),
                description: name,
            })
        } else {
            addToWishlist({
                productId: id,
                slug,
                name,
                price: displayPrice,
                image: image || PLACEHOLDER_IMAGE,
                addedAt: new Date().toISOString(),
            })
            toast({
                title: tw('addedToWishlist'),
                description: name,
            })
        }
    }
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onQuickView?.(id)
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col bg-white rounded-[3px] overflow-hidden',
        'transition-all duration-300 hover:shadow-xl',
        isOutOfStock && 'opacity-70',
        className
      )}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Image Container */}
      <Link 
        href={`/products/${slug}`} 
        className="relative block w-full overflow-hidden bg-gray-50 rounded-t-[3px]"
        style={{ paddingBottom: '100%' }}
      >
        {/* Badge Top Left - Style Temu */}
        {badgeObject && (
          <span className={cn(
            'absolute left-0 top-2 z-10 px-2 py-1 text-xs font-semibold rounded-r-[3px] shadow-sm',
            badgeStyles[badgeObject.variant] || badgeStyles.local
          )}>
            {badgeObject.text}
          </span>
        )}

        {/* Wishlist & Quick View - Top Right */}
        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
          <button
            onClick={handleToggleWishlist}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-[3px]',
              'bg-white shadow-md border border-gray-100',
              'transition-all duration-200 hover:scale-110',
              inWishlist && 'bg-red-50 border-red-200'
            )}
            aria-label={inWishlist ? `${tw('removedFromWishlist')} ${name}` : `${tw('addToWishlist')} ${name}`}
          >
            <Heart
              className={cn(
                'w-3.5 h-3.5',
                inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'
              )}
            />
          </button>
          {onQuickView && (
            <button
              onClick={handleQuickView}
              className="w-7 h-7 flex items-center justify-center rounded-[3px] bg-white shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
              aria-label={`${t('quickView')} ${name}`}
            >
              <Eye className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Product Image */}
        <Image
          src={resolvedImage}
          alt={name}
          fill
          className={cn(
            'object-cover transition-transform duration-500',
            isHovered && 'scale-110'
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          onLoad={() => {
            setImageLoaded(true)
            setImageError(false)
          }}
          onError={() => {
            setImageLoaded(true)
            setImageError(true)
          }}
          priority={priority}
          unoptimized={true}
        />

        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <span className="px-3 py-1.5 bg-gray-900/90 text-white text-xs font-semibold rounded-[3px]">
              {t('outOfStock')}
            </span>
          </div>
        )}

        {/* Image Dots */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {allImages.slice(0, 5).map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  'w-1 h-1 rounded-[3px] transition-colors',
                  idx === currentImageIndex ? 'bg-orange-500' : 'bg-gray-300'
                )}
              />
            ))}
          </div>
        )}

        {/* Add to Cart Button - Bottom Right on Image */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAddingToCart}
          className={cn(
            'absolute right-2 bottom-2 z-10',
            'w-8 h-8 flex items-center justify-center rounded-[3px] shadow-lg',
            'transition-all duration-200',
            isAddingToCart
              ? 'bg-turquoise-500 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-orange-500 hover:text-white hover:border-orange-500',
            'hover:scale-110 active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label={isAddingToCart ? `${t('added')} ${name}` : `${t('addToCart')} ${name}`}
        >
          {isAddingToCart ? (
            <Check className="w-4 h-4" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
        </button>
      </Link>

      {/* Product Info - Temu Style */}
      <div className="flex flex-col gap-2 p-3 pt-2">
        {/* Product Name with Badge inline */}
        <Link href={`/products/${slug}`}>
          <h3 className="text-[12px] leading-[1.3] text-gray-700 line-clamp-2 hover:text-orange-600 transition-colors min-h-[32px]">
            {badgeObject && (
              <span className={cn(
                'inline-block mr-1 px-2 py-1 text-xs font-semibold rounded-[3px] align-middle',
                badgeStyles[badgeObject.variant] || badgeStyles.local
              )}>
                {badgeObject.text}
              </span>
            )}
            {name}
          </h3>
        </Link>

        {/* Price Row - Temu Style */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[18px] font-black text-anthracite-800 leading-none">
            {formatPrice(displayPrice)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-[11px] text-gray-400 line-through">
                {formatPrice(displayCompareAtPrice!)}
              </span>
              <span className="text-[10px] font-semibold text-red-500">
                -{discountPercentage}%
              </span>
            </>
          )}
        </div>

        {/* Sales Count - Temu Style */}
        {salesCount > 0 && (
          <span className="text-xs text-gray-500">
            <Flame className="inline w-3 h-3 text-gray-400 mr-0.5" />
            {formatSalesCount(salesCount)}
          </span>
        )}

        {/* Rating - Temu Style */}
        {rating > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-2.5 h-2.5',
                    i < Math.floor(rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-200 fill-gray-200'
                  )}
                />
              ))}
            </div>
            {reviewCount > 0 && (
              <span className="text-[10px] text-gray-400">
                {reviewCount > 1000 ? `${(reviewCount / 1000).toFixed(1)}k` : reviewCount}
              </span>
            )}
          </div>
        )}

        {/* Seller Badges Row - Temu Style */}
        <div className="flex flex-wrap items-center gap-1 mt-0.5">
          {isVerifiedSeller && (
            <span className="inline-flex items-center gap-0.5 px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-[3px] border border-purple-200">
              <Check className="w-2 h-2 text-purple-500" />
              {t('verifiedSeller')}
            </span>
          )}
          {isOfficialStore && (
            <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-[3px] border border-purple-200">
              {t('officialStore')}
            </span>
          )}
        </div>

        {/* Brand - Temu Style */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {brand && (
            <span className="text-xs text-gray-500">
              {t('brand')} <span className="text-gray-700 hover:underline cursor-pointer">{brand}</span>
            </span>
          )}
          
          {vendor && (
             <span className="text-xs text-gray-400">
              • {vendor}
             </span>
          )}
        </div>

        {/* Delivery & Shipping Info */}
        <div className="flex flex-col gap-0.5 mt-0.5">
          {deliveryDays && (
            <div className="text-xs text-green-700">
              {t('delivery')} <span className="text-green-800 font-semibold">{deliveryDays} {t('workingDays')}</span>
            </div>
          )}
          
          {freeShipping && (
            <div className="flex items-center gap-1 text-xs text-green-700 font-medium">
              <Truck className="w-3 h-3 text-green-600" />
              <span>{t('freeShipping') || 'Livraison offerte'}</span>
            </div>
          )}
        </div>

         {/* Low Stock Warning */}
         {!isOutOfStock && effectiveStock > 0 && effectiveStock <= 5 && (
          <span className="text-xs text-red-500 font-medium">
            ⚡ {t('lowStock', { count: effectiveStock })}
          </span>
        )}
      </div>
    </div>
  )
}


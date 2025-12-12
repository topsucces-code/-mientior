'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Star, Check, Eye, Flame } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { toast } from '@/hooks/use-toast'
import { useCurrency } from '@/hooks/use-currency'

export interface ProductCardUnifiedProps {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  image?: string
  images?: string[]
  rating?: number
  reviewCount?: number
  salesCount?: number
  badge?: {
    text: string
    variant: 'local' | 'new' | 'hot' | 'sale' | 'featured' | 'limited' | 'bestseller' | 'trending'
  }
  brand?: string
  isVerifiedSeller?: boolean
  isOfficialStore?: boolean
  stock?: number
  freeShipping?: boolean
  deliveryDays?: number
  className?: string
  onQuickView?: (id: string) => void
  priority?: boolean
}

const badgeStyles: Record<string, string> = {
  local: 'bg-orange-500 text-white',
  new: 'bg-turquoise-500 text-white',
  hot: 'bg-red-500 text-white',
  sale: 'bg-red-600 text-white',
  featured: 'bg-amber-500 text-white',
  limited: 'bg-purple-500 text-white',
  bestseller: 'bg-gradient-to-r from-orange-500 to-red-500 text-white',
  trending: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
}

export function ProductCardUnified({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  image,
  images = [],
  rating = 0,
  reviewCount = 0,
  salesCount = 0,
  badge,
  brand,
  isVerifiedSeller = false,
  isOfficialStore = false,
  stock = 10,
  freeShipping: _freeShipping = false,
  deliveryDays,
  className,
  onQuickView,
  priority = false,
}: ProductCardUnifiedProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0)
  const [imageLoaded, setImageLoaded] = React.useState(false)
  const [isAddingToCart, setIsAddingToCart] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  const t = useTranslations('products.card')
  const tw = useTranslations('wishlist')
  const { formatPrice } = useCurrency()

  const addToCart = useCartStore((state) => state.addItem)
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const inWishlist = isMounted && isInWishlist(id)
  const isOutOfStock = stock === 0
  const hasDiscount = compareAtPrice && compareAtPrice > price
  const discountPercentage = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0

  const allImages = [image, ...images].filter(Boolean) as string[]
  const placeholderImage = `https://picsum.photos/seed/${slug}/400/400`
  const displayImage = allImages[currentImageIndex] || placeholderImage

  // Rotate images on hover
  React.useEffect(() => {
    if (isHovered && allImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
      }, 1500)
      return () => clearInterval(interval)
    } else {
      setCurrentImageIndex(0)
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

    setIsAddingToCart(true)
    addToCart({
      id,
      productId: id,
      productName: name,
      productSlug: slug,
      productImage: image || '/placeholder-product.jpg',
      price,
      quantity: 1,
      stock,
    })

    toast({
      title: t('addedToCart'),
      description: name,
    })

    setTimeout(() => setIsAddingToCart(false), 1500)
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

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
        price,
        image,
        addedAt: new Date().toISOString(),
      })
      toast({
        title: tw('addedToWishlist'),
        description: name,
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
      className={cn(
        'group relative flex flex-col bg-white rounded-xl overflow-hidden',
        'transition-all duration-300 hover:shadow-xl',
        isOutOfStock && 'opacity-70',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <Link 
        href={`/products/${slug}`} 
        className="relative block w-full overflow-hidden bg-gray-50 rounded-t-xl"
        style={{ paddingBottom: '100%' }}
      >
        {/* Badge Top Left - Style Temu */}
        {badge && (
          <span className={cn(
            'absolute left-0 top-2 z-10 px-2 py-0.5 text-[10px] font-bold rounded-r-md shadow-sm',
            badgeStyles[badge.variant] || badgeStyles.local
          )}>
            {badge.text}
          </span>
        )}

        {/* Wishlist & Quick View - Top Right */}
        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5">
          <button
            onClick={handleToggleWishlist}
            className={cn(
              'w-7 h-7 flex items-center justify-center rounded-full',
              'bg-white shadow-md border border-gray-100',
              'transition-all duration-200 hover:scale-110',
              inWishlist && 'bg-red-50 border-red-200'
            )}
            aria-label={inWishlist ? t('removeFromWishlist') : t('addToWishlist')}
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
              className="w-7 h-7 flex items-center justify-center rounded-full bg-white shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
              aria-label={t('quickView')}
            >
              <Eye className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Product Image */}
        <Image
          src={displayImage}
          alt={name}
          fill
          className={cn(
            'object-cover transition-transform duration-500',
            isHovered && 'scale-110',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          onLoad={() => setImageLoaded(true)}
          priority={priority}
        />

        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <span className="px-3 py-1.5 bg-gray-900/90 text-white text-xs font-semibold rounded-full">
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
                  'w-1 h-1 rounded-full transition-colors',
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
            'w-8 h-8 flex items-center justify-center rounded-full shadow-lg',
            'transition-all duration-200',
            isAddingToCart
              ? 'bg-green-500 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-orange-500 hover:text-white hover:border-orange-500',
            'hover:scale-110 active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          aria-label={isAddingToCart ? t('added') : t('addToCart')}
        >
          {isAddingToCart ? (
            <Check className="w-4 h-4" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
        </button>
      </Link>

      {/* Product Info - Temu Style */}
      <div className="flex flex-col gap-1 p-2.5 pt-2">
        {/* Product Name with Badge inline */}
        <Link href={`/products/${slug}`}>
          <h3 className="text-[12px] leading-[1.3] text-gray-700 line-clamp-2 hover:text-orange-600 transition-colors min-h-[32px]">
            {badge && (
              <span className={cn(
                'inline-block mr-1 px-1 py-0.5 text-[9px] font-bold rounded align-middle',
                badgeStyles[badge.variant] || badgeStyles.local
              )}>
                {badge.text}
              </span>
            )}
            {name}
          </h3>
        </Link>

        {/* Price Row - Temu Style */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[18px] font-black text-orange-600 leading-none">
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-[11px] text-gray-400 line-through">
                {formatPrice(compareAtPrice)}
              </span>
              <span className="text-[10px] font-semibold text-green-600">
                -{discountPercentage}%
              </span>
            </>
          )}
        </div>

        {/* Sales Count - Temu Style */}
        {salesCount > 0 && (
          <span className="text-[11px] text-gray-500">
            <Flame className="inline w-3 h-3 text-orange-400 mr-0.5" />
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
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[9px] font-semibold rounded border border-orange-200">
              <Check className="w-2 h-2" />
              {t('verifiedSeller')}
            </span>
          )}
          {isOfficialStore && (
            <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-semibold rounded border border-blue-200">
              {t('officialStore')}
            </span>
          )}
        </div>

        {/* Brand - Temu Style */}
        {brand && (
          <span className="text-[10px] text-gray-500">
            {t('brand')} <span className="text-blue-600 hover:underline cursor-pointer">{brand}</span>
          </span>
        )}

        {/* Delivery Info - Temu Style */}
        {deliveryDays && (
          <div className="text-[10px] text-gray-600 mt-0.5">
            {t('delivery')} <span className="text-orange-600 font-bold">{deliveryDays} {t('workingDays')}</span>
          </div>
        )}

        {/* Low Stock Warning */}
        {!isOutOfStock && stock > 0 && stock <= 5 && (
          <span className="text-[10px] text-red-500 font-medium">
            ⚡ {t('lowStock', { count: stock })}
          </span>
        )}
      </div>
    </div>
  )
}

export default ProductCardUnified

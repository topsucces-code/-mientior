'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Star, Truck, Check, Eye, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { toast } from '@/hooks/use-toast'

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
  freeShipping = false,
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

  const formatPrice = (priceInCents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(priceInCents / 100)
  }

  const formatSalesCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1).replace('.0', '')}k+ ventes`
    }
    return `${count} ventes`
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
      title: 'Ajouté au panier',
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
        title: 'Retiré des favoris',
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
        title: 'Ajouté aux favoris',
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
        'group relative flex flex-col bg-white rounded-lg overflow-hidden',
        'border border-gray-200 hover:border-gray-300',
        'transition-all duration-300 hover:shadow-lg',
        isOutOfStock && 'opacity-70',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <Link 
        href={`/products/${slug}`} 
        className="relative block w-full overflow-hidden bg-gray-100"
        style={{ paddingBottom: '100%' }}
      >
        {/* Badges Top Left */}
        <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
          {badge && (
            <span className={cn(
              'px-1.5 py-0.5 text-[10px] font-bold uppercase rounded',
              badgeStyles[badge.variant] || badgeStyles.local
            )}>
              {badge.text}
            </span>
          )}
          {hasDiscount && discountPercentage >= 10 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded">
              -{discountPercentage}%
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={cn(
            'absolute right-2 top-2 z-10',
            'w-8 h-8 flex items-center justify-center rounded-full',
            'bg-white/90 backdrop-blur-sm shadow-sm',
            'transition-all duration-200',
            'hover:scale-110 hover:bg-white',
            inWishlist && 'bg-red-50'
          )}
          aria-label={inWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              inWishlist ? 'fill-red-500 text-red-500' : 'text-gray-600'
            )}
          />
        </button>

        {/* Quick View Button (on hover) */}
        {onQuickView && (
          <button
            onClick={handleQuickView}
            className={cn(
              'absolute right-2 top-12 z-10',
              'w-8 h-8 flex items-center justify-center rounded-full',
              'bg-white/90 backdrop-blur-sm shadow-sm',
              'transition-all duration-200',
              'opacity-0 group-hover:opacity-100',
              'hover:scale-110 hover:bg-white'
            )}
            aria-label="Aperçu rapide"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Product Image */}
        <Image
          src={displayImage}
          alt={name}
          fill
          className={cn(
            'object-cover transition-all duration-500',
            isHovered && 'scale-105',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          onLoad={() => setImageLoaded(true)}
          priority={priority}
        />

        {/* Loading Skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="px-3 py-1.5 bg-gray-900 text-white text-sm font-medium rounded">
              Épuisé
            </span>
          </div>
        )}

        {/* Image Dots Indicator */}
        {allImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {allImages.slice(0, 5).map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-colors',
                  idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex flex-col gap-1.5 p-2.5">
        {/* Product Name */}
        <Link href={`/products/${slug}`}>
          <h3 className="text-[13px] leading-tight font-medium text-gray-800 line-clamp-2 hover:text-turquoise-600 transition-colors">
            {name}
          </h3>
        </Link>

        {/* Price Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-lg font-bold text-orange-600">
              {formatPrice(price)} F
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(compareAtPrice)} F
              </span>
            )}
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAddingToCart}
            className={cn(
              'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full',
              'transition-all duration-200',
              isAddingToCart 
                ? 'bg-green-500 text-white' 
                : 'bg-orange-500 hover:bg-orange-600 text-white',
              'hover:scale-110 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
            )}
            aria-label={isAddingToCart ? 'Ajouté' : 'Ajouter au panier'}
          >
            {isAddingToCart ? (
              <Check className="w-4 h-4" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Sales Count */}
        {salesCount > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Flame className="w-3 h-3 text-orange-500" />
            <span>{formatSalesCount(salesCount)}</span>
          </div>
        )}

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'w-3 h-3',
                    i < Math.floor(rating)
                      ? 'fill-amber-400 text-amber-400'
                      : i < rating
                      ? 'fill-amber-400/50 text-amber-400'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            {reviewCount > 0 && (
              <span className="text-[11px] text-gray-500">
                {reviewCount > 1000 ? `${(reviewCount / 1000).toFixed(1)}k` : reviewCount}
              </span>
            )}
          </div>
        )}

        {/* Seller Badges */}
        <div className="flex flex-wrap gap-1">
          {isVerifiedSeller && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-turquoise-50 text-turquoise-700 text-[10px] font-medium rounded">
              <Check className="w-2.5 h-2.5" />
              Vendeur vedette
            </span>
          )}
          {isOfficialStore && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded">
              Magasin officiel
            </span>
          )}
          {brand && (
            <span className="text-[10px] text-gray-500">
              Marque : <span className="text-turquoise-600 font-medium">{brand}</span>
            </span>
          )}
        </div>

        {/* Delivery Info */}
        {(freeShipping || deliveryDays) && (
          <div className="flex items-center gap-1 pt-1 border-t border-gray-100">
            <Truck className="w-3 h-3 text-green-600" />
            <span className="text-[10px] text-gray-600">
              {freeShipping && <span className="text-green-600 font-medium">Livraison gratuite</span>}
              {freeShipping && deliveryDays && ' • '}
              {deliveryDays && (
                <span>
                  Arrive en <span className="text-turquoise-600 font-semibold">{deliveryDays} JOURS OUVRÉS OU PLUS</span>
                </span>
              )}
            </span>
          </div>
        )}

        {/* Low Stock Warning */}
        {!isOutOfStock && stock > 0 && stock <= 5 && (
          <span className="text-[10px] text-red-600 font-medium">
            Plus que {stock} en stock !
          </span>
        )}
      </div>
    </div>
  )
}

export default ProductCardUnified

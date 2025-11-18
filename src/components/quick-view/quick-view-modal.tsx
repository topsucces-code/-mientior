'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ShoppingCart, Heart, Share2, Loader2 } from 'lucide-react'
import useSWR from 'swr'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RippleButton } from '@/components/ui/ripple-button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { StarRating } from '@/components/ui/star-rating'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { cn } from '@/lib/utils'
import type { CartItem } from '@/types'

interface QuickViewModalProps {
  productId: string | null
  isOpen: boolean
  onClose: () => void
  onAddToCart?: (item: CartItem) => void
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  compareAtPrice?: number
  images: Array<{ url: string; alt: string }>
  rating?: number
  reviewCount?: number
  inStock: boolean
  stockQuantity?: number
  stock?: number
  variants?: Array<{
    id: string
    sku?: string
    size?: string | null
    color?: string | null
    stock: number
    priceModifier?: number | null
  }>
  badges?: Array<{
    text: string
    variant: 'new' | 'bestseller' | 'sale'
  }>
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Unauthorized access')
    }
    throw new Error('Failed to fetch product')
  }
  return res.json()
}

export function QuickViewModal({ productId, isOpen, onClose, onAddToCart }: QuickViewModalProps) {
  const { data: product, error, isLoading } = useSWR<Product>(
    productId ? `/api/public/products/${productId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  const [selectedImage, setSelectedImage] = React.useState(0)
  const [selectedVariants, setSelectedVariants] = React.useState<Record<string, string>>({})
  const [quantity, setQuantity] = React.useState(1)
  const [isAddingToCart, setIsAddingToCart] = React.useState(false)

  const addToCart = useCartStore((state) => state.addItem)
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore()

  const isInWishlist = product ? wishlistItems.some((item) => item.productId === product.id) : false

  const handleAddToCart = async () => {
    if (!product) return

    setIsAddingToCart(true)
    
    const cartItem = {
      id: product.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0]?.url || '/images/placeholder.svg',
      price: product.price,
      quantity,
      variant: Object.keys(selectedVariants).length > 0 ? {
        size: selectedVariants.size,
        color: selectedVariants.color,
        sku: `${product.id}-${selectedVariants.size || ''}-${selectedVariants.color || ''}`,
      } : undefined,
      stock: product.stock || 0,
    }

    try {
      addToCart(cartItem)
      onAddToCart?.(cartItem)
      
      // Show success feedback (optional)
      setTimeout(() => {
        setIsAddingToCart(false)
      }, 500)
    } catch (error) {
      console.error('Error adding to cart:', error)
      setIsAddingToCart(false)
    }
  }

  const handleToggleWishlist = () => {
    if (!product) return

    if (isInWishlist) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0]?.url || '/images/placeholder.svg',
        addedAt: new Date().toISOString(),
      })
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price / 100)
  }

  const discountPercentage = product?.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-white/90 p-2 shadow-lg transition-all hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500"
          aria-label="Close quick view"
        >
          <X className="h-5 w-5 text-anthracite-700" />
        </button>

        {isLoading || !product ? (
          <QuickViewSkeleton />
        ) : error ? (
          <QuickViewError onClose={onClose} />
        ) : (
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left Column - Product Gallery */}
            <div className="relative bg-platinum-50 p-6">
              {/* Badges */}
              {product.badges && product.badges.length > 0 && (
                <div className="absolute left-6 top-6 z-10 flex flex-wrap gap-2">
                  {product.badges.map((badge, index) => {
                    const badgeVariant = badge.variant === 'sale' ? 'urgent' : badge.variant
                    return (
                      <Badge 
                        key={index} 
                        variant={badgeVariant}
                      >
                        {badge.text}
                      </Badge>
                    )
                  })}
                </div>
              )}

              {/* Main Image */}
              <div className="relative aspect-square overflow-hidden rounded-lg bg-white mb-4">
                <Image
                  src={product.images[selectedImage]?.url || '/images/placeholder.svg'}
                  alt={product.images[selectedImage]?.alt || product.name}
                  fill
                  unoptimized={!product.images[selectedImage]?.url} // SVG placeholder needs unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        'relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all',
                        selectedImage === index
                          ? 'border-orange-500 ring-2 ring-orange-200'
                          : 'border-transparent hover:border-nuanced-300'
                      )}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt || `${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Product Info */}
            <div className="flex flex-col p-6 md:p-8">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-2xl md:text-3xl font-display font-bold text-anthracite-700 leading-tight">
                  {product.name}
                </DialogTitle>
              </DialogHeader>

              {/* Rating */}
              {product.rating && (
                <div className="mb-4 flex items-center gap-3">
                  <StarRating rating={product.rating} size="sm" />
                  <span className="text-sm text-nuanced-600">
                    {product.rating.toFixed(1)} ({product.reviewCount || 0} avis)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mb-6 flex items-baseline gap-3">
                <span className="text-3xl font-bold text-anthracite-700">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && (
                  <>
                    <span className="text-lg text-nuanced-500 line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                    <Badge variant="urgent" size="sm">
                      -{discountPercentage}%
                    </Badge>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="mb-6 text-nuanced-600 leading-relaxed">
                {product.description}
              </p>

              {/* Variants - Group by size and color */}
              {product.variants && product.variants.length > 0 && (() => {
                // Extract unique sizes and colors from variants
                const uniqueSizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))]
                const uniqueColors = [...new Set(product.variants.map(v => v.color).filter(Boolean))]
                
                return (
                  <div className="mb-6 space-y-4">
                    {/* Size selector */}
                    {uniqueSizes.length > 0 && (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-anthracite-700">
                          Taille
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {uniqueSizes.map((size) => (
                            <button
                              key={size}
                              onClick={() =>
                                setSelectedVariants((prev) => ({
                                  ...prev,
                                  size: size || '',
                                }))
                              }
                              className={cn(
                                'rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                                selectedVariants.size === size
                                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                                  : 'border-nuanced-300 bg-white text-anthracite-700 hover:border-nuanced-400'
                              )}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Color selector */}
                    {uniqueColors.length > 0 && (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-anthracite-700">
                          Couleur
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {uniqueColors.map((color) => (
                            <button
                              key={color}
                              onClick={() =>
                                setSelectedVariants((prev) => ({
                                  ...prev,
                                  color: color || '',
                                }))
                              }
                              className={cn(
                                'rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all',
                                selectedVariants.color === color
                                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                                  : 'border-nuanced-300 bg-white text-anthracite-700 hover:border-nuanced-400'
                              )}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Quantity */}
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-anthracite-700">
                  Quantité
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-nuanced-300 bg-white text-anthracite-700 transition-all hover:border-nuanced-400 hover:bg-platinum-50"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-lg font-semibold text-anthracite-700">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-nuanced-300 bg-white text-anthracite-700 transition-all hover:border-nuanced-400 hover:bg-platinum-50"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                  {product.stockQuantity && (
                    <span className="ml-2 text-sm text-nuanced-600">
                      {product.stockQuantity} disponibles
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <RippleButton
                  onClick={handleAddToCart}
                  disabled={!product.inStock || isAddingToCart}
                  variant="gradient"
                  size="lg"
                  className="w-full"
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Ajout en cours...
                    </>
                  ) : !product.inStock ? (
                    'Rupture de stock'
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Ajouter au panier
                    </>
                  )}
                </RippleButton>

                <div className="flex gap-3">
                  <RippleButton
                    onClick={handleToggleWishlist}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    <Heart
                      className={cn(
                        'mr-2 h-5 w-5',
                        isInWishlist && 'fill-orange-500 text-orange-500'
                      )}
                    />
                    {isInWishlist ? 'Dans la wishlist' : 'Ajouter à la wishlist'}
                  </RippleButton>
                  <RippleButton
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: product.name,
                          text: product.description,
                          url: `/products/${product.slug}`,
                        })
                      }
                    }}
                  >
                    <Share2 className="h-5 w-5" />
                  </RippleButton>
                </div>

                <Link href={`/products/${product.slug}`} className="block">
                  <RippleButton variant="ghost" size="lg" className="w-full">
                    Voir tous les détails
                  </RippleButton>
                </Link>
              </div>

              {/* Stock Status */}
              {product.inStock && (
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                  En stock - Expédition sous 24h
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function QuickViewSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-0">
      <VisuallyHidden.Root>
        <DialogTitle>Chargement du produit...</DialogTitle>
      </VisuallyHidden.Root>
      <div className="p-6 bg-platinum-50">
        <Skeleton className="aspect-square w-full rounded-lg mb-4" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-20 rounded-md" />
          ))}
        </div>
      </div>
      <div className="p-6 md:p-8 space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  )
}

function QuickViewError({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-8 text-center">
      <DialogTitle className="sr-only">Erreur de chargement du produit</DialogTitle>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <X className="h-8 w-8 text-red-600" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-anthracite-700">
        Erreur de chargement
      </h3>
      <p className="mb-6 text-nuanced-600">
        Impossible de charger les détails du produit. Veuillez réessayer.
      </p>
      <RippleButton onClick={onClose} variant="outline">
        Fermer
      </RippleButton>
    </div>
  )
}

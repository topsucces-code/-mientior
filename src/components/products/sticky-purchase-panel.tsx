'use client'

/**
 * Sticky purchase panel that appears on scroll with quick purchase options
 */

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingCart, Heart, Share2, ChevronUp } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PDP_CONFIG } from '@/lib/constants'
import type { Product, ProductVariant } from '@/types'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useToast } from '@/hooks/use-toast'

interface StickyPurchasePanelProps {
  product: Product
  selectedVariant: ProductVariant | null
  onVariantChange?: (variant: ProductVariant) => void
  quantity?: number
  onQuantityChange?: (quantity: number) => void
  className?: string
}

export function StickyPurchasePanel({
  product,
  selectedVariant,
  onVariantChange,
  quantity: externalQuantity,
  onQuantityChange,
  className,
}: StickyPurchasePanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [internalQuantity, setInternalQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const { addItem: addToCart } = useCartStore()
  const { addItem: addToWishlist, isInWishlist } = useWishlistStore()
  const { toast } = useToast()

  // Use external quantity if provided, otherwise use internal
  const quantity = externalQuantity ?? internalQuantity
  const setQuantity = onQuantityChange ?? setInternalQuantity

  // Show/hide panel based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Use PDP_CONFIG for scroll threshold
      setIsVisible(window.scrollY > PDP_CONFIG.stickyPanelOffset)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const finalPrice = selectedVariant?.priceModifier
    ? product.price + selectedVariant.priceModifier
    : product.price

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - finalPrice) / product.compareAtPrice) * 100)
    : 0

  const handleAddToCart = async () => {
    setIsAddingToCart(true)

    try {
      addToCart({
        id: `${product.id}-${selectedVariant?.sku || ''}`,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images[0]?.url || '',
        price: finalPrice,
        quantity,
        variant: selectedVariant
          ? {
              size: selectedVariant.size,
              color: selectedVariant.color,
              sku: selectedVariant.sku,
            }
          : undefined,
        stock: selectedVariant?.stock || product.stock,
      })

      toast({
        title: 'Ajouté au panier',
        description: `${product.name} a été ajouté à votre panier`,
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleAddToWishlist = () => {
    addToWishlist({
      productId: product.id,
      name: product.name,
      price: finalPrice,
      image: product.images[0]?.url,
      addedAt: new Date().toISOString(),
    })
    toast({
      title: 'Ajouté aux favoris',
      description: `${product.name} a été ajouté à vos favoris`,
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href,
      })
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast({ title: 'Lien copié!', description: 'Le lien a été copié dans le presse-papier' })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 transition-all duration-300',
        isVisible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0 pointer-events-none',
        className
      )}
    >
      {/* Panel Container */}
      <div className="bg-white border-t-2 border-platinum-300 shadow-elevation-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            {/* Product Image */}
            <div className="hidden md:block w-16 h-16 rounded-lg overflow-hidden border border-platinum-200 flex-shrink-0 relative">
              <Image
                src={product.images[0]?.url || '/placeholder-product.jpg'}
                alt={product.name}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-anthracite-900 truncate text-sm md:text-base">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl md:text-2xl font-bold text-orange-500">
                  {finalPrice.toFixed(2)}€
                </span>
                {product.compareAtPrice && (
                  <>
                    <span className="text-sm text-nuanced-500 line-through">
                      {product.compareAtPrice.toFixed(2)}€
                    </span>
                    <Badge variant="destructive" size="sm">
                      -{discount}%
                    </Badge>
                  </>
                )}
              </div>
            </div>

            {/* Variant Selection (Mobile Compact) */}
            {product.variants && product.variants.length > 0 && (
              <div className="hidden lg:flex items-center gap-2">
                {/* Size Selector */}
                {product.variants.some((v) => v.size) && (
                  <select
                    value={selectedVariant?.size || ''}
                    onChange={(e) => {
                      const variant = product.variants?.find((v) => v.size === e.target.value)
                      if (variant && onVariantChange) {
                        onVariantChange(variant)
                      }
                    }}
                    className="px-3 py-2 border-2 border-platinum-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Taille</option>
                    {[...new Set(product.variants.map((v) => v.size))].filter(Boolean).map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                )}

                {/* Color Selector */}
                {product.variants.some((v) => v.color) && (
                  <div className="flex items-center gap-1">
                    {[...new Set(product.variants.map((v) => v.color))].filter(Boolean).slice(0, 5).map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          const variant = product.variants?.find((v) => v.color === color)
                          if (variant && onVariantChange) {
                            onVariantChange(variant)
                          }
                        }}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 transition-all',
                          selectedVariant?.color === color
                            ? 'border-orange-500 ring-2 ring-orange-500/20 scale-110'
                            : 'border-platinum-300 hover:border-orange-300'
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="hidden sm:flex items-center border-2 border-platinum-300 rounded-lg flex-shrink-0">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 hover:bg-platinum-100 transition-colors text-lg"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 text-center border-x-2 border-platinum-300 py-2 text-sm font-medium"
                min="1"
                max={selectedVariant?.stock || product.stock}
              />
              <button
                onClick={() =>
                  setQuantity(Math.min((selectedVariant?.stock || product.stock), quantity + 1))
                }
                className="px-3 py-2 hover:bg-platinum-100 transition-colors text-lg"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Wishlist Button */}
              <button
                onClick={handleAddToWishlist}
                className={cn(
                  'hidden md:flex items-center justify-center w-12 h-12 rounded-lg border-2 transition-all',
                  isInWishlist(product.id)
                    ? 'border-red-500 bg-red-50 text-red-500'
                    : 'border-platinum-300 hover:border-orange-500'
                )}
                aria-label="Add to wishlist"
              >
                <Heart
                  className={cn('w-5 h-5', isInWishlist(product.id) && 'fill-current')}
                />
              </button>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="hidden lg:flex items-center justify-center w-12 h-12 rounded-lg border-2 border-platinum-300 hover:border-orange-500 transition-all"
                aria-label="Share product"
              >
                <Share2 className="w-5 h-5" />
              </button>

              {/* Add to Cart Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex">
                    <RippleButton
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || product.stock === 0}
                      className="h-12 px-6 md:px-8 gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold whitespace-nowrap flex items-center justify-center"
                      aria-label={product.stock === 0 ? 'Rupture de stock' : isAddingToCart ? 'Ajout en cours...' : 'Ajouter au panier'}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span className="hidden md:inline">{product.stock === 0 ? 'Rupture de stock' : isAddingToCart ? 'Ajout en cours...' : 'Ajouter au panier'}</span>
                    </RippleButton>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{product.stock === 0 ? 'Rupture de stock' : isAddingToCart ? 'Ajout en cours...' : 'Ajouter au panier'}</p>
                </TooltipContent>
              </Tooltip>

              {/* Scroll to Top Button */}
              <button
                onClick={scrollToTop}
                className="flex items-center justify-center w-12 h-12 rounded-lg bg-platinum-100 hover:bg-platinum-200 transition-all"
                aria-label="Scroll to top"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Warning Banner */}
      {(selectedVariant?.stock || product.stock) < 10 && (selectedVariant?.stock || product.stock) > 0 && (
        <div className="bg-red-500 text-white text-center py-2 px-4 text-sm font-medium">
          Plus que {selectedVariant?.stock || product.stock} en stock - Commandez vite !
        </div>
      )}
    </div>
  )
}

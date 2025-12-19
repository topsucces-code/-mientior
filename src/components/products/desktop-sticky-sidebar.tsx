'use client'

/**
 * Desktop Sticky Sidebar Component
 * Displays mini product info, variant selectors, and quick purchase actions
 * Only visible on desktop (lg breakpoint and above)
 */

import { useState } from 'react'
import { ShoppingCart, Heart, Check, Truck, RotateCcw, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useToast } from '@/hooks/use-toast'
import { useTranslations } from 'next-intl'
import { cn, extractReturnDays } from '@/lib/utils'
import { CART_CONFIG, PDP_CONFIG } from '@/lib/constants'
import type { Product, ProductVariant, ShippingInfo } from '@/types'

interface DesktopStickySidebarProps {
  product: Product
  selectedVariant: ProductVariant | null
  onVariantChange: (variant: ProductVariant) => void
  quantity: number
  onQuantityChange: (quantity: number) => void
  shippingInfo?: ShippingInfo
}

export function DesktopStickySidebar({
  product,
  selectedVariant,
  onVariantChange,
  quantity,
  onQuantityChange,
  shippingInfo,
}: DesktopStickySidebarProps) {
  const { addItem: addToCart } = useCartStore()
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore()
  const { toast } = useToast()
  const t = useTranslations('wishlist')
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const isWishlisted = wishlistItems.some(item => item.productId === product.id)

  // Calculate final price with variant modifier
  const finalPrice = selectedVariant?.priceModifier
    ? product.price + selectedVariant.priceModifier
    : product.price

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - finalPrice) / product.compareAtPrice) * 100)
    : 0

  // Get unique sizes and colors from variants
  const sizes = product.variants ? Array.from(new Set(product.variants.filter(v => v.size).map(v => v.size))) : []
  const colors = product.variants ? Array.from(new Set(product.variants.filter(v => v.color).map(v => v.color))) : []

  // Extract return days from shipping policy
  const returnDays = extractReturnDays(shippingInfo?.returnPolicy) || PDP_CONFIG.defaultReturnDays

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      toast({
        title: 'Produit indisponible',
        description: 'Ce produit est actuellement en rupture de stock.',
        variant: 'destructive',
      })
      return
    }

    setIsAddingToCart(true)

    const cartItem = {
      id: `${product.id}-${selectedVariant?.sku || ''}`,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0]?.url || '/images/placeholder.svg',
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
    }

    try {
      addToCart(cartItem)

      toast({
        title: 'Produit ajouté au panier',
        description: `${product.name} a été ajouté à votre panier.`,
      })

      setTimeout(() => {
        setIsAddingToCart(false)
      }, 500)
    } catch (error) {
      console.error('Error adding to cart:', error)
      setIsAddingToCart(false)
      
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue. Veuillez réessayer.',
        variant: 'destructive',
      })
    }
  }

  const handleToggleWishlist = () => {
    if (isWishlisted) {
      const wishlistItem = wishlistItems.find(item => item.productId === product.id)
      if (wishlistItem) {
        removeFromWishlist(wishlistItem.productId)
      }
      toast({
        title: t('removedFromWishlist'),
        description: t('removedFromWishlistDesc', { name: product.name }),
      })
    } else {
      addToWishlist({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: finalPrice,
        image: product.images[0]?.url || '/images/placeholder.svg',
        addedAt: new Date().toISOString(),
      })
      toast({
        title: t('addedToWishlist'),
        description: t('addedToWishlistDesc', { name: product.name }),
      })
    }
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(product.stock, quantity + delta))
    onQuantityChange(newQuantity)
  }

  return (
    <div className="sticky top-24 w-full">
      <div className="bg-white border-2 border-platinum-300 rounded-2xl p-5 shadow-sm">
        {/* Product Title & Badge */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-anthracite-900 leading-tight mb-2">
            {product.name}
          </h1>
          {product.badge && (
            <Badge variant="default" className="bg-aurore-500 text-anthracite-900 text-xs">
              #{product.badge}
            </Badge>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-platinum-200">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={cn(
                  'w-4 h-4',
                  i < Math.floor(product.rating) ? 'text-aurore-500 fill-aurore-500' : 'text-platinum-300'
                )}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-sm text-nuanced-600">
            {product.rating} ({product.reviewCount} avis)
          </span>
        </div>

        {/* Price */}
        <div className="mb-4 pb-4 border-b border-platinum-200">
          <div className="flex items-baseline gap-2 flex-wrap">
            {product.compareAtPrice && (
              <span className="text-base text-nuanced-500 line-through">
                {product.compareAtPrice.toFixed(2)}€
              </span>
            )}
            <span className="text-3xl font-bold text-orange-500">
              {finalPrice.toFixed(2)}€
            </span>
            {discount > 0 && (
              <Badge variant="destructive" className="text-sm">
                -{discount}%
              </Badge>
            )}
          </div>
          <p className="text-sm text-nuanced-600 mt-1">
            Ou <strong>3x {(finalPrice / 3).toFixed(2)}€</strong> sans frais
          </p>
        </div>

        {/* Variant Selectors */}
        <div className="space-y-4 mb-6">
          {/* Size Selector */}
          {sizes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-anthracite-900 mb-2">
                Taille
              </label>
              <select
                value={selectedVariant?.size || ''}
                onChange={(e) => {
                  const variant = product.variants?.find(v => v.size === e.target.value)
                  if (variant) onVariantChange(variant)
                }}
                className="w-full p-2 border border-platinum-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              >
                <option value="">Sélectionner une taille</option>
                {sizes.map((size) => (
                  <option key={size} value={size!}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Color Selector */}
          {colors.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-anthracite-900 mb-2">
                Couleur
              </label>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const variant = product.variants?.find(v => v.color === color)
                  const isSelected = selectedVariant?.color === color
                  
                  return (
                    <button
                      key={color}
                      onClick={() => variant && onVariantChange(variant)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg border-2 text-sm font-medium transition-all',
                        isSelected
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-platinum-300 hover:border-platinum-400 text-anthracite-700'
                      )}
                    >
                      {color}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector */}
          <div>
            <label className="block text-sm font-medium text-anthracite-900 mb-2">
              Quantité
            </label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="h-9 w-9 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1
                  onQuantityChange(Math.max(1, Math.min(product.stock, val)))
                }}
                className="w-16 text-center py-1.5 border border-platinum-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                min="1"
                max={product.stock}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= product.stock}
                className="h-9 w-9 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 mb-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex w-full">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || product.stock <= 0}
                  className="w-full h-14 flex items-center justify-center gap-3"
                  size="lg"
                  aria-label={product.stock <= 0 ? 'Rupture de stock' : isAddingToCart ? 'Ajout en cours...' : 'Ajouter au panier'}
                >
                  <ShoppingCart className="w-6 h-6" />
                  <p>{product.stock <= 0 ? 'Rupture de stock' : isAddingToCart ? 'Ajout en cours...' : 'Ajouter au panier'}</p>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{product.stock <= 0 ? 'Rupture de stock' : isAddingToCart ? 'Ajout en cours...' : 'Ajouter au panier'}</p>
            </TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            onClick={handleToggleWishlist}
            className="w-full"
            size="lg"
          >
            <Heart className={cn('w-5 h-5 mr-2', isWishlisted && 'fill-current text-red-500')} />
            {isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="space-y-3 pt-6 border-t border-platinum-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-turquoise-100 flex items-center justify-center">
              <Check className="w-4 h-4 text-turquoise-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-anthracite-900">En stock</p>
              <p className="text-xs text-nuanced-500">Expédition sous 24h</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-turquoise-100 flex items-center justify-center">
              <Truck className="w-4 h-4 text-turquoise-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-anthracite-900">Livraison gratuite</p>
              <p className="text-xs text-nuanced-500">
                Dès {shippingInfo?.freeShippingThreshold || CART_CONFIG.freeShippingThreshold}€ d'achat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-anthracite-900">Retour {returnDays}j</p>
              <p className="text-xs text-nuanced-500">
                {shippingInfo?.returnPolicy || 'Satisfait ou remboursé'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

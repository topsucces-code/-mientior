'use client'

/**
 * Desktop Sticky Sidebar Component
 * Displays mini product info, variant selectors, and quick purchase actions
 * Only visible on desktop (lg breakpoint and above)
 */

import { useState } from 'react'
import Image from 'next/image'
import { ShoppingCart, Heart, Check, Truck, RotateCcw, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useToast } from '@/hooks/use-toast'
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
        title: 'Retiré des favoris',
        description: `${product.name} a été retiré de vos favoris.`,
      })
    } else {
      addToWishlist({
        productId: product.id,
        name: product.name,
        price: finalPrice,
        image: product.images[0]?.url || '/images/placeholder.svg',
        addedAt: new Date().toISOString(),
      })
      toast({
        title: 'Ajouté aux favoris',
        description: `${product.name} a été ajouté à vos favoris.`,
      })
    }
  }

  const handleQuantityChange = (delta: number) => {
    const newQuantity = Math.max(1, Math.min(product.stock, quantity + delta))
    onQuantityChange(newQuantity)
  }

  return (
    <div className="hidden lg:block sticky top-24 w-full">
      <div className="bg-white border-2 border-platinum-300 rounded-2xl p-6 shadow-sm">
        {/* Mini Product Info */}
        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-platinum-200">
          <div className="relative w-20 h-20 flex-shrink-0 bg-platinum-100 rounded-lg overflow-hidden">
            {product.images[0] && (
              <Image
                src={product.images[0].url}
                alt={product.name}
                fill
                className="object-contain p-2"
                sizes="80px"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm text-anthracite-900 line-clamp-2 mb-2">
              {product.name}
            </h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-anthracite-900">
                {finalPrice.toFixed(2)} €
              </span>
              {product.compareAtPrice && (
                <>
                  <span className="text-sm text-nuanced-500 line-through">
                    {product.compareAtPrice.toFixed(2)} €
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    -{discount}%
                  </Badge>
                </>
              )}
            </div>
          </div>
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
                  className="w-full h-14 flex items-center justify-center"
                  size="lg"
                  aria-label={product.stock <= 0 ? 'Rupture de stock' : isAddingToCart ? 'Ajout en cours...' : 'Ajouter au panier'}
                >
                  <ShoppingCart className="w-6 h-6" />
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
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-anthracite-900">En stock</p>
              <p className="text-xs text-nuanced-500">Expédition sous 24h</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Truck className="w-4 h-4 text-blue-600" />
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

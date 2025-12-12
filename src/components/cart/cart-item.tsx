'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Minus, Plus, X, Heart, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { CartItem as CartItemType } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedQuantityUpdate } from '@/hooks/use-debounced-cart-update'
import { useOptimisticCart } from '@/hooks/use-optimistic-cart'
import { useCartAnalytics } from '@/hooks/use-cart-analytics'
import { formatCurrency } from '@/lib/currency'
import { useCartStore } from '@/stores/cart.store'
import { PromotionBadge } from '@/components/cart/promotion-badge'

interface CartItemProps {
  item: CartItemType
  className?: string
  showActions?: boolean
}

export function CartItem({ item, className, showActions = true }: CartItemProps) {
  const t = useTranslations('cart.item')
  const { removeItem: optimisticRemove, saveForLater: optimisticSave } = useOptimisticCart()
  const { trackRemoveFromCart } = useCartAnalytics()
  const { toast } = useToast()
  const [isRemoving, setIsRemoving] = React.useState(false)

  // Get item-level promotions from cart store
  const getItemPromotions = useCartStore(state => state.getItemPromotions)
  const itemPromotions = getItemPromotions(item.id)

  // Use debounced quantity update
  const { 
    quantity, 
    increment, 
    decrement, 
    isPending 
  } = useDebouncedQuantityUpdate({
    itemId: item.id,
    initialQuantity: item.quantity,
  })

  const handleIncrement = () => {
    // Check max quantity limit
    if (item.maxQuantity && quantity >= item.maxQuantity) {
      toast({
        title: 'Quantité maximale atteinte',
        description: `Vous ne pouvez commander que ${item.maxQuantity} unités de ce produit.`,
        variant: 'destructive'
      })
      return
    }
    increment()
  }

  const handleDecrement = () => {
    if (quantity > 1) {
      decrement()
    }
  }

  const handleRemove = () => {
    setIsRemoving(true)
    
    // Track analytics before removing
    trackRemoveFromCart(item)
    
    setTimeout(() => {
      optimisticRemove({ itemId: item.id })
    }, 300)
  }

  const handleSaveForLater = () => {
    optimisticSave({ itemId: item.id })
  }

  const subtotal = item.price * quantity

  return (
    <div
      className={cn(
        'flex gap-4 rounded-lg border border-platinum-300 bg-white p-4 transition-all hover:shadow-elevation-2',
        isRemoving && 'opacity-0 scale-95',
        className
      )}
    >
      {/* Product Image */}
      <Link href={`/products/${item.productSlug}`} className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-platinum-100 group">
        {item.productImage ? (
          <Image
            src={item.productImage}
            alt={item.productName ?? 'Product image'}
            fill
            className="object-cover transition-transform group-hover:scale-110"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-xs text-nuanced-500">No image</span>
          </div>
        )}
        {item.badge && (
          <Badge className="absolute top-1 left-1 text-xs" variant="secondary">
            {item.badge}
          </Badge>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <Link
              href={`/products/${item.productSlug}`}
              className="text-sm font-medium text-anthracite-700 hover:text-orange-500 transition-colors line-clamp-2"
            >
              {item.productName}
            </Link>

            {/* Variant Information */}
            {item.variant && (
              <div className="mt-1 flex flex-wrap gap-2 text-xs text-nuanced-600">
                {item.variant.size && (
                  <span className="font-medium">Taille: {item.variant.size}</span>
                )}
                {item.variant.color && (
                  <span className="font-medium">Couleur: {item.variant.color}</span>
                )}
              </div>
            )}

            {/* Stock Status & Free Shipping */}
            <div className="mt-1 flex flex-wrap gap-2">
              {item.inStock ? (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  En stock
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                  Rupture de stock
                </Badge>
              )}
              {item.freeShipping && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  <Truck className="h-3 w-3 mr-1" />
                  Livraison gratuite
                </Badge>
              )}
            </div>

            {/* Compare at Price & Item Promotions */}
            <div className="mt-1 space-y-1">
              {item.compareAtPrice && item.compareAtPrice > item.price && (
                <div>
                  <span className="text-xs text-nuanced-500 line-through">
                    {formatCurrency(item.compareAtPrice)}
                  </span>
                  <span className="ml-2 text-xs font-semibold text-green-600">
                    Économisez {formatCurrency(item.compareAtPrice - item.price)}
                  </span>
                </div>
              )}

              {/* Promotion Badges */}
              {itemPromotions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {itemPromotions.map(promo => (
                    <PromotionBadge
                      key={promo.id}
                      type={promo.type}
                      label={promo.label}
                      size="sm"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Remove Button */}
          {showActions && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 text-nuanced-500 hover:text-error"
              onClick={handleRemove}
              aria-label="Remove item"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Price and Quantity Controls */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Quantity Controls */}
              {showActions ? (
                <div className="flex items-center gap-2 rounded-md border border-platinum-300 bg-platinum-50">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-platinum-200"
                    onClick={handleDecrement}
                    disabled={quantity <= 1 || isPending}
                    aria-label="Diminuer la quantité"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className={cn(
                    "min-w-[2ch] text-center text-sm font-medium text-anthracite-700",
                    isPending && "text-orange-500"
                  )}>
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-platinum-200"
                    onClick={handleIncrement}
                    disabled={isPending || (item.maxQuantity ? quantity >= item.maxQuantity : false)}
                    aria-label="Augmenter la quantité"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <span className="text-sm text-nuanced-500">Qté: {item.quantity}</span>
              )}

              {/* Unit Price */}
              <span className="text-sm text-nuanced-500">
                {formatCurrency(item.price)} ch.
              </span>
            </div>

            {/* Subtotal */}
            <div className="text-right">
              <p className="text-base font-semibold text-orange-500">
                {formatCurrency(subtotal)}
              </p>
            </div>
          </div>

          {/* Save for Later Button */}
          {showActions && (
            <Button
              variant="ghost"
              size="sm"
              className="w-fit text-xs text-nuanced-600 hover:text-orange-500"
              onClick={handleSaveForLater}
            >
              <Heart className="h-3 w-3 mr-1" />
              Sauvegarder pour plus tard
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

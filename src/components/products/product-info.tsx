'use client'

/**
 * Product information block with variants, pricing, and CTAs
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Truck, RotateCcw, Shield, CreditCard, ShoppingCart } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { RippleButton } from '@/components/ui/ripple-button'
import { StarRating } from '@/components/ui/star-rating'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useToast } from '@/hooks/use-toast'
import { EnhancedColorSelector } from '@/components/products/enhanced-color-selector'
import { EnhancedSizeSelector } from '@/components/products/enhanced-size-selector'
import { EnhancedQuantitySelector } from '@/components/products/enhanced-quantity-selector'
import { RealTimeStockIndicator } from '@/components/products/real-time-stock-indicator'
import { SizeGuideModal } from '@/components/products/size-guide-modal'
import { TrustBadges } from '@/components/products/trust-badges'
import { PaymentMethods } from '@/components/products/payment-methods'
import { SocialShare } from '@/components/products/social-share'
import { ProductMeta } from '@/components/products/product-meta'
import { DeliveryOptionsModal } from '@/components/products/delivery-options-modal'
import { COLOR_HEX_MAP } from '@/lib/constants'
import { formatPrice } from '@/lib/utils'
import { useTranslations } from 'next-intl'
import { createCartItem } from '@/lib/cart-utils'
import type { Product, ProductVariant } from '@/types'

interface ProductInfoProps {
  product: Product
  selectedVariant: ProductVariant | null
  onVariantChange: (variant: ProductVariant) => void
  quantity?: number
  onQuantityChange?: (quantity: number) => void
}

export function ProductInfo({
  product,
  selectedVariant,
  onVariantChange,
  quantity: externalQuantity,
  onQuantityChange,
}: ProductInfoProps) {
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [internalQuantity, setInternalQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false)
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false)

  // Use external quantity if provided, otherwise use internal
  const quantity = externalQuantity ?? internalQuantity
  const setQuantity = onQuantityChange ?? setInternalQuantity

  const { addItem } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const { toast } = useToast()
  const t = useTranslations('products.pdp')
  const tNav = useTranslations('nav')
  const tWishlist = useTranslations('wishlist')

  // Derive variant from color/size selection and call onVariantChange
  useEffect(() => {
    if (product.variants && (selectedColor || selectedSize)) {
      const matchingVariant = product.variants.find((v) => {
        const colorMatch = !selectedColor || v.color === selectedColor
        const sizeMatch = !selectedSize || v.size === selectedSize
        return colorMatch && sizeMatch
      })

      if (matchingVariant && matchingVariant.id !== selectedVariant?.id) {
        onVariantChange(matchingVariant)
      }
    }
    // Don't call onVariantChange(null) as it expects ProductVariant, not null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedColor, selectedSize, product.variants])

  // Sync internal selections from selectedVariant to prevent drift
  // Sync selectedColor and selectedSize when variant changes
  useEffect(() => {
    if (selectedVariant) {
      if (selectedVariant.color && selectedVariant.color !== selectedColor) {
        setSelectedColor(selectedVariant.color)
      }
      if (selectedVariant.size && selectedVariant.size !== selectedSize) {
        setSelectedSize(selectedVariant.size)
      }
    }
  }, [selectedVariant, selectedColor, selectedSize])

  const finalPrice = selectedVariant?.priceModifier
    ? product.price + selectedVariant.priceModifier
    : product.price

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - finalPrice) / product.compareAtPrice) * 100)
    : 0

  // Use selectedVariant for stock and price
  const currentStock = selectedVariant?.stock ?? product.stock
  const maxQuantity = currentStock

  const handleAddToCart = async () => {
    // Check if variant selection is required
    const hasVariants = product.variants && product.variants.length > 0
    const requiresSize = hasVariants && product.variants?.some(v => v.size)
    const requiresColor = hasVariants && product.variants?.some(v => v.color)

    if (requiresSize && !selectedSize) {
      toast({
        title: t('selectSize'),
        description: t('selectSizeDesc'),
        variant: 'destructive',
      })
      return
    }

    if (requiresColor && !selectedColor) {
      toast({
        title: t('selectColor'),
        description: t('selectColorDesc'),
        variant: 'destructive',
      })
      return
    }

    setIsAddingToCart(true)

    try {
      const cartItem = createCartItem({
        product,
        variant: selectedVariant || undefined,
        quantity,
      })

      addItem(cartItem)

      toast({
        title: t('addedSuccess'),
        description: t('addedSuccessDesc', { name: product.name }),
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleToggleWishlist = () => {
    const inWishlist = isInWishlist(product.id)
    
    if (inWishlist) {
      removeFromWishlist(product.id)
      toast({
        title: tWishlist('removedFromWishlist'),
        description: tWishlist('removedFromWishlistDesc', { name: product.name }),
      })
    } else {
      addToWishlist({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: finalPrice,
        image: product.images[0]?.url,
        addedAt: new Date().toISOString(),
      })
      toast({
        title: tWishlist('addedToWishlist'),
        description: tWishlist('addedToWishlistDesc', { name: product.name }),
      })
    }
  }

  // Check if variant selection is complete
  const hasVariants = product.variants && product.variants.length > 0
  const requiresSize = hasVariants && product.variants?.some(v => v.size)
  const requiresColor = hasVariants && product.variants?.some(v => v.color)
  const isVariantSelectionComplete = (!requiresSize || !!selectedSize) && (!requiresColor || !!selectedColor)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-nuanced-600">
        <Link href="/" className="hover:text-orange-500">{tNav('home')}</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-orange-500">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-nuanced-900">{product.name}</span>
      </nav>

      {/* Title & Badges */}
      <div>
        <h1 className="text-3xl font-bold text-anthracite-900 mb-2">{product.name}</h1>
        {product.badge && (
          <Badge variant="default" className="bg-aurore-500 text-anthracite-900">
            #{product.badge}
          </Badge>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center gap-3">
        <StarRating rating={product.rating} size="lg" />
        <span className="text-sm text-nuanced-600">
          {t('reviews', { rating: product.rating, count: product.reviewCount })}
        </span>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-3">
          {product.compareAtPrice && (
            <span className="text-lg text-nuanced-500 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
          <span className="text-4xl font-bold text-orange-500">
            {formatPrice(finalPrice)}
          </span>
          {discount > 0 && (
            <Badge variant="destructive" className="text-base">
              -{discount}%
            </Badge>
          )}
        </div>
        <p className="text-sm text-nuanced-600">
            {/* Note: using hardcoded 3 for installment logic until we have a real config */}
          {t.rich('installment', { price: (finalPrice / 3).toFixed(2), strong: (chunks) => <strong>{chunks}</strong> })}
        </p>
      </div>

      {/* Color Selection */}
      {product.variants && product.variants.some(v => v.color) && (
        <EnhancedColorSelector
          colors={[...new Set(product.variants.map(v => v.color))].filter(Boolean).map((color) => ({
            id: color!,
            name: color!,
            hex: COLOR_HEX_MAP[color!] || '#CCCCCC',
          }))}
          selected={selectedColor}
          onChange={setSelectedColor}
        />
      )}

      {/* Size Selection */}
      {product.variants && product.variants.some(v => v.size) && (
        <EnhancedSizeSelector
          sizes={[...new Set(product.variants.map(v => v.size))].filter(Boolean).map((size) => {
            const variant = product.variants!.find(v => v.size === size)
            return {
              value: size!,
              available: variant ? variant.stock > 0 : false,
              stock: variant?.stock,
            }
          })}
          selected={selectedSize}
          onChange={setSelectedSize}
          onGuideClick={() => setIsSizeGuideOpen(true)}
        />
      )}

      {/* Quantity */}
      <div className="flex items-center gap-4">
        <EnhancedQuantitySelector
          value={quantity}
          min={1}
          max={maxQuantity}
          onChange={setQuantity}
        />
        <span className="text-sm text-nuanced-600">
          {t.rich('totalPrice', { total: (finalPrice * quantity).toFixed(2), strong: (chunks) => <strong className="text-anthracite-900">{chunks}</strong> })}
        </span>
      </div>

      {/* Stock Indicator */}
      <RealTimeStockIndicator 
        productId={product.id}
        variantId={selectedVariant?.id}
        initialStock={currentStock}
      />

      {/* CTAs */}
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex-1">
              <RippleButton
                onClick={handleAddToCart}
                disabled={isAddingToCart || !isVariantSelectionComplete || currentStock === 0}
                className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                aria-label={currentStock === 0 ? t('outOfStock') : isAddingToCart ? t('adding') : t('addToCart')}
              >
                <ShoppingCart className="w-6 h-6" />
                <p>{currentStock === 0 ? t('outOfStock') : isAddingToCart ? t('adding') : t('addToCart')}</p>
              </RippleButton>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{currentStock === 0 ? t('outOfStock') : isAddingToCart ? t('adding') : t('addToCart')}</p>
          </TooltipContent>
        </Tooltip>

        <button
          onClick={handleToggleWishlist}
          className={`flex items-center justify-center w-14 h-14 border-2 rounded-lg transition-all flex-shrink-0 ${
            isInWishlist(product.id) 
              ? 'border-red-500 bg-red-50 hover:bg-red-100' 
              : 'border-platinum-300 hover:border-orange-500'
          }`}
          aria-label={isInWishlist(product.id) ? tWishlist('removedFromWishlist') : tWishlist('addedToWishlist')}
        >
          <Heart className={`w-6 h-6 transition-all ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-anthracite-500 hover:text-orange-500'}`} />
        </button>
      </div>

      {/* Trust Badges */}
      <TrustBadges
        features={[
          { icon: <Truck className="w-5 h-5" />, text: t('trustBadges.freeShipping'), highlight: true },
          { icon: <RotateCcw className="w-5 h-5" />, text: t('trustBadges.freeReturns') },
          { icon: <Shield className="w-5 h-5" />, text: t('trustBadges.warranty') },
          { icon: <CreditCard className="w-5 h-5" />, text: t('trustBadges.securePayment') },
        ]}
        estimatedDelivery={{
          min: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          max: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        }}
        shippingOrigin="France"
        internationalShipping={true}
        onDeliveryClick={() => setIsDeliveryModalOpen(true)}
      />

      {/* Payment Methods */}
      <PaymentMethods
        methods={['visa', 'mastercard', 'paypal', 'apple-pay']}
        showSecurity={true}
      />

      {/* Social Share */}
      <SocialShare
        productName={product.name}
        productUrl={`${process.env.NEXT_PUBLIC_BASE_URL || 'https://mientior.com'}/products/${product.slug}`}
        description={product.description}
      />

      {/* Product Meta */}
      <ProductMeta
        sku={selectedVariant?.sku || product.id}
        category={{
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
          parent: product.category.parent,
        }}
        vendor={product.vendor}
        tags={product.tags}
      />

      {/* Size Guide Modal */}
      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        sizeGuide={null}
      />

      {/* Delivery Options Modal */}
      <DeliveryOptionsModal 
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
      />
    </div>
  )
}

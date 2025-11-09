'use client'

/**
 * Product information block with variants, pricing, and CTAs
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Heart, Share2, Truck, RotateCcw, Shield, CreditCard, Check } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { StarRating } from '@/components/ui/star-rating'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useToast } from '@/hooks/use-toast'
import type { Product, ProductVariant } from '@/types'

interface ProductInfoProps {
  product: Product
  selectedVariant: ProductVariant | null
  onVariantChange: (variant: ProductVariant) => void
}

export function ProductInfo({ product, selectedVariant, onVariantChange }: ProductInfoProps) {
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const { addItem } = useCartStore()
  const { addItem: addToWishlist, hasItem: isInWishlist } = useWishlistStore()
  const { toast } = useToast()

  // Derive variant from color/size selection and call onVariantChange
  useEffect(() => {
    if (product.variants && (selectedColor || selectedSize)) {
      const matchingVariant = product.variants.find((v) => {
        const colorMatch = !selectedColor || v.color === selectedColor
        const sizeMatch = !selectedSize || v.size === selectedSize
        return colorMatch && sizeMatch
      })

      if (matchingVariant) {
        onVariantChange(matchingVariant)
      }
    } else if (!selectedColor && !selectedSize) {
      onVariantChange(null)
    }
  }, [selectedColor, selectedSize, product.variants, onVariantChange])

  // Sync internal selections from selectedVariant to prevent drift
  useEffect(() => {
    if (selectedVariant) {
      if (selectedVariant.color && selectedVariant.color !== selectedColor) {
        setSelectedColor(selectedVariant.color)
      }
      if (selectedVariant.size && selectedVariant.size !== selectedSize) {
        setSelectedSize(selectedVariant.size)
      }
    }
  }, [selectedVariant])

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
    const requiresSize = hasVariants && product.variants.some(v => v.size)
    const requiresColor = hasVariants && product.variants.some(v => v.color)

    if (requiresSize && !selectedSize) {
      toast({
        title: 'Sélectionnez une taille',
        description: 'Veuillez choisir une taille avant d\'ajouter au panier',
        variant: 'destructive',
      })
      return
    }

    if (requiresColor && !selectedColor) {
      toast({
        title: 'Sélectionnez une couleur',
        description: 'Veuillez choisir une couleur avant d\'ajouter au panier',
        variant: 'destructive',
      })
      return
    }

    setIsAddingToCart(true)

    try {
      addItem({
        id: `${product.id}-${selectedVariant?.sku || ''}`,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images[0]?.url || '',
        price: finalPrice,
        quantity,
        variant: selectedVariant ? {
          size: selectedSize,
          color: selectedColor,
          sku: selectedVariant.sku,
        } : undefined,
        stock: currentStock,
      })

      toast({
        title: '✓ Ajouté au panier',
        description: `${product.name} a été ajouté à votre panier`,
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleAddToWishlist = () => {
    addToWishlist(product.id)
    toast({
      title: '♡ Ajouté aux favoris',
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

  // Calculate stock percentage for low stock warning
  const lowStockThreshold = 10
  const stockPercentage = Math.min((currentStock / lowStockThreshold) * 100, 100)

  // Check if variant selection is complete
  const hasVariants = product.variants && product.variants.length > 0
  const requiresSize = hasVariants && product.variants.some(v => v.size)
  const requiresColor = hasVariants && product.variants.some(v => v.color)
  const isVariantSelectionComplete = (!requiresSize || !!selectedSize) && (!requiresColor || !!selectedColor)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-nuanced-600">
        <Link href="/" className="hover:text-orange-500">Accueil</Link>
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
          {product.rating} ({product.reviewCount} avis)
        </span>
      </div>

      {/* Price */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-3">
          {product.compareAtPrice && (
            <span className="text-lg text-nuanced-500 line-through">
              {product.compareAtPrice.toFixed(2)}€
            </span>
          )}
          <span className="text-4xl font-bold text-orange-500">
            {finalPrice.toFixed(2)}€
          </span>
          {discount > 0 && (
            <Badge variant="destructive" className="text-base">
              -{discount}%
            </Badge>
          )}
        </div>
        <p className="text-sm text-nuanced-600">
          Ou <strong>3x {(finalPrice / 3).toFixed(2)}€</strong> sans frais
        </p>
      </div>

      {/* Color Selection */}
      {product.variants && product.variants.some(v => v.color) && (
        <div>
          <label className="block text-sm font-medium text-anthracite-900 mb-2">
            Couleur: <span className="text-nuanced-600">{selectedColor || 'Choisir'}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {[...new Set(product.variants.map(v => v.color))].filter(Boolean).map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color!)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${selectedColor === color
                  ? 'border-orange-500 ring-2 ring-orange-500/20'
                  : 'border-platinum-300 hover:border-orange-300'
                  }`}
                style={{ backgroundColor: color }}
                title={color}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {product.variants && product.variants.some(v => v.size) && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-anthracite-900">
              Taille: <span className="text-nuanced-600">{selectedSize || 'Choisir'}</span>
            </label>
            <button className="text-sm text-orange-500 hover:underline">
              Guide des tailles
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {[...new Set(product.variants.map(v => v.size))].filter(Boolean).map((size) => {
              const variant = product.variants!.find(v => v.size === size)
              const isOutOfStock = variant && variant.stock === 0
              const isLowStock = variant && variant.stock > 0 && variant.stock < 5

              return (
                <button
                  key={size}
                  onClick={() => !isOutOfStock && setSelectedSize(size!)}
                  disabled={isOutOfStock}
                  className={`min-w-[60px] px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${selectedSize === size
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : isOutOfStock
                      ? 'border-platinum-200 bg-platinum-100 text-nuanced-400 cursor-not-allowed'
                      : 'border-platinum-300 hover:border-orange-300'
                    }`}
                >
                  {size}
                  {isLowStock && <span className="block text-xs text-red-500">Bientôt épuisé</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-anthracite-900 mb-2">Quantité</label>
        <div className="flex items-center gap-4">
          <div className="flex items-center border-2 border-platinum-300 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2 hover:bg-platinum-100 transition-colors"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
              className="w-16 text-center border-x-2 border-platinum-300 py-2"
              min="1"
              max={maxQuantity}
            />
            <button
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              className="px-4 py-2 hover:bg-platinum-100 transition-colors"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <span className="text-sm text-nuanced-600">
            Prix total: <strong className="text-anthracite-900">{(finalPrice * quantity).toFixed(2)}€</strong>
          </span>
        </div>
      </div>

      {/* Stock Indicator */}
      {currentStock > 0 && currentStock <= lowStockThreshold && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">
            ⚠️ Il ne reste que {currentStock} article(s) en stock
          </p>
          <div className="mt-2 h-2 bg-red-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all"
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="space-y-3">
        <RippleButton
          onClick={handleAddToCart}
          disabled={isAddingToCart || !isVariantSelectionComplete || currentStock === 0}
          className="w-full h-14 text-lg font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentStock === 0 ? 'RUPTURE DE STOCK' : isAddingToCart ? 'Ajout en cours...' : 'AJOUTER AU PANIER'}
        </RippleButton>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleAddToWishlist}
            className="flex items-center justify-center gap-2 h-12 border-2 border-platinum-300 hover:border-orange-500 rounded-lg transition-all"
          >
            <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="font-medium">Favoris</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 h-12 border-2 border-platinum-300 hover:border-orange-500 rounded-lg transition-all"
          >
            <Share2 className="w-5 h-5" />
            <span className="font-medium">Partager</span>
          </button>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="space-y-2 pt-4 border-t border-platinum-200">
        {[
          { icon: Truck, text: 'Livraison gratuite dès 25€' },
          { icon: RotateCcw, text: 'Retour gratuit sous 30 jours' },
          { icon: Shield, text: 'Garantie 2 ans' },
          { icon: CreditCard, text: 'Paiement 100% sécurisé' },
        ].map(({ icon: Icon, text }, index) => (
          <div key={index} className="flex items-center gap-3 text-sm text-nuanced-700">
            <Icon className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* Delivery Estimate */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Truck className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Livraison estimée</p>
            <p className="text-sm text-green-700">
              Entre le {new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
              {' et le '}
              {new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}
            </p>
            <p className="text-xs text-green-600 mt-1">Expédié depuis France</p>
          </div>
        </div>
      </div>
    </div>
  )
}

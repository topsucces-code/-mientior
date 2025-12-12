'use client'

/**
 * Sophisticated Product Detail Page - Enhanced Temu-style Design
 * Features: Lightbox, keyboard navigation, animations, flash deals, guarantees
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Heart, Truck, Shield, Check, Star, ChevronRight,
  Gift, Zap, BadgeCheck, Copy, Facebook, Twitter, MessageCircle,
  ChevronLeft, X, ZoomIn, Share2, Clock, Package, RotateCcw,
  ThumbsUp, ShoppingBag, Sparkles, Award, Timer, Eye, Minus, Plus
} from 'lucide-react'
import { StickyPurchasePanel } from '@/components/products/sticky-purchase-panel'
import { FrequentlyBoughtTogether } from '@/components/products/frequently-bought-together'
import { ProductTabs } from '@/components/products/product-tabs'
import { DeliveryOptions, type DeliveryOption } from '@/components/delivery/delivery-options'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useToast } from '@/hooks/use-toast'
import { useCurrency } from '@/hooks/use-currency'
import { cn } from '@/lib/utils'
import type { Product, ProductVariant, ProductImage, Review, ReviewStats, QA, ShippingInfo, BundleProduct } from '@/types'

interface PDPClientProps {
  product: Product
  images: ProductImage[]
  has360View?: boolean
  hasVideo?: boolean
  bundleProducts?: BundleProduct[]
  reviews?: Review[]
  reviewStats?: ReviewStats
  qa?: QA[]
  shippingInfo?: ShippingInfo
}

export function PDPClient({
  product,
  images,
  has360View: _has360View,
  hasVideo: _hasVideo,
  bundleProducts = [],
  reviews = [],
  reviewStats,
  qa,
  shippingInfo,
}: PDPClientProps) {
  // Centralized state for variant selection and quantity
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedDeliveryOption, setSelectedDeliveryOption] = useState<DeliveryOption | null>(null)
  const [showDeliveryModal, setShowDeliveryModal] = useState(false)

  // Initialize first variant if available
  useEffect(() => {
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      const firstVariant = product.variants[0]
      if (firstVariant) {
        setSelectedVariant(firstVariant)
      }
    }
  }, [product.variants, selectedVariant])

  // Handle variant change - updates all related state
  const handleVariantChange = useCallback((variant: ProductVariant) => {
    setSelectedVariant(variant)
    // Reset quantity to 1 when variant changes
    setQuantity(1)
  }, [])

  // Handle quantity change
  const handleQuantityChange = useCallback((newQuantity: number) => {
    const maxStock = selectedVariant?.stock || product.stock
    setQuantity(Math.max(1, Math.min(maxStock, newQuantity)))
  }, [selectedVariant, product.stock])

  const { addItem: addToCart } = useCartStore()
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore()
  const { toast } = useToast()
  const { formatPrice } = useCurrency()
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const isWishlisted = wishlistItems.some(item => item.productId === product.id)

  const finalPrice = selectedVariant?.priceModifier
    ? product.price + selectedVariant.priceModifier
    : product.price

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - finalPrice) / product.compareAtPrice) * 100)
    : 0

  const currentStock = selectedVariant?.stock ?? product.stock

  // Calculate shipping cost
  const subtotal = finalPrice * quantity
  const getShippingCost = (option: DeliveryOption | null) => {
    if (!option || option.price === 0) return 0
    if (option.freeThreshold && subtotal >= option.freeThreshold) return 0
    return option.price
  }

  const shippingCost = getShippingCost(selectedDeliveryOption)
  const totalWithShipping = subtotal + shippingCost

  // Handle delivery option selection
  const handleDeliveryOptionSelect = (option: DeliveryOption) => {
    setSelectedDeliveryOption(option)
    setShowDeliveryModal(false)
    toast({
      title: 'Option de livraison mise à jour',
      description: `${option.name} - ${option.duration}`
    })
  }

  // Get unique sizes
  const sizes = product.variants ? [...new Set(product.variants.filter(v => v.size).map(v => v.size))] : []

  const handleAddToCart = () => {
    if (currentStock <= 0) {
      toast({ title: 'Produit indisponible', variant: 'destructive' })
      return
    }
    setIsAddingToCart(true)

    addToCart({
      id: `${product.id}-${selectedVariant?.sku || 'default'}`,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0]?.url || '/images/placeholder.svg',
      price: finalPrice,
      quantity,
      variant: selectedVariant ? {
        size: selectedVariant.size,
        color: selectedVariant.color,
        sku: selectedVariant.sku,
      } : undefined,
      stock: currentStock,
    })

    toast({ title: 'Ajouté au panier', description: product.name })
    setTimeout(() => setIsAddingToCart(false), 500)
  }

  const handleToggleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(product.id)
      toast({ title: 'Retiré des favoris' })
    } else {
      addToWishlist({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: finalPrice,
        image: product.images[0]?.url || '/images/placeholder.svg',
        addedAt: new Date().toISOString(),
      })
      toast({ title: 'Ajouté aux favoris' })
    }
  }

  // State for gallery
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)
  const galleryRef = useRef<HTMLDivElement>(null)

  // Flash deal countdown (demo)
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 45, seconds: 30 })

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 }
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        return prev
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Keyboard navigation for gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') setIsLightboxOpen(false)
        if (e.key === 'ArrowLeft') setSelectedImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1)
        if (e.key === 'ArrowRight') setSelectedImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isLightboxOpen, images.length])

  // Viewed count simulation - use product id hash for consistent SSR/client value
  const [viewedCount, setViewedCount] = useState(35)

  useEffect(() => {
    // Generate random value only on client side to avoid hydration mismatch
    setViewedCount(Math.floor(Math.random() * 50) + 20)
  }, [])

  // Get variant images for color selector
  const colorVariantsWithImages = useMemo(() => {
    if (!product.variants) return []
    const colorMap = new Map<string, { color: string; image: string; variant: ProductVariant }>()

    product.variants.forEach((variant) => {
      if (variant.color && !colorMap.has(variant.color)) {
        // Try to find an image for this color variant
        const variantImage = variant.image || images[0]?.url || '/images/placeholder.svg'
        colorMap.set(variant.color, { color: variant.color, image: variantImage, variant })
      }
    })

    return Array.from(colorMap.values())
  }, [product.variants, images])

  // Fallback image if no images available or URLs are invalid
  const fallbackImage = { url: '/images/placeholder.svg', alt: product.name, type: 'image' as const }

  // Filter out images with empty/invalid URLs and provide fallback
  const validImages = images.filter(img => img.url && img.url.trim() !== '' && img.url !== 'undefined')
  const displayImages = validImages.length > 0 ? validImages : [fallbackImage]
  const currentImage = displayImages[selectedImageIndex] || displayImages[0]

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPosition({ x, y })
  }

  const handleShare = async (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    const text = `Découvrez ${product.name} sur Mientior!`

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
        break
      case 'copy':
        await navigator.clipboard.writeText(url)
        toast({ title: 'Lien copié!' })
        break
    }
    setShowShareMenu(false)
  }

  const nextImage = () => setSelectedImageIndex(prev => prev < images.length - 1 ? prev + 1 : 0)
  const prevImage = () => setSelectedImageIndex(prev => prev > 0 ? prev - 1 : images.length - 1)

  return (
    <div className="bg-white">
      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={() => setIsLightboxOpen(false)}>
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); prevImage() }}
            className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>

          <div className="relative w-full max-w-4xl aspect-square mx-4" onClick={(e) => e.stopPropagation()}>
            {currentImage ? (
              <Image
                src={currentImage.url}
                alt={currentImage.alt || product.name}
                fill
                className="object-contain"
                sizes="100vw"
                priority
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/images/placeholder.svg'
                }}
              />
            ) : (
              <Image
                src="/images/placeholder.svg"
                alt={product.name}
                fill
                className="object-contain"
              />
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); nextImage() }}
            className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>

          {/* Thumbnails in lightbox */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {displayImages.slice(0, 8).map((img, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(index) }}
                className={cn(
                  'w-16 h-16 rounded-lg overflow-hidden border-2 transition-all bg-gray-800',
                  selectedImageIndex === index ? 'border-orange-500' : 'border-white/30 hover:border-white/60'
                )}
              >
                <Image
                  src={img.url}
                  alt={img.alt || ''}
                  width={64}
                  height={64}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/images/placeholder.svg'
                  }}
                />
              </button>
            ))}
          </div>

          <div className="absolute top-4 left-4 text-white/70 text-sm">
            {selectedImageIndex + 1} / {displayImages.length}
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 px-4 lg:px-0 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-orange-500 transition-colors">Accueil</Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        {product.category?.parent && (
          <>
            <Link href={`/categories/${product.category.parent.slug}`} className="hover:text-orange-500 transition-colors">
              {product.category.parent.name}
            </Link>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
          </>
        )}
        <Link href={`/categories/${product.category?.slug}`} className="hover:text-orange-500 transition-colors">
          {product.category?.name}
        </Link>
        <ChevronRight className="w-3 h-3 flex-shrink-0" />
        <span className="text-gray-700 truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main Product Section - Temu Style */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

        {/* LEFT: Gallery Section */}
        <div className="lg:col-span-7">
          <div className="flex gap-3">
            {/* Thumbnails - Vertical on left */}
            <div className="hidden md:flex flex-col gap-2 w-20 flex-shrink-0">
              {displayImages.slice(0, 6).map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  onMouseEnter={() => setSelectedImageIndex(index)}
                  className={cn(
                    'relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all bg-gray-50',
                    selectedImageIndex === index
                      ? 'border-orange-500 shadow-md'
                      : 'border-gray-200 hover:border-orange-300'
                  )}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || `${product.name} - Vue ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/images/placeholder.svg'
                    }}
                  />
                </button>
              ))}
              {displayImages.length > 6 && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-500 font-medium">+{displayImages.length - 6}</span>
                </div>
              )}
            </div>

            {/* Main Image */}
            <div className="flex-1" ref={galleryRef}>
              <div
                className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-gray-100 cursor-zoom-in group min-h-[500px]"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
                onClick={() => setIsLightboxOpen(true)}
              >
                {currentImage && currentImage.url ? (
                  <Image
                    src={currentImage.url}
                    alt={currentImage.alt || product.name}
                    fill
                    className={cn(
                      'object-cover transition-transform duration-300',
                      isZoomed && 'scale-150'
                    )}
                    style={isZoomed ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : undefined}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = '/images/placeholder.svg'
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="/images/placeholder.svg"
                      alt={product.name}
                      width={400}
                      height={400}
                      className="object-contain"
                    />
                  </div>
                )}

                {/* Badges on image */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {discount > 0 && (
                    <span className="px-2.5 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                      -{discount}%
                    </span>
                  )}
                  {product.featured && (
                    <span className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                      <Zap className="w-3 h-3" /> Top vente
                    </span>
                  )}
                  {currentStock <= 5 && currentStock > 0 && (
                    <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-lg">
                      <Timer className="w-3 h-3" /> Stock limité
                    </span>
                  )}
                </div>

                {/* Action buttons on image */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleWishlist() }}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg backdrop-blur-sm',
                      isWishlisted
                        ? 'bg-red-500 text-white scale-110'
                        : 'bg-white/90 text-gray-600 hover:text-red-500 hover:scale-110'
                    )}
                  >
                    <Heart className={cn('w-5 h-5 transition-transform', isWishlisted && 'fill-current animate-pulse')} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu) }}
                    className="w-10 h-10 rounded-full bg-white/90 text-gray-600 hover:text-orange-500 hover:scale-110 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Share menu popup */}
                {showShareMenu && (
                  <div className="absolute top-16 right-3 bg-white rounded-xl shadow-2xl p-3 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-2">
                      <button onClick={() => handleShare('facebook')} className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-colors">
                        <Facebook className="w-5 h-5 text-white" />
                      </button>
                      <button onClick={() => handleShare('twitter')} className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 flex items-center justify-center transition-colors">
                        <Twitter className="w-5 h-5 text-white" />
                      </button>
                      <button onClick={() => handleShare('whatsapp')} className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </button>
                      <button onClick={() => handleShare('copy')} className="w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors">
                        <Copy className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Zoom indicator */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm">
                  <ZoomIn className="w-3 h-3" /> Cliquez pour agrandir
                </div>

                {/* Navigation arrows */}
                {displayImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage() }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage() }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}

                {/* Image counter */}
                <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                  {selectedImageIndex + 1}/{displayImages.length}
                </div>
              </div>

              {/* Mobile thumbnails - Horizontal */}
              <div className="flex md:hidden gap-2 mt-3 overflow-x-auto pb-2">
                {displayImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      'relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all bg-gray-50',
                      selectedImageIndex === index
                        ? 'border-orange-500'
                        : 'border-gray-200'
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `Vue ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/images/placeholder.svg'
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Reviews summary under image */}
              <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-2xl font-bold text-gray-900">{product.rating.toFixed(1)}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-5 h-5',
                              i < Math.floor(product.rating)
                                ? 'text-orange-400 fill-orange-400'
                                : i < product.rating
                                  ? 'text-orange-400 fill-orange-400 opacity-50'
                                  : 'text-gray-300'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="h-8 w-px bg-orange-200" />
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900">{product.reviewCount.toLocaleString()}</span>
                      <span className="text-gray-500"> avis vérifiés</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600"><strong>{viewedCount}</strong> personnes regardent ce produit</span>
                  </div>
                </div>

                {/* Rating breakdown mini */}
                <div className="mt-3 flex items-center gap-2">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-1 text-xs">
                      <span className="text-gray-500">{stars}</span>
                      <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
                      <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-400 rounded-full"
                          style={{ width: `${stars === 5 ? 70 : stars === 4 ? 20 : stars === 3 ? 7 : 2}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust badges under gallery */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[
                  { icon: Truck, label: 'Livraison gratuite', color: 'text-green-600' },
                  { icon: RotateCcw, label: 'Retour 30 jours', color: 'text-blue-600' },
                  { icon: Shield, label: 'Paiement sécurisé', color: 'text-purple-600' },
                  { icon: Award, label: 'Qualité garantie', color: 'text-orange-600' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-lg text-center">
                    <Icon className={cn('w-5 h-5', color)} />
                    <span className="text-[10px] text-gray-600 leading-tight">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Product Info */}
        <div className="lg:col-span-5 px-4 lg:px-0">
          <div className="space-y-4">

            {/* Flash Deal Banner */}
            {discount > 0 && (
              <div className="bg-gradient-to-r from-red-500 via-orange-500 to-red-500 text-white p-3 rounded-xl flex items-center justify-between animate-gradient-x">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span className="font-bold">VENTE FLASH</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <Clock className="w-4 h-4" />
                  <span className="bg-white/20 px-2 py-0.5 rounded">{String(countdown.hours).padStart(2, '0')}</span>
                  <span>:</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded">{String(countdown.minutes).padStart(2, '0')}</span>
                  <span>:</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded">{String(countdown.seconds).padStart(2, '0')}</span>
                </div>
              </div>
            )}

            {/* Delivery Badge */}
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Livraison GRATUITE</p>
                <p className="text-xs text-green-600">Arrive en <strong>3-5 jours ouvrables</strong></p>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-lg lg:text-xl font-medium text-gray-900 leading-snug">
              {product.name}
            </h1>

            {/* Sales & Vendor */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>{(product.reviewCount * 15).toLocaleString()}+ ventes</span>
              <span>|</span>
              {product.vendor && (
                <Link
                  href={`/vendors/${product.vendor.slug}`}
                  className="flex items-center gap-1 text-orange-500 hover:underline"
                >
                  <BadgeCheck className="w-4 h-4" />
                  Vendeur vedette
                </Link>
              )}
              <span className="flex items-center gap-1">
                {product.rating.toFixed(1)}
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'w-3 h-3',
                        i < Math.floor(product.rating)
                          ? 'text-orange-400 fill-orange-400'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
              </span>
            </div>

            {/* Short Product Description */}
            {product.description && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                  {product.description}
                </p>
                <button
                  type="button"
                  className="text-xs text-orange-500 font-medium mt-1 hover:underline"
                  onClick={() => document.getElementById('product-details-tab')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Voir plus →
                </button>
              </div>
            )}

            {/* Best Seller Badge */}
            {product.featured && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                <Zap className="w-3 h-3" />
                #10 Mieux noté dans {product.category?.name}
              </div>
            )}

            {/* Price Section */}
            <div className="py-3 border-y border-gray-100">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(finalPrice)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > finalPrice && (
                  <>
                    <span className="text-base text-gray-400 line-through">
                      Payez {formatPrice(product.compareAtPrice)}
                    </span>
                    <span className="text-sm text-orange-500 font-medium">
                      aujourd'hui
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Shipping Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-medium">LIVRAISON GRATUITE</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <Check className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">5,00€ CRÉDIT POUR RETARD</span>
              </div>
            </div>

            {/* Color Selector with Images - Temu Style */}
            {colorVariantsWithImages.length > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">
                  Couleur
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorVariantsWithImages.map(({ color, image, variant }) => {
                    const isSelected = selectedVariant?.color === color
                    return (
                      <button
                        key={color}
                        onClick={() => handleVariantChange(variant)}
                        className={cn(
                          'relative flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all',
                          isSelected
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-orange-300'
                        )}
                      >
                        <div className="relative w-16 h-16 rounded overflow-hidden">
                          <Image
                            src={image}
                            alt={color}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <span className={cn(
                          'text-xs font-medium truncate max-w-[64px]',
                          isSelected ? 'text-orange-600' : 'text-gray-600'
                        )}>
                          {isSelected && <span className="mr-0.5">●</span>}
                          {color}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {sizes.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-900">
                    Taille: <span className="text-orange-500">{selectedVariant?.size}</span>
                  </label>
                  <button className="text-xs text-orange-500 hover:underline">Guide des tailles</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map((size) => {
                    const variant = product.variants?.find(v => v.size === size)
                    const isSelected = selectedVariant?.size === size
                    const isOutOfStock = variant && variant.stock <= 0
                    return (
                      <button
                        key={size}
                        onClick={() => variant && handleVariantChange(variant)}
                        disabled={isOutOfStock}
                        className={cn(
                          'min-w-[44px] h-9 px-3 rounded border text-sm font-medium transition-all',
                          isSelected
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : isOutOfStock
                              ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                              : 'border-gray-300 hover:border-orange-400 text-gray-700'
                        )}
                      >
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector - Enhanced */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Quantité</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(Number(e.target.value))}
                    className="w-14 h-10 text-center border-x border-gray-300 focus:outline-none text-sm font-medium"
                    min={1}
                    max={currentStock}
                  />
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= currentStock}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {currentStock <= 10 && currentStock > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full">
                    <Timer className="w-4 h-4" />
                    <span>Plus que <strong>{currentStock}</strong> en stock!</span>
                  </div>
                )}
              </div>
              {quantity > 1 && (
                <p className="text-sm text-gray-500">
                  Total: <span className="font-semibold text-gray-900">{formatPrice(finalPrice * quantity)}</span>
                </p>
              )}
            </div>

            {/* Add to Cart Buttons - Enhanced */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={currentStock <= 0 || isAddingToCart}
                className={cn(
                  'w-full h-14 rounded-xl font-bold text-lg text-white transition-all flex items-center justify-center gap-3 shadow-lg',
                  currentStock > 0
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] shadow-orange-200'
                    : 'bg-gray-300 cursor-not-allowed'
                )}
              >
                {isAddingToCart ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="w-6 h-6" />
                    AJOUTER AU PANIER
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  handleAddToCart()
                  // Navigate to checkout
                }}
                disabled={currentStock <= 0}
                className={cn(
                  'w-full h-12 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 border-2',
                  currentStock > 0
                    ? 'border-orange-500 text-orange-600 hover:bg-orange-50 active:scale-[0.98]'
                    : 'border-gray-300 text-gray-400 cursor-not-allowed'
                )}
              >
                <Zap className="w-5 h-5" />
                ACHETER MAINTENANT
              </button>
            </div>

            {/* Shipping Info Box - Enhanced with Dynamic Selection */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 space-y-4 border border-green-100 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-green-700">Options de livraison</span>
                </div>
                <button
                  onClick={() => setShowDeliveryModal(!showDeliveryModal)}
                  className="text-orange-500 hover:text-orange-600 font-medium text-sm flex items-center gap-1"
                >
                  {selectedDeliveryOption ? 'Modifier' : 'Choisir'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {selectedDeliveryOption ? (
                <>
                  {/* Selected delivery option display */}
                  <div className="p-3 bg-white rounded-lg border-2 border-green-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        {(() => {
                          const Icon = selectedDeliveryOption.icon
                          return <Icon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        })()}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-gray-900">{selectedDeliveryOption.name}</p>
                            {shippingCost === 0 && (
                              <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                                GRATUIT
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{selectedDeliveryOption.description}</p>
                          <p className="text-xs text-green-600 font-medium mt-1">
                            📦 {selectedDeliveryOption.duration}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {shippingCost === 0 ? (
                          <span className="text-green-600 font-bold">Gratuit</span>
                        ) : (
                          <span className="font-bold text-gray-900">{formatPrice(shippingCost)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Free shipping progress */}
                  {selectedDeliveryOption.freeThreshold && subtotal < selectedDeliveryOption.freeThreshold && (
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <p className="text-xs text-orange-700 mb-2">
                        Plus que <strong>{formatPrice(selectedDeliveryOption.freeThreshold - subtotal)}</strong> pour la livraison gratuite!
                      </p>
                      <div className="w-full h-2 bg-orange-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                          style={{ width: `${Math.min((subtotal / selectedDeliveryOption.freeThreshold) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> 5€ crédit retard
                  </span>
                  <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Suivi en temps réel
                  </span>
                  <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Retour gratuit
                  </span>
                </div>
              )}

              {/* Delivery modal */}
              {showDeliveryModal && (
                <div className="absolute left-0 right-0 z-20 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">Choisissez votre livraison</h4>
                    <button
                      onClick={() => setShowDeliveryModal(false)}
                      className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <DeliveryOptions
                    selectedOption={selectedDeliveryOption?.id}
                    onSelect={handleDeliveryOptionSelect}
                    cartTotal={subtotal}
                    showFullCards={false}
                  />
                </div>
              )}
            </div>

            {/* Guarantees Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Shield, title: 'Paiement sécurisé', desc: 'SSL 256-bit', color: 'purple' },
                { icon: RotateCcw, title: 'Retour gratuit', desc: '30 jours', color: 'blue' },
                { icon: ThumbsUp, title: 'Satisfaction', desc: '100% garantie', color: 'green' },
                { icon: Gift, title: 'Emballage soigné', desc: 'Cadeau possible', color: 'orange' },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className={cn(
                  'p-3 rounded-lg border flex items-center gap-3',
                  color === 'purple' && 'bg-purple-50 border-purple-100',
                  color === 'blue' && 'bg-blue-50 border-blue-100',
                  color === 'green' && 'bg-green-50 border-green-100',
                  color === 'orange' && 'bg-orange-50 border-orange-100',
                )}>
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    color === 'purple' && 'bg-purple-100',
                    color === 'blue' && 'bg-blue-100',
                    color === 'green' && 'bg-green-100',
                    color === 'orange' && 'bg-orange-100',
                  )}>
                    <Icon className={cn(
                      'w-5 h-5',
                      color === 'purple' && 'text-purple-600',
                      color === 'blue' && 'text-blue-600',
                      color === 'green' && 'text-green-600',
                      color === 'orange' && 'text-orange-600',
                    )} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{title}</p>
                    <p className="text-[10px] text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Vendor Info Card */}
            {product.vendor && (
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                      {product.vendor.businessName?.charAt(0) || 'V'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900">{product.vendor.businessName}</span>
                        <BadgeCheck className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
                          4.8
                        </span>
                        <span>•</span>
                        <span>98% avis positifs</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/vendors/${product.vendor.slug}`}
                    className="px-4 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    Voir boutique
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Frequently Bought Together */}
      {bundleProducts.length > 0 && (
        <div className="mb-12">
          <FrequentlyBoughtTogether
            mainProduct={product}
            bundleProducts={bundleProducts}
          />
        </div>
      )}

      {/* Product Tabs (Description, Specs, Reviews) */}
      <div className="mb-12">
        <ProductTabs
          product={product}
          reviews={reviews}
          reviewStats={reviewStats}
          qa={qa}
          shippingInfo={shippingInfo}
        />
      </div>

      {/* Sticky Purchase Panel (Mobile) */}
      <StickyPurchasePanel
        product={product}
        selectedVariant={selectedVariant}
        onVariantChange={handleVariantChange}
        quantity={quantity}
        onQuantityChange={handleQuantityChange}
      />
    </div>
  )
}

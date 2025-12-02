'use client'

/**
 * Client-side wrapper for PDP with centralized variant/quantity state management
 */

import { useState, useEffect, useCallback } from 'react'
import { ProductGallery } from '@/components/products/product-gallery'
import { ProductInfo } from '@/components/products/product-info'
import { StickyPurchasePanel } from '@/components/products/sticky-purchase-panel'
import { DesktopStickySidebar } from '@/components/products/desktop-sticky-sidebar'
import { FrequentlyBoughtTogether } from '@/components/products/frequently-bought-together'
import { ProductTabs } from '@/components/products/product-tabs'
import type { Product, ProductVariant, ProductImage, Review, ReviewStats, QA, ShippingInfo, BundleProduct } from '@/types'

interface PDPClientProps {
  product: Product
  images: ProductImage[]
  has360View: boolean
  hasVideo: boolean
  bundleProducts?: BundleProduct[]
  reviews?: Review[]
  reviewStats?: ReviewStats
  qa?: QA[]
  shippingInfo?: ShippingInfo
}

export function PDPClient({
  product,
  images,
  has360View,
  hasVideo,
  bundleProducts = [],
  reviews = [],
  reviewStats,
  qa,
  shippingInfo,
}: PDPClientProps) {
  // Centralized state for variant selection and quantity
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [quantity, setQuantity] = useState(1)

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

  return (
    <>
      {/* Main Product Section - Gallery + Info side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(400px,500px)] gap-6 lg:gap-8 mb-8">
        {/* Left Column: Gallery */}
        <div className="w-full">
          <ProductGallery
            images={images}
            productName={product.name}
            has360View={has360View}
            hasVideo={hasVideo}
          />
        </div>

        {/* Right Column: Product Info + Sticky Sidebar combined */}
        <div className="w-full">
          {/* Desktop: Show ProductInfo inline */}
          <div className="lg:hidden">
            <ProductInfo
              product={product}
              selectedVariant={selectedVariant}
              onVariantChange={handleVariantChange}
              quantity={quantity}
              onQuantityChange={handleQuantityChange}
            />
          </div>
          
          {/* Desktop Sticky Sidebar - contains all product info */}
          <div className="hidden lg:block">
            <DesktopStickySidebar
              product={product}
              selectedVariant={selectedVariant}
              onVariantChange={handleVariantChange}
              quantity={quantity}
              onQuantityChange={handleQuantityChange}
              shippingInfo={shippingInfo}
            />
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

      {/* Sticky Purchase Panel */}
      <StickyPurchasePanel
        product={product}
        selectedVariant={selectedVariant}
        onVariantChange={handleVariantChange}
        quantity={quantity}
        onQuantityChange={handleQuantityChange}
      />
    </>
  )
}

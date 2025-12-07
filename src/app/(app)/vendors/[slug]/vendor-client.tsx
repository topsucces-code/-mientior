'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ProductImage } from '@/components/ui/product-image'
// Note: Image is still used for vendor logo/banner
import { Store, Star, Package, Calendar, Grid, List, ShoppingCart, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { toast } from '@/hooks/use-toast'
import { useTranslations } from 'next-intl'

interface VendorProduct {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number | null
  stock: number
  rating: number
  reviewCount: number
  image?: string
  category?: string
}

interface Vendor {
  id: string
  name: string
  slug: string
  description?: string | null
  logo?: string | null
  rating: number
  productCount: number
  createdAt: string
  products: VendorProduct[]
}

interface VendorPageClientProps {
  vendor: Vendor
}

export function VendorPageClient({ vendor }: VendorPageClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'rating'>('newest')
  const { addItem: addToCart } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const t = useTranslations('wishlist')

  const sortedProducts = [...vendor.products].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return a.price - b.price
      case 'price-desc': return b.price - a.price
      case 'rating': return b.rating - a.rating
      default: return 0
    }
  })

  const handleAddToCart = (product: VendorProduct) => {
    if (product.stock <= 0) {
      toast({ title: 'Out of stock', variant: 'destructive' })
      return
    }

    addToCart({
      id: product.id,
      productId: product.id,
      name: product.name,
      productName: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      productImage: product.image || '',
      productSlug: product.slug,
      stock: product.stock,
    })

    toast({ title: 'Added to cart' })
  }

  const handleToggleWishlist = (product: VendorProduct) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
      toast({
        title: t('removedFromWishlist'),
        description: t('removedFromWishlistDesc', { name: product.name }),
      })
    } else {
      addToWishlist({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        addedAt: new Date().toISOString(),
      })
      toast({
        title: t('addedToWishlist'),
        description: t('addedToWishlistDesc', { name: product.name }),
      })
    }
  }

  const memberSince = new Date(vendor.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

  return (
    <div>
      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-r from-anthracite-700 to-anthracite-900 sm:h-64">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      {/* Vendor Info */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-16 mb-8 flex flex-col items-center sm:-mt-20 sm:flex-row sm:items-end sm:gap-6">
          {/* Logo */}
          <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg sm:h-40 sm:w-40">
            {vendor.logo ? (
              <Image
                src={vendor.logo}
                alt={vendor.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-platinum-100">
                <Store className="h-16 w-16 text-platinum-400" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-4 text-center sm:mt-0 sm:flex-1 sm:pb-4 sm:text-left">
            <h1 className="text-2xl font-bold text-anthracite-700 sm:text-3xl">{vendor.name}</h1>
            
            <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-sm text-nuanced-600 sm:justify-start">
              {vendor.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{vendor.rating.toFixed(1)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>{vendor.productCount} products</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Member since {memberSince}</span>
              </div>
            </div>

            {vendor.description && (
              <p className="mt-4 max-w-2xl text-nuanced-600">{vendor.description}</p>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div className="pb-12">
          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-anthracite-700">
              Products ({vendor.products.length})
            </h2>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="rounded-lg border border-platinum-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              >
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Best Rated</option>
              </select>

              {/* View Toggle */}
              <div className="flex rounded-lg border border-platinum-200 bg-white p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded p-2 ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'text-nuanced-600 hover:bg-platinum-100'}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded p-2 ${viewMode === 'list' ? 'bg-orange-100 text-orange-600' : 'text-nuanced-600 hover:bg-platinum-100'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid/List */}
          {sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-platinum-200 bg-white py-16 text-center">
              <Package className="mb-4 h-12 w-12 text-platinum-400" />
              <h3 className="text-lg font-medium text-anthracite-700">No products yet</h3>
              <p className="text-nuanced-600">This vendor hasn&apos;t added any products</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="group overflow-hidden rounded-lg border border-platinum-200 bg-white transition-shadow hover:shadow-lg"
                >
                  <Link href={`/products/${product.slug}`}>
                    <div className="relative aspect-square overflow-hidden bg-platinum-100">
                      <ProductImage
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="rounded bg-white px-2 py-1 text-xs font-medium">Out of Stock</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-3">
                    {product.category && (
                      <p className="mb-1 text-xs text-nuanced-500">{product.category}</p>
                    )}
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="line-clamp-2 text-sm font-medium text-anthracite-700 hover:text-orange-600">
                        {product.name}
                      </h3>
                    </Link>

                    {product.rating > 0 && (
                      <div className="mt-1 flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-nuanced-600">{product.rating.toFixed(1)}</span>
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <span className="font-bold text-anthracite-700">€{product.price.toFixed(2)}</span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-xs text-nuanced-500 line-through">
                          €{product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        <ShoppingCart className="mr-1 h-3 w-3" />
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleWishlist(product)}
                      >
                        <Heart className={`h-3 w-3 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex gap-4 rounded-lg border border-platinum-200 bg-white p-4"
                >
                  <Link href={`/products/${product.slug}`} className="shrink-0">
                    <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-platinum-100">
                      <ProductImage src={product.image} alt={product.name} fill className="object-cover" />
                    </div>
                  </Link>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      {product.category && (
                        <p className="text-xs text-nuanced-500">{product.category}</p>
                      )}
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-medium text-anthracite-700 hover:text-orange-600">
                          {product.name}
                        </h3>
                      </Link>
                      {product.rating > 0 && (
                        <div className="mt-1 flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-nuanced-600">
                            {product.rating.toFixed(1)} ({product.reviewCount})
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-anthracite-700">
                          €{product.price.toFixed(2)}
                        </span>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <span className="text-sm text-nuanced-500 line-through">
                            €{product.compareAtPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock <= 0}
                        >
                          <ShoppingCart className="mr-1 h-4 w-4" />
                          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleWishlist(product)}
                        >
                          <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

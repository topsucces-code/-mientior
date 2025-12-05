'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProductImage } from '@/components/ui/product-image'
import { useRouter } from 'next/navigation'
import { Heart, ShoppingCart, Trash2, Share2, Grid, List, ArrowLeft, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useCartStore } from '@/stores/cart.store'
import { toast } from '@/hooks/use-toast'

interface WishlistProduct {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number | null
  image?: string
  stock: number
  rating?: number
  reviewCount?: number
}

export function WishlistPageClient() {
  const router = useRouter()
  const { items, removeItem, clearWishlist } = useWishlistStore()
  const { addItem: addToCart } = useCartStore()
  const [products, setProducts] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const fetchProducts = async () => {
      if (items.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/products/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: items }),
        })

        if (response.ok) {
          const data = await response.json()
          setProducts(data)
        }
      } catch (error) {
        console.error('Failed to fetch wishlist products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [items])

  const handleAddToCart = (product: WishlistProduct) => {
    if (product.stock <= 0) {
      toast({
        title: 'Out of stock',
        description: 'This product is currently unavailable',
        variant: 'destructive',
      })
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

    toast({
      title: 'Added to cart',
      description: `${product.name} has been added to your cart`,
    })
  }

  const handleRemove = (productId: string, productName: string) => {
    removeItem(productId)
    toast({
      title: 'Removed from wishlist',
      description: `${productName} has been removed`,
    })
  }

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Wishlist',
          url,
        })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Link copied',
        description: 'Wishlist link copied to clipboard',
      })
    }
  }

  const handleAddAllToCart = () => {
    const inStockProducts = products.filter(p => p.stock > 0)
    if (inStockProducts.length === 0) {
      toast({
        title: 'No products available',
        description: 'All products in your wishlist are out of stock',
        variant: 'destructive',
      })
      return
    }

    inStockProducts.forEach(product => {
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
    })

    toast({
      title: 'Added to cart',
      description: `${inStockProducts.length} products added to your cart`,
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-platinum-200" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-lg bg-platinum-200" />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 rounded-full bg-platinum-100 p-6">
          <Heart className="h-12 w-12 text-platinum-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-anthracite-700">Your wishlist is empty</h1>
        <p className="mb-6 text-nuanced-600">
          Save products you love by clicking the heart icon
        </p>
        <Button onClick={() => router.push('/products')}>
          <Package className="mr-2 h-4 w-4" />
          Browse Products
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 flex items-center text-sm text-nuanced-600 hover:text-anthracite-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-anthracite-700">
            My Wishlist
            <span className="ml-2 text-lg font-normal text-nuanced-600">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
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

          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>

          <Button variant="outline" size="sm" onClick={() => clearWishlist()}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>

          <Button onClick={handleAddAllToCart}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add All to Cart
          </Button>
        </div>
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="group relative overflow-hidden rounded-lg border border-platinum-200 bg-white transition-shadow hover:shadow-lg"
            >
              {/* Remove Button */}
              <button
                onClick={() => handleRemove(product.id, product.name)}
                className="absolute right-2 top-2 z-10 rounded-full bg-white p-2 shadow-md transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Image */}
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
                      <span className="rounded bg-white px-3 py-1 text-sm font-medium text-anthracite-700">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="p-4">
                <Link href={`/products/${product.slug}`}>
                  <h3 className="mb-2 line-clamp-2 font-medium text-anthracite-700 hover:text-orange-600">
                    {product.name}
                  </h3>
                </Link>

                {/* Rating */}
                {product.rating && (
                  <div className="mb-2 flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-4 w-4 ${i < Math.round(product.rating!) ? 'text-yellow-400' : 'text-platinum-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-nuanced-600">({product.reviewCount})</span>
                  </div>
                )}

                {/* Price */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-lg font-bold text-anthracite-700">
                    €{product.price.toFixed(2)}
                  </span>
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="text-sm text-nuanced-500 line-through">
                      €{product.compareAtPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Add to Cart */}
                <Button
                  className="w-full"
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock <= 0}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex gap-4 rounded-lg border border-platinum-200 bg-white p-4"
            >
              {/* Image */}
              <Link href={`/products/${product.slug}`} className="shrink-0">
                <div className="relative h-32 w-32 overflow-hidden rounded-lg bg-platinum-100">
                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </Link>

              {/* Info */}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-medium text-anthracite-700 hover:text-orange-600">
                      {product.name}
                    </h3>
                  </Link>
                  {product.rating && (
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-sm text-yellow-500">★</span>
                      <span className="text-sm text-nuanced-600">
                        {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                      </span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-anthracite-700">
                      €{product.price.toFixed(2)}
                    </span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-sm text-nuanced-500 line-through">
                        €{product.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemove(product.id, product.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

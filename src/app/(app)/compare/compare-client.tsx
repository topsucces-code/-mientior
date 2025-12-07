'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProductImage } from '@/components/ui/product-image'
import { useRouter } from 'next/navigation'
import { X, ShoppingCart, Heart, ArrowLeft, Plus, Package, Check, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useComparatorStore } from '@/stores/comparator.store'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { toast } from '@/hooks/use-toast'
import { useTranslations } from 'next-intl'

interface CompareProduct {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number | null
  description?: string | null
  image?: string
  stock: number
  rating?: number | null
  reviewCount?: number | null
  category?: { name: string } | null
  specifications?: Record<string, string> | null
}

export function ComparePageClient() {
  const router = useRouter()
  const { items, removeItem, clearAll } = useComparatorStore()
  const { addItem: addToCart } = useCartStore()
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const [products, setProducts] = useState<CompareProduct[]>([])
  const [loading, setLoading] = useState(true)
  const t = useTranslations('wishlist')

  useEffect(() => {
    const fetchProducts = async () => {
      if (items.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/products/compare', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: items }),
        })

        if (response.ok) {
          const data = await response.json()
          setProducts(data)
        }
      } catch (error) {
        console.error('Failed to fetch comparison products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [items])

  const handleAddToCart = (product: CompareProduct) => {
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

  const handleToggleWishlist = (product: CompareProduct) => {
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

  const handleRemove = (productId: string) => {
    removeItem(productId)
  }

  // Get all unique specification keys
  const allSpecKeys = React.useMemo(() => {
    const keys = new Set<string>()
    products.forEach(p => {
      if (p.specifications) {
        Object.keys(p.specifications).forEach(k => keys.add(k))
      }
    })
    return Array.from(keys)
  }, [products])

  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-platinum-200" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-lg bg-platinum-200" />
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 rounded-full bg-platinum-100 p-6">
          <Package className="h-12 w-12 text-platinum-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-anthracite-700">No products to compare</h1>
        <p className="mb-6 text-nuanced-600">
          Add products to compare by clicking the compare icon on product cards
        </p>
        <Button onClick={() => router.push('/products')}>
          Browse Products
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-2 flex items-center text-sm text-nuanced-600 hover:text-anthracite-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-anthracite-700">
            Compare Products
            <span className="ml-2 text-lg font-normal text-nuanced-600">
              ({products.length} products)
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={clearAll}>
            Clear All
          </Button>
          <Button variant="outline" onClick={() => router.push('/products')}>
            <Plus className="mr-2 h-4 w-4" />
            Add More
          </Button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse">
          {/* Product Cards Row */}
          <thead>
            <tr>
              <th className="w-48 p-4 text-left align-top">
                <span className="text-sm font-medium text-nuanced-600">Product</span>
              </th>
              {products.map((product) => (
                <th key={product.id} className="relative w-64 p-4 align-top">
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemove(product.id)}
                    className="absolute right-2 top-2 rounded-full bg-white p-1 shadow-md hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  {/* Product Card */}
                  <div className="rounded-lg border border-platinum-200 bg-white p-4">
                    <Link href={`/products/${product.slug}`}>
                      <div className="relative mb-4 aspect-square overflow-hidden rounded-lg bg-platinum-100">
                        <ProductImage
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </Link>

                    <Link href={`/products/${product.slug}`}>
                      <h3 className="mb-2 line-clamp-2 text-sm font-medium text-anthracite-700 hover:text-orange-600">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Price */}
                    <div className="mb-4">
                      <span className="text-lg font-bold text-anthracite-700">
                        €{product.price.toFixed(2)}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="ml-2 text-sm text-nuanced-500 line-through">
                          €{product.compareAtPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        <ShoppingCart className="mr-1 h-4 w-4" />
                        {product.stock > 0 ? 'Add' : 'Out'}
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
                </th>
              ))}
              {/* Empty slots */}
              {[...Array(Math.max(0, 4 - products.length))].map((_, i) => (
                <th key={`empty-${i}`} className="w-64 p-4 align-top">
                  <div className="flex h-80 items-center justify-center rounded-lg border-2 border-dashed border-platinum-300 bg-platinum-50">
                    <Button variant="outline" onClick={() => router.push('/products')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Rating Row */}
            <tr className="border-t border-platinum-200">
              <td className="p-4 text-sm font-medium text-nuanced-600">Rating</td>
              {products.map((product) => (
                <td key={product.id} className="p-4 text-center">
                  {product.rating ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium">{product.rating.toFixed(1)}</span>
                      <span className="text-sm text-nuanced-500">({product.reviewCount})</span>
                    </div>
                  ) : (
                    <span className="text-nuanced-400">No reviews</span>
                  )}
                </td>
              ))}
              {[...Array(Math.max(0, 4 - products.length))].map((_, i) => (
                <td key={`empty-${i}`} className="p-4" />
              ))}
            </tr>

            {/* Stock Row */}
            <tr className="border-t border-platinum-200 bg-platinum-50">
              <td className="p-4 text-sm font-medium text-nuanced-600">Availability</td>
              {products.map((product) => (
                <td key={product.id} className="p-4 text-center">
                  {product.stock > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      <Check className="mr-1 h-3 w-3" />
                      In Stock ({product.stock})
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                      <Minus className="mr-1 h-3 w-3" />
                      Out of Stock
                    </span>
                  )}
                </td>
              ))}
              {[...Array(Math.max(0, 4 - products.length))].map((_, i) => (
                <td key={`empty-${i}`} className="p-4" />
              ))}
            </tr>

            {/* Category Row */}
            <tr className="border-t border-platinum-200">
              <td className="p-4 text-sm font-medium text-nuanced-600">Category</td>
              {products.map((product) => (
                <td key={product.id} className="p-4 text-center text-sm">
                  {product.category?.name || '-'}
                </td>
              ))}
              {[...Array(Math.max(0, 4 - products.length))].map((_, i) => (
                <td key={`empty-${i}`} className="p-4" />
              ))}
            </tr>

            {/* Specifications */}
            {allSpecKeys.length > 0 && (
              <>
                <tr className="border-t-2 border-platinum-300">
                  <td colSpan={5} className="bg-platinum-100 p-4 text-sm font-semibold text-anthracite-700">
                    Specifications
                  </td>
                </tr>
                {allSpecKeys.map((key, idx) => (
                  <tr key={key} className={`border-t border-platinum-200 ${idx % 2 === 0 ? 'bg-platinum-50' : ''}`}>
                    <td className="p-4 text-sm font-medium text-nuanced-600">{key}</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center text-sm">
                        {product.specifications?.[key] || '-'}
                      </td>
                    ))}
                    {[...Array(Math.max(0, 4 - products.length))].map((_, i) => (
                      <td key={`empty-${i}`} className="p-4" />
                    ))}
                  </tr>
                ))}
              </>
            )}

                      </tbody>
        </table>
      </div>
    </div>
  )
}

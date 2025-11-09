/**
 * Products Listing Page
 * Displays all products with filtering, sorting, and search capabilities
 */

import { Metadata } from 'next'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { ProductsPageClient } from './products-client'
import type { Product, AvailableFilters } from '@/types'

export const metadata: Metadata = {
  title: 'Products | Mientior',
  description: 'Browse our complete collection of products. Filter by category, price, and more.',
}

async function getProductsData() {
  try {
    // Fetch all products with Prisma
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          images: {
            orderBy: { order: 'asc' },
          },
          variants: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      prisma.category.findMany({
        take: 100,
        orderBy: { order: 'asc' },
      }),
    ])

    // Transform products
    const transformedProducts: Product[] = products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      compareAtPrice: product.compareAtPrice || undefined,
      images: product.images.map((img) => ({
        url: img.url,
        alt: img.alt,
        type: img.type === 'THREE_SIXTY' ? '360' : img.type.toLowerCase() as 'image' | 'video' | '360',
        thumbnail: img.thumbnail || undefined,
      })),
      variants: product.variants.map((v) => ({
        id: v.id,
        size: v.size || undefined,
        color: v.color || undefined,
        sku: v.sku,
        stock: v.stock,
        priceModifier: v.priceModifier || undefined,
        image: v.image || undefined,
      })),
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
        isActive: product.category.isActive,
      },
      tags: product.tags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
      })),
      rating: product.rating,
      reviewCount: product.reviewCount,
      stock: product.stock,
      badge: product.badge || undefined,
      featured: product.featured,
      onSale: product.onSale,
      description: product.description || undefined,
    }))

    // Calculate available filters
    const prices = transformedProducts.map(p => p.price).filter(p => p > 0)
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 100000

    const categoryCount: Record<string, number> = {}
    transformedProducts.forEach((product) => {
      const catId = product.category.id
      categoryCount[catId] = (categoryCount[catId] || 0) + 1
    })

    const availableFilters: AvailableFilters = {
      priceRange: {
        min: minPrice,
        max: maxPrice,
      },
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        count: categoryCount[cat.id] || 0,
      })),
      brands: [],
      colors: [],
      sizes: [],
    }

    // Extract colors and sizes from variants
    const colorSet = new Set<string>()
    const sizeSet = new Set<string>()
    transformedProducts.forEach((product) => {
      product.variants?.forEach((variant) => {
        if (variant.color) colorSet.add(variant.color)
        if (variant.size) sizeSet.add(variant.size)
      })
    })

    availableFilters.colors = Array.from(colorSet).map((color) => ({
      value: color,
      name: color,
      count: 0,
    }))

    availableFilters.sizes = Array.from(sizeSet).map((size) => ({
      value: size,
      count: 0,
    }))

    return {
      products: transformedProducts,
      availableFilters,
    }
  } catch (error) {
    console.error('Error fetching products:', error)
    return {
      products: [],
      availableFilters: {
        priceRange: { min: 0, max: 100000 },
        categories: [],
        brands: [],
        colors: [],
        sizes: [],
      },
    }
  }
}

export default async function ProductsPage() {
  const { products, availableFilters } = await getProductsData()

  return (
    <div className="min-h-screen bg-platinum-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-anthracite-700 mb-2">
            All Products
          </h1>
          <p className="text-nuanced-600">
            Discover our complete collection of premium products
          </p>
        </div>

        {/* Products Content - Client Component */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
            </div>
          }
        >
          <ProductsPageClient
            initialProducts={products}
            availableFilters={availableFilters}
          />
        </Suspense>
      </div>
    </div>
  )
}

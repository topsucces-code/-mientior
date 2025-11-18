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
    const [products, categories, vendors] = await Promise.all([
      prisma.product.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          vendor: true,
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
      prisma.vendor.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { businessName: 'asc' },
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
      })),
      variants: product.variants.map((v) => ({
        id: v.id,
        size: v.size || undefined,
        color: v.color || undefined,
        sku: v.sku,
        stock: v.stock,
        priceModifier: v.priceModifier || undefined,
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
      vendor: product.vendor ? {
        id: product.vendor.id,
        name: product.vendor.businessName, // For filter display
      } : undefined,
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

    // Build brand counts from vendors
    const brandCount: Record<string, number> = {}
    products.forEach((product) => {
      if (product.vendorId) {
        brandCount[product.vendorId] = (brandCount[product.vendorId] || 0) + 1
      }
    })

    // Build color counts from variants
    const colorCount: Record<string, number> = {}
    transformedProducts.forEach((product) => {
      product.variants?.forEach((variant) => {
        if (variant.color) {
          colorCount[variant.color] = (colorCount[variant.color] || 0) + 1
        }
      })
    })

    // Build size counts from variants
    const sizeCount: Record<string, number> = {}
    transformedProducts.forEach((product) => {
      product.variants?.forEach((variant) => {
        if (variant.size) {
          sizeCount[variant.size] = (sizeCount[variant.size] || 0) + 1
        }
      })
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
      brands: vendors
        .filter((vendor) => vendor.id && brandCount[vendor.id] && brandCount[vendor.id]! > 0)
        .map((vendor) => ({
          id: vendor.id!,
          name: vendor.businessName,
          count: brandCount[vendor.id!]!,
        }))
        .sort((a, b) => b.count - a.count),
      colors: Object.entries(colorCount)
        .map(([color, count]) => ({
          value: color,
          name: color,
          count,
        }))
        .sort((a, b) => b.count - a.count),
      sizes: Object.entries(sizeCount)
        .map(([size, count]) => ({
          value: size,
          count,
        }))
        .sort((a, b) => {
          // Sort sizes in logical order: XS, S, M, L, XL, XXL, etc.
          const sizeOrder: Record<string, number> = {
            'XXS': 1, 'XS': 2, 'S': 3, 'M': 4, 'L': 5, 'XL': 6, 'XXL': 7, 'XXXL': 8
          }
          return (sizeOrder[a.value] || 99) - (sizeOrder[b.value] || 99)
        }),
    }

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

  // Build breadcrumb data
  const breadcrumbs = [
    { label: 'Accueil', href: '/' },
    { label: 'Produits' }
  ]

  // Build category hero data
  const categoryHeroData = {
    title: 'Tous les Produits',
    description: 'Découvrez notre collection complète de produits premium',
    productCount: products.length,
    quickFilters: [
      { id: 'new', label: 'Nouveautés', value: 'newest' },
      { id: 'sale', label: 'En promotion', value: 'onSale' },
      { id: 'bestseller', label: 'Bestsellers', value: 'bestseller' }
    ]
  }

  // SEO content data
  const seoContent = {
    title: 'À propos de notre collection',
    content: `
      <h2>Découvrez Notre Collection Premium</h2>
      <p>Explorez notre sélection complète de produits soigneusement choisis pour leur qualité exceptionnelle.
      Nous travaillons avec les meilleurs vendeurs pour vous offrir une expérience d'achat incomparable.</p>

      <h3>Qualité Garantie</h3>
      <p>Tous nos produits sont vérifiés et approuvés par notre équipe avant d'être mis en vente.
      Nous garantissons la satisfaction de nos clients avec une politique de retour flexible.</p>

      <h3>Livraison Rapide</h3>
      <p>Profitez de notre service de livraison rapide partout en France.
      La livraison est gratuite pour toute commande supérieure à 50€.</p>
    `
  }

  return (
    <div className="min-h-screen bg-platinum-50">
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
          breadcrumbs={breadcrumbs}
          categoryHeroData={categoryHeroData}
          seoContent={seoContent}
        />
      </Suspense>
    </div>
  )
}

/**
 * Dynamic Category Page
 * Displays products filtered by category with filtering, sorting, and search capabilities
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { CategoryPageClient } from './category-client'
import type { Product, AvailableFilters, BreadcrumbItem } from '@/types'

export const revalidate = 300 // ISR: Revalidate every 5 minutes

interface CategoryPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await prisma.category.findUnique({
    where: { slug },
  })

  if (!category) {
    return {
      title: 'Catégorie non trouvée',
    }
  }

  return {
    title: `${category.name} | Mientior`,
    description: category.description || `Découvrez notre sélection de produits ${category.name}`,
  }
}

async function getCategoryData(slug: string) {
  try {
    // Fetch category (use findFirst since isActive is not part of unique constraint)
    const category = await prisma.category.findFirst({
      where: { 
        slug,
        isActive: true 
      },
      include: {
        parent: true,
      },
    })

    // Return null if category not found or inactive
    if (!category) {
      return null
    }

    // Fetch products filtered by category
    const [products, allCategories, vendors] = await Promise.all([
      prisma.product.findMany({
        where: {
          categoryId: category.id,
          status: 'ACTIVE',
        },
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
        where: { isActive: true },
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
      categories: allCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        count: categoryCount[cat.id] || 0,
      })),
      brands: vendors
        .filter((vendor) => (brandCount[vendor.id] || 0) > 0)
        .map((vendor) => ({
          id: vendor.id,
          name: vendor.businessName,
          count: brandCount[vendor.id] || 0,
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

    // Build breadcrumbs
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Accueil', href: '/' },
    ]
    
    if (category.parent) {
      breadcrumbs.push({ 
        label: category.parent.name, 
        href: `/categories/${category.parent.slug}` 
      })
    }
    
    breadcrumbs.push({ label: category.name })

    // Build category hero data
    const categoryHeroData = {
      title: category.name,
      description: category.description || `Découvrez notre sélection de produits ${category.name}`,
      image: category.image || undefined,
      productCount: transformedProducts.length,
      quickFilters: [
        { id: 'new', label: 'Nouveautés', value: 'newest' },
        { id: 'sale', label: 'En promotion', value: 'onSale' },
        { id: 'bestseller', label: 'Bestsellers', value: 'bestseller' }
      ]
    }

    // SEO content data
    const seoContent = {
      title: `À propos de ${category.name}`,
      content: `
        <h2>Découvrez Notre Collection ${category.name}</h2>
        <p>${category.description || `Explorez notre sélection complète de produits ${category.name} soigneusement choisis pour leur qualité exceptionnelle.`}
        Nous travaillons avec les meilleurs vendeurs pour vous offrir une expérience d'achat incomparable.</p>

        <h3>Qualité Garantie</h3>
        <p>Tous nos produits sont vérifiés et approuvés par notre équipe avant d'être mis en vente.
        Nous garantissons la satisfaction de nos clients avec une politique de retour flexible.</p>

        <h3>Livraison Rapide</h3>
        <p>Profitez de notre service de livraison rapide partout en France.
        La livraison est gratuite pour toute commande supérieure à 50€.</p>
      `
    }

    return {
      category,
      products: transformedProducts,
      availableFilters,
      breadcrumbs,
      categoryHeroData,
      seoContent,
    }
  } catch (error) {
    console.error('Error fetching category data:', error)
    return null
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const data = await getCategoryData(slug)

  // Show 404 if category not found
  if (!data) {
    notFound()
  }

  const { category, products, availableFilters, breadcrumbs, categoryHeroData, seoContent } = data

  return (
    <div className="min-h-screen bg-platinum-50">
      {/* Category Content - Client Component */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          </div>
        }
      >
        <CategoryPageClient
          initialProducts={products}
          availableFilters={availableFilters}
          breadcrumbs={breadcrumbs}
          categoryHeroData={categoryHeroData}
          seoContent={seoContent}
          categorySlug={category.slug}
        />
      </Suspense>
    </div>
  )
}

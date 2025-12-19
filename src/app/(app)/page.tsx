import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { prisma } from '@/lib/prisma-simple'

import TrustBadges from '@/components/home/trust-badges'
import SocialProofBar from '@/components/home/social-proof-bar'

// Dynamic imports for all sections (optimized loading)
const HeroSectionEnhanced = dynamic(() => import('@/components/home/hero-section-enhanced'), {
  loading: () => <div className="h-[200px] sm:h-[220px] md:h-[240px] lg:h-[280px] xl:h-[320px] animate-pulse bg-turquoise-700" />,
})
const CategoriesGridEnhanced = dynamic(() => import('@/components/home/categories-grid-enhanced'), {
  loading: () => <div className="h-80 animate-pulse bg-gray-50" />,
})
const FlashDealsEnhanced = dynamic(() => import('@/components/home/flash-deals-enhanced'), {
  loading: () => <div className="h-96 animate-pulse bg-red-500" />,
})
const ProductsUnifiedSection = dynamic(() => import('@/components/home/products-unified-section'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
})
const DoubleBanner = dynamic(() => import('@/components/home/double-banner'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-50" />,
})
const BrandsShowcase = dynamic(() => import('@/components/home/brands-showcase'), {
  loading: () => <div className="h-48 animate-pulse bg-gray-50" />,
})
const NewArrivalsMasonry = dynamic(() => import('@/components/home/new-arrivals-masonry'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
})
const CategoryShowcase = dynamic(() => import('@/components/home/category-showcase'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
})
const TestimonialsEnhanced = dynamic(() => import('@/components/home/testimonials-enhanced'), {
  loading: () => <div className="h-96 animate-pulse bg-turquoise-600" />,
})
const InstagramFeed = dynamic(() => import('@/components/home/instagram-feed'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
})
const NewsletterEnhanced = dynamic(() => import('@/components/home/newsletter-enhanced'), {
  loading: () => <div className="h-80 animate-pulse bg-gray-50" />,
})

// Add ISR revalidation
export const revalidate = 300 // Revalidate every 5 minutes

// Empty product type for fallback
type ProductResult = {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice: number | null
  stock: number
  rating: number
  reviewCount: number
  badge?: string | null
  category: { name: string; nameEn: string | null }
  images: { url: string; alt: string }[]
}[]

export default async function HomePage() {
  // Fetch real data from database with error handling
  let featuredProducts: ProductResult = []
  let trendingProducts: ProductResult = []
  let flashDealsProducts: ProductResult = []

  try {
    const results = await Promise.all([
      // Featured products for main grid
      prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        featured: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        rating: true,
        reviewCount: true,
        category: {
          select: {
            name: true,
            nameEn: true,
          },
        },
        images: {
          select: {
            url: true,
            alt: true,
          },
          orderBy: {
            order: 'asc',
          },
          take: 1,
        },
      },
      take: 12,
      orderBy: {
        createdAt: 'desc',
      },
    }),

      // Trending products
      prisma.product.findMany({
        where: {
          status: 'ACTIVE',
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          rating: true,
          reviewCount: true,
          badge: true,
          images: {
            select: {
              url: true,
              alt: true,
            },
            orderBy: {
              order: 'asc',
            },
            take: 1,
          },
        },
        take: 8,
        orderBy: {
          rating: 'desc',
        },
      }),

      // Flash deals (products on sale)
      prisma.product.findMany({
        where: {
          status: 'ACTIVE',
          onSale: true,
          compareAtPrice: {
            not: null,
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          images: {
            select: {
              url: true,
              alt: true,
            },
            orderBy: {
              order: 'asc',
            },
            take: 1,
          },
        },
        take: 6,
        orderBy: {
          updatedAt: 'desc',
        },
      }),
    ])

    featuredProducts = results[0] as ProductResult
    trendingProducts = results[1] as ProductResult
    flashDealsProducts = results[2] as ProductResult
  } catch (error) {
    console.error('Database connection error:', error)
    // Use mock data as fallback when database is not available
    const mockProducts = [
      {
        id: 'mock-1',
        name: 'MacBook Pro 16" M3 Max',
        slug: 'macbook-pro-16',
        price: 2499,
        compareAtPrice: 2699,
        stock: 25,
        rating: 4.8,
        reviewCount: 342,
        category: { name: 'Électronique', nameEn: 'Electronics' },
        images: [{ url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80', alt: 'MacBook Pro' }],
      },
      {
        id: 'mock-2',
        name: 'iPhone 15 Pro',
        slug: 'iphone-15-pro',
        price: 1479,
        compareAtPrice: null,
        stock: 50,
        rating: 4.9,
        reviewCount: 589,
        category: { name: 'Électronique', nameEn: 'Electronics' },
        images: [{ url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80', alt: 'iPhone 15 Pro' }],
      },
      {
        id: 'mock-3',
        name: 'Casque Audio Sans Fil Premium',
        slug: 'casque-audio-premium',
        price: 249.99,
        compareAtPrice: 299.99,
        stock: 45,
        rating: 4.7,
        reviewCount: 234,
        category: { name: 'Électronique', nameEn: 'Electronics' },
        images: [{ url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', alt: 'Casque Audio' }],
      },
      {
        id: 'mock-4',
        name: 'Montre Connectée Sport',
        slug: 'montre-connectee',
        price: 199.99,
        compareAtPrice: 249.99,
        stock: 78,
        rating: 4.5,
        reviewCount: 189,
        category: { name: 'Électronique', nameEn: 'Electronics' },
        images: [{ url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', alt: 'Montre Sport' }],
      },
      {
        id: 'mock-5',
        name: 'Sneakers Urban Style',
        slug: 'sneakers-urban',
        price: 89.99,
        compareAtPrice: 119.99,
        stock: 120,
        rating: 4.6,
        reviewCount: 312,
        category: { name: 'Mode', nameEn: 'Fashion' },
        images: [{ url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', alt: 'Sneakers' }],
      },
      {
        id: 'mock-6',
        name: 'Sac à Main Cuir Élégant',
        slug: 'sac-cuir-elegant',
        price: 149.99,
        compareAtPrice: 189.99,
        stock: 35,
        rating: 4.8,
        reviewCount: 87,
        category: { name: 'Mode', nameEn: 'Fashion' },
        images: [{ url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80', alt: 'Sac à Main' }],
      },
      {
        id: 'mock-7',
        name: 'Écouteurs Bluetooth Sport',
        slug: 'ecouteurs-bluetooth',
        price: 79.99,
        compareAtPrice: 99.99,
        stock: 200,
        rating: 4.3,
        reviewCount: 445,
        badge: 'Hot',
        category: { name: 'Électronique', nameEn: 'Electronics' },
        images: [{ url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80', alt: 'Écouteurs' }],
      },
      {
        id: 'mock-8',
        name: 'Tablette Graphique Pro',
        slug: 'tablette-graphique',
        price: 349.99,
        compareAtPrice: 399.99,
        stock: 28,
        rating: 4.9,
        reviewCount: 67,
        badge: 'Premium',
        category: { name: 'Électronique', nameEn: 'Electronics' },
        images: [{ url: 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800&q=80', alt: 'Tablette Graphique' }],
      },
      {
        id: 'mock-9',
        name: 'Robe de Soirée Élégante',
        slug: 'robe-soiree',
        price: 129.99,
        compareAtPrice: 159.99,
        stock: 40,
        rating: 4.7,
        reviewCount: 78,
        badge: 'NEW',
        category: { name: 'Mode', nameEn: 'Fashion' },
        images: [{ url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=800&q=80', alt: 'Robe Africaine' }],
      },
      {
        id: 'mock-10',
        name: 'Cafetière Automatique',
        slug: 'cafetiere-automatique',
        price: 299.99,
        compareAtPrice: 349.99,
        stock: 32,
        rating: 4.6,
        reviewCount: 201,
        badge: 'Best Seller',
        category: { name: 'Maison', nameEn: 'Home' },
        images: [{ url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80', alt: 'Cafetière' }],
      },
      {
        id: 'mock-11',
        name: 'Floral Summer Dress',
        slug: 'floral-dress',
        price: 79.99,
        compareAtPrice: null,
        stock: 65,
        rating: 4.5,
        reviewCount: 156,
        category: { name: 'Mode', nameEn: 'Fashion' },
        images: [{ url: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=80', alt: 'Robe Ankara' }],
      },
      {
        id: 'mock-12',
        name: 'Organic Cotton T-Shirt',
        slug: 'cotton-tshirt',
        price: 29.99,
        compareAtPrice: null,
        stock: 150,
        rating: 4.4,
        reviewCount: 423,
        category: { name: 'Mode', nameEn: 'Fashion' },
        images: [{ url: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=800&q=80', alt: 'T-Shirt Mode Africaine' }],
      },
    ]
    featuredProducts = mockProducts as ProductResult
    trendingProducts = mockProducts as ProductResult
    flashDealsProducts = mockProducts as ProductResult
  }

  // Format products for component props with all details
  const mainProducts = featuredProducts.map((p, i) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice || undefined,
    image: p.images[0]?.url,
    images: p.images.map((img) => img.url),
    rating: p.rating,
    reviewCount: p.reviewCount,
    salesCount: Math.floor(Math.random() * 5000) + 100, // Simulated sales count
    inStock: p.stock > 0,
    stock: p.stock,
    category: p.category.name, // Add category name for filtering
    isVerifiedSeller: i % 3 === 0, // Every 3rd product has verified seller
    isOfficialStore: i % 5 === 0, // Every 5th product is official store
    freeShipping: p.price > 1500, // Free shipping for orders > 15€
    deliveryDays: Math.floor(Math.random() * 5) + 2, // 2-7 days delivery
  }))

  const trending = trendingProducts.map((p, i) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice || undefined,
    image: p.images[0]?.url,
    images: p.images.map((img) => img.url),
    rating: p.rating,
    reviewCount: p.reviewCount,
    salesCount: Math.floor(Math.random() * 3000) + 50,
    inStock: p.stock > 0,
    stock: p.stock,
    badge: p.badge ? { text: p.badge, variant: 'trending' as const } : undefined,
    isVerifiedSeller: i % 4 === 0,
    isOfficialStore: i % 6 === 0,
    freeShipping: p.price > 1500,
    deliveryDays: Math.floor(Math.random() * 5) + 2,
  }))

  // Calculate flash deals stock aggregates
  let totalFlashStock = 1000
  try {
    const flashStockAggregate = await prisma.product.aggregate({
      where: {
        status: 'ACTIVE',
        onSale: true,
        compareAtPrice: {
          not: null,
        },
      },
      _sum: {
        stock: true,
      },
    })
    totalFlashStock = flashStockAggregate._sum.stock || 1000
  } catch (error) {
    console.error('Database connection error (flash stock aggregate):', error)
  }

  // Calculate sold count estimate
  // Since there's no soldQuantity field, estimate based on orders or use a percentage
  const estimatedSoldCount = Math.floor(totalFlashStock * 0.65) // 65% sold as demo

  // Alternatively, calculate from actual orders if OrderItem model exists:
  // const soldAggregate = await prisma.orderItem.aggregate({
  //   where: {
  //     product: {
  //       onSale: true,
  //       status: 'ACTIVE',
  //     },
  //   },
  //   _sum: {
  //     quantity: true,
  //   },
  // })
  // const estimatedSoldCount = soldAggregate._sum.quantity || Math.floor(totalFlashStock * 0.65)

  const flashDeals = flashDealsProducts.map((p, i) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice || undefined,
    image: p.images[0]?.url,
    images: p.images.map((img) => img.url),
    inStock: p.stock > 0,
    stock: p.stock,
    rating: 4 + Math.random(), // 4-5 stars
    reviewCount: Math.floor(Math.random() * 500) + 50,
    salesCount: Math.floor(Math.random() * 2000) + 200,
    brand: ['Samsung', 'Apple', 'Sony', 'LG', 'Dyson', 'Adidas'][i % 6],
    isVerifiedSeller: true, // Flash deals are from verified sellers
    isOfficialStore: i % 2 === 0,
    freeShipping: true, // Flash deals have free shipping
    deliveryDays: Math.floor(Math.random() * 3) + 1, // 1-3 days fast delivery
  }))

  // Flash deals end date (24 hours from now)
  const flashDealsEndDate = new Date()
  flashDealsEndDate.setHours(flashDealsEndDate.getHours() + 24)

  // Best sellers data with all details
  const bestSellersProducts = mainProducts.map((p, i) => ({
    ...p,
    vendor: ['Nike', 'Adidas', 'Zara', 'H&M', 'Gucci'][i % 5],
    brand: ['Nike', 'Adidas', 'Zara', 'H&M', 'Gucci'][i % 5],
    badge: i % 3 === 0 
      ? { text: 'Best Seller', variant: 'bestseller' as const } 
      : i % 4 === 0 
        ? { text: 'Local', variant: 'local' as const }
        : undefined,
    stockCount: Math.floor(Math.random() * 50) + 5,
    salesCount: Math.floor(Math.random() * 8000) + 500,
    isVerifiedSeller: i % 2 === 0,
    isOfficialStore: i % 4 === 0,
    freeShipping: true,
    deliveryDays: Math.floor(Math.random() * 4) + 2,
  }))

  // New arrivals data
  const newArrivalsProducts = trending.map((p) => ({
    ...p,
    vendor: ['Nike', 'Adidas', 'Zara', 'H&M', 'Gucci'][Math.floor(Math.random() * 5)],
  }))

  return (
    <>
      {/* 1. Hero Section - Full-Width Slider avec Parallax */}
      <Suspense fallback={<div className="h-[200px] sm:h-[220px] md:h-[240px] lg:h-[280px] xl:h-[320px] animate-pulse bg-turquoise-700" />}>
        <HeroSectionEnhanced />
      </Suspense>

      {/* 2. Social Proof Bar - Trust Indicators */}
      <SocialProofBar />

      {/* 3. Categories Grid - Interactive Cards */}
      <Suspense fallback={<div className="h-80 animate-pulse bg-gray-50" />}>
        <CategoriesGridEnhanced products={mainProducts} />
      </Suspense>

      {/* 4. Flash Deals Banner - Countdown Timer */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-red-500" />}>
        <FlashDealsEnhanced 
          products={flashDeals} 
          endDate={flashDealsEndDate}
          totalStock={totalFlashStock}
          soldCount={estimatedSoldCount}
        />
      </Suspense>

      {/* 5. Double Banner - Split Promotional */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50" />}>
        <DoubleBanner />
      </Suspense>

      {/* 6. Unified Products Section - Featured/Best Sellers/Trending */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <ProductsUnifiedSection
          featuredProducts={mainProducts.map((p, i) => ({
            ...p,
            vendor: ['Nike', 'Adidas', 'Zara', 'H&M', 'Gucci'][i % 5],
            badge: i % 4 === 0
              ? { text: 'Nouveau', variant: 'new' as const }
              : i % 4 === 1
                ? { text: 'Best Seller', variant: 'bestseller' as const }
                : i % 4 === 2
                  ? { text: '-30%', variant: 'sale' as const }
                  : undefined,
          }))}
          bestSellersProducts={bestSellersProducts}
          trendingProducts={trending}
        />
      </Suspense>

      {/* 7. Brands Showcase - Infinite Scroll */}
      <Suspense fallback={<div className="h-48 animate-pulse bg-gray-50" />}>
        <BrandsShowcase />
      </Suspense>

      {/* 8. New Arrivals - Masonry Grid */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <NewArrivalsMasonry
          products={newArrivalsProducts}
        />
      </Suspense>

      {/* 11. Category Showcase - 3 Hero Cards */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <CategoryShowcase />
      </Suspense>

      {/* 12. Trust Badges & Benefits */}
      <TrustBadges />

      {/* 13. Testimonials - 3D Carousel */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-turquoise-600" />}>
        <TestimonialsEnhanced />
      </Suspense>

      {/* 14. Instagram Feed */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <InstagramFeed />
      </Suspense>

      {/* 15. Newsletter + App Download */}
      <Suspense fallback={<div className="h-80 animate-pulse bg-gray-50" />}>
        <NewsletterEnhanced />
      </Suspense>
    </>
  )
}

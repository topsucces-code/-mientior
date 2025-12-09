import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { prisma } from '@/lib/prisma'

import TrustBadges from '@/components/home/trust-badges'
import SocialProofBar from '@/components/home/social-proof-bar'

// Dynamic imports for all sections (optimized loading)
const HeroSectionEnhanced = dynamic(() => import('@/components/home/hero-section-enhanced'), {
  loading: () => <div className="h-[600px] animate-pulse bg-gradient-to-r from-turquoise-600 to-turquoise-500" />,
})
const CategoriesGridEnhanced = dynamic(() => import('@/components/home/categories-grid-enhanced'), {
  loading: () => <div className="h-80 animate-pulse bg-gray-50" />,
})
const FlashDealsEnhanced = dynamic(() => import('@/components/home/flash-deals-enhanced'), {
  loading: () => <div className="h-96 animate-pulse bg-red-500" />,
})
const FeaturedProductsEnhanced = dynamic(() => import('@/components/home/featured-products-enhanced'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
})
const DoubleBanner = dynamic(() => import('@/components/home/double-banner'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-50" />,
})
const BestSellers = dynamic(() => import('@/components/home/best-sellers'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
})
const BrandsShowcase = dynamic(() => import('@/components/home/brands-showcase'), {
  loading: () => <div className="h-48 animate-pulse bg-gray-50" />,
})
const NewArrivalsMasonry = dynamic(() => import('@/components/home/new-arrivals-masonry'), {
  loading: () => <div className="h-96 animate-pulse bg-gray-100" />,
})
const TrendingNowCarousel = dynamic(() => import('@/components/home/trending-now-carousel'), {
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

export default async function HomePage() {
  // Fetch real data from database
  const [
    featuredProducts,
    trendingProducts,
    flashDealsProducts,
    _categories, // Not used in enhanced version - categories are hardcoded
    _curatedProducts, // Not used - replaced by FeaturedProductsEnhanced
  ] = await Promise.all([
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

    // Categories for navigation
    prisma.category.findMany({
      where: {
        isActive: true,
        parentId: null, // Only root categories
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
      },
      take: 8,
      orderBy: {
        order: 'asc',
      },
    }),

    // Curated collection
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
      take: 4,
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ])

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

  // Calculate sold count estimate
  // Since there's no soldQuantity field, estimate based on orders or use a percentage
  const totalFlashStock = flashStockAggregate._sum.stock || 1000
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
      <Suspense fallback={<div className="h-[600px] animate-pulse bg-gradient-to-r from-turquoise-600 to-turquoise-500" />}>
        <HeroSectionEnhanced />
      </Suspense>

      {/* 2. Social Proof Bar - Trust Indicators */}
      <SocialProofBar />

      {/* 3. Categories Grid - Interactive Cards */}
      <Suspense fallback={<div className="h-80 animate-pulse bg-gray-50" />}>
        <CategoriesGridEnhanced />
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

      {/* 5. Featured Products - Carousel avec Tabs */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <FeaturedProductsEnhanced 
          products={mainProducts.map((p, i) => ({
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
          title="Produits Vedettes"
          subtitle="Notre sélection des meilleurs produits"
        />
      </Suspense>

      {/* 6. Double Banner - Split Promotional */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50" />}>
        <DoubleBanner />
      </Suspense>

      {/* 7. Best Sellers - Grid with Filters */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <BestSellers 
          products={bestSellersProducts}
          title="Meilleures Ventes"
          subtitle="Les produits les plus populaires de notre boutique"
        />
      </Suspense>

      {/* 8. Brands Showcase - Infinite Scroll */}
      <Suspense fallback={<div className="h-48 animate-pulse bg-gray-50" />}>
        <BrandsShowcase />
      </Suspense>

      {/* 9. New Arrivals - Masonry Grid */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <NewArrivalsMasonry 
          products={newArrivalsProducts}
          title="Nouveautés"
          subtitle="Découvrez nos dernières arrivées"
        />
      </Suspense>

      {/* 10. Trending Now Carousel */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100" />}>
        <TrendingNowCarousel products={trending} />
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

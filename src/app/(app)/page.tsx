import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { prisma } from '@/lib/prisma'
import HeroSection from '@/components/home/hero-section'
import SocialProofBar from '@/components/home/social-proof-bar'
import CategoriesNav from '@/components/home/categories-nav'
import MainProductGrid from '@/components/home/main-product-grid'
import TrustBadges from '@/components/home/trust-badges'

// Dynamic imports for below-the-fold sections
const FlashDeals = dynamic(() => import('@/components/home/flash-deals'), {
  loading: () => <div className="h-96 animate-pulse bg-platinum-100" />,
})
const CuratedCollection = dynamic(() => import('@/components/home/curated-collection'), {
  loading: () => <div className="h-96 animate-pulse bg-platinum-100" />,
})
const TrendingNowCarousel = dynamic(() => import('@/components/home/trending-now-carousel'), {
  loading: () => <div className="h-96 animate-pulse bg-platinum-100" />,
})
const CategoryShowcase = dynamic(() => import('@/components/home/category-showcase'), {
  loading: () => <div className="h-96 animate-pulse bg-platinum-100" />,
})
const TestimonialsCarousel = dynamic(() => import('@/components/home/testimonials-carousel'), {
  loading: () => <div className="h-96 animate-pulse bg-platinum-100" />,
})
const InstagramFeed = dynamic(() => import('@/components/home/instagram-feed'), {
  loading: () => <div className="h-96 animate-pulse bg-platinum-100" />,
})

// Add ISR revalidation
export const revalidate = 300 // Revalidate every 5 minutes

export default async function HomePage() {
  // Fetch real data from database
  const [
    featuredProducts,
    trendingProducts,
    flashDealsProducts,
    categories,
    curatedProducts,
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

  // Format products for component props
  const mainProducts = featuredProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice || undefined,
    image: p.images[0]?.url,
    images: p.images.map((img) => img.url),
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: p.stock > 0,
  }))

  const trending = trendingProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice || undefined,
    image: p.images[0]?.url,
    images: p.images.map((img) => img.url),
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: p.stock > 0,
    badge: p.badge ? { text: p.badge, variant: 'trending' as const } : undefined,
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

  const flashDeals = flashDealsProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice || undefined,
    image: p.images[0]?.url,
    images: p.images.map((img) => img.url),
    inStock: p.stock > 0,
  }))

  const curated = curatedProducts.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice || undefined,
    image: p.images[0]?.url,
    images: p.images.map((img) => img.url),
  }))

  // Flash deals end date (24 hours from now)
  const flashDealsEndDate = new Date()
  flashDealsEndDate.setHours(flashDealsEndDate.getHours() + 24)

  // Curated collection data
  const curatedCollection = {
    id: 'selection-semaine',
    name: 'Sélection de la Semaine',
    slug: 'selection-semaine',
    description: 'Notre sélection exclusive de produits pour cette semaine',
    theme: {
      primaryColor: '#FF6B35',
      secondaryColor: '#F7931E',
      textColor: 'dark' as const,
    },
    badge: {
      text: 'Sélection',
      variant: 'new' as const,
    },
    products: curated,
  }

  return (
    <>
      {/* Hero Section - 85vh Theater Visual */}
      <HeroSection />

      {/* Social Proof Bar - Sticky 48px */}
      <SocialProofBar />

      {/* Categories Navigation - 8 Column Grid */}
      <CategoriesNav 
        categories={categories.map(cat => ({
          ...cat,
          image: cat.image || undefined,
        }))} 
      />

      {/* Flash Deals - Horizontal Carousel with Countdown */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-platinum-100" />}>
        <FlashDeals 
          products={flashDeals} 
          endDate={flashDealsEndDate}
          totalStock={totalFlashStock}
          soldCount={estimatedSoldCount}
        />
      </Suspense>

      {/* Featured Collection - Editorial Asymmetric Layout */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-platinum-100" />}>
        <CuratedCollection collection={curatedCollection} layout="hero" />
      </Suspense>

      {/* Main Product Grid - 4 Columns with Infinite Scroll */}
      <MainProductGrid
        initialProducts={mainProducts}
        title="Tous nos Produits"
        subtitle="Découvrez l'intégralité de notre catalogue"
        enableInfiniteScroll={true}
      />

      {/* Trending Now Carousel - Auto-scroll */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-platinum-100" />}>
        <TrendingNowCarousel products={trending} />
      </Suspense>

      {/* Category Showcase - 3 Hero Cards */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-platinum-100" />}>
        <CategoryShowcase />
      </Suspense>

      {/* Trust Badges & Benefits - 4 Inline */}
      <TrustBadges />

      {/* Testimonials Carousel - Customer Reviews */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-platinum-100" />}>
        <TestimonialsCarousel />
      </Suspense>

      {/* Instagram Feed - 2x3 Grid */}
      <Suspense fallback={<div className="h-96 animate-pulse bg-platinum-100" />}>
        <InstagramFeed />
      </Suspense>

      {/* Newsletter is in Footer component */}
    </>
  )
}

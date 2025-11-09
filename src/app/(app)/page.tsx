import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'
import HeroSection from '@/components/home/hero-section'
import SocialProofBar from '@/components/home/social-proof-bar'
import CategoriesNav from '@/components/home/categories-nav'
import FeaturedProducts from '@/components/home/featured-products'

// Dynamic imports for below-the-fold sections
const FlashDeals = dynamic(() => import('@/components/home/flash-deals'), {
  loading: () => <div className="h-96 animate-pulse bg-platinum-100" />,
})
const CuratedCollection = dynamic(() => import('@/components/home/curated-collection'), {
  loading: () => <div className="h-96 animate-pulse bg-platinum-100" />,
})

export default async function HomePage() {
  // Données mock temporaires - à remplacer quand les models Prisma seront créés
  const featuredProducts: never[] = []
  const categories: never[] = []
  const flashDeals: never[] = []
  const curatedProducts: never[] = []

  // Flash deals end date (24 hours from now)
  const flashDealsEndDate = new Date()
  flashDealsEndDate.setHours(flashDealsEndDate.getHours() + 24)

  // Curated collection data
  const curatedCollection = {
    id: 'latest-arrivals',
    name: 'Nouveautés',
    slug: 'nouveautes',
    description: 'Découvrez nos derniers produits sélectionnés avec soin',
    theme: {
      primaryColor: '#FF6B35',
      secondaryColor: '#F7931E',
      textColor: 'dark' as const,
    },
    badge: {
      text: 'Nouveau',
      variant: 'new' as const,
    },
    products: curatedProducts,
  }

  return (
    <>
      <HeroSection />
      <SocialProofBar />
      {categories.length > 0 && <CategoriesNav categories={categories} />}
      <Suspense fallback={<div className="h-96 animate-pulse bg-platinum-100" />}>
        {flashDeals.length > 0 && <FlashDeals products={flashDeals} endDate={flashDealsEndDate} />}
      </Suspense>
      <Suspense fallback={<div className="h-96 animate-pulse bg-platinum-100" />}>
        {curatedProducts.length > 0 && <CuratedCollection collection={curatedCollection} />}
      </Suspense>
      {featuredProducts.length > 0 && <FeaturedProducts products={featuredProducts} />}
    </>
  )
}

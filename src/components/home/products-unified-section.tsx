'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Star, Trophy, Flame } from 'lucide-react'
import { Product } from '@/types/product'
import ProductCardUnified from '@/components/ui/product-card-unified'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface ProductsUnifiedSectionProps {
  featuredProducts: Product[]
  bestSellersProducts: Product[]
  trendingProducts: Product[]
  title?: string
  subtitle?: string
}

export default function ProductsUnifiedSection({
  featuredProducts,
  bestSellersProducts,
  trendingProducts,
  title,
  subtitle,
}: ProductsUnifiedSectionProps) {
  const t = useTranslations()
  const prefersReducedMotion = useReducedMotion()

  // Intersection observer for animations
  const { ref: sectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
  })

  // Featured Products State
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'new' | 'bestseller' | 'sale'>('all')
  const [featuredEmblaRef, featuredEmblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    containScroll: 'trimSnaps',
  })
  const [canScrollFeaturedPrev, setCanScrollFeaturedPrev] = useState(false)
  const [canScrollFeaturedNext, setCanScrollFeaturedNext] = useState(false)

  // Best Sellers State
  const [bestSellersCategory, setBestSellersCategory] = useState<string>('all')
  const [bestSellersEmblaRef, bestSellersEmblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    dragFree: true,
    containScroll: 'trimSnaps',
  })
  const [canScrollBestSellersPrev, setCanScrollBestSellersPrev] = useState(false)
  const [canScrollBestSellersNext, setCanScrollBestSellersNext] = useState(false)

  // Trending State
  const [trendingEmblaRef, trendingEmblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    dragFree: false,
    containScroll: 'trimSnaps',
  })
  const [canScrollTrendingPrev, setCanScrollTrendingPrev] = useState(false)
  const [canScrollTrendingNext, setCanScrollTrendingNext] = useState(false)
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('featured')

  // Featured Products: Filter logic
  const filteredFeaturedProducts = featuredProducts.filter((product) => {
    if (featuredFilter === 'all') return true
    return product.badge?.variant === featuredFilter
  })

  // Best Sellers: Category filter logic
  const filteredBestSellersProducts = bestSellersProducts.filter((product) => {
    if (bestSellersCategory === 'all') return true
    // Hardcoded category mapping as per original implementation
    const categoryMap: Record<string, string[]> = {
      electronics: ['Électronique', 'Electronics'],
      fashion: ['Mode', 'Fashion', 'Vêtements'],
      home: ['Maison', 'Home', 'Décoration'],
      beauty: ['Beauté', 'Beauty', 'Cosmétiques'],
    }
    const categoryNames = categoryMap[bestSellersCategory] || []
    return categoryNames.some((name) =>
      product.category?.toLowerCase().includes(name.toLowerCase())
    )
  })

  // Featured carousel scroll handlers
  const scrollFeaturedPrev = useCallback(() => {
    if (featuredEmblaApi) featuredEmblaApi.scrollPrev()
  }, [featuredEmblaApi])

  const scrollFeaturedNext = useCallback(() => {
    if (featuredEmblaApi) featuredEmblaApi.scrollNext()
  }, [featuredEmblaApi])

  const onFeaturedSelect = useCallback(() => {
    if (!featuredEmblaApi) return
    setCanScrollFeaturedPrev(featuredEmblaApi.canScrollPrev())
    setCanScrollFeaturedNext(featuredEmblaApi.canScrollNext())
  }, [featuredEmblaApi])

  useEffect(() => {
    if (!featuredEmblaApi) return
    onFeaturedSelect()
    featuredEmblaApi.on('select', onFeaturedSelect)
    featuredEmblaApi.on('reInit', onFeaturedSelect)
    return () => {
      featuredEmblaApi.off('select', onFeaturedSelect)
      featuredEmblaApi.off('reInit', onFeaturedSelect)
    }
  }, [featuredEmblaApi, onFeaturedSelect])

  // Best Sellers carousel scroll handlers
  const scrollBestSellersPrev = useCallback(() => {
    if (bestSellersEmblaApi) bestSellersEmblaApi.scrollPrev()
  }, [bestSellersEmblaApi])

  const scrollBestSellersNext = useCallback(() => {
    if (bestSellersEmblaApi) bestSellersEmblaApi.scrollNext()
  }, [bestSellersEmblaApi])

  const onBestSellersSelect = useCallback(() => {
    if (!bestSellersEmblaApi) return
    setCanScrollBestSellersPrev(bestSellersEmblaApi.canScrollPrev())
    setCanScrollBestSellersNext(bestSellersEmblaApi.canScrollNext())
  }, [bestSellersEmblaApi])

  useEffect(() => {
    if (!bestSellersEmblaApi) return
    onBestSellersSelect()
    bestSellersEmblaApi.on('select', onBestSellersSelect)
    bestSellersEmblaApi.on('reInit', onBestSellersSelect)
    return () => {
      bestSellersEmblaApi.off('select', onBestSellersSelect)
      bestSellersEmblaApi.off('reInit', onBestSellersSelect)
    }
  }, [bestSellersEmblaApi, onBestSellersSelect])

  // Trending carousel scroll handlers
  const scrollTrendingPrev = useCallback(() => {
    if (trendingEmblaApi) trendingEmblaApi.scrollPrev()
  }, [trendingEmblaApi])

  const scrollTrendingNext = useCallback(() => {
    if (trendingEmblaApi) trendingEmblaApi.scrollNext()
  }, [trendingEmblaApi])

  const onTrendingSelect = useCallback(() => {
    if (!trendingEmblaApi) return
    setCanScrollTrendingPrev(trendingEmblaApi.canScrollPrev())
    setCanScrollTrendingNext(trendingEmblaApi.canScrollNext())
  }, [trendingEmblaApi])

  useEffect(() => {
    if (!trendingEmblaApi) return
    onTrendingSelect()
    trendingEmblaApi.on('select', onTrendingSelect)
    trendingEmblaApi.on('reInit', onTrendingSelect)
    return () => {
      trendingEmblaApi.off('select', onTrendingSelect)
      trendingEmblaApi.off('reInit', onTrendingSelect)
    }
  }, [trendingEmblaApi, onTrendingSelect])

  // Trending autoplay logic
  useEffect(() => {
    if (!trendingEmblaApi || prefersReducedMotion || activeTab !== 'trending') return
    if (isAutoplayPaused) return

    const autoplay = setInterval(() => {
      trendingEmblaApi.scrollNext()
    }, 4000)

    return () => clearInterval(autoplay)
  }, [trendingEmblaApi, isAutoplayPaused, prefersReducedMotion, activeTab])

  const featuredTabs = [
    { id: 'all', label: t('home.featured.tabs.all') },
    { id: 'new', label: t('home.featured.tabs.new') },
    { id: 'bestseller', label: t('home.featured.tabs.bestseller') },
    { id: 'sale', label: t('home.featured.tabs.sale') },
  ]

  const bestSellersCategories = [
    { id: 'all', label: t('home.bestSellers.categories.all') },
    { id: 'electronics', label: t('home.bestSellers.categories.electronics') },
    { id: 'fashion', label: t('home.bestSellers.categories.fashion') },
    { id: 'home', label: t('home.bestSellers.categories.home') },
    { id: 'beauty', label: t('home.bestSellers.categories.beauty') },
  ]

  return (
    <section
      ref={sectionRef}
      className={`w-full bg-white py-8 md:py-12 transition-all duration-1000 ${
        isIntersecting && !prefersReducedMotion
          ? 'opacity-100 translate-y-0'
          : prefersReducedMotion
          ? 'opacity-100'
          : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="container mx-auto px-4">
        <Tabs
          defaultValue="featured"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          {/* Main Tabs Navigation */}
          <TabsList className="w-full mb-8 grid grid-cols-3 gap-2 bg-transparent h-auto p-0">
            <TabsTrigger
              value="featured"
              className="flex items-center gap-2 rounded-md border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-black hover:border-gray-300"
            >
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">{t('home.featured.tabLabel')}</span>
              <span className="sm:hidden">{t('home.featured.tabLabelShort')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="bestsellers"
              className="flex items-center gap-2 rounded-md border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-black hover:border-gray-300"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">{t('home.bestSellers.tabLabel')}</span>
              <span className="sm:hidden">{t('home.bestSellers.tabLabelShort')}</span>
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="flex items-center gap-2 rounded-md border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium transition-all data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-black hover:border-gray-300"
            >
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">{t('home.trending.tabLabel')}</span>
              <span className="sm:hidden">{t('home.trending.tabLabelShort')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Featured Products Tab */}
          <TabsContent value="featured" className="mt-0">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {title || t('home.featured.title')}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {subtitle || t('home.featured.subtitle')}
                  </p>
                </div>
              </div>

              {/* Sub-tabs for Featured */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {featuredTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFeaturedFilter(tab.id as 'all' | 'new' | 'bestseller' | 'sale')}
                    className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                      featuredFilter === tab.id
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Carousel */}
              <div className="relative group">
                <div className="overflow-hidden" ref={featuredEmblaRef}>
                  <div className="flex gap-3 md:gap-4">
                    {filteredFeaturedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex-[0_0_180px] sm:flex-[0_0_210px] md:flex-[0_0_240px] lg:flex-[0_0_260px] min-w-0"
                      >
                        <ProductCardUnified 
                          id={product.id}
                          name={product.name}
                          slug={product.slug}
                          price={product.price}
                          compareAtPrice={product.compareAtPrice}
                          image={product.image}
                          images={product.images}
                          rating={product.rating}
                          reviewCount={product.reviewCount}
                          salesCount={product.salesCount}
                          badge={product.badge}
                          brand={product.brand}
                          isVerifiedSeller={product.isVerifiedSeller}
                          isOfficialStore={product.isOfficialStore}
                          stock={product.stockCount}
                          freeShipping={product.freeShipping}
                          deliveryDays={product.deliveryDays}
                          priority={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                {canScrollFeaturedPrev && (
                  <button
                    onClick={scrollFeaturedPrev}
                    aria-label="Previous products"
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {canScrollFeaturedNext && (
                  <button
                    onClick={scrollFeaturedNext}
                    aria-label="Next products"
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Best Sellers Tab */}
          <TabsContent value="bestsellers" className="mt-0">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {t('home.bestSellers.title')}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('home.bestSellers.subtitle')}
                  </p>
                </div>
              </div>

              {/* Category filters */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {bestSellersCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setBestSellersCategory(category.id)}
                    className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                      bestSellersCategory === category.id
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              {/* Carousel */}
              <div className="relative group">
                <div className="overflow-hidden" ref={bestSellersEmblaRef}>
                  <div className="flex gap-3 md:gap-4">
                    {filteredBestSellersProducts.map((product, index) => (
                      <div
                        key={product.id}
                        className="flex-[0_0_180px] sm:flex-[0_0_210px] md:flex-[0_0_240px] lg:flex-[0_0_260px] min-w-0 relative"
                      >
                        {/* Rank badges for top 3 */}
                        {index < 3 && (
                          <div className="absolute top-2 left-2 z-20 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            #{index + 1}
                          </div>
                        )}
                        <ProductCardUnified 
                          id={product.id}
                          name={product.name}
                          slug={product.slug}
                          price={product.price}
                          compareAtPrice={product.compareAtPrice}
                          image={product.image}
                          images={product.images}
                          rating={product.rating}
                          reviewCount={product.reviewCount}
                          salesCount={product.salesCount}
                          badge={product.badge}
                          brand={product.brand}
                          isVerifiedSeller={product.isVerifiedSeller}
                          isOfficialStore={product.isOfficialStore}
                          stock={product.stockCount}
                          freeShipping={product.freeShipping}
                          deliveryDays={product.deliveryDays}
                          priority={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                {canScrollBestSellersPrev && (
                  <button
                    onClick={scrollBestSellersPrev}
                    aria-label="Previous products"
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {canScrollBestSellersNext && (
                  <button
                    onClick={scrollBestSellersNext}
                    aria-label="Next products"
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Trending Tab */}
          <TabsContent value="trending" className="mt-0">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {t('home.trending.title')}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {t('home.trending.subtitle')}
                  </p>
                </div>
              </div>

              {/* Carousel with autoplay */}
              <div
                className="relative group"
                onMouseEnter={() => setIsAutoplayPaused(true)}
                onMouseLeave={() => setIsAutoplayPaused(false)}
              >
                <div className="overflow-hidden" ref={trendingEmblaRef}>
                  <div className="flex gap-3 md:gap-4">
                    {trendingProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex-[0_0_180px] sm:flex-[0_0_210px] md:flex-[0_0_240px] lg:flex-[0_0_260px] min-w-0 relative"
                      >
                        {/* Trending badge */}
                        <div className="absolute top-2 right-2 z-20 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          {t('home.badges.trending')}
                        </div>
                        <ProductCardUnified 
                          id={product.id}
                          name={product.name}
                          slug={product.slug}
                          price={product.price}
                          compareAtPrice={product.compareAtPrice}
                          image={product.image}
                          images={product.images}
                          rating={product.rating}
                          reviewCount={product.reviewCount}
                          salesCount={product.salesCount}
                          badge={product.badge}
                          brand={product.brand}
                          isVerifiedSeller={product.isVerifiedSeller}
                          isOfficialStore={product.isOfficialStore}
                          stock={product.stockCount}
                          freeShipping={product.freeShipping}
                          deliveryDays={product.deliveryDays}
                          priority={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                {canScrollTrendingPrev && (
                  <button
                    onClick={scrollTrendingPrev}
                    aria-label="Previous products"
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {canScrollTrendingNext && (
                  <button
                    onClick={scrollTrendingNext}
                    aria-label="Next products"
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white shadow-lg rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-gray-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}

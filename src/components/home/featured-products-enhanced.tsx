'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Star, Sparkles } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { cn } from '@/lib/utils'
import { ProductCardUnified } from '@/components/ui/product-card-unified'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useTranslations } from 'next-intl'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  image?: string
  images?: string[]
  rating?: number
  reviewCount?: number
  salesCount?: number
  vendor?: string
  brand?: string
  badge?: {
    text: string
    variant: 'sale' | 'new' | 'bestseller' | 'trending' | 'local' | 'hot' | 'featured' | 'limited'
  }
  inStock?: boolean
  stock?: number
  isVerifiedSeller?: boolean
  isOfficialStore?: boolean
  freeShipping?: boolean
  deliveryDays?: number
}

interface FeaturedProductsEnhancedProps {
  products: Product[]
  title?: string
  subtitle?: string
}

// Tabs are now generated inside the component to use translations

export default function FeaturedProductsEnhanced({
  products,
  title,
  subtitle,
}: FeaturedProductsEnhancedProps) {
  const t = useTranslations('home.featured')
  const [activeTab, setActiveTab] = React.useState('all')
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true, dragFree: true })
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  const displayTitle = title || t('title')
  const displaySubtitle = subtitle || t('subtitle')

  const tabs = [
    { id: 'all', label: t('tabs.all'), icon: '🎯' },
    { id: 'new', label: t('tabs.new'), icon: '✨' },
    { id: 'bestseller', label: t('tabs.bestseller'), icon: '🏆' },
    { id: 'sale', label: t('tabs.sale'), icon: '🔥' },
  ]

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  // Filter products based on active tab
  const filteredProducts = React.useMemo(() => {
    if (activeTab === 'all') return products
    return products.filter(p => p.badge?.variant === activeTab)
  }, [products, activeTab])

  return (
    <section 
      ref={sectionRef}
      className="py-8 sm:py-10 md:py-14 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50"
    >
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header - Style Temu */}
        <div
          className={cn(
            'mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Icon with Animation */}
            <div className="relative">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg">
                <Star className="h-6 w-6 sm:h-7 sm:w-7 text-white fill-white" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold text-yellow-900 animate-bounce">
                ⭐
              </div>
            </div>

            {/* Title & Subtitle */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                  {displayTitle}
                </h2>
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-violet-500" />
              </div>
              <p className="text-sm sm:text-base text-gray-500 mt-0.5">{displaySubtitle}</p>
            </div>
          </div>

          {/* Navigation & View All */}
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {t('viewAll')}
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={scrollPrev}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-violet-500 hover:text-white hover:border-violet-500 transition-all shadow-sm"
                aria-label="Précédent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={scrollNext}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-violet-500 hover:text-white hover:border-violet-500 transition-all shadow-sm"
                aria-label="Suivant"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-5 sm:mb-6 overflow-x-auto hide-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex gap-2 sm:gap-3 w-max sm:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-violet-300 hover:text-violet-600"
                )}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Carousel */}
        <div className="relative -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex gap-2">
              {(filteredProducts.length > 0 ? filteredProducts : products).map((product, index) => (
                <div 
                  key={product.id} 
                  className="embla__slide flex-[0_0_180px] sm:flex-[0_0_210px] md:flex-[0_0_240px] lg:flex-[0_0_260px]"
                >
                  <ProductCardUnified
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    image={product.image || `https://picsum.photos/seed/${product.slug}/400/400`}
                    images={product.images}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    salesCount={product.salesCount}
                    brand={product.brand || product.vendor}
                    badge={product.badge || { text: '⭐ Vedette', variant: 'featured' }}
                    stock={product.stock ?? (product.inStock === false ? 0 : 10)}
                    isVerifiedSeller={product.isVerifiedSeller}
                    isOfficialStore={product.isOfficialStore}
                    freeShipping={product.freeShipping}
                    deliveryDays={product.deliveryDays}
                    priority={index < 6}
                    className="h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile View All */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-sm font-semibold rounded-full hover:shadow-lg transition-all"
          >
            <Star className="h-4 w-4" />
            {t('viewAll')}
          </Link>
        </div>
      </div>
    </section>
  )
}

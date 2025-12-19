'use client'

import * as React from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, TrendingUp, Flame, Sparkles } from 'lucide-react'
import { ProductCardUnified } from '@/components/ui/product-card-unified'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useTranslations } from 'next-intl'

interface TrendingProduct {
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
  brand?: string
  stock?: number
  inStock?: boolean
  isVerifiedSeller?: boolean
  isOfficialStore?: boolean
  freeShipping?: boolean
  deliveryDays?: number
}

interface TrendingNowCarouselProps extends React.HTMLAttributes<HTMLElement> {
  products: TrendingProduct[]
  title?: string
  subtitle?: string
  autoplayDelay?: number
}

export default function TrendingNowCarousel({
  products,
  title,
  subtitle,
  autoplayDelay = 4000,
  className,
  ...props
}: TrendingNowCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    slidesToScroll: 1,
    align: 'start',
    dragFree: true,
  })
  const [isPaused, setIsPaused] = React.useState(false)
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()
  const t = useTranslations('home.trending')

  const displayTitle = title || t('title')
  const displaySubtitle = subtitle || t('subtitle')

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  // Autoplay with pause on hover
  React.useEffect(() => {
    if (!emblaApi || prefersReducedMotion || isPaused) return

    const interval = setInterval(() => {
      emblaApi.scrollNext()
    }, autoplayDelay)

    return () => clearInterval(interval)
  }, [emblaApi, autoplayDelay, prefersReducedMotion, isPaused])

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      className={cn(
        'relative py-20 md:py-24 overflow-hidden',
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      {...props}
    >
      {/* Background avec motifs */}
      <div className="absolute inset-0 bg-orange-50/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(244,63,94,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.05),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative">
        {/* Header - Style Temu */}
        <div
          className={cn(
            'mb-4 sm:mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Trending Icon with Animation */}
            <div className="relative">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gray-900 shadow-lg">
                <Flame className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white animate-bounce">
                HOT
              </div>
            </div>

            {/* Title & Subtitle */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                  {displayTitle}
                </h2>
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
              </div>
              <p className="text-sm sm:text-base text-gray-500 mt-0.5">{displaySubtitle}</p>
            </div>
          </div>

          {/* Navigation & View All */}
          <div className="flex items-center gap-3">
            <Link
              href="/products?sort=trending"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {t('viewAll')}
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={scrollPrev}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all shadow-sm"
                aria-label="Précédent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={scrollNext}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-900 hover:text-white hover:border-gray-900 transition-all shadow-sm"
                aria-label="Suivant"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex gap-2">
              {products.map((product, index) => (
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
                    stock={product.stock ?? (product.inStock === false ? 0 : 10)}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    salesCount={product.salesCount}
                    brand={product.brand}
                    badge={{ text: '🔥 Trending', variant: 'trending' }}
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
        <div className="mt-5 text-center sm:hidden">
          <Link
            href="/products?sort=trending"
            className="inline-flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-semibold rounded-full hover:shadow-lg transition-all"
          >
            <Sparkles className="h-4 w-4" />
            {t('viewAll')}
          </Link>
        </div>
      </div>
    </section>
  )
}

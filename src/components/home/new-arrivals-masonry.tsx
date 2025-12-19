'use client'

import * as React from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Sparkles, Star } from 'lucide-react'
import { ProductCardUnified } from '@/components/ui/product-card-unified'
import { cn } from '@/lib/utils'
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
  brand?: string
  vendor?: string
  badge?: string | { text: string; variant: string }
  inStock?: boolean
  stock?: number
  isVerifiedSeller?: boolean
  isOfficialStore?: boolean
  freeShipping?: boolean
  deliveryDays?: number
}

interface NewArrivalsMasonryProps {
  products: Product[]
  title?: string
  subtitle?: string
}

export default function NewArrivalsMasonry({
  products,
  title,
  subtitle,
}: NewArrivalsMasonryProps) {
  const t = useTranslations('home.newArrivals')
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    dragFree: true,
  })
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  const displayTitle = title || t('title')
  const displaySubtitle = subtitle || t('subtitle')

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      className={cn('relative py-24 md:py-32 overflow-hidden')}
    >
      {/* Background avec motifs */}
      <div className="absolute inset-0 bg-turquoise-50/30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(5,150,105,0.05),transparent_50%)]" />
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative">
        {/* Header - Style Temu */}
        <div
          className={cn(
            'mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Icon with Animation */}
            <div className="relative">
              <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-md bg-gray-900 shadow-lg">
                <Star className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white animate-pulse">
                NEW
              </div>
            </div>

            {/* Title & Subtitle */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                  {displayTitle}
                </h2>
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
              </div>
              <p className="text-sm sm:text-base text-gray-500 mt-1 leading-relaxed">{displaySubtitle}</p>
            </div>
          </div>

          {/* Navigation & View All */}
          <div className="flex items-center gap-4">
            <Link
              href="/products?filter=new"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {t('viewAll')}
            </Link>
            <div className="flex items-center gap-4">
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
        <div className="relative -mx-3 sm:mx-0 px-3 sm:px-0 mt-12">
          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex gap-4">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="embla__slide flex-[0_0_220px] sm:flex-[0_0_250px] md:flex-[0_0_280px] lg:flex-[0_0_300px]"
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
                    brand={product.brand || product.vendor}
                    badge={{ text: '✨ Nouveau', variant: 'new' }}
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
            href="/products?filter=new"
            className="inline-flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-semibold rounded-full hover:shadow-lg transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Voir toutes les nouveautés
          </Link>
        </div>
      </div>
    </section>
  )
}

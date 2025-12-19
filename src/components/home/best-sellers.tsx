'use client'

import * as React from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { Trophy, ChevronLeft, ChevronRight, Crown, Flame } from 'lucide-react'
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
  stockCount?: number
  isVerifiedSeller?: boolean
  isOfficialStore?: boolean
  freeShipping?: boolean
  deliveryDays?: number
}

interface BestSellersProps {
  products: Product[]
  title?: string
  subtitle?: string
}

const filterCategories = [
  { id: 'all', label: 'Tous', icon: '🏆' },
  { id: 'electronics', label: 'Électronique', icon: '💻' },
  { id: 'fashion', label: 'Mode', icon: '👔' },
  { id: 'home', label: 'Maison', icon: '🏠' },
  { id: 'beauty', label: 'Beauté', icon: '💄' },
]

export default function BestSellers({
  products,
  title,
  subtitle,
}: BestSellersProps) {
  const t = useTranslations('home.bestSellers')
  const [activeFilter, setActiveFilter] = React.useState('all')
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true, dragFree: true })
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  const displayTitle = title || t('title')
  const displaySubtitle = subtitle || t('subtitle')

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-24 overflow-hidden"
    >
      {/* Background avec motifs */}
      <div className="absolute inset-0 bg-amber-50/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.06),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(245,158,11,0.05),transparent_50%)]" />
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
            {/* Icon with Animation */}
            <div className="relative">
              <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gray-900 shadow-lg">
                <Trophy className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white animate-pulse">
                #1
              </div>
            </div>

            {/* Title & Subtitle */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                  {displayTitle}
                </h2>
                <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
              </div>
              <p className="text-sm sm:text-base text-gray-500 mt-0.5">{displaySubtitle}</p>
            </div>
          </div>

          {/* Navigation & View All */}
          <div className="flex items-center gap-3">
            <Link
              href="/products?sort=bestselling"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Flame className="h-4 w-4" />
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

        {/* Filter Tabs */}
        <div className="mb-4 sm:mb-5 overflow-x-auto hide-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
          <div className="flex gap-2 sm:gap-3 w-max sm:w-auto">
            {filterCategories.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap',
                  activeFilter === filter.id
                    ? 'bg-black text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-400 hover:bg-gray-50'
                )}
              >
                <span>{filter.icon}</span>
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Carousel */}
        <div className="relative -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex gap-2">
              {products.map((product, index) => (
                <div 
                  key={product.id} 
                  className="embla__slide flex-[0_0_180px] sm:flex-[0_0_210px] md:flex-[0_0_240px] lg:flex-[0_0_260px] relative"
                >
                  {/* Rank Badge for top 3 */}
                  {index < 3 && (
                    <div className={cn(
                      "absolute -top-2 -left-2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center font-black text-sm shadow-lg",
                      index === 0 && "bg-red-500 text-white",
                      index !== 0 && "bg-gray-900 text-white"
                    )}>
                      #{index + 1}
                    </div>
                  )}
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
                    badge={product.badge || { text: '🏆 Best Seller', variant: 'bestseller' }}
                    stock={product.stock ?? (product.inStock === false ? 0 : (product.stockCount || 10))}
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
            href="/products?sort=bestselling"
            className="inline-flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-semibold rounded-full hover:shadow-lg transition-all"
          >
            <Trophy className="h-4 w-4" />
            Voir les meilleures ventes
          </Link>
        </div>
      </div>
    </section>
  )
}

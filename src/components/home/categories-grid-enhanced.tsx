'use client'

import * as React from 'react'
import Link from 'next/link'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Grid3X3, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface Category {
  id: string
  name: string
  slug: string
  image?: string
  icon?: string
  productCount?: number
  badge?: 'new' | 'hot' | null
}

const defaultCategories: Category[] = [
  { id: '1', name: 'Électronique', slug: 'electronique', icon: '💻', productCount: 1250, badge: 'hot' },
  { id: '2', name: 'Mode Femme', slug: 'mode-femme', icon: '👗', productCount: 3420 },
  { id: '3', name: 'Mode Homme', slug: 'mode-homme', icon: '👔', productCount: 2180 },
  { id: '4', name: 'Chaussures', slug: 'chaussures', icon: '👟', productCount: 890, badge: 'new' },
  { id: '5', name: 'Accessoires', slug: 'accessoires', icon: '👜', productCount: 1560 },
  { id: '6', name: 'Beauté', slug: 'beaute', icon: '💄', productCount: 2340 },
  { id: '7', name: 'Maison', slug: 'maison', icon: '🏠', productCount: 1890 },
  { id: '8', name: 'Sports', slug: 'sports', icon: '⚽', productCount: 760, badge: 'hot' },
]

interface CategoriesGridEnhancedProps {
  categories?: Category[]
  title?: string
  subtitle?: string
}

export default function CategoriesGridEnhanced({
  categories = defaultCategories,
  title = 'Explorez nos Catégories',
  subtitle = 'Trouvez exactement ce que vous cherchez',
}: CategoriesGridEnhancedProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    dragFree: true,
  })
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace('.0', '') + 'k'
    }
    return count.toString()
  }

  return (
    <section 
      ref={sectionRef}
      className="py-8 sm:py-10 md:py-14 bg-gradient-to-b from-sky-50 via-white to-indigo-50"
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
            {/* Icon */}
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 shadow-lg">
              <Grid3X3 className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>

            {/* Title & Subtitle */}
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                {title}
              </h2>
              <p className="text-sm sm:text-base text-gray-500 mt-0.5">{subtitle}</p>
            </div>
          </div>

          {/* Navigation & View All */}
          <div className="flex items-center gap-3">
            <Link
              href="/categories"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
            >
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={scrollPrev}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all shadow-sm"
                aria-label="Précédent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={scrollNext}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-sky-500 hover:text-white hover:border-sky-500 transition-all shadow-sm"
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
            <div className="embla__container flex gap-3 sm:gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="embla__slide flex-[0_0_120px] sm:flex-[0_0_140px] md:flex-[0_0_160px] lg:flex-[0_0_180px]"
                >
                  <Link
                    href={`/categories/${category.slug}`}
                    className={cn(
                      "group relative flex flex-col items-center p-4 sm:p-5 md:p-6",
                      "bg-white rounded-2xl",
                      "border border-gray-100 hover:border-sky-200",
                      "shadow-sm hover:shadow-xl",
                      "transition-all duration-300",
                      "hover:-translate-y-1"
                    )}
                  >
                    {/* Badge */}
                    {category.badge && (
                      <div 
                        className={cn(
                          "absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-full text-white",
                          category.badge === 'new' && "bg-emerald-500",
                          category.badge === 'hot' && "bg-red-500 animate-pulse"
                        )}
                      >
                        {category.badge === 'new' ? 'New' : 'Hot'}
                      </div>
                    )}

                    {/* Icon Container */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-sky-50 to-indigo-50 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg">
                      <span className="text-3xl sm:text-4xl md:text-5xl">{category.icon}</span>
                    </div>

                    {/* Name */}
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 text-center mb-1 transition-colors duration-300 group-hover:text-sky-600">
                      {category.name}
                    </h3>

                    {/* Product Count */}
                    {category.productCount && (
                      <p className="text-xs text-gray-400">
                        {formatCount(category.productCount)} produits
                      </p>
                    )}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile View All */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm font-semibold rounded-full hover:shadow-lg transition-all"
          >
            <Grid3X3 className="h-4 w-4" />
            Voir toutes les catégories
          </Link>
        </div>
      </div>
    </section>
  )
}

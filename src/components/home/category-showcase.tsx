'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles, Crown, Leaf, Zap, Gift, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

export interface CategoryShowcaseData {
  id: string
  title: string
  subtitle: string
  slug: string
  image: string
  theme?: 'light' | 'dark'
  icon?: 'sparkles' | 'crown' | 'leaf' | 'zap' | 'gift' | 'star'
  gradient?: string
  productCount?: number
  discount?: string
}

interface CategoryShowcaseProps extends React.HTMLAttributes<HTMLElement> {
  categories?: CategoryShowcaseData[]
  title?: string
  subtitle?: string
}

const iconMap = {
  sparkles: Sparkles,
  crown: Crown,
  leaf: Leaf,
  zap: Zap,
  gift: Gift,
  star: Star,
}

const defaultCategories: CategoryShowcaseData[] = [
  {
    id: '1',
    title: 'Nouveautés',
    subtitle: 'Les dernières tendances',
    slug: 'nouveautes',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
    theme: 'dark',
    icon: 'sparkles',
    gradient: 'from-purple-500 to-pink-500',
    productCount: 245,
  },
  {
    id: '2',
    title: 'Bestsellers',
    subtitle: 'Les coups de cœur',
    slug: 'bestsellers',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80',
    theme: 'dark',
    icon: 'crown',
    gradient: 'from-orange-500 to-red-500',
    productCount: 189,
    discount: '-30%',
  },
  {
    id: '3',
    title: 'Éco-responsable',
    subtitle: 'Mode durable',
    slug: 'eco-responsable',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    theme: 'dark',
    icon: 'leaf',
    gradient: 'from-green-500 to-teal-500',
    productCount: 156,
  },
  {
    id: '4',
    title: 'Flash Deals',
    subtitle: 'Offres limitées',
    slug: 'flash-deals',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
    theme: 'dark',
    icon: 'zap',
    gradient: 'from-yellow-500 to-orange-500',
    productCount: 78,
    discount: '-50%',
  },
]

export default function CategoryShowcase({
  categories = defaultCategories,
  title,
  subtitle,
  className,
  ...props
}: CategoryShowcaseProps) {
  const t = useTranslations('home.categoryShowcase')
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

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      className={cn('py-8 sm:py-10 md:py-14 bg-gradient-to-b from-gray-50 to-white', className)}
      {...props}
    >
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header - Style Temu */}
        <div
          className={cn(
            'mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-turquoise-500 to-blue-500 shadow-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                {displayTitle}
              </h2>
              <p className="text-sm sm:text-base text-gray-500">{displaySubtitle}</p>
            </div>
          </div>

          {/* Navigation & View All */}
          <div className="flex items-center gap-3">
            <Link
              href="/categories"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-turquoise-600 hover:text-turquoise-700 hover:bg-turquoise-50 rounded-lg transition-colors"
            >
              {t('viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={scrollPrev}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-turquoise-500 hover:text-white hover:border-turquoise-500 transition-all shadow-sm"
                aria-label={t('navigation.previous')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={scrollNext}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-turquoise-500 hover:text-white hover:border-turquoise-500 transition-all shadow-sm"
                aria-label={t('navigation.next')}
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
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="embla__slide flex-[0_0_200px] sm:flex-[0_0_240px] md:flex-[0_0_280px] lg:flex-[0_0_300px]"
                >
                  <CategoryShowcaseCard
                    category={category}
                    productsLabel={t('productsLabel')}
                    exploreLabel={t('explore')}
                    className={cn(
                      !prefersReducedMotion && isVisible && 'animate-fade-in-up'
                    )}
                    style={{
                      animationDelay: !prefersReducedMotion ? `${index * 100}ms` : undefined,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile View All */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-turquoise-500 to-blue-500 text-white text-sm font-semibold rounded-full hover:shadow-lg transition-all"
          >
            <Crown className="h-4 w-4" />
            {t('viewAllCollections')}
          </Link>
        </div>
      </div>
    </section>
  )
}

interface CategoryShowcaseCardProps {
  category: CategoryShowcaseData
  productsLabel: string
  exploreLabel: string
  className?: string
  style?: React.CSSProperties
}

function CategoryShowcaseCard({ category, productsLabel, exploreLabel, className, style }: CategoryShowcaseCardProps) {
  const [isImageLoaded, setIsImageLoaded] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)

  const IconComponent = category.icon ? iconMap[category.icon] : Sparkles

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        'group relative overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-300',
        'hover:shadow-xl hover:-translate-y-1',
        'bg-white border border-gray-100',
        className
      )}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <Image
          src={category.image}
          alt={category.title}
          fill
          className={cn(
            'object-cover transition-all duration-500',
            isHovered && 'scale-110',
            !isImageLoaded && 'blur-sm',
            isImageLoaded && 'blur-0'
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 50vw, 25vw"
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />

        {/* Fallback Gradient */}
        <div className={cn(
          'absolute inset-0 -z-10 bg-gradient-to-br',
          category.gradient || 'from-turquoise-400 to-blue-500'
        )} />

        {/* Overlay */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300',
          isHovered && 'from-black/70'
        )} />

        {/* Discount Badge */}
        {category.discount && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg animate-pulse">
            {category.discount}
          </div>
        )}

        {/* Icon Badge */}
        <div className={cn(
          'absolute top-2 left-2 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-300',
          category.gradient || 'from-turquoise-500 to-blue-500',
          isHovered && 'scale-110'
        )}>
          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-bold text-white mb-0.5 line-clamp-1">
            {category.title}
          </h3>
          <p className="text-xs sm:text-sm text-white/80 line-clamp-1">
            {category.subtitle}
          </p>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="p-2.5 sm:p-3 flex items-center justify-between bg-white">
        <div className="flex items-center gap-1.5">
          {category.productCount && (
            <span className="text-xs sm:text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{category.productCount}</span> {productsLabel}
            </span>
          )}
        </div>
        <span className={cn(
          'inline-flex items-center gap-1 text-xs sm:text-sm font-medium transition-all duration-300',
          'text-turquoise-600 group-hover:text-turquoise-700'
        )}>
          {exploreLabel}
          <ArrowRight className={cn(
            'h-3.5 w-3.5 transition-transform duration-300',
            isHovered && 'translate-x-1'
          )} />
        </span>
      </div>
    </Link>
  )
}

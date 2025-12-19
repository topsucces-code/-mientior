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
    gradient: 'bg-turquoise-600',
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
    gradient: 'bg-orange-600',
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
    gradient: 'bg-turquoise-600',
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
    gradient: 'bg-orange-600',
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
      className={cn('py-24 md:py-32 bg-gradient-to-br from-gray-50 to-turquoise-50/30', className)}
      {...props}
    >
      <div className="container mx-auto px-3 sm:px-4 lg:px-6">
        {/* Header - Style Temu */}
        <div
          className={cn(
            'mb-8 sm:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-turquoise-600 shadow-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
                {displayTitle}
              </h2>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed">{displaySubtitle}</p>
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
            <div className="embla__container flex gap-4 sm:gap-5">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className="embla__slide flex-[0_0_220px] sm:flex-[0_0_260px] md:flex-[0_0_300px] lg:flex-[0_0_320px]"
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
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-turquoise-600 text-white text-sm font-semibold rounded-full hover:shadow-lg transition-all"
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
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 })
  const cardRef = React.useRef<HTMLDivElement>(null)

  const IconComponent = category.icon ? iconMap[category.icon] : Sparkles

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setTilt({
      x: (x - 0.5) * 10,
      y: (y - 0.5) * -10
    })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="block"
    >
      <div
        ref={cardRef}
        className={cn(
          'group relative overflow-hidden rounded-md transition-all duration-300',
          'hover:shadow-2xl hover:-translate-y-2',
          'bg-white border border-gray-100',
          'before:absolute before:inset-0 before:rounded-md before:bg-gradient-to-r before:from-turquoise-500 before:via-orange-500 before:to-turquoise-500 before:opacity-0 before:transition-opacity before:duration-500 before:z-10',
          'hover:before:opacity-20',
          className
        )}
        style={{
          ...style,
          transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateZ(10px)`
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          handleMouseLeave()
        }}
        onMouseMove={handleMouseMove}
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
        <div className="absolute inset-0 -z-10 bg-turquoise-600" />

        {/* Glassmorphism Overlay */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent backdrop-blur-[1px] transition-all duration-500',
          isHovered && 'from-black/80 via-black/30 to-transparent backdrop-blur-[2px]'
        )} />

        {/* Discount Badge with Sparkles */}
        {category.discount && (
          <div className="absolute top-2 right-2 z-20">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 animate-ping rounded-lg" />
              <div className="relative px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" />
                {category.discount}
              </div>
            </div>
          </div>
        )}

        {/* Icon Badge with Trending Indicator */}
        <div className={cn(
          'absolute top-2 left-2 z-20 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-md bg-turquoise-600 shadow-lg transition-all duration-300',
          isHovered && 'scale-110 rotate-6'
        )}>
          <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>

        {/* Content Overlay with Shop Button */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
          <div className="space-y-2">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-0.5 line-clamp-1">
                {category.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/90 line-clamp-1">
                {category.subtitle}
              </p>
            </div>
            <div className={cn(
              'overflow-hidden transition-all duration-300 transform translate-y-full',
              isHovered && 'translate-y-0'
            )}>
              <button className="w-full px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-semibold rounded-md border border-white/30 hover:bg-white/30 transition-colors">
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="p-3 sm:p-4 flex items-center justify-between bg-white backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center gap-2">
          {category.productCount && (
            <span className="text-xs sm:text-sm text-gray-600">
              <span className="font-bold text-gray-800">{category.productCount}</span> {productsLabel}
            </span>
          )}
          {category.discount && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-600 font-medium">Trending</span>
            </div>
          )}
        </div>
        <span className={cn(
          'inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold transition-all duration-300',
          'text-turquoise-600 group-hover:text-turquoise-700 group-hover:translate-x-1'
        )}>
          {exploreLabel}
          <ArrowRight className={cn(
            'h-4 w-4 transition-transform duration-300',
            isHovered && 'translate-x-1'
          )} />
        </span>
      </div>
    </div>
    </Link>
  )
}

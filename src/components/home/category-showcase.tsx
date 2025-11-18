'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
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
}

interface CategoryShowcaseProps extends React.HTMLAttributes<HTMLElement> {
  categories?: CategoryShowcaseData[]
  title?: string
  subtitle?: string
}

const defaultCategories: CategoryShowcaseData[] = [
  {
    id: '1',
    title: 'Nouveau',
    subtitle: 'Les dernières tendances',
    slug: 'nouveautes',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
    theme: 'dark',
  },
  {
    id: '2',
    title: 'Bestsellers',
    subtitle: 'Les coups de cœur',
    slug: 'bestsellers',
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80',
    theme: 'dark',
  },
  {
    id: '3',
    title: 'Éco-responsable',
    subtitle: 'Mode durable',
    slug: 'eco-responsable',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    theme: 'dark',
  },
]

export default function CategoryShowcase({
  categories = defaultCategories,
  title = 'Collections Phares',
  subtitle = 'Explorez nos sélections thématiques',
  className,
  ...props
}: CategoryShowcaseProps) {
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      className={cn('py-10 md:py-14', className)}
      {...props}
    >
      <div className="container mx-auto px-3 md:px-4 lg:px-6">
        {/* Header */}
        <div
          className={cn(
            'mb-8 text-center',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <h2 className="mb-3 font-display text-display-md md:text-display-lg text-anthracite-700">
            {title}
          </h2>
          <p className="text-lg text-nuanced-600">{subtitle}</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {categories.map((category, index) => (
            <CategoryShowcaseCard
              key={category.id}
              category={category}
              className={cn(
                !prefersReducedMotion && isVisible && 'animate-fade-in-up'
              )}
              style={{
                animationDelay: !prefersReducedMotion ? `${index * 100}ms` : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface CategoryShowcaseCardProps {
  category: CategoryShowcaseData
  className?: string
  style?: React.CSSProperties
}

function CategoryShowcaseCard({ category, className, style }: CategoryShowcaseCardProps) {
  const [isImageLoaded, setIsImageLoaded] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const isDark = category.theme === 'dark'

  const handleMouseEnter = React.useCallback(() => {
    setIsHovered(true)
  }, [])

  const handleMouseLeave = React.useCallback(() => {
    setIsHovered(false)
  }, [])

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        'group relative overflow-hidden rounded-2xl transition-all duration-500',
        'hover:shadow-elevation-4 hover:-translate-y-2',
        className
      )}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-platinum-100">
        <Image
          src={category.image}
          alt={category.title}
          fill
          className={cn(
            'object-cover transition-all duration-700',
            isHovered && 'scale-105',
            !isImageLoaded && 'blur-sm',
            isImageLoaded && 'blur-0'
          )}
          sizes="(max-width: 768px) 100vw, 33vw"
          onLoad={() => setIsImageLoaded(true)}
          onError={(e) => {
            // Fallback gradient if image fails to load
            e.currentTarget.style.display = 'none'
          }}
        />

        {/* Fallback Gradient (if image fails to load) */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-200 via-orange-300 to-blue-300" />

        {/* Overlay Gradient */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t transition-opacity duration-500',
            isDark
              ? 'from-black/80 via-black/40 to-transparent'
              : 'from-white/80 via-white/40 to-transparent',
            isHovered && 'opacity-90'
          )}
        />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
          {/* Subtitle */}
          <p
            className={cn(
              'mb-2 text-sm font-medium uppercase tracking-wider transition-all duration-300',
              isDark ? 'text-platinum-200' : 'text-nuanced-600',
              isHovered && 'translate-y-[-4px]'
            )}
          >
            {category.subtitle}
          </p>

          {/* Title */}
          <h3
            className={cn(
              'mb-4 font-display text-3xl md:text-4xl font-bold transition-all duration-300',
              isDark ? 'text-white' : 'text-anthracite-700',
              isHovered && 'translate-y-[-4px]'
            )}
          >
            {category.title}
          </h3>

          {/* CTA Button */}
          <span
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300',
              isDark
                ? 'border border-white/30 text-white hover:bg-white/10 backdrop-blur-sm'
                : 'border border-anthracite-700/30 text-anthracite-700 hover:bg-anthracite-700/10',
              isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            )}
          >
            Découvrir
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  )
}

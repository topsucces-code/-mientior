'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

export interface CategoryCardData {
  id: string
  name: string
  slug: string
  image?: string
  icon?: React.ReactNode
  productCount?: number
  description?: string
}

interface CategoriesNavProps extends React.HTMLAttributes<HTMLElement> {
  categories: CategoryCardData[]
  title?: string
  subtitle?: string
  columns?: 2 | 3 | 4 | 6 | 8
}

export default function CategoriesNav({
  categories,
  title = 'Explorez nos catégories',
  subtitle = 'Trouvez exactement ce que vous cherchez',
  columns = 8,
  className,
  ...props
}: CategoriesNavProps) {
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  if (!categories || categories.length === 0) {
    return null
  }

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex = currentIndex
    const cols = columns

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        nextIndex = Math.min(currentIndex + 1, categories.length - 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        nextIndex = Math.max(currentIndex - 1, 0)
        break
      case 'ArrowDown':
        e.preventDefault()
        nextIndex = Math.min(currentIndex + cols, categories.length - 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        nextIndex = Math.max(currentIndex - cols, 0)
        break
      case 'Home':
        e.preventDefault()
        nextIndex = 0
        break
      case 'End':
        e.preventDefault()
        nextIndex = categories.length - 1
        break
      default:
        return
    }

    // Focus the next card
    const nextCard = document.querySelector(
      `[data-category-index="${nextIndex}"]`
    ) as HTMLAnchorElement
    nextCard?.focus()
  }

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    6: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
    8: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-8',
  }[columns]

  return (
    <section
      ref={sectionRef}
      className={cn('py-20 md:py-24 bg-platinum-50', className)}
      {...props}
    >
      <div className="container mx-auto px-3 md:px-4 lg:px-6">
        {/* Header */}
        <div
          className={cn(
            'mb-8',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <h2 className="mb-3 font-display text-display-md md:text-display-lg text-anthracite-700">
            {title}
          </h2>
          <p className="text-lg text-nuanced-600">{subtitle}</p>
        </div>

        {/* Categories Grid */}
        <div className={cn('grid gap-6', gridColsClass)}>
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={index}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                !prefersReducedMotion && isVisible && 'animate-fade-in-up'
              )}
              style={
                !prefersReducedMotion
                  ? { animationDelay: `${index * 75}ms` }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  )
}

type CategoryCardProps = {
  category: CategoryCardData
  index: number
  onKeyDown: (e: React.KeyboardEvent) => void
  className?: string
  style?: React.CSSProperties
}

const CategoryCard = ({ category, index, onKeyDown, className, style }: CategoryCardProps) => {
  const [isImageLoaded, setIsImageLoaded] = React.useState(false)

  // Format product count with thousands separator
  const formatCount = (count: number) => {
    return new Intl.NumberFormat('fr-FR').format(count)
  }

  return (
    <Link
      href={`/categories/${category.slug}`}
      data-category-index={index}
      onKeyDown={onKeyDown}
      className={cn(
        'group relative overflow-hidden rounded-2xl border-2 border-transparent bg-white transition-all duration-250',
        'hover:shadow-[0_12px_32px_rgba(255,107,0,0.15)] hover:-translate-y-1 hover:scale-[1.02]',
        'hover:border-orange-500',
        'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
        className
      )}
      style={style}
      aria-label={`${category.name}${category.productCount ? ` - ${formatCount(category.productCount)} produits` : ''}`}
    >
      {/* Icon or Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-platinum-100">
        {category.icon ? (
          <div className="absolute inset-0 flex items-center justify-center bg-orange-50">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 shadow-lg">
              <div className="text-orange-500 transition-all duration-300 group-hover:scale-125" style={{ width: '48px', height: '48px' }}>
                {category.icon}
              </div>
            </div>
          </div>
        ) : (
          <>
            <Image
              src={category.image || '/placeholder-category.svg'}
              alt={category.name}
              fill
              unoptimized={!category.image} // SVG placeholder needs unoptimized
              className={cn(
                'object-cover transition-all duration-500 group-hover:scale-110',
                !isImageLoaded && 'blur-sm',
                isImageLoaded && 'blur-0'
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onLoad={() => setIsImageLoaded(true)}
              onError={(e) => {
                // Fallback gradient if image fails to load
                e.currentTarget.style.display = 'none'
              }}
            />

            {/* Fallback Gradient (if image fails to load) */}
            <div className="absolute inset-0 -z-10 bg-orange-200" />
          </>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Category Info */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="mb-1 font-display text-xl font-bold text-white transition-all duration-300 group-hover:translate-x-1">
            {category.name}
          </h3>

          {category.productCount !== undefined && (
            <p className="text-sm text-platinum-200 font-semibold">
              {formatCount(category.productCount)} {category.productCount > 1 ? 'produits' : 'produit'}
            </p>
          )}

          {category.description && (
            <p className="mt-2 line-clamp-2 text-sm text-platinum-200">
              {category.description}
            </p>
          )}

          {/* Arrow indicator */}
          <div className="mt-2 flex items-center gap-1 text-sm font-medium text-white opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
            <span>Découvrir</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}

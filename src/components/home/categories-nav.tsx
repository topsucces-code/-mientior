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
  productCount?: number
  description?: string
}

interface CategoriesNavProps extends React.HTMLAttributes<HTMLElement> {
  categories: CategoryCardData[]
  title?: string
  subtitle?: string
  columns?: 2 | 3 | 4 | 6
}

export default function CategoriesNav({
  categories,
  title = 'Explorez nos catégories',
  subtitle = 'Trouvez exactement ce que vous cherchez',
  columns = 4,
  className,
  ...props
}: CategoriesNavProps) {
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  if (!categories || categories.length === 0) {
    return null
  }

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    6: 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }[columns]

  return (
    <section
      ref={sectionRef}
      className={cn('py-16 md:py-24 bg-platinum-50', className)}
      {...props}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div
          className={cn(
            'mb-12 text-center',
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
              className={cn(
                !prefersReducedMotion && isVisible && 'animate-fade-in-up'
              )}
              style={{
                animationDelay: !prefersReducedMotion ? `${index * 75}ms` : undefined,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface CategoryCardProps extends React.HTMLAttributes<HTMLDivElement> {
  category: CategoryCardData
}

function CategoryCard({ category, className, style, ...props }: CategoryCardProps) {
  const [isImageLoaded, setIsImageLoaded] = React.useState(false)

  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        'group relative overflow-hidden rounded-lg border border-platinum-300 bg-white transition-all duration-300',
        'hover:shadow-elevation-3 hover:-translate-y-1',
        className
      )}
      style={style}
      {...props}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-platinum-100">
        <Image
          src={category.image || '/placeholder-category.jpg'}
          alt={category.name}
          fill
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
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-200 via-orange-300 to-blue-300" />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Category Info */}
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="mb-1 font-display text-xl font-bold text-white transition-all duration-300 group-hover:translate-x-1">
            {category.name}
          </h3>

          {category.productCount !== undefined && (
            <p className="text-sm text-platinum-200">
              {category.productCount} {category.productCount > 1 ? 'produits' : 'produit'}
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

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useTranslations } from 'next-intl'
import type { QuickFilter } from '@/types'

// Separate component to use translations hook
function ProductCountText({ count }: { count: number }) {
  const t = useTranslations('products.category')
  return (
    <p className="text-sm text-white/80">
      {t('productsAvailable', { count })}
    </p>
  )
}

export interface CategoryHeroBannerProps {
  title: string
  description?: string
  image?: string
  productCount?: number
  quickFilters?: QuickFilter[]
  onQuickFilterClick?: (value: string) => void
  activeQuickFilter?: string
}

export function CategoryHeroBanner({
  title,
  description,
  image,
  productCount,
  quickFilters = [],
  onQuickFilterClick,
  activeQuickFilter
}: CategoryHeroBannerProps) {
  const [parallaxOffset, setParallaxOffset] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (prefersReducedMotion) return

    const handleScroll = () => {
      const offset = window.scrollY * 0.3 // Parallax effect: move at 30% of scroll speed
      setParallaxOffset(offset)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [prefersReducedMotion])

  return (
    <div className="relative h-[160px] md:h-[200px] lg:h-[240px] overflow-hidden">
      {/* Background Image with Parallax */}
      {image && (
        <div
          className="parallax-hero absolute inset-0"
          style={{
            transform: prefersReducedMotion ? 'none' : `translateY(-${parallaxOffset}px)`
          }}
        >
          <Image
            src={image}
            alt={title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>
      )}

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.7) 100%)'
        }}
      />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-[600px] space-y-2">
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}
          >
            {title}
          </h1>

          {description && (
            <p className="text-base text-white/90 mt-2">{description}</p>
          )}

          {productCount !== undefined && (
            <ProductCountText count={productCount} />
          )}
        </div>

        {/* Quick Filter Pills */}
        {quickFilters.length > 0 && (
          <div className="mt-6 flex gap-3 overflow-x-auto custom-scrollbar-horizontal max-w-full px-4">
            {quickFilters.map((filter) => {
              const isActive = activeQuickFilter === filter.value

              return (
                <button
                  key={filter.id}
                  onClick={() => onQuickFilterClick?.(filter.value)}
                  className={cn(
                    'h-10 px-6 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                    'border border-white/30 backdrop-blur-md flex-shrink-0',
                    isActive
                      ? 'bg-white text-anthracite-700 shadow-elevation-2'
                      : 'bg-white/20 text-white hover:bg-white/30 hover:-translate-y-0.5'
                  )}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

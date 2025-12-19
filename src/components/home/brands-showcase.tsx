'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Award, ChevronRight, Verified } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface Brand {
  id: string
  name: string
  logo: string
  href?: string
  productCount?: number
  isVerified?: boolean
}

const defaultBrands: Brand[] = [
  { id: '1', name: 'Nike', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/200px-Logo_NIKE.svg.png', productCount: 245, isVerified: true },
  { id: '2', name: 'Adidas', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/200px-Adidas_Logo.svg.png', productCount: 189, isVerified: true },
  { id: '3', name: 'Puma', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Puma_complete_logo.svg/200px-Puma_complete_logo.svg.png', productCount: 156, isVerified: true },
  { id: '4', name: 'Zara', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Zara_Logo.svg/200px-Zara_Logo.svg.png', productCount: 312, isVerified: true },
  { id: '5', name: 'H&M', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/H%26M-Logo.svg/200px-H%26M-Logo.svg.png', productCount: 278, isVerified: true },
  { id: '6', name: 'Gucci', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/1960s_Gucci_Logo.svg/200px-1960s_Gucci_Logo.svg.png', productCount: 98, isVerified: true },
  { id: '7', name: 'Louis Vuitton', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Louis_Vuitton_logo_and_wordmark.svg/200px-Louis_Vuitton_logo_and_wordmark.svg.png', productCount: 76, isVerified: true },
  { id: '8', name: 'Chanel', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Chanel_logo-no_words.svg/200px-Chanel_logo-no_words.svg.png', productCount: 54, isVerified: true },
]

interface BrandsShowcaseProps {
  brands?: Brand[]
  title?: string
  subtitle?: string
}

export default function BrandsShowcase({
  brands = defaultBrands,
  title,
  subtitle,
}: BrandsShowcaseProps) {
  const t = useTranslations('home.brands')
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  const displayTitle = title || t('title')
  const displaySubtitle = subtitle || t('subtitle')

  // Duplicate brands for infinite scroll effect
  const duplicatedBrands = [...brands, ...brands]

  return (
    <section
      ref={sectionRef}
      className="py-20 md:py-24 bg-amber-50 overflow-hidden"
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
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-orange-600 shadow-lg">
              <Award className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>

            {/* Title & Subtitle */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                  {displayTitle}
                </h2>
                <Verified className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              </div>
              <p className="text-sm sm:text-base text-gray-500 mt-0.5">{displaySubtitle}</p>
            </div>
          </div>

          {/* View All Link */}
          <Link
            href="/brands"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
          >
            {t('viewAll')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Marquee Container */}
      <div className="relative w-full overflow-hidden">
        {/* Gradient Fades */}
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 md:w-32 bg-amber-50/80 z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 md:w-32 bg-amber-50/80 z-10 pointer-events-none" />

        {/* Scrolling Track */}
        <div className="flex gap-4 sm:gap-6 md:gap-8 animate-marquee-scroll hover:[animation-play-state:paused]">
          {duplicatedBrands.map((brand, index) => (
            <Link
              key={`${brand.id}-${index}`}
              href={brand.href || `/brands/${brand.name.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                'flex-shrink-0 group',
                'w-32 sm:w-40 md:w-48',
                'bg-white rounded-xl sm:rounded-2xl',
                'border border-gray-100 hover:border-amber-200',
                'shadow-sm hover:shadow-xl',
                'transition-all duration-300',
                'hover:-translate-y-1'
              )}
            >
              {/* Logo Container */}
              <div className="p-4 sm:p-5 md:p-6">
                <div className="relative h-10 sm:h-12 md:h-14 grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    fill
                    sizes="180px"
                    className="object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.innerHTML = `<span class="text-base sm:text-lg font-bold text-gray-600">${brand.name}</span>`
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Brand Info */}
              <div className="px-4 pb-3 sm:px-5 sm:pb-4 border-t border-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-500">
                    {brand.productCount} {t('productsLabel')}
                  </span>
                  {brand.isVerified && (
                    <span className="flex items-center gap-0.5 text-xs text-amber-600 font-medium">
                      <Verified className="h-3 w-3" />
                      {t('official')}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

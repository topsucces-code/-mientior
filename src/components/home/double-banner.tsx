'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Shirt, Watch, Sparkles, TrendingUp, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface BannerItem {
  id: string
  label: string
  title: string
  description: string
  image: string
  href: string
  ctaText: string
  variant?: 'turquoise' | 'orange' | 'green' | 'purple'
  icon?: 'shirt' | 'watch' | 'sparkles'
  stats?: { value: string; label: string }[]
}

const defaultBanners: BannerItem[] = [
  {
    id: '1',
    label: 'Collection Exclusive',
    title: 'Mode Homme Tendance',
    description: 'Découvrez notre nouvelle collection masculine avec des pièces élégantes et modernes',
    image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80',
    href: '/categories/homme',
    ctaText: 'Voir la Collection',
    variant: 'turquoise',
    icon: 'shirt',
    stats: [
      { value: '500+', label: 'Produits' },
      { value: '-40%', label: 'Réduction' },
    ],
  },
  {
    id: '2',
    label: 'Nouveautés',
    title: 'Accessoires Premium',
    description: 'Complétez votre style avec nos accessoires soigneusement sélectionnés',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
    href: '/categories/accessoires',
    ctaText: 'Explorer',
    variant: 'orange',
    icon: 'watch',
    stats: [
      { value: '300+', label: 'Articles' },
      { value: 'Nouveau', label: 'Arrivage' },
    ],
  },
]

const iconMap = {
  shirt: Shirt,
  watch: Watch,
  sparkles: Sparkles,
}

interface DoubleBannerProps {
  banners?: BannerItem[]
}

export default function DoubleBanner({ banners = defaultBanners }: DoubleBannerProps) {
  const t = useTranslations('home.banners')
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  return (
    <section
      ref={sectionRef}
      className="py-4 sm:py-6 md:py-8 bg-slate-50"
    >
      <div className="container mx-auto px-2 sm:px-3 lg:px-4">
        {/* Header - Style Temu */}
        <div
          className={cn(
            'mb-4 sm:mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Icon */}
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-md bg-slate-800 shadow-lg">
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </div>

            {/* Title & Subtitle */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
                  {t('title')}
                </h2>
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              </div>
              <p className="text-sm sm:text-base text-gray-500 mt-0.5">{t('subtitle')}</p>
            </div>
          </div>

          {/* View All Link */}
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          >
            {t('viewAll')}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
          {banners.map((banner, index) => {
            const IconComponent = banner.icon ? iconMap[banner.icon] : Sparkles
            
            return (
              <Link
                key={banner.id}
                href={banner.href}
                className={cn(
                  "group relative h-[280px] sm:h-[320px] md:h-[360px] rounded-md overflow-hidden cursor-pointer",
                  "shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2",
                  isVisible && !prefersReducedMotion && 'animate-fade-in-up'
                )}
                style={{ animationDelay: !prefersReducedMotion ? `${index * 150}ms` : undefined }}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <Image
                    src={banner.image}
                    alt={banner.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>

                {/* Gradient Overlay */}
                <div
                  className={cn(
                    'absolute inset-0 transition-opacity duration-500',
                    banner.variant === 'turquoise' && 'bg-turquoise-700/85',
                    banner.variant === 'orange' && 'bg-orange-600/85',
                    banner.variant === 'green' && 'bg-emerald-600/85',
                    banner.variant === 'purple' && 'bg-purple-700/85',
                    !banner.variant && 'bg-turquoise-700/85'
                  )}
                />

                {/* Icon Badge */}
                <div className="absolute top-4 right-4 sm:top-5 sm:right-5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-md flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="relative h-full p-4 sm:p-5 md:p-6 flex flex-col justify-end text-white z-10">
                  {/* Label */}
                  <span className="inline-flex items-center gap-1.5 w-fit px-3 py-1 mb-3 text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm rounded-md">
                    <Sparkles className="w-3 h-3" />
                    {banner.label}
                  </span>

                  {/* Title */}
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 sm:mb-3 leading-tight drop-shadow-lg">
                    {banner.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-white/90 mb-4 max-w-md leading-relaxed line-clamp-2">
                    {banner.description}
                  </p>

                  {/* Stats */}
                  {banner.stats && (
                    <div className="flex gap-3 mb-3">
                      {banner.stats.map((stat, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-lg sm:text-xl font-black">{stat.value}</span>
                          <span className="text-xs text-white/70">{stat.label}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* CTA Button */}
                  <span
                    className={cn(
                      'inline-flex items-center gap-2 w-fit px-4 py-2 rounded-md font-bold text-sm',
                      'bg-white shadow-lg transition-all duration-300',
                      'group-hover:translate-x-2 group-hover:shadow-xl',
                      banner.variant === 'turquoise' && 'text-turquoise-600',
                      banner.variant === 'orange' && 'text-orange-500',
                      banner.variant === 'green' && 'text-emerald-600',
                      banner.variant === 'purple' && 'text-violet-600',
                      !banner.variant && 'text-turquoise-600'
                    )}
                  >
                    {banner.ctaText}
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

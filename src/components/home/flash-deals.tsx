'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
import { ProductCard, ProductCardProps } from '@/components/ui/product-card'
import { CountdownTimer } from '@/components/ui/countdown-timer'
import { RippleButton } from '@/components/ui/ripple-button'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface FlashDealsProps extends React.HTMLAttributes<HTMLElement> {
  products: Omit<ProductCardProps, 'onQuickView'>[]
  title?: string
  subtitle?: string
  endDate: Date | string
  viewAllHref?: string
  onDealsEnd?: () => void
}

export default function FlashDeal({
  products,
  title = 'Ventes Flash',
  subtitle = 'Offres limitées, ne les manquez pas !',
  endDate,
  viewAllHref = '/products?filter=flash',
  onDealsEnd,
  className,
  ...props
}: FlashDealsProps) {
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  // TODO: Implement quick view modal
  const handleQuickView = (productId: string) => {
    console.log('Quick view:', productId)
    // This would open a modal with product details
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      className={cn('py-16 md:py-24 bg-gradient-to-br from-orange-50 via-white to-orange-50', className)}
      {...props}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div
          className={cn(
            'mb-12',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          {/* Title Row */}
          <div className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              {/* Flash Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-elevation-2">
                <Zap className="h-8 w-8 fill-white text-white" />
              </div>

              {/* Title & Subtitle */}
              <div>
                <h2 className="mb-2 font-display text-display-md md:text-display-lg text-anthracite-700">
                  {title}
                </h2>
                <p className="text-lg text-nuanced-600">{subtitle}</p>
              </div>
            </div>

            {/* View All Button (Desktop) */}
            <Link href={viewAllHref} className="hidden md:block">
              <RippleButton variant="outline" className="group flex items-center gap-2">
                Voir toutes les offres
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </RippleButton>
            </Link>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-4 rounded-lg border border-orange-200 bg-orange-50/50 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-anthracite-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
              <span>Se termine dans :</span>
            </div>
            <CountdownTimer
              targetDate={endDate}
              format="compact"
              variant="card"
              onComplete={onDealsEnd}
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              {...product}
              badge={{ text: 'FLASH', variant: 'flash' }}
              onQuickView={handleQuickView}
              className={cn(
                !prefersReducedMotion && isVisible && 'animate-fade-in-up'
              )}
              style={{
                animationDelay: !prefersReducedMotion ? `${index * 50}ms` : undefined,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* View All Button (Mobile) */}
        <div
          className={cn(
            'mt-8 flex justify-center md:hidden',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
          style={{ animationDelay: '400ms' }}
        >
          <Link href={viewAllHref}>
            <RippleButton variant="outline" className="group flex items-center gap-2">
              Voir toutes les offres
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </RippleButton>
          </Link>
        </div>

        {/* Progress Indicator */}
        <div
          className={cn(
            'mt-12 rounded-lg border border-platinum-300 bg-white p-6',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
          style={{ animationDelay: '500ms' }}
        >
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-medium text-anthracite-500">
              Stocks limités
            </span>
            <span className="text-nuanced-600">
              Dépêchez-vous !
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-platinum-200">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
              style={{ width: '35%' }}
            />
          </div>
          <p className="mt-3 text-xs text-nuanced-500">
            Plus de 65% des stocks ont déjà été vendus
          </p>
        </div>
      </div>
    </section>
  )
}

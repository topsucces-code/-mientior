'use client'

import * as React from 'react'
import Link from 'next/link'
import { Zap, ArrowRight, ChevronLeft, ChevronRight, Clock, Flame, Timer } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { ProductCardUnified } from '@/components/ui/product-card-unified'
import { cn } from '@/lib/utils'

interface FlashProduct {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number
  image?: string
  images?: string[]
  stock?: number
  rating?: number
  reviewCount?: number
  salesCount?: number
  brand?: string
  isVerifiedSeller?: boolean
  isOfficialStore?: boolean
  freeShipping?: boolean
  deliveryDays?: number
}

interface FlashDealsEnhancedProps {
  products: FlashProduct[]
  endDate: Date | string
  totalStock?: number
  soldCount?: number
}

export default function FlashDealsEnhanced({
  products,
  endDate,
  totalStock = 1000,
  soldCount = 650,
}: FlashDealsEnhancedProps) {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true, dragFree: true })

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  // Countdown timer
  React.useEffect(() => {
    const targetDate = new Date(endDate).getTime()
    
    const updateTimer = () => {
      const now = Date.now()
      const diff = Math.max(0, targetDate - now)
      
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [endDate])

  const soldPercentage = Math.round((soldCount / totalStock) * 100)

  return (
    <section className="relative py-6 sm:py-8 md:py-10 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-banner-shine" />
        {/* Floating icons */}
        <div className="absolute top-4 left-[10%] text-white/10 animate-float">
          <Zap className="w-12 h-12" />
        </div>
        <div className="absolute bottom-4 right-[15%] text-white/10 animate-float" style={{ animationDelay: '1s' }}>
          <Flame className="w-10 h-10" />
        </div>
        <div className="absolute top-1/2 right-[5%] text-white/10 animate-float" style={{ animationDelay: '2s' }}>
          <Timer className="w-8 h-8" />
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative z-10">
        {/* Header Row - Style Temu */}
        <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between mb-5 sm:mb-6">
          {/* Left - Title & Icon */}
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500 fill-orange-500" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 animate-ping" />
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-bold">
                ⚡
              </div>
            </div>
            <div className="text-white">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-wide">
                  Ventes Flash
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full animate-pulse">
                  <Flame className="w-3 h-3" />
                  HOT
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/90">Offres limitées, ne les manquez pas !</p>
            </div>
          </div>

          {/* Center - Countdown */}
          <div className="flex items-center gap-2 sm:gap-3 justify-center">
            <Clock className="w-5 h-5 text-white/80 hidden sm:block" />
            <div className="flex gap-1.5 sm:gap-2">
              {[
                { value: timeLeft.days, label: 'J' },
                { value: timeLeft.hours, label: 'H' },
                { value: timeLeft.minutes, label: 'M' },
                { value: timeLeft.seconds, label: 'S' },
              ].map((item, i) => (
                <React.Fragment key={item.label}>
                  <div className="flex flex-col items-center bg-white rounded-xl px-2.5 py-1.5 sm:px-4 sm:py-2 min-w-[44px] sm:min-w-[56px] shadow-lg">
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-gray-800 tabular-nums">
                      {String(item.value).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                      {item.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <span className="text-xl sm:text-2xl md:text-3xl font-black text-white self-center animate-pulse">
                      :
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right - Navigation & CTA */}
          <div className="flex items-center gap-3 justify-center sm:justify-end">
            <Link 
              href="/products?filter=flash" 
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-orange-500 text-sm font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={scrollPrev}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-orange-500 transition-all"
                aria-label="Précédent"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={scrollNext}
                className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white hover:text-orange-500 transition-all"
                aria-label="Suivant"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stock Progress */}
        <div className="mb-5 sm:mb-6 max-w-lg">
          <div className="flex justify-between text-xs sm:text-sm text-white mb-2">
            <span className="flex items-center gap-1.5 font-semibold">
              <Flame className="w-4 h-4 text-yellow-400" />
              {soldPercentage}% vendus
            </span>
            <span className="text-white/80">Plus que {totalStock - soldCount} en stock</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 rounded-full transition-all duration-1000 relative"
              style={{ width: `${soldPercentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Products Carousel */}
        <div className="relative -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex gap-3 sm:gap-4">
              {products.map((product, index) => (
                <div 
                  key={product.id} 
                  className="embla__slide flex-[0_0_170px] sm:flex-[0_0_200px] md:flex-[0_0_220px] lg:flex-[0_0_240px]"
                >
                  <ProductCardUnified
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    image={product.image || `https://picsum.photos/seed/${product.slug}/400/400`}
                    images={product.images}
                    stock={product.stock}
                    rating={product.rating}
                    reviewCount={product.reviewCount}
                    salesCount={product.salesCount}
                    brand={product.brand}
                    badge={{ text: '⚡ Flash', variant: 'sale' }}
                    isVerifiedSeller={product.isVerifiedSeller}
                    isOfficialStore={product.isOfficialStore}
                    freeShipping={product.freeShipping}
                    deliveryDays={product.deliveryDays}
                    priority={index < 6}
                    className="h-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile View All */}
        <div className="mt-5 text-center sm:hidden">
          <Link
            href="/products?filter=flash"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-orange-500 text-sm font-bold rounded-full shadow-lg"
          >
            <Zap className="h-4 w-4" />
            Voir toutes les offres flash
          </Link>
        </div>
      </div>
    </section>
  )
}

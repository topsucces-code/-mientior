'use client'

import * as React from 'react'
import Link from 'next/link'
import { Zap, ArrowRight, ChevronLeft, ChevronRight, Clock, Flame, Timer, Users, TrendingUp, Sparkles } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { ProductCardUnified } from '@/components/ui/product-card-unified'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('home.flashDeals')
  const [isMounted, setIsMounted] = React.useState(false)
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', loop: true, dragFree: true })
  const [viewersCount, setViewersCount] = React.useState(0)
  const [recentPurchase, setRecentPurchase] = React.useState<{ name: string; city: string } | null>(null)
  const [showPurchaseNotif, setShowPurchaseNotif] = React.useState(false)
  const [lightningStrike, setLightningStrike] = React.useState(false)

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  // Mark as mounted to avoid hydration mismatch
  React.useEffect(() => {
    setIsMounted(true)
    // Simulate viewers count
    setViewersCount(Math.floor(Math.random() * 50) + 20)
    const viewersInterval = setInterval(() => {
      setViewersCount(prev => Math.max(10, prev + Math.floor(Math.random() * 11) - 5))
    }, 5000)
    return () => clearInterval(viewersInterval)
  }, [])

  // Lightning strike effect
  React.useEffect(() => {
    if (!isMounted) return
    const strikeInterval = setInterval(() => {
      setLightningStrike(true)
      setTimeout(() => setLightningStrike(false), 300)
    }, 8000)
    return () => clearInterval(strikeInterval)
  }, [isMounted])

  // Recent purchase notifications
  React.useEffect(() => {
    if (!isMounted) return
    const cities = ['Dakar', 'Abidjan', 'Lagos', 'Douala', 'Accra', 'Nairobi']
    const names = ['Marie', 'Aisha', 'Fatou', 'Khadija', 'Amara', 'Zara']
    
    const showPurchase = () => {
      const purchase = {
        name: names[Math.floor(Math.random() * names.length)] || 'Client',
        city: cities[Math.floor(Math.random() * cities.length)] || 'Ville'
      }
      setRecentPurchase(purchase)
      setShowPurchaseNotif(true)
      setTimeout(() => setShowPurchaseNotif(false), 4000)
    }
    
    showPurchase()
    const purchaseInterval = setInterval(showPurchase, 12000)
    return () => clearInterval(purchaseInterval)
  }, [isMounted])

  // Countdown timer - only runs after mount
  React.useEffect(() => {
    if (!isMounted) return

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
  }, [endDate, isMounted])

  const soldPercentage = Math.round((soldCount / totalStock) * 100)

  return (
    <section className="relative py-24 md:py-32 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Lightning effect */}
        {lightningStrike && (
          <div className="absolute inset-0 z-50">
            <div className="absolute inset-0 bg-white/30 animate-pulse" />
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                d="M30,0 L35,40 L25,45 L40,100 L35,60 L45,55 Z"
                fill="white"
                className="animate-pulse"
                style={{ filter: 'blur(2px)' }}
              />
            </svg>
          </div>
        )}
        {/* Floating particles */}
        <div className="absolute top-4 left-[10%] text-white/20 animate-float">
          <Zap className="w-12 h-12" />
        </div>
        <div className="absolute bottom-4 right-[15%] text-white/20 animate-float" style={{ animationDelay: '1s' }}>
          <Flame className="w-10 h-10" />
        </div>
        <div className="absolute top-1/2 right-[5%] text-white/20 animate-float" style={{ animationDelay: '2s' }}>
          <Timer className="w-8 h-8" />
        </div>
        <div className="absolute top-1/3 left-[20%] text-white/10 animate-float" style={{ animationDelay: '3s' }}>
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="absolute bottom-1/3 left-[30%] text-white/10 animate-float" style={{ animationDelay: '4s' }}>
          <TrendingUp className="w-8 h-8" />
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative z-10">
        {/* Header Row - Style Temu */}
        <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between mb-6 sm:mb-8">
          {/* Left - Title & Icon */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-md flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500 fill-orange-500" />
              </div>
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 animate-ping" />
              <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold">
                ⚡
              </div>
            </div>
            <div className="text-white">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight">
                  {t('title')}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full animate-pulse">
                  <Flame className="w-3 h-3" />
                  HOT
                </span>
              </div>
              <p className="text-sm sm:text-base text-white/90 leading-relaxed">{t('subtitle')}</p>
            </div>
          </div>

          {/* Center - Countdown with urgency effect */}
          {isMounted && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <Clock className="w-5 h-5 text-white/80 hidden sm:block" />
                <div className="flex gap-1.5 sm:gap-2">
                  {[
                    { value: timeLeft.days, label: t('days').charAt(0).toUpperCase() },
                    { value: timeLeft.hours, label: t('hours').charAt(0).toUpperCase() },
                    { value: timeLeft.minutes, label: t('minutes').charAt(0).toUpperCase() },
                    { value: timeLeft.seconds, label: t('seconds').charAt(0).toUpperCase() },
                  ].map((item, i) => (
                    <React.Fragment key={item.label}>
                      <div className={cn(
                        "flex flex-col items-center bg-white rounded-lg px-2 py-1 sm:px-3 sm:py-1.5 min-w-[44px] sm:min-w-[56px] shadow-lg relative overflow-hidden",
                        timeLeft.seconds < 10 && item.label === 'S' && "animate-pulse ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent"
                      )}>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200 to-transparent -translate-x-full animate-shimmer" />
                        <span className={cn(
                          "text-xl sm:text-2xl md:text-3xl font-black text-gray-800 tabular-nums relative z-10",
                          timeLeft.seconds < 10 && item.label === 'S' && "text-red-600 animate-pulse"
                        )}>
                          {String(item.value).padStart(2, '0')}
                        </span>
                        <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold relative z-10">
                          {item.label}
                        </span>
                      </div>
                      {i < 3 && (
                        <span className={cn(
                          "text-xl sm:text-2xl md:text-3xl font-black text-white self-center",
                          timeLeft.seconds < 10 && "animate-pulse text-yellow-300"
                        )}>
                          :
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              {/* Live viewers count */}
              <div className="flex items-center gap-2 text-white/90 text-sm animate-pulse">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <Users className="w-3 h-3" />
                <span>{viewersCount} personnes en train de voir</span>
              </div>
            </div>
          )}

          {/* Right - Navigation & CTA */}
          <div className="flex items-center gap-3 justify-center sm:justify-end">
            <Link
              href="/products?filter=flash"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-orange-500 text-sm font-bold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              {t('viewAll')}
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

        {/* Stock Progress with urgency */}
        <div className="mb-6 sm:mb-8 max-w-lg">
          <div className="flex justify-between text-sm text-white mb-3">
            <span className={cn(
              "flex items-center gap-1.5 font-semibold",
              soldPercentage > 80 && "animate-pulse text-yellow-300"
            )}>
              <Flame className={cn("w-4 h-4", soldPercentage > 80 && "text-yellow-300 animate-bounce")} />
              {soldPercentage}% {t('sold')}
              {soldPercentage > 80 && <span className="text-xs bg-red-500 px-2 py-0.5 rounded-full animate-pulse">VITE!</span>}
            </span>
            <span className="text-white/80">{totalStock - soldCount} {t('remaining')}</span>
          </div>
          <div className="h-4 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm relative">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-1000 relative",
                soldPercentage > 80 ? "bg-red-500 animate-pulse" : "bg-yellow-500"
              )}
              style={{ width: `${soldPercentage}%` }}
            >
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Products Carousel */}
        <div className="relative -mx-3 sm:mx-0 px-3 sm:px-0 mt-8">
          <div className="embla overflow-hidden" ref={emblaRef}>
            <div className="embla__container flex gap-3">
              {products.map((product, index) => (
                <div 
                  key={product.id} 
                  className="embla__slide flex-[0_0_200px] sm:flex-[0_0_230px] md:flex-[0_0_260px] lg:flex-[0_0_280px]"
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
                    badge={{ text: 'Flash', variant: 'sale' }}
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
        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/products?filter=flash"
            className="inline-flex items-center gap-2 px-5 py-2 bg-white text-orange-500 text-sm font-bold rounded-full shadow-lg"
          >
            <Zap className="h-4 w-4" />
            {t('viewAll')}
          </Link>
        </div>

        {/* Recent Purchase Notification */}
        {showPurchaseNotif && recentPurchase && (
          <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
            <div className="bg-white rounded-lg shadow-xl p-3 flex items-center gap-3 max-w-xs">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-800">
                  {recentPurchase.name} de {recentPurchase.city}
                </p>
                <p className="text-xs text-gray-500">vient d'acheter</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

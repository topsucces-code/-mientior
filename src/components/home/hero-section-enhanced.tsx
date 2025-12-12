'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface HeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  productImage?: string
  discount?: string
  price?: string
  cta: {
    text: string
    href: string
  }
  secondaryCta?: {
    text: string
    href: string
  }
  features?: { icon: string; text: string }[]
}

// Default slides with static images and hrefs - text will be localized
const getDefaultSlides = (t: (key: string) => string): HeroSlide[] => [
  {
    id: '1',
    title: t('slides.1.title'),
    subtitle: t('slides.1.subtitle'),
    description: t('slides.1.description'),
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
    productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
    discount: t('slides.1.discount'),
    price: t('slides.1.price'),
    cta: { text: t('slides.1.cta.text'), href: '/products' },
    secondaryCta: { text: t('slides.1.secondaryCta.text'), href: '/about' },
    features: [
      { icon: '🚚', text: t('slides.1.features.freeShipping') },
      { icon: '↩️', text: t('slides.1.features.returns') },
    ],
  },
  {
    id: '2',
    title: t('slides.2.title'),
    subtitle: t('slides.2.subtitle'),
    description: t('slides.2.description'),
    image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1920&q=80',
    productImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
    discount: t('slides.2.discount'),
    price: t('slides.2.price'),
    cta: { text: t('slides.2.cta.text'), href: '/categories/electronique' },
    features: [
      { icon: '🔒', text: t('slides.2.features.securePayment') },
      { icon: '⚡', text: t('slides.2.features.expressDelivery') },
    ],
  },
  {
    id: '3',
    title: t('slides.3.title'),
    subtitle: t('slides.3.subtitle'),
    description: t('slides.3.description'),
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&q=80',
    productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
    discount: t('slides.3.discount'),
    price: t('slides.3.price'),
    cta: { text: t('slides.3.cta.text'), href: '/products?filter=sale' },
    features: [
      { icon: '🎁', text: t('slides.3.features.exclusiveGifts') },
      { icon: '💳', text: t('slides.3.features.installments') },
    ],
  },
  {
    id: '4',
    title: t('slides.4.title'),
    subtitle: t('slides.4.subtitle'),
    description: t('slides.4.description'),
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1920&q=80',
    productImage: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&q=80',
    discount: t('slides.4.discount'),
    price: t('slides.4.price'),
    cta: { text: t('slides.4.cta.text'), href: '/categories/beaute' },
    features: [
      { icon: '✨', text: t('slides.4.features.authentic') },
      { icon: '🌿', text: t('slides.4.features.natural') },
    ],
  },
]

interface HeroSectionProps {
  slides?: HeroSlide[]
  autoplayDelay?: number
}

export default function HeroSectionEnhanced({
  slides,
  autoplayDelay = 5000
}: HeroSectionProps) {
  const t = useTranslations('home.hero')
  const localizedSlides = slides || getDefaultSlides(t)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [progress, setProgress] = React.useState(0)
  const [isPaused, setIsPaused] = React.useState(false)

  const scrollPrev = React.useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = React.useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = React.useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi])

  // Update selected index
  React.useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    onSelect()
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi])

  // Autoplay effect
  React.useEffect(() => {
    if (!emblaApi || isPaused) return
    const interval = setInterval(() => {
      emblaApi.scrollNext()
    }, autoplayDelay)
    return () => clearInterval(interval)
  }, [emblaApi, autoplayDelay, isPaused])

  // Progress bar animation
  React.useEffect(() => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0
        return prev + (100 / (autoplayDelay / 50))
      })
    }, 50)
    return () => clearInterval(interval)
  }, [selectedIndex, autoplayDelay])

  return (
    <section 
      className="relative w-full h-[280px] sm:h-[300px] md:h-[340px] lg:h-[380px] xl:h-[420px] overflow-hidden bg-gradient-to-br from-turquoise-600 to-turquoise-500"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Carousel */}
      <div className="embla h-full" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {localizedSlides.map((slide, index) => {
            const isActive = index === selectedIndex

            return (
              <div key={slide.id} className="embla__slide relative min-w-0 flex-[0_0_100%] h-full">
                {/* Background Image with Parallax */}
                <div className="absolute inset-0 overflow-hidden">
                  <div 
                    className={cn(
                      "absolute -inset-12 transition-transform duration-[8000ms] ease-out",
                      isActive ? "scale-100" : "scale-110"
                    )}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      priority={index === 0}
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-turquoise-600/90 via-turquoise-500/80 to-orange-500/70" />
                </div>

                {/* Content Wrapper */}
                <div className="relative h-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-[4%] grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-16 items-center z-10">
                  {/* Left Content - Text */}
                  <div className="text-white pt-6 sm:pt-8 lg:pt-0 text-center lg:text-left">
                    {/* Label */}
                    <span 
                      className={cn(
                        "inline-block px-3 sm:px-5 py-1.5 sm:py-2 mb-3 sm:mb-4 md:mb-6 text-[10px] sm:text-xs font-bold uppercase tracking-[0.1em] sm:tracking-[0.15em]",
                        "bg-white/15 backdrop-blur-sm border border-white/30 rounded-full",
                        "opacity-0 translate-y-8",
                        isActive && "animate-[slideUpFade_800ms_ease_200ms_forwards]"
                      )}
                    >
                      {slide.subtitle}
                    </span>

                    {/* Title */}
                    <h1 
                      className={cn(
                        "text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black leading-[1.1] mb-3 sm:mb-4 md:mb-5",
                        "bg-gradient-to-r from-white via-gray-100 to-turquoise-100 bg-clip-text text-transparent",
                        "opacity-0 translate-y-8",
                        isActive && "animate-[slideUpFade_800ms_ease_400ms_forwards]"
                      )}
                    >
                      {slide.title}
                    </h1>

                    {/* Description */}
                    <p 
                      className={cn(
                        "text-sm sm:text-base md:text-lg lg:text-xl text-white/95 mb-4 sm:mb-6 md:mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed",
                        "opacity-0 translate-y-8",
                        isActive && "animate-[slideUpFade_800ms_ease_600ms_forwards]"
                      )}
                    >
                      {slide.description}
                    </p>

                    {/* CTA Buttons */}
                    <div 
                      className={cn(
                        "flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8 justify-center lg:justify-start",
                        "opacity-0 translate-y-8",
                        isActive && "animate-[slideUpFade_800ms_ease_800ms_forwards]"
                      )}
                    >
                      <Link href={slide.cta.href}>
                        <button className="group relative px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-orange-500 text-white text-sm sm:text-base font-bold rounded-lg sm:rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(249,115,22,0.4)] hover:shadow-[0_12px_32px_rgba(249,115,22,0.5)] hover:-translate-y-1 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
                          <span className="relative z-10 flex items-center gap-2">
                            {slide.cta.text}
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                          </span>
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </Link>

                      {slide.secondaryCta && (
                        <Link href={slide.secondaryCta.href}>
                          <button className="px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 bg-transparent text-white text-sm sm:text-base font-bold rounded-lg sm:rounded-xl border-2 border-white/40 backdrop-blur-sm hover:bg-white hover:text-turquoise-600 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto">
                            {slide.secondaryCta.text}
                          </button>
                        </Link>
                      )}
                    </div>

                    {/* Features */}
                    {slide.features && (
                      <div 
                        className={cn(
                          "hidden sm:flex gap-4 md:gap-6 lg:gap-8 justify-center lg:justify-start",
                          "opacity-0 translate-y-8",
                          isActive && "animate-[slideUpFade_800ms_ease_1000ms_forwards]"
                        )}
                      >
                        {slide.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2 md:gap-3">
                            <span className="text-lg md:text-xl lg:text-2xl animate-feature-pulse">{feature.icon}</span>
                            <span className="text-xs md:text-sm font-semibold text-white/95">{feature.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Content - Product Showcase */}
                  <div className="hidden lg:flex relative h-full items-center justify-center pb-8 lg:pb-0">
                    {slide.productImage && (
                      <>
                        {/* Product Image */}
                        <div 
                          className={cn(
                            "relative w-[280px] h-[280px] lg:w-[320px] lg:h-[320px] xl:w-[380px] xl:h-[380px] 2xl:w-[400px] 2xl:h-[400px]",
                            "opacity-0 translate-x-12 rotate-6",
                            isActive && "animate-[productEntrance_1000ms_cubic-bezier(0.4,0,0.2,1)_600ms_forwards]"
                          )}
                        >
                          <Image
                            src={slide.productImage}
                            alt={slide.title}
                            fill
                            sizes="400px"
                            className="object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
                          />
                        </div>

                        {/* Price Badge */}
                        {slide.discount && slide.price && (
                          <div 
                            className={cn(
                              "absolute top-8 lg:top-12 xl:top-16 right-4 lg:right-8 xl:right-16 2xl:right-20 bg-white p-3 lg:p-4 xl:p-5 rounded-xl lg:rounded-2xl shadow-[0_12px_48px_rgba(0,0,0,0.2)]",
                              "opacity-0 scale-75",
                              isActive && "animate-[badgeEntrance_600ms_cubic-bezier(0.4,0,0.2,1)_1200ms_forwards]"
                            )}
                          >
                            <span className="block text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-black text-red-500 animate-discount-pulse">
                              {slide.discount}
                            </span>
                            <span className="block text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-black text-orange-500">
                              {slide.price}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 sm:px-4 md:px-8 pointer-events-none z-20">
        <button
          onClick={scrollPrev}
          className="pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-turquoise-600 hover:scale-110 transition-all duration-300"
          aria-label={t('navigation.previous')}
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>
        <button
          onClick={scrollNext}
          className="pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-turquoise-600 hover:scale-110 transition-all duration-300"
          aria-label={t('navigation.next')}
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-20">
        {localizedSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "h-2 sm:h-3 rounded-full transition-all duration-400 border-2",
              index === selectedIndex 
                ? "w-6 sm:w-8 md:w-10 bg-white border-orange-500/60 shadow-[0_4px_12px_rgba(255,255,255,0.4)]" 
                : "w-2 sm:w-3 bg-white/40 border-transparent hover:bg-white/60 hover:scale-125"
            )}
            aria-label={t('navigation.goToSlide', { number: index + 1 })}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-20">
        <div 
          className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  )
}

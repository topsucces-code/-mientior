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

// Christmas PNG images with transparent backgrounds
const christmasImages = {
  giftBox: 'https://www.pngall.com/wp-content/uploads/2016/10/Gift-Free-Download-PNG.png',
  santaHat: 'https://www.pngall.com/wp-content/uploads/2016/04/Santa-Claus-Hat-PNG-Clipart.png',
  christmasTree: 'https://www.pngall.com/wp-content/uploads/2016/04/Christmas-Tree-Free-Download-PNG.png',
  ornament: 'https://www.pngall.com/wp-content/uploads/2016/10/Christmas-Ornament-PNG-File.png',
  snowman: 'https://www.pngall.com/wp-content/uploads/2016/10/Snowman-PNG-File.png',
  bells: 'https://www.pngall.com/wp-content/uploads/2016/10/Christmas-Bell-PNG-Clipart.png',
  candy: 'https://www.pngall.com/wp-content/uploads/2016/10/Candy-Cane-PNG-File.png',
  wreath: 'https://www.pngall.com/wp-content/uploads/2016/10/Christmas-Wreath-PNG-File.png',
}

// Default slides with Christmas theme - text will be localized
const getDefaultSlides = (_t: (key: string) => string): HeroSlide[] => [
  {
    id: '1',
    title: '🎄 Offres de Noël',
    subtitle: '🎅 JOYEUX NOËL',
    description: 'Découvrez nos meilleures offres pour célébrer les fêtes en famille !',
    image: '',
    productImage: christmasImages.giftBox,
    discount: '-50%',
    price: 'Dès 5000 FCFA',
    cta: { text: 'Voir les cadeaux 🎁', href: '/products' },
    secondaryCta: { text: 'Idées cadeaux', href: '/categories/cadeaux' },
    features: [
      { icon: '🎁', text: 'Emballage cadeau gratuit' },
      { icon: '🚚', text: 'Livraison express' },
    ],
  },
  {
    id: '2',
    title: '🎧 High-Tech en Promo',
    subtitle: '⚡ OFFRES FLASH',
    description: 'Les meilleurs gadgets pour faire plaisir à vos proches !',
    image: '',
    productImage: 'https://www.pngall.com/wp-content/uploads/5/Headphone-PNG-Free-Image.png',
    discount: '-40%',
    price: 'Dès 15000 FCFA',
    cta: { text: 'Découvrir', href: '/categories/electronique' },
    features: [
      { icon: '🔒', text: 'Paiement sécurisé' },
      { icon: '⚡', text: 'Livraison 24h' },
    ],
  },
  {
    id: '3',
    title: '👟 Mode & Sneakers',
    subtitle: '🔥 TENDANCES 2024',
    description: 'Les dernières tendances pour briller pendant les fêtes !',
    image: '',
    productImage: 'https://www.pngall.com/wp-content/uploads/2016/04/Sneakers-PNG-File.png',
    discount: '-35%',
    price: 'Dès 25000 FCFA',
    cta: { text: 'Shopper maintenant', href: '/products?filter=sale' },
    features: [
      { icon: '✨', text: 'Nouveautés' },
      { icon: '💳', text: 'Paiement en 3x' },
    ],
  },
  {
    id: '4',
    title: '💄 Coffrets Beauté',
    subtitle: '✨ ÉDITION LIMITÉE',
    description: 'Des coffrets exclusifs pour sublimer vos fêtes !',
    image: '',
    productImage: 'https://www.pngall.com/wp-content/uploads/2016/07/Perfume-PNG-HD.png',
    discount: '-30%',
    price: 'Dès 10000 FCFA',
    cta: { text: 'Offrir', href: '/categories/beaute' },
    features: [
      { icon: '🎀', text: 'Édition Noël' },
      { icon: '🌟', text: 'Produits premium' },
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

  // Pre-calculated snowflake positions to avoid SSR hydration mismatch
  const [snowflakes, setSnowflakes] = React.useState<Array<{
    id: number
    left: string
    animationDelay: string
    animationDuration: string
    size: number
    opacity: number
  }>>([])

  // Generate snowflakes only on client side to avoid hydration mismatch
  React.useEffect(() => {
    const flakes = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${3 + Math.random() * 4}s`,
      size: Math.random() * 8 + 4,
      opacity: Math.random() * 0.7 + 0.3,
    }))
    setSnowflakes(flakes)
  }, [])

  // Use snowflakes to avoid unused warning
  snowflakes.forEach(() => {})

  return (
    <section
      className="relative w-full h-[200px] sm:h-[220px] md:h-[240px] lg:h-[280px] xl:h-[320px] overflow-hidden bg-turquoise-700"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Removed Snowfall Animation */}

      {/* Christmas Decorations */}
      <div className="absolute top-2 left-4 text-2xl sm:text-3xl animate-bounce z-20">🎄</div>
      <div className="absolute top-2 right-4 text-2xl sm:text-3xl animate-bounce z-20" style={{ animationDelay: '0.5s' }}>🎅</div>
      <div className="absolute bottom-12 left-8 text-xl sm:text-2xl animate-pulse z-20">⭐</div>
      <div className="absolute bottom-12 right-8 text-xl sm:text-2xl animate-pulse z-20" style={{ animationDelay: '1s' }}>🔔</div>

      {/* Carousel */}
      <div className="embla h-full" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {localizedSlides.map((slide, index) => {
            const isActive = index === selectedIndex

            return (
              <div key={slide.id} className="embla__slide relative min-w-0 flex-[0_0_100%] h-full">
                {/* Solid Turquoise Background */}
                <div className="absolute inset-0 bg-turquoise-700" />

                {/* Content Wrapper */}
                <div className="relative h-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-[4%] grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 lg:gap-8 items-center z-10">
                  {/* Left Content - Text */}
                  <div className="text-white pt-2 sm:pt-0 text-center sm:text-left order-2 sm:order-1">
                    {/* Label */}
                    <span
                      className={cn(
                        "inline-block px-2 sm:px-3 py-0.5 sm:py-1 mb-1.5 sm:mb-2 md:mb-3 text-xs font-bold uppercase tracking-[0.1em]",
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
                        "text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black leading-[1.1] mb-1.5 sm:mb-2 md:mb-3",
                        "text-white",
                        "opacity-0 translate-y-8",
                        isActive && "animate-[slideUpFade_800ms_ease_400ms_forwards]"
                      )}
                    >
                      {slide.title}
                    </h1>

                    {/* Description */}
                    <p
                      className={cn(
                        "text-xs sm:text-sm md:text-base text-white/95 mb-2 sm:mb-3 md:mb-4 max-w-lg mx-auto lg:mx-0 leading-relaxed line-clamp-2",
                        "opacity-0 translate-y-8",
                        isActive && "animate-[slideUpFade_800ms_ease_600ms_forwards]"
                      )}
                    >
                      {slide.description}
                    </p>

                    {/* CTA Buttons */}
                    <div
                      className={cn(
                        "flex flex-col sm:flex-row flex-wrap gap-2 mb-2 sm:mb-3 md:mb-4 justify-center lg:justify-start",
                        "opacity-0 translate-y-8",
                        isActive && "animate-[slideUpFade_800ms_ease_800ms_forwards]"
                      )}
                    >
                      <Link href={slide.cta.href}>
                        <button className="group relative px-4 sm:px-5 py-1.5 sm:py-2 md:py-2.5 bg-orange-500 text-white text-xs sm:text-sm font-bold rounded-lg overflow-hidden shadow-[0_4px_16px_rgba(249,115,22,0.4)] hover:shadow-[0_6px_20px_rgba(249,115,22,0.5)] hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 w-full sm:w-auto">
                          <span className="relative z-10 flex items-center gap-1.5">
                            {slide.cta.text}
                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
                          </span>
                          <div className="absolute inset-0 bg-orange-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </Link>

                      {slide.secondaryCta && (
                        <Link href={slide.secondaryCta.href}>
                          <button className="hidden sm:block px-4 sm:px-5 py-1.5 sm:py-2 md:py-2.5 bg-transparent text-white text-xs sm:text-sm font-bold rounded-lg border-2 border-white/40 backdrop-blur-sm hover:bg-white hover:text-turquoise-600 hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto">
                            {slide.secondaryCta.text}
                          </button>
                        </Link>
                      )}
                    </div>

                    {/* Features */}
                    {slide.features && (
                      <div
                        className={cn(
                          "hidden md:flex gap-3 lg:gap-4 justify-center lg:justify-start",
                          "opacity-0 translate-y-8",
                          isActive && "animate-[slideUpFade_800ms_ease_1000ms_forwards]"
                        )}
                      >
                        {slide.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className="text-sm md:text-base animate-feature-pulse">{feature.icon}</span>
                            <span className="text-xs font-semibold text-white/95">{feature.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right Content - Product Showcase */}
                  <div className="flex relative h-full items-center justify-center pb-4 lg:pb-0">
                    {slide.productImage && (
                      <>
                        {/* Product Image - Transparent background, above turquoise */}
                        <div
                          className={cn(
                            "relative w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] md:w-[160px] md:h-[160px] lg:w-[200px] lg:h-[200px] xl:w-[260px] xl:h-[260px]",
                            "opacity-0 translate-y-8 scale-95",
                            isActive && "animate-[productEntrance_1000ms_cubic-bezier(0.4,0,0.2,1)_400ms_forwards]"
                          )}
                        >
                          <Image
                            src={slide.productImage}
                            alt={slide.title}
                            fill
                            sizes="(max-width: 640px) 120px, (max-width: 768px) 140px, (max-width: 1024px) 160px, (max-width: 1280px) 200px, 260px"
                            className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
                          />
                        </div>

                        {/* Price Badge */}
                        {slide.discount && slide.price && (
                          <div
                            className={cn(
                              "absolute top-2 sm:top-3 md:top-4 lg:top-6 xl:top-8 right-0 sm:right-2 lg:right-4 xl:right-8 bg-white p-1.5 sm:p-2 lg:p-2.5 xl:p-3 rounded-lg lg:rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]",
                              "opacity-0 scale-75",
                              isActive && "animate-[badgeEntrance_600ms_cubic-bezier(0.4,0,0.2,1)_800ms_forwards]"
                            )}
                          >
                            <span className="block text-xs sm:text-sm lg:text-base xl:text-lg font-black text-red-500 animate-discount-pulse">
                              {slide.discount}
                            </span>
                            <span className="block text-xs sm:text-sm lg:text-base xl:text-lg font-black text-orange-500">
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
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2 sm:px-3 md:px-4 pointer-events-none z-20">
        <button
          onClick={scrollPrev}
          className="pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-turquoise-600 hover:scale-110 transition-all duration-300"
          aria-label={t('navigation.previous')}
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </button>
        <button
          onClick={scrollNext}
          className="pointer-events-auto w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-turquoise-600 hover:scale-110 transition-all duration-300"
          aria-label={t('navigation.next')}
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Dots Navigation */}
      <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 z-20">
        {localizedSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "h-1.5 sm:h-2 rounded-full transition-all duration-400 border",
              index === selectedIndex
                ? "w-5 sm:w-6 md:w-8 bg-white border-orange-500/60 shadow-[0_2px_8px_rgba(255,255,255,0.4)]"
                : "w-1.5 sm:w-2 bg-white/40 border-transparent hover:bg-white/60 hover:scale-125"
            )}
            aria-label={t('navigation.goToSlide', { number: index + 1 })}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-black/20 z-20">
        <div
          className="h-full bg-orange-600 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  )
}

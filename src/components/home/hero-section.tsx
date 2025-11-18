'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import Fade from 'embla-carousel-fade'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RippleButton } from '@/components/ui/ripple-button'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

interface HeroSlide {
  id: string
  title: string
  subtitle: string
  description: string
  image: string
  cta: {
    text: string
    href: string
  }
  secondaryCta?: {
    text: string
    href: string
  }
  theme?: 'light' | 'dark'
}

const defaultSlides: HeroSlide[] = [
  {
    id: '1',
    title: 'NOUVELLE COLLECTION Automne/Hiver 2025',
    subtitle: 'L\'Excellence au Quotidien',
    description: 'Découvrez notre sélection exclusive de pièces tendance pour la nouvelle saison',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
    cta: {
      text: 'Découvrir Maintenant',
      href: '/products',
    },
    secondaryCta: {
      text: 'En Savoir Plus',
      href: '/about',
    },
    theme: 'dark',
  },
  {
    id: '2',
    title: 'Les Incontournables du Moment',
    subtitle: 'Nouveautés',
    description: 'Soyez les premiers à découvrir nos dernières collections et produits tendance',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1920&q=80',
    cta: {
      text: 'Explorer la Collection',
      href: '/products?filter=new',
    },
    theme: 'dark',
  },
  {
    id: '3',
    title: 'Offres Exclusives',
    subtitle: 'Ventes Flash',
    description: 'Profitez de nos offres exceptionnelles et promotions limitées',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&q=80',
    cta: {
      text: 'Voir les Offres',
      href: '/products?filter=sale',
    },
    theme: 'dark',
  },
  {
    id: '4',
    title: 'Mode Éco-Responsable',
    subtitle: 'Style Durable',
    description: 'Une mode consciente pour un avenir meilleur',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1920&q=80',
    cta: {
      text: 'Découvrir',
      href: '/categories/eco-responsable',
    },
    theme: 'dark',
  },
]

interface HeroSectionProps {
  slides?: HeroSlide[]
  autoplayDelay?: number
}

export default function HeroSection({ slides = defaultSlides, autoplayDelay = 6000 }: HeroSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      duration: 30,
    },
    [Fade()]
  )
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })
  const [isAutoplayPaused, setIsAutoplayPaused] = React.useState(false)
  const [currentSlideAnnouncement, setCurrentSlideAnnouncement] = React.useState('')
  const [imageLuminance, setImageLuminance] = React.useState<Record<string, number>>({})
  const prefersReducedMotion = useReducedMotion()

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollTo = React.useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi]
  )

  // Calculate image luminance for dynamic overlay
  const calculateImageLuminance = React.useCallback((imageUrl: string, slideId: string) => {
    const img = new window.Image()
    img.crossOrigin = 'Anonymous'
    img.src = imageUrl

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Sample from the left portion where text overlay appears
        const sampleWidth = 400
        const sampleHeight = 300
        canvas.width = sampleWidth
        canvas.height = sampleHeight

        ctx.drawImage(img, 0, 0, sampleWidth, sampleHeight, 0, 0, sampleWidth, sampleHeight)
        const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
        const data = imageData.data

        let totalLuminance = 0
        // Sample every 10th pixel for performance
        for (let i = 0; i < data.length; i += 40) {
          const r = data[i] ?? 0
          const g = data[i + 1] ?? 0
          const b = data[i + 2] ?? 0
          // Calculate relative luminance using standard formula
          totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b
        }

        const avgLuminance = totalLuminance / (data.length / 40)
        // Normalize to 0-1 range
        const normalizedLuminance = avgLuminance / 255

        setImageLuminance(prev => ({ ...prev, [slideId]: normalizedLuminance }))
      } catch (error) {
        console.error('Error calculating luminance:', error)
        // Default to dark overlay if calculation fails
        setImageLuminance(prev => ({ ...prev, [slideId]: 0.5 }))
      }
    }

    img.onerror = () => {
      // Default to dark overlay if image fails to load
      setImageLuminance(prev => ({ ...prev, [slideId]: 0.5 }))
    }
  }, [])

  // Calculate luminance for all slides on mount
  React.useEffect(() => {
    slides.forEach(slide => {
      calculateImageLuminance(slide.image, slide.id)
    })
  }, [slides, calculateImageLuminance])

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return
    const index = emblaApi.selectedScrollSnap()
    setSelectedIndex(index)
    // Update ARIA live region with current slide info
    const slide = slides[index]
    if (slide) {
      setCurrentSlideAnnouncement(`Slide ${index + 1} of ${slides.length}: ${slide.title}`)
    }
  }, [emblaApi, slides])

  React.useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  // Autoplay with pause on hover
  React.useEffect(() => {
    if (!emblaApi || prefersReducedMotion || isAutoplayPaused) return

    const interval = setInterval(() => {
      emblaApi.scrollNext()
    }, autoplayDelay)

    return () => clearInterval(interval)
  }, [emblaApi, autoplayDelay, prefersReducedMotion, isAutoplayPaused])

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scrollPrev()
      } else if (e.key === 'ArrowRight') {
        scrollNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [scrollPrev, scrollNext])

  // Parallax effect - 3-layer parallax based on mouse position
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 30
    setMousePosition({ x, y })
  }

  return (
    <section
      className="relative overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsAutoplayPaused(true)}
      onMouseLeave={() => setIsAutoplayPaused(false)}
      role="region"
      aria-label="Hero carousel"
    >
      {/* Skip link for keyboard navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-anthracite-700 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
      >
        Skip to main content
      </a>

      {/* ARIA live region for screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {currentSlideAnnouncement}
      </div>

      <div className="embla" ref={emblaRef}>
        <div className="embla__container flex">
          {slides.map((slide, index) => {
            const isActive = index === selectedIndex
            const isDark = slide.theme === 'dark'
            const luminance = imageLuminance[slide.id] ?? 0.5
            // Use luminance to determine overlay: brighter images need darker overlay
            const overlayOpacity = luminance > 0.5 ? 0.7 : 0.5

            return (
              <div key={slide.id} className="embla__slide relative min-w-0 flex-[0_0_100%]">
                {/* Background Image with Fade + Scale Animation */}
                <div className="relative h-[85vh] overflow-hidden bg-anthracite-700">
                  {/* Fallback Gradient (only visible if image fails to load) */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-500 via-orange-600 to-blue-600" />
                  
                  {/* Background Layer with scale animation on transition */}
                  <div
                    className={cn(
                      "absolute inset-0 transition-all ease-out",
                      isActive && !prefersReducedMotion 
                        ? "duration-700 scale-100 opacity-100" 
                        : "duration-500 scale-105 opacity-0"
                    )}
                    style={{
                      transform: isActive && !prefersReducedMotion 
                        ? `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px) scale(1)` 
                        : 'scale(1.05)',
                    }}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      priority={index === 0}
                      placeholder={index === 0 ? undefined : 'blur'}
                      blurDataURL={index === 0 ? undefined : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMyMDIwMjAiLz48L3N2Zz4='}
                      sizes="100vw"
                      className="object-cover"
                      onError={(e) => {
                        // Fallback gradient if image fails to load
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>

                  {/* Midground Layer - medium movement */}
                  <div
                    className="absolute inset-0 transition-transform duration-500 ease-out"
                    style={{
                      transform: isActive && !prefersReducedMotion 
                        ? `translate(${mousePosition.x * 0.6}px, ${mousePosition.y * 0.6}px)` 
                        : 'translate(0, 0)',
                    }}
                  >
                    {/* Dynamic Gradient Overlay - adapts based on image luminance */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent transition-opacity duration-500"
                      style={{
                        opacity: overlayOpacity,
                      }}
                    />
                  </div>
                </div>

                {/* Foreground Content Layer - fastest movement */}
                <div 
                  className="absolute inset-0 flex items-center transition-transform duration-300 ease-out"
                  style={{
                    transform: isActive && !prefersReducedMotion 
                      ? `translate(${mousePosition.x}px, ${mousePosition.y}px)` 
                      : 'translate(0, 0)',
                  }}
                >
                  <div className="container mx-auto px-3 md:px-4 lg:px-6">
                    <div className="max-w-3xl">
                      {/* Subtitle */}
                      <div
                        className={cn(
                          'mb-3 inline-block overflow-hidden',
                          isActive && !prefersReducedMotion && 'animate-fade-in-up'
                        )}
                        style={{ animationDelay: '100ms' }}
                      >
                        <span
                          className={cn(
                            'inline-block rounded-full px-4 py-1.5 text-sm font-semibold uppercase tracking-wide',
                            isDark
                              ? 'bg-white/10 text-white backdrop-blur-sm'
                              : 'bg-anthracite-700/10 text-anthracite-700 backdrop-blur-sm'
                          )}
                        >
                          {slide.subtitle}
                        </span>
                      </div>

                      {/* Title with gradient text effect */}
                      <h1
                        className={cn(
                          'mb-4 font-display font-extrabold leading-[1.1] tracking-tight',
                          'text-[clamp(48px,8vw,96px)]',
                          isDark ? 'text-transparent' : 'text-anthracite-700',
                          'bg-gradient-to-r from-white via-platinum-100 to-aurore-200 bg-clip-text',
                          isActive && !prefersReducedMotion && 'animate-fade-in-up'
                        )}
                        style={{
                          animationDelay: '200ms',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: isDark ? 'transparent' : undefined,
                        }}
                      >
                        {slide.title}
                      </h1>

                      {/* Description */}
                      <p
                        className={cn(
                          'mb-6 text-lg md:text-xl',
                          isDark ? 'text-platinum-100' : 'text-nuanced-600',
                          isActive && !prefersReducedMotion && 'animate-fade-in-up'
                        )}
                        style={{ animationDelay: '300ms' }}
                      >
                        {slide.description}
                      </p>

                      {/* CTAs with enhanced styling */}
                      <div
                        className={cn(
                          'flex flex-wrap gap-4',
                          isActive && !prefersReducedMotion && 'animate-fade-in-up'
                        )}
                        style={{ animationDelay: '400ms' }}
                      >
                        <Link href={slide.cta.href}>
                          <RippleButton
                            variant="gradient"
                            size="lg"
                            className={cn(
                              'group flex items-center gap-2',
                              'h-14 px-12 rounded-xl',
                              'shadow-[0_12px_24px_rgba(255,107,0,0.3)]',
                              'hover:shadow-[0_16px_32px_rgba(255,107,0,0.4)]',
                              'hover:-translate-y-0.5',
                              'transition-all duration-300',
                              'hover:scale-105'
                            )}
                            aria-label={`${slide.cta.text} - ${slide.title}`}
                          >
                            {slide.cta.text}
                            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                          </RippleButton>
                        </Link>

                        {slide.secondaryCta && (
                          <Link href={slide.secondaryCta.href}>
                            <RippleButton
                              variant="outline"
                              size="lg"
                              className={cn(
                                'h-14 px-12 rounded-xl transition-all duration-300',
                                isDark
                                  ? 'border-white/30 text-white hover:bg-white/10 backdrop-blur-sm'
                                  : 'border-anthracite-700/30 text-anthracite-700 hover:bg-anthracite-700/10'
                              )}
                              aria-label={`${slide.secondaryCta.text} - ${slide.title}`}
                            >
                              {slide.secondaryCta.text}
                            </RippleButton>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <>
          {/* Previous/Next Buttons */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 md:px-6 lg:px-8 pointer-events-none">
            <button
              onClick={scrollPrev}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-110"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </button>
            <button
              onClick={scrollNext}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-110"
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Dots Navigation with Thumbnails */}
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                  'group relative h-16 w-24 overflow-hidden rounded-lg transition-all',
                  index === selectedIndex 
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-black/20' 
                    : 'opacity-60 hover:opacity-100'
                )}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === selectedIndex}
              >
                <Image
                  src={slide.image}
                  alt={`Slide ${index + 1} thumbnail`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
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
    title: 'Discover Exceptional Products',
    subtitle: 'Premium Quality',
    description: 'Explore our curated collection of premium products designed to enhance your lifestyle',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80',
    cta: {
      text: 'Shop Now',
      href: '/products',
    },
    secondaryCta: {
      text: 'Learn More',
      href: '/about',
    },
    theme: 'dark',
  },
  {
    id: '2',
    title: 'New Arrivals',
    subtitle: 'Fresh Collections',
    description: 'Be the first to discover our latest products and trending items',
    image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1920&q=80',
    cta: {
      text: 'Explore Collection',
      href: '/products?filter=new',
    },
    theme: 'light',
  },
  {
    id: '3',
    title: 'Exclusive Deals',
    subtitle: 'Limited Time Offers',
    description: 'Save big with our exclusive offers and seasonal promotions',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&q=80',
    cta: {
      text: 'View Deals',
      href: '/products?filter=sale',
    },
    theme: 'dark',
  },
]

interface HeroSectionProps {
  slides?: HeroSlide[]
  autoplayDelay?: number
}

export default function HeroSection({ slides = defaultSlides, autoplayDelay = 5000 }: HeroSectionProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 })
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([])
  const [mouseY, setMouseY] = React.useState(0)
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

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  React.useEffect(() => {
    if (!emblaApi) return
    onSelect()
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  // Autoplay
  React.useEffect(() => {
    if (!emblaApi || prefersReducedMotion) return

    const interval = setInterval(() => {
      emblaApi.scrollNext()
    }, autoplayDelay)

    return () => clearInterval(interval)
  }, [emblaApi, autoplayDelay, prefersReducedMotion])

  // Parallax effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20
    setMouseY(y)
  }

  return (
    <section className="relative overflow-hidden" onMouseMove={handleMouseMove}>
      <div className="embla" ref={emblaRef}>
        <div className="embla__container flex">
          {slides.map((slide, index) => {
            const isActive = index === selectedIndex
            const isDark = slide.theme === 'dark'

            return (
              <div key={slide.id} className="embla__slide relative min-w-0 flex-[0_0_100%]">
                {/* Background Image with Parallax */}
                <div className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden bg-anthracite-700">
                  <div
                    className="absolute inset-0 transition-transform duration-700 ease-out"
                    style={{
                      transform: isActive && !prefersReducedMotion ? `translateY(${mouseY}px) scale(1.1)` : 'scale(1.1)',
                    }}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      fill
                      priority={index === 0}
                      sizes="100vw"
                      className="object-cover"
                      onError={(e) => {
                        // Fallback gradient if image fails to load
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    {/* Gradient Overlay */}
                    <div
                      className={cn(
                        'absolute inset-0',
                        isDark
                          ? 'bg-gradient-to-r from-black/70 via-black/50 to-transparent'
                          : 'bg-gradient-to-r from-white/70 via-white/50 to-transparent'
                      )}
                    />
                  </div>

                  {/* Fallback Gradient (if image fails to load) */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-blue-600" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-4 md:px-6 lg:px-8">
                    <div className="max-w-2xl">
                      {/* Subtitle */}
                      <div
                        className={cn(
                          'mb-4 inline-block overflow-hidden',
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

                      {/* Title */}
                      <h1
                        className={cn(
                          'mb-6 font-display text-display-lg md:text-display-xl',
                          isDark ? 'text-white' : 'text-anthracite-700',
                          isActive && !prefersReducedMotion && 'animate-fade-in-up'
                        )}
                        style={{ animationDelay: '200ms' }}
                      >
                        {slide.title}
                      </h1>

                      {/* Description */}
                      <p
                        className={cn(
                          'mb-8 text-lg md:text-xl',
                          isDark ? 'text-platinum-100' : 'text-nuanced-600',
                          isActive && !prefersReducedMotion && 'animate-fade-in-up'
                        )}
                        style={{ animationDelay: '300ms' }}
                      >
                        {slide.description}
                      </p>

                      {/* CTAs */}
                      <div
                        className={cn(
                          'flex flex-wrap gap-4',
                          isActive && !prefersReducedMotion && 'animate-fade-in-up'
                        )}
                        style={{ animationDelay: '400ms' }}
                      >
                        <Link href={slide.cta.href}>
                          <RippleButton variant="gradient" size="lg" className="group flex items-center gap-2">
                            {slide.cta.text}
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                          </RippleButton>
                        </Link>

                        {slide.secondaryCta && (
                          <Link href={slide.secondaryCta.href}>
                            <RippleButton
                              variant="outline"
                              size="lg"
                              className={cn(
                                isDark
                                  ? 'border-white/30 text-white hover:bg-white/10 backdrop-blur-sm'
                                  : 'border-anthracite-700/30 text-anthracite-700 hover:bg-anthracite-700/10'
                              )}
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

          {/* Dots Navigation */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === selectedIndex ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                )}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === selectedIndex}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}

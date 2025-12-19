'use client'

import * as React from 'react'
import Image from 'next/image'
import useEmblaCarousel from 'embla-carousel-react'
import { Quote, CheckCircle2 } from 'lucide-react'
import { StarRating } from '@/components/ui/star-rating'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'

export interface Testimonial {
  id: string
  name: string
  avatar?: string
  rating: number
  text: string
  productName?: string
  productImage?: string
  date: string
  verified?: boolean
}

const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Marie Dupont',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    rating: 5,
    text: 'Produits de qualité exceptionnelle ! La livraison était rapide et l\'emballage soigné. Je recommande vivement.',
    productName: 'Sac en Cuir Premium',
    productImage: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=200&q=80',
    date: '2025-01-10',
    verified: true,
  },
  {
    id: '2',
    name: 'Thomas Martin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    rating: 5,
    text: 'Service client au top ! J\'ai eu un souci avec ma commande et ils l\'ont résolu immédiatement. Excellente expérience.',
    productName: 'Montre Connectée',
    productImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80',
    date: '2025-01-08',
    verified: true,
  },
  {
    id: '3',
    name: 'Sophie Laurent',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    rating: 5,
    text: 'Très satisfaite de mon achat. Les photos correspondent parfaitement au produit reçu. Je reviendrai !',
    productName: 'Robe d\'Été',
    productImage: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=200&q=80',
    date: '2025-01-05',
    verified: true,
  },
  {
    id: '4',
    name: 'Lucas Bernard',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    rating: 5,
    text: 'Prix compétitifs et qualité au rendez-vous. Le site est facile à naviguer et le paiement sécurisé.',
    productName: 'Chaussures de Sport',
    productImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&q=80',
    date: '2025-01-03',
    verified: true,
  },
  {
    id: '5',
    name: 'Emma Petit',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    rating: 5,
    text: 'Produit conforme à mes attentes. Livraison dans les délais annoncés. Boutique très professionnelle.',
    productName: 'Parfum Floral',
    productImage: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=200&q=80',
    date: '2025-01-01',
    verified: true,
  },
]

interface TestimonialsCarouselProps extends React.HTMLAttributes<HTMLElement> {
  testimonials?: Testimonial[]
  title?: string
  subtitle?: string
  autoplayDelay?: number
}

export default function TestimonialsCarousel({
  testimonials = defaultTestimonials,
  title = 'Ils Nous Ont Fait Confiance',
  subtitle = 'Découvrez les avis de nos clients satisfaits',
  autoplayDelay = 7000,
  className,
  ...props
}: TestimonialsCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([])
  const [currentSlideAnnouncement, setCurrentSlideAnnouncement] = React.useState('')
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()

  const scrollTo = React.useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi]
  )

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return
    const index = emblaApi.selectedScrollSnap()
    setSelectedIndex(index)
    
    // Update ARIA live region announcement for screen readers
    const testimonial = testimonials[index]
    if (testimonial) {
      setCurrentSlideAnnouncement(
        `Témoignage ${index + 1} sur ${testimonials.length} : ${testimonial.name}, ${testimonial.rating} étoiles. ${testimonial.text}`
      )
    }
  }, [emblaApi, testimonials])

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

  if (!testimonials || testimonials.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      className={cn('py-20 md:py-24 bg-turquoise-50', className)}
      aria-label="Témoignages clients"
      {...props}
    >
      {/* ARIA live region for screen reader announcements */}
      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {currentSlideAnnouncement}
      </div>

      <div className="container mx-auto px-3 md:px-4 lg:px-6">
        {/* Header */}
        <div
          className={cn(
            'mb-8 text-center',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <h2 className="mb-3 font-display text-display-md md:text-display-lg text-anthracite-700">
            {title}
          </h2>
          <p className="text-lg text-nuanced-600">{subtitle}</p>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="min-w-0 flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%]"
                >
                  <TestimonialCard
                    testimonial={testimonial}
                    className={cn(
                      !prefersReducedMotion && isVisible && 'animate-fade-in-up'
                    )}
                    style={{
                      animationDelay: !prefersReducedMotion ? `${index * 75}ms` : undefined,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Dots Navigation */}
          {scrollSnaps.length > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={cn(
                    'h-2 rounded-full transition-all',
                    index === selectedIndex
                      ? 'w-8 bg-orange-500'
                      : 'w-2 bg-platinum-400 hover:bg-platinum-500'
                  )}
                  aria-label={`Go to testimonial ${index + 1}`}
                  aria-current={index === selectedIndex}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

interface TestimonialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  testimonial: Testimonial
}

function TestimonialCard({ testimonial, className, style, ...props }: TestimonialCardProps) {
  const [isAvatarLoaded, setIsAvatarLoaded] = React.useState(false)
  const [isProductImageLoaded, setIsProductImageLoaded] = React.useState(false)

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-2xl border border-platinum-300 bg-white p-6 shadow-elevation-2 transition-all duration-300',
        'hover:shadow-elevation-3 hover:-translate-y-1',
        className
      )}
      style={style}
      {...props}
    >
      {/* Quote Icon */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-turquoise-100">
        <Quote className="h-6 w-6 text-orange-500" />
      </div>

      {/* Rating */}
      <div className="mb-4">
        <StarRating rating={testimonial.rating} showCount={false} size="md" />
      </div>

      {/* Testimonial Text */}
      <p className="mb-6 flex-1 text-base text-anthracite-500 leading-relaxed">
        "{testimonial.text}"
      </p>

      {/* Product Info (if available) */}
      {testimonial.productName && testimonial.productImage && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-platinum-200 bg-platinum-50 p-3">
          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white">
            <Image
              src={testimonial.productImage}
              alt={testimonial.productName}
              fill
              className={cn(
                'object-cover transition-all duration-300',
                !isProductImageLoaded && 'blur-sm',
                isProductImageLoaded && 'blur-0'
              )}
              sizes="48px"
              onLoad={() => setIsProductImageLoaded(true)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-anthracite-700 truncate">
              {testimonial.productName}
            </p>
          </div>
        </div>
      )}

      {/* Author Info */}
      <div className="flex items-center gap-3 border-t border-platinum-200 pt-4">
        {/* Avatar */}
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-platinum-200">
          {testimonial.avatar ? (
            <Image
              src={testimonial.avatar}
              alt={testimonial.name}
              fill
              className={cn(
                'object-cover transition-all duration-300',
                !isAvatarLoaded && 'blur-sm',
                isAvatarLoaded && 'blur-0'
              )}
              sizes="48px"
              onLoad={() => setIsAvatarLoaded(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-turquoise-200 text-lg font-bold text-anthracite-700">
              {testimonial.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Name and Date */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-anthracite-700 truncate">
              {testimonial.name}
            </p>
            {testimonial.verified && (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success" />
            )}
          </div>
          <p className="text-sm text-nuanced-500">
            {testimonial.verified ? 'Achat vérifié' : 'Avis client'} •{' '}
            {new Date(testimonial.date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>
    </div>
  )
}

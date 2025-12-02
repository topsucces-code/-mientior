'use client'

import * as React from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, TrendingUp, Flame } from 'lucide-react'
import { ProductCard, ProductCardProps } from '@/components/ui/product-card'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useQuickView } from '@/contexts/quick-view-context'
import { useCartStore } from '@/stores/cart.store'
import { toast } from 'sonner'
import { useHeaderSafe } from '@/contexts/header-context'

interface TrendingNowCarouselProps extends React.HTMLAttributes<HTMLElement> {
  products: (Omit<ProductCardProps, 'onQuickView'> & { stock?: number })[]
  title?: string
  subtitle?: string
  autoplayDelay?: number
}

export default function TrendingNowCarousel({
  products,
  title = 'Tendances du Moment',
  subtitle = 'Les produits les plus populaires cette semaine',
  autoplayDelay = 4000,
  className,
  ...props
}: TrendingNowCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    slidesToScroll: 1,
    align: 'start',
    containScroll: 'trimSnaps'
  })
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const [isPaused, setIsPaused] = React.useState(false)
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()
  const addToCart = useCartStore((state) => state.addItem)
  const headerContext = useHeaderSafe()

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  const { openQuickView } = useQuickView()

  const handleAddToCart = (product: Omit<ProductCardProps, 'onQuickView'> & { stock?: number }) => {
     addToCart({
       id: product.id,
       productId: product.id,
       productName: product.name,
       productSlug: product.slug,
       productImage: product.image || '/placeholder-product.jpg',
       price: product.price,
       quantity: 1,
       stock: product.stock || 0,
     })
     
     toast.success("Ajouté au panier !", {
       description: `${product.name} a été ajouté à votre panier.`,
       action: {
         label: "Voir le panier",
         onClick: () => window.location.href = '/cart'
       }
     })
     
     // Open cart preview after adding item
     if (headerContext?.openCart) {
       setTimeout(() => headerContext.openCart(), 300)
     }
  }

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
    if (!emblaApi || prefersReducedMotion || isPaused) return

    const interval = setInterval(() => {
      emblaApi.scrollNext()
    }, autoplayDelay)

    return () => clearInterval(interval)
  }, [emblaApi, autoplayDelay, prefersReducedMotion, isPaused])

  // Global keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle arrow keys when not in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        scrollPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        scrollNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [scrollPrev, scrollNext])

  const handleQuickView = (productId: string) => {
    openQuickView(productId)
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      className={cn('py-10 md:py-14 bg-gradient-to-br from-orange-50/50 via-white to-blue-50/50', className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      {...props}
    >
      <div className="container mx-auto px-3 md:px-4 lg:px-6">
        {/* Header */}
        <div
          className={cn(
            'mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <div className="flex items-center gap-4">
            {/* Trending Icon */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-elevation-2">
              <Flame className="h-8 w-8 text-white animate-pulse" />
              <div className="absolute inset-0 animate-ping rounded-full bg-orange-400 opacity-20" />
            </div>

            {/* Title & Subtitle */}
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 className="font-display text-display-md md:text-display-lg text-anthracite-700">
                  {title}
                </h2>
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
              <p className="text-lg text-nuanced-600">{subtitle}</p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 border-orange-500 transition-all',
                canScrollPrev
                  ? 'bg-white text-orange-500 hover:bg-orange-500 hover:text-white'
                  : 'cursor-not-allowed opacity-30'
              )}
              aria-label="Précédent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border-2 border-orange-500 transition-all',
                canScrollNext
                  ? 'bg-white text-orange-500 hover:bg-orange-500 hover:text-white'
                  : 'cursor-not-allowed opacity-30'
              )}
              aria-label="Suivant"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="min-w-0 flex-[0_0_calc(50%-12px)] sm:flex-[0_0_calc(33.333%-16px)] md:flex-[0_0_calc(25%-18px)] lg:flex-[0_0_calc(20%-19px)] xl:flex-[0_0_calc(16.666%-20px)]"
                >
                  <ProductCard
                    {...product}
                    inStock={product.stock !== undefined ? product.stock > 0 : product.inStock}
                    badge={{ text: '🔥 Trending', variant: 'trending' }}
                    onQuickView={handleQuickView}
                    onAddToCart={() => handleAddToCart(product)}
                    priority={index < 6}
                    className={cn(
                      !prefersReducedMotion && isVisible && 'animate-fade-in-up'
                    )}
                    style={{
                      animationDelay: !prefersReducedMotion ? `${index * 50}ms` : undefined,
                    } as React.CSSProperties}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

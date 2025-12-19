'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import useEmblaCarousel from 'embla-carousel-react'
import { ProductCard, ProductCardProps } from '@/components/ui/product-card'
import { CountdownTimer } from '@/components/ui/countdown-timer'
import { RippleButton } from '@/components/ui/ripple-button'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useQuickView } from '@/contexts/quick-view-context'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { toast } from 'sonner'
import { useHeaderSafe } from '@/contexts/header-context'

interface FlashDealsProps extends React.HTMLAttributes<HTMLElement> {
  products: (Omit<ProductCardProps, 'onQuickView'> & { stock?: number })[]
  title?: string
  subtitle?: string
  endDate: Date | string
  viewAllHref?: string
  onDealsEnd?: () => void
  totalStock?: number
  soldCount?: number
}

export default function FlashDeal({
  products,
  title = 'Ventes Flash',
  subtitle = 'Offres limitées, ne les manquez pas !',
  endDate,
  viewAllHref = '/products?filter=flash',
  onDealsEnd,
  totalStock,
  soldCount,
  className,
  ...props
}: FlashDealsProps) {
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()
  const { openQuickView } = useQuickView()
  const addToCart = useCartStore((state) => state.addItem)
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const headerContext = useHeaderSafe()

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
  
  // Calculate stock percentage if data is provided
  const stockData = React.useMemo(() => {
    if (totalStock && soldCount !== undefined) {
      const remaining = Math.max(0, totalStock - soldCount)
      const soldPercentage = totalStock > 0 ? Math.round((soldCount / totalStock) * 100) : 0
      const remainingPercentage = 100 - soldPercentage
      
      return {
        total: totalStock,
        sold: soldCount,
        remaining,
        soldPercentage,
        remainingPercentage,
      }
    }
    return null
  }, [totalStock, soldCount])
  
  // Embla Carousel Setup
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    skipSnaps: false,
    dragFree: true,
  })
  
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)

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
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

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

  // Keyboard Navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const handleWishlistToggle = (product: Omit<ProductCardProps, 'onQuickView'> & { stock?: number }) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
      toast.success('Retiré des favoris', {
        description: `${product.name} a été retiré de vos favoris.`,
      })
    } else {
      addToWishlist({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        addedAt: new Date().toISOString(),
      })
      toast.success('Ajouté aux favoris', {
        description: `${product.name} a été ajouté à vos favoris.`,
      })
    }
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section
      ref={sectionRef}
      className={cn('py-10 md:py-14 bg-orange-50', className)}
      {...props}
    >
      <div className="container mx-auto px-3 md:px-4 lg:px-6">
        {/* Header */}
        <div
          className={cn(
            'mb-8',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          {/* Title Row */}
          <div className="mb-6 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              {/* Flash Icon */}
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-600 shadow-elevation-2">
                <Zap className="h-8 w-8 fill-white text-white" />
              </div>

              {/* Title & Subtitle */}
              <div>
                <h2 className="mb-1.5 font-display text-display-md md:text-display-lg text-anthracite-700">
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
          <div className="flex items-center gap-4 rounded-lg border border-orange-200 bg-orange-50/50 p-3">
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
        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="min-w-0 flex-[0_0_calc(50%-8px)] sm:flex-[0_0_calc(33.333%-10px)] md:flex-[0_0_calc(25%-12px)] lg:flex-[0_0_calc(20%-12px)] xl:flex-[0_0_calc(16.666%-14px)]"
                >
                  <ProductCard
                    {...product}
                    inStock={product.stock !== undefined ? product.stock > 0 : product.inStock}
                    badge={{ text: 'FLASH', variant: 'flash' }}
                    onQuickView={handleQuickView}
                    onAddToCart={() => handleAddToCart(product)}
                    onWishlistToggle={() => handleWishlistToggle(product)}
                    isInWishlist={isInWishlist(product.id)}
                    priority={index < 6}
                    className={cn(
                      'border-2 border-orange-200',
                      'shadow-[0_0_15px_rgba(255,107,0,0.2)]',
                      'hover:shadow-[0_0_25px_rgba(255,107,0,0.4)]',
                      'animate-border-glow',
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

          {/* Navigation Buttons */}
          {canScrollPrev && (
            <button
              onClick={scrollPrev}
              aria-label="Previous slide"
              className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-elevation-3 transition-all hover:scale-110 hover:shadow-elevation-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-6 w-6 text-anthracite-700" />
            </button>
          )}
          {canScrollNext && (
            <button
              onClick={scrollNext}
              aria-label="Next slide"
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-elevation-3 transition-all hover:scale-110 hover:shadow-elevation-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-6 w-6 text-anthracite-700" />
            </button>
          )}

          {/* Gradient Edges */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-12 bg-orange-50/80" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-orange-50/80" />
        </div>

        {/* Dot Indicators */}
        <div className="mt-6 flex justify-center gap-2">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                'h-2 rounded-full transition-all',
                index === selectedIndex
                  ? 'w-8 bg-orange-500'
                  : 'w-2 bg-platinum-300 hover:bg-platinum-400'
              )}
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
        {stockData && (
          <div
            className={cn(
              'mt-8 rounded-lg border border-platinum-300 bg-white p-4',
              isVisible && !prefersReducedMotion && 'animate-fade-in-up'
            )}
            style={{ animationDelay: '500ms' }}
          >
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium text-anthracite-500">
                Stocks limités
              </span>
              <span className="text-nuanced-600">
                {stockData.remaining > 0 ? 'Dépêchez-vous !' : 'Épuisé'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-platinum-200">
              <div
                className="h-full bg-orange-600 transition-all duration-500"
                style={{ width: `${stockData.remainingPercentage}%` }}
                role="progressbar"
                aria-valuenow={stockData.remaining}
                aria-valuemin={0}
                aria-valuemax={stockData.total}
                aria-label={`${stockData.remaining} articles restants sur ${stockData.total}`}
              />
            </div>
            <p className="mt-3 text-xs text-nuanced-500">
              {stockData.soldPercentage > 0 
                ? `Plus de ${stockData.soldPercentage}% des stocks ont déjà été vendus`
                : 'Stock disponible'
              }
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

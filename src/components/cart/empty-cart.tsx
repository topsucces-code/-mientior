'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import useEmblaCarousel from 'embla-carousel-react'
import { ShoppingCart, ChevronLeft, ChevronRight, Clock, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProductCard } from '@/components/ui/product-card'
import { useQuickView } from '@/contexts/quick-view-context'
import type { Product } from '@/types'
import * as React from 'react'

interface EmptyCartProps {
  isAuthenticated?: boolean
  className?: string
}

export function EmptyCart({ isAuthenticated = false, className }: EmptyCartProps) {
  const { openQuickView } = useQuickView()

  // Fetch recently viewed products
  const { data: recentlyViewed } = useQuery<Product[]>({
    queryKey: ['recently-viewed'],
    queryFn: async () => {
      const response = await fetch('/api/products/recently-viewed')
      if (!response.ok) return []
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  // Fetch suggested products
  const { data: suggestions } = useQuery<Product[]>({
    queryKey: ['empty-cart-suggestions'],
    queryFn: async () => {
      const response = await fetch('/api/products/popular?limit=8')
      if (!response.ok) return []
      return response.json()
    },
    staleTime: 10 * 60 * 1000,
  })

  return (
    <div className={className}>
      <Card className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          {/* Illustration with floating circles */}
          <div className="relative mb-6">
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-orange-100">
              <ShoppingCart className="h-16 w-16 text-orange-500" strokeWidth={1.5} />
            </div>
            {/* Floating decorative circles */}
            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-orange-200 opacity-60 animate-float" style={{ animationDelay: '0s' }} />
            <div className="absolute -bottom-2 -left-2 h-6 w-6 rounded-full bg-amber-200 opacity-60 animate-float" style={{ animationDelay: '0.5s' }} />
            <div className="absolute top-1/2 -right-4 h-4 w-4 rounded-full bg-orange-300 opacity-60 animate-float" style={{ animationDelay: '1s' }} />
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-bold text-anthracite-700 mb-2">
            Votre panier est vide
          </h2>

          {/* Description */}
          <p className="text-nuanced-600 mb-8 max-w-md">
            Découvrez nos produits exceptionnels et commencez votre shopping dès maintenant
          </p>

          {/* Primary CTA */}
          <Button variant="gradient" size="lg" asChild className="mb-4">
            <Link href="/products">
              Découvrir nos produits
            </Link>
          </Button>

          {/* Login prompt for guests */}
          {!isAuthenticated && (
            <div className="mt-8 pt-8 border-t border-platinum-300 w-full">
              <p className="text-sm text-nuanced-600 mb-3">
                Ou connectez-vous pour retrouver vos articles sauvegardés
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/api/auth/signin">
                  Se connecter
                </Link>
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Recently Viewed Products */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <ProductCarousel
          title="Articles récemment vus"
          icon={<Clock className="h-5 w-5 text-anthracite-600" />}
          products={recentlyViewed}
          onQuickView={openQuickView}
          className="mt-12"
        />
      )}

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <ProductCarousel
          title="Suggestions pour vous"
          icon={<Sparkles className="h-5 w-5 text-orange-500" />}
          products={suggestions}
          onQuickView={openQuickView}
          className="mt-12"
        />
      )}
    </div>
  )
}

interface ProductCarouselProps {
  title: string
  icon: React.ReactNode
  products: Product[]
  onQuickView: (productId: string) => void
  className?: string
}

function ProductCarousel({ title, icon, products, onQuickView, className }: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    slidesToScroll: 1,
    align: 'start',
    containScroll: 'trimSnaps'
  })
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)

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

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-semibold text-anthracite-900">{title}</h2>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="h-9 w-9"
            aria-label="Produit précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="h-9 w-9"
            aria-label="Produit suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%]"
            >
              <ProductCard
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                image={product.images[0]?.url || ''}
                images={product.images.map(img => img.url)}
                rating={product.rating}
                reviewCount={product.reviewCount}
                badge={product.badge}
                inStock={product.stock > 0}
                onQuickView={onQuickView}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

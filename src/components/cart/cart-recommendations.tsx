'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import useEmblaCarousel from 'embla-carousel-react'
import { Sparkles, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { ProductCard } from '@/components/ui/product-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useQuickView } from '@/contexts/quick-view-context'
import type { CartItem, Product } from '@/types'

interface CartRecommendationsProps {
  cartItems: CartItem[]
  title?: string
  className?: string
}

export function CartRecommendations({ 
  cartItems, 
  title = 'Vous pourriez aussi aimer', 
  className 
}: CartRecommendationsProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    slidesToScroll: 1,
    align: 'start',
    containScroll: 'trimSnaps'
  })
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)
  const [canScrollNext, setCanScrollNext] = React.useState(false)
  const { openQuickView } = useQuickView()

  // Extract product IDs from cart items
  const itemIds = React.useMemo(() => 
    cartItems.map(item => item.productId),
    [cartItems]
  )

  // Fetch recommendations from API
  const { data: recommendations, isLoading, isError } = useQuery<Product[]>({
    queryKey: ['cart-recommendations', itemIds],
    queryFn: async () => {
      const params = new URLSearchParams({
        itemIds: itemIds.join(','),
        limit: '8'
      })
      const response = await fetch(`/api/cart/recommendations?${params}`)
      if (!response.ok) throw new Error('Failed to fetch recommendations')
      return response.json()
    },
    enabled: itemIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

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

  const handleQuickView = (productId: string) => {
    openQuickView(productId)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('py-8', className)}>
        <div className="flex items-center justify-center gap-2 text-nuanced-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Chargement des recommandations...</span>
        </div>
      </div>
    )
  }

  // Error or empty state
  if (isError || !recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <div className={cn('py-8', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-500" />
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
          {recommendations.map((product) => (
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
                onQuickView={handleQuickView}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

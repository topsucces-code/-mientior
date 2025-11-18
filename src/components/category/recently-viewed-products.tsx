'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PLP_CONFIG } from '@/lib/constants'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { ProductCard } from '@/components/ui/product-card'
import type { Product, RecentlyViewedProduct } from '@/types'

export interface RecentlyViewedProductsProps {
  currentProductId?: string
}

export function RecentlyViewedProducts({ currentProductId }: RecentlyViewedProductsProps) {
  const [recentlyViewed] = useLocalStorage<RecentlyViewedProduct[]>('recently-viewed-products', [])
  const [products, setProducts] = useState<Product[]>([])
  const [scrollPosition, setScrollPosition] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const { ref } = useIntersectionObserver({
    threshold: 0.1,
    onIntersect: () => setIsVisible(true)
  })

  useEffect(() => {
    if (!isVisible || recentlyViewed.length === 0) return

    // Filter out current product and get product IDs
    const productIds = recentlyViewed
      .filter(item => item.productId !== currentProductId)
      .slice(0, PLP_CONFIG.recentlyViewedLimit)
      .map(item => item.productId)

    if (productIds.length === 0) return

    // Fetch products - adjust based on actual API response shape
    fetch(`/api/public/products?ids=${productIds.join(',')}`)
      .then(res => res.json())
      .then(data => {
        // Handle different possible response shapes
        if (Array.isArray(data)) {
          setProducts(data)
        } else if (data.data && Array.isArray(data.data)) {
          setProducts(data.data)
        } else if (data.products && Array.isArray(data.products)) {
          setProducts(data.products)
        } else {
          setProducts([])
        }
      })
      .catch(err => console.error('Failed to fetch recently viewed products:', err))
  }, [isVisible, recentlyViewed, currentProductId])

  const scrollContainer = (direction: 'left' | 'right') => {
    const container = document.getElementById('recently-viewed-carousel')
    if (!container) return

    const scrollAmount = 300
    const newPosition = direction === 'left'
      ? scrollPosition - scrollAmount
      : scrollPosition + scrollAmount

    container.scrollTo({ left: newPosition, behavior: 'smooth' })
    setScrollPosition(newPosition)
  }

  // Don't render if no products
  if (products.length === 0) return null

  return (
    <div ref={ref} className="py-8 border-t border-platinum-300">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold uppercase text-anthracite-700">
          RÉCEMMENT VUS
        </h2>

        {/* Navigation Arrows (Desktop) */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scrollContainer('left')}
            className="w-10 h-10 rounded-full border-2 border-platinum-300 flex items-center justify-center hover:border-orange-500 hover:text-orange-500 transition-colors"
            aria-label="Précédent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => scrollContainer('right')}
            className="w-10 h-10 rounded-full border-2 border-platinum-300 flex items-center justify-center hover:border-orange-500 hover:text-orange-500 transition-colors"
            aria-label="Suivant"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div
        id="recently-viewed-carousel"
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory custom-scrollbar-horizontal pb-4"
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[200px] snap-start transition-transform hover:scale-105"
          >
            <ProductCard
              id={product.id}
              name={product.name}
              slug={product.slug}
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              image={product.images[0]?.url || '/placeholder-product.jpg'}
              rating={product.rating}
              reviewCount={product.reviewCount}
              onSale={product.onSale}
              badge={product.badge}
              compact
            />
          </div>
        ))}
      </div>
    </div>
  )
}

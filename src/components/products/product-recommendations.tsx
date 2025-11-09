'use client'

/**
 * Product recommendations carousel showing related/recommended products
 */

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '@/components/ui/product-card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useToast } from '@/hooks/use-toast'

interface ProductRecommendationsProps {
  products: Product[]
  title?: string
  subtitle?: string
  className?: string
}

export function ProductRecommendations({
  products,
  title = 'Produits recommandés',
  subtitle = 'Découvrez des produits similaires qui pourraient vous plaire',
  className,
}: ProductRecommendationsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const { addItem: addToCart } = useCartStore()
  const { addItem: addToWishlist, hasItem: isInWishlist } = useWishlistStore()
  const { toast } = useToast()

  // Check scroll position to show/hide navigation buttons
  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    checkScroll()
    container.addEventListener('scroll', checkScroll)
    window.addEventListener('resize', checkScroll)

    return () => {
      container.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [products])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = container.clientWidth * 0.8
    const newScrollLeft =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    })
  }

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      productImage: product.images[0]?.url || '',
      price: product.price,
      quantity: 1,
      stock: product.stock,
    })

    toast({
      title: 'Ajouté au panier',
      description: `${product.name} a été ajouté à votre panier`,
    })
  }

  const handleWishlistToggle = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    addToWishlist(productId)
    toast({
      title: 'Ajouté aux favoris',
      description: `${product.name} a été ajouté à vos favoris`,
    })
  }

  if (!products || products.length === 0) {
    return null
  }

  return (
    <section className={cn('w-full py-12', className)}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-anthracite-900 mb-2">{title}</h2>
          {subtitle && <p className="text-nuanced-600">{subtitle}</p>}
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Left Navigation Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full shadow-elevation-3 bg-white',
              'transition-all duration-300',
              canScrollLeft
                ? 'opacity-100 -translate-x-1/2 hover:scale-110'
                : 'opacity-0 pointer-events-none'
            )}
            aria-label="Défiler vers la gauche"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          {/* Products Scroll Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-[280px]"
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  compareAtPrice={product.compareAtPrice}
                  image={product.images[0]?.url}
                  images={product.images.slice(1).map((img) => img.url)}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  badge={
                    product.badge
                      ? {
                          text: product.badge,
                          variant: product.onSale
                            ? 'flash'
                            : product.featured
                            ? 'bestseller'
                            : 'new',
                        }
                      : undefined
                  }
                  inStock={product.stock > 0}
                  freeShipping={product.price >= 25}
                  onAddToCart={() => handleAddToCart(product)}
                  onWishlistToggle={handleWishlistToggle}
                  isInWishlist={isInWishlist(product.id)}
                />
              </div>
            ))}
          </div>

          {/* Right Navigation Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full shadow-elevation-3 bg-white',
              'transition-all duration-300',
              canScrollRight
                ? 'opacity-100 translate-x-1/2 hover:scale-110'
                : 'opacity-0 pointer-events-none'
            )}
            aria-label="Défiler vers la droite"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(products.length / 4) }).map((_, index) => (
            <button
              key={index}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === 0 ? 'w-8 bg-orange-500' : 'w-2 bg-platinum-300 hover:bg-platinum-400'
              )}
              aria-label={`Aller à la page ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}

'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductCard, ProductCardProps } from '@/components/ui/product-card'
import { RippleButton } from '@/components/ui/ripple-button'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useCartStore } from '@/stores/cart.store'
import { useWishlistStore } from '@/stores/wishlist.store'
import { useToast } from '@/hooks/use-toast'
import { toast as sonnerToast } from 'sonner'

interface FeaturedProductsProps {
  products: (Omit<ProductCardProps, 'onQuickView'> & { stock?: number })[]
  title?: string
  subtitle?: string
  viewAllHref?: string
  className?: string
}

export default function FeaturedProducts({
  products,
  title = 'Featured Products',
  subtitle = 'Discover our handpicked selection of premium products',
  viewAllHref = '/products',
  className,
}: FeaturedProductsProps) {
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()
  const addToCart = useCartStore((state) => state.addItem)
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore()
  const { toast } = useToast()

  // TODO: Implement quick view modal
  const handleQuickView = (productId: string) => {
    console.log('Quick view:', productId)
    // This would open a modal with product details
  }

  const handleAddToCart = (product: any) => {
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
     toast({
       title: "Ajouté au panier",
       description: `${product.name} a été ajouté à votre panier.`,
     })
  }

  const handleWishlistToggle = (product: any) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
      sonnerToast.success('Retiré des favoris', {
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
      sonnerToast.success('Ajouté aux favoris', {
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
      className={cn(
        'py-16 md:py-24',
        className
      )}
    >
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div
          className={cn(
            'mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <div className="max-w-2xl">
            <h2 className="mb-3 font-display text-display-md md:text-display-lg text-anthracite-700">
              {title}
            </h2>
            <p className="text-lg text-nuanced-600">
              {subtitle}
            </p>
          </div>

          <Link href={viewAllHref}>
            <RippleButton variant="outline" className="group flex items-center gap-2">
              View All Products
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </RippleButton>
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              {...product}
              inStock={product.stock !== undefined ? product.stock > 0 : product.inStock}
              onQuickView={handleQuickView}
              onAddToCart={() => handleAddToCart(product)}
              onWishlistToggle={() => handleWishlistToggle(product)}
              isInWishlist={isInWishlist(product.id)}
              className={cn(
                !prefersReducedMotion && isVisible && 'animate-fade-in-up',
              )}
              style={{
                animationDelay: !prefersReducedMotion ? `${index * 50}ms` : undefined,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Empty State (if no products but section is shown) */}
        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 h-24 w-24 rounded-full bg-platinum-200" />
            <h3 className="mb-2 text-xl font-semibold text-anthracite-700">
              No products yet
            </h3>
            <p className="text-nuanced-600">
              Check back soon for our curated selection
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

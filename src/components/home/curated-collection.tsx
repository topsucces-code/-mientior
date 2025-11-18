'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Sparkles } from 'lucide-react'
import { ProductCard, ProductCardProps } from '@/components/ui/product-card'
import { RippleButton } from '@/components/ui/ripple-button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { useQuickView } from '@/contexts/quick-view-context'

export interface CollectionData {
  id: string
  name: string
  slug: string
  description: string
  image?: string
  theme?: {
    primaryColor: string
    secondaryColor: string
    textColor?: 'light' | 'dark'
  }
  badge?: {
    text: string
    variant?: 'new' | 'bestseller' | 'trending'
  }
  products: Omit<ProductCardProps, 'onQuickView'>[]
}

interface CuratedCollectionProps extends React.HTMLAttributes<HTMLElement> {
  collection: CollectionData
  layout?: 'standard' | 'hero' | 'compact'
  showAllProducts?: boolean
  maxProducts?: number
}

export default function CuratedCollection({
  collection,
  layout = 'standard',
  showAllProducts = false,
  maxProducts = 4,
  className,
  ...props
}: CuratedCollectionProps) {
  const { ref: sectionRef, isIntersecting: isVisible } = useIntersectionObserver({ threshold: 0.1 })
  const prefersReducedMotion = useReducedMotion()
  const { openQuickView } = useQuickView()

  const displayProducts = showAllProducts
    ? collection.products
    : collection.products.slice(0, maxProducts)

  const handleQuickView = (productId: string) => {
    openQuickView(productId)
  }

  if (!collection || !collection.products || collection.products.length === 0) {
    return null
  }

  if (layout === 'hero') {
    return (
      <HeroLayout
        collection={collection}
        displayProducts={displayProducts}
        isVisible={isVisible}
        prefersReducedMotion={prefersReducedMotion}
        onQuickView={handleQuickView}
        className={className}
        {...props}
      />
    )
  }

  return (
    <section
      ref={sectionRef}
      className={cn('py-10 md:py-14', className)}
      {...props}
    >
      <div className="container mx-auto px-3 md:px-4 lg:px-6">
        {/* Header */}
        <div
          className={cn(
            'mb-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              {collection.badge && (
                <Badge variant={collection.badge.variant || 'new'} size="lg">
                  <Sparkles className="h-3.5 w-3.5" />
                  {collection.badge.text}
                </Badge>
              )}
            </div>
            <h2 className="mb-3 font-display text-display-md md:text-display-lg text-anthracite-700">
              {collection.name}
            </h2>
            <p className="text-lg text-nuanced-600">
              {collection.description}
            </p>
          </div>

          <Link href={`/collections/${collection.slug}`}>
            <RippleButton variant="outline" className="group flex items-center gap-2">
              Voir la collection
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </RippleButton>
          </Link>
        </div>

        {/* Products Grid - Asymmetric Masonry Layout */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayProducts.slice(0, 1).map((product, index) => (
            // Hero product - larger card
            <div key={product.id} className="sm:col-span-2 lg:row-span-2">
              <ProductCard
                {...product}
                onQuickView={handleQuickView}
                className={cn(
                  'h-full',
                  !prefersReducedMotion && isVisible && 'animate-fade-in-up'
                )}
                style={{
                  animationDelay: !prefersReducedMotion ? `${index * 50}ms` : undefined,
                } as React.CSSProperties}
              />
            </div>
          ))}
          {displayProducts.slice(1).map((product, index) => (
            <ProductCard
              key={product.id}
              {...product}
              onQuickView={handleQuickView}
              className={cn(
                !prefersReducedMotion && isVisible && 'animate-fade-in-up'
              )}
              style={{
                animationDelay: !prefersReducedMotion ? `${(index + 1) * 50}ms` : undefined,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// Hero Layout with featured image
interface HeroLayoutProps {
  collection: CollectionData
  displayProducts: Omit<ProductCardProps, 'onQuickView'>[]
  isVisible: boolean
  prefersReducedMotion: boolean
  onQuickView: (id: string) => void
  className?: string
}

function HeroLayout({
  collection,
  displayProducts,
  isVisible,
  prefersReducedMotion,
  onQuickView,
  className,
  ...props
}: HeroLayoutProps) {
  const [isImageLoaded, setIsImageLoaded] = React.useState(false)
  const theme = collection.theme || {
    primaryColor: '#F97316',
    secondaryColor: '#3B82F6',
    textColor: 'dark' as const,
  }
  const isDark = theme.textColor === 'light'

  return (
    <section className={cn('py-10 md:py-14', className)} {...props}>
      <div className="container mx-auto px-3 md:px-4 lg:px-6">
        {/* Hero Banner */}
        <div
          className={cn(
            'relative mb-8 overflow-hidden rounded-2xl',
            isVisible && !prefersReducedMotion && 'animate-fade-in-up'
          )}
        >
          <div className="relative h-[400px] md:h-[500px]">
            {/* Background Image */}
            <Image
              src={collection.image || '/placeholder-collection.svg'}
              alt={collection.name}
              fill
              unoptimized={!collection.image} // SVG placeholder needs unoptimized
              className={cn(
                'object-cover transition-all duration-700',
                !isImageLoaded && 'blur-sm',
                isImageLoaded && 'blur-0'
              )}
              sizes="100vw"
              priority
              onLoad={() => setIsImageLoaded(true)}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />

            {/* Fallback Gradient */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor})`,
              }}
            />

            {/* Overlay */}
            <div
              className={cn(
                'absolute inset-0',
                isDark
                  ? 'bg-gradient-to-r from-black/70 via-black/50 to-transparent'
                  : 'bg-gradient-to-r from-white/70 via-white/50 to-transparent'
              )}
            />

            {/* Content */}
            <div className="relative flex h-full items-center">
              <div className="max-w-2xl px-8 md:px-12">
                {collection.badge && (
                  <Badge
                    variant={collection.badge.variant || 'new'}
                    size="lg"
                    className="mb-4"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    {collection.badge.text}
                  </Badge>
                )}

                <h2
                  className={cn(
                    'mb-4 font-display text-display-lg md:text-display-xl',
                    isDark ? 'text-white' : 'text-anthracite-700'
                  )}
                >
                  {collection.name}
                </h2>

                <p
                  className={cn(
                    'mb-8 text-lg md:text-xl',
                    isDark ? 'text-platinum-100' : 'text-nuanced-600'
                  )}
                >
                  {collection.description}
                </p>

                <Link href={`/collections/${collection.slug}`}>
                  <RippleButton
                    variant="gradient"
                    size="lg"
                    className="group flex items-center gap-2"
                  >
                    Découvrir maintenant
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </RippleButton>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              {...product}
              onQuickView={onQuickView}
              className={cn(
                !prefersReducedMotion && isVisible && 'animate-fade-in-up'
              )}
              style={{
                animationDelay: !prefersReducedMotion ? `${index * 50}ms` : undefined,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* View All Link */}
        {displayProducts.length < collection.products.length && (
          <div
            className={cn(
              'mt-8 text-center',
              isVisible && !prefersReducedMotion && 'animate-fade-in-up'
            )}
            style={{ animationDelay: '400ms' }}
          >
            <Link
              href={`/collections/${collection.slug}`}
              className="inline-flex items-center gap-2 text-orange-500 transition-colors hover:text-orange-600 font-medium"
            >
              Voir tous les produits ({collection.products.length})
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

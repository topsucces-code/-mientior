'use client'

import * as React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProductCard, type ProductCardProps } from '@/components/ui/product-card'

interface Category {
  id: string
  name: string
  slug: string
  image?: string
  icon?: string
  productCount?: number
  badge?: 'new' | 'hot' | null
}

const defaultCategories: Category[] = [
  { id: 'all', name: 'Recommandé', slug: 'all', productCount: 0, badge: null },
  { id: '1', name: 'Électronique & Tech', slug: 'electronique', productCount: 1250, badge: 'hot' },
  { id: '2', name: 'Mode Femme', slug: 'mode-femme', productCount: 3420 },
  { id: '3', name: 'Mode Homme', slug: 'mode-homme', productCount: 2180 },
  { id: '4', name: 'Maison & Cuisine', slug: 'maison', productCount: 1890 },
  { id: '5', name: 'Beauté & Santé', slug: 'beaute', productCount: 2340 },
  { id: '6', name: 'Sport & Loisirs', slug: 'sports', productCount: 760 },
  { id: '7', name: 'Bébés & Maternité', slug: 'bebe', productCount: 890 },
  { id: '8', name: 'Automobile', slug: 'auto', productCount: 450 },
  { id: '9', name: 'Jardin & Bricolage', slug: 'jardin', productCount: 670 },
]

interface CategoriesGridEnhancedProps {
  categories?: Category[]
  products?: ProductCardProps[]
}


export default function CategoriesGridEnhanced({
  categories = defaultCategories,
  products = [],
}: CategoriesGridEnhancedProps) {
  const [activeCategory, setActiveCategory] = React.useState('all')
  const t = useTranslations('categories')

  // Only use provided products - no fallback mock data
  const sourceProducts = products

  // Initialize displayProducts with first 12 products for SSR
  const [displayProducts, setDisplayProducts] = React.useState<ProductCardProps[]>(
    sourceProducts.slice(0, 12)
  )
  const [isChanging, setIsChanging] = React.useState(false)

  // Simulation of filtering - in a real app this would fetch or filter real data
  React.useEffect(() => {
    setIsChanging(true)
    const timeout = setTimeout(() => {
      // Shuffle products slightly to simulate different content per category
      // In production this would filter by categoryId
      const shuffled = [...sourceProducts].sort(() => Math.random() - 0.5)
      setDisplayProducts(shuffled.slice(0, 12)) // Limit to 12 items
      setIsChanging(false)
    }, 200)

    return () => clearTimeout(timeout)
  }, [activeCategory, sourceProducts])

  const displayTitle = t('exploreInterests')

  // Don't render section if no products available
  if (sourceProducts.length === 0) {
    return null
  }

  return (
    <section
      className="relative py-4 sm:py-6 bg-white overflow-hidden"
    >
      <div className="container mx-auto px-2 sm:px-3 lg:px-4">
        {/* Header - Temu Style */}
        <div className="mb-4 text-center">
           <h2 className="text-xl sm:text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">
            {displayTitle}
          </h2>
          
          {/* Scrollable Tabs */}
          <div className="relative">
            <div className="flex overflow-x-auto pb-3 gap-2 sm:gap-2 no-scrollbar items-center justify-start md:justify-center px-2 snap-x">
              {categories.map((category) => {
                const isActive = activeCategory === category.id
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={cn(
                      "flex-shrink-0 px-3 py-1.5 rounded-md text-sm font-bold transition-all duration-300 snap-center border",
                      isActive 
                        ? "bg-black text-white border-black shadow-md scale-105" 
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                    )}
                  >
                    {t(category.id)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className={cn(
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3",
          "transition-opacity duration-200",
          isChanging ? "opacity-30" : "opacity-100"
        )}>
          {displayProducts.map((product, index) => (
            <ProductCard
              key={`${product.id}-${activeCategory}-${index}`}
              {...product}
              className="h-full border-gray-100 hover:border-orange-500 hover:shadow-lg transition-all"
            />
          ))}
        </div>

        {/* See More Button */}
        <div className="mt-5 text-center">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-5 py-2 bg-white border border-gray-300 hover:border-black text-gray-900 font-bold rounded-md transition-all hover:bg-gray-50 hover:shadow-md"
            >
              {t('seeMore')}
              <ArrowRight className="h-4 w-4" />
            </Link>
        </div>
      </div>
    </section>
  )
}

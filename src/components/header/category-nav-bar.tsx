'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'
import { HEADER_CONFIG } from '@/lib/constants'

interface Category {
    id: string
    name: string
    slug: string
    icon?: string
}

interface CategoryNavBarProps {
    categories?: Category[]
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: '1', name: 'Électronique', slug: 'electronique', icon: '💻' },
    { id: '2', name: 'Mode', slug: 'mode', icon: '👔' },
    { id: '3', name: 'Maison & Jardin', slug: 'maison', icon: '🏠' },
    { id: '4', name: 'Sports & Loisirs', slug: 'sports', icon: '⚽' },
    { id: '5', name: 'Beauté & Santé', slug: 'beaute', icon: '💄' },
    { id: '6', name: 'Livres & Médias', slug: 'livres', icon: '📚' },
    { id: '7', name: 'Jouets & Enfants', slug: 'jouets', icon: '🧸' },
    { id: '8', name: 'Électroménager', slug: 'electromenager', icon: '🍳' },
]

export function CategoryNavBar({ categories = DEFAULT_CATEGORIES }: CategoryNavBarProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)
    const [activeCategory, setActiveCategory] = useState<string | null>(null)

    const checkScrollability = () => {
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

        checkScrollability()
        container.addEventListener('scroll', checkScrollability)
        window.addEventListener('resize', checkScrollability)

        return () => {
            container.removeEventListener('scroll', checkScrollability)
            window.removeEventListener('resize', checkScrollability)
        }
    }, [])

    const scroll = (direction: 'left' | 'right') => {
        const container = scrollContainerRef.current
        if (!container) return

        const scrollAmount = 300
        const targetScroll =
            direction === 'left'
                ? container.scrollLeft - scrollAmount
                : container.scrollLeft + scrollAmount

        container.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
        })
    }

    return (
        <div
            className="bg-white border-b border-gray-200 z-40 transition-all duration-300"
            style={{
                height: HEADER_CONFIG.heights.categoryNavBar
            }}
        >
            <div className="container mx-auto px-4 h-full relative">
                <div className="flex items-center h-full">
                    {/* Left scroll button */}
                    {canScrollLeft && (
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-0 z-10 bg-white/90 backdrop-blur-sm shadow-md p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Défiler vers la gauche"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}

                    {/* Categories scroll container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth flex-1"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {categories.map((category) => (
                            <Link
                                key={category.id}
                                href={`/categories/${category.slug}`}
                                onClick={() => setActiveCategory(category.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${activeCategory === category.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                            >
                                {category.icon && <span className="text-lg">{category.icon}</span>}
                                <span className="font-medium text-sm">{category.name}</span>
                            </Link>
                        ))}
                    </div>

                    {/* Right scroll button */}
                    {canScrollRight && (
                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-0 z-10 bg-white/90 backdrop-blur-sm shadow-md p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="Défiler vers la droite"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Hide scrollbar CSS */}
            <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </div>
    )
}

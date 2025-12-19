'use client'

import { ChevronLeft, ChevronRight, MoreHorizontal, Flame } from 'lucide-react'
import Link from 'next/link'
import { useRef, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { HEADER_CONFIG } from '@/lib/constants'
import { useHeader } from '@/contexts/header-context'

interface Category {
    id: string
    name: string
    slug: string
    icon?: string
    isHot?: boolean
}

interface CategoryNavBarProps {
    categories?: Category[]
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: 'new', name: 'Nouveautés', slug: 'nouveautes', icon: '✨', isHot: true },
    { id: 'clothing', name: 'Vêtements', slug: 'vetements', icon: '👔' },
    { id: 'shoes', name: 'Chaussures', slug: 'chaussures', icon: '👟' },
    { id: 'accessories', name: 'Accessoires', slug: 'accessoires', icon: '👜' },
    { id: 'brands', name: 'Marques', slug: 'marques', icon: '🏷️' },
    { id: 'sale', name: 'Soldes', slug: 'soldes', icon: '🔥', isHot: true },
]

export function CategoryNavBar({ categories = DEFAULT_CATEGORIES }: CategoryNavBarProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const [activeCategory, setActiveCategory] = useState<string | null>('new')
    const [showMoreDropdown, setShowMoreDropdown] = useState(false)
    const { isCompact } = useHeader()
    const t = useTranslations('categories')

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
            className={`
                hidden md:block
                bg-white border-b border-gray-200/60 
                relative z-[1] transition-all duration-300 ease-smooth
                ${isCompact ? 'shadow-[0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-sm bg-white/[0.98]' : ''}
            `}
            style={{
                height: HEADER_CONFIG.heights.categoryNavBar
            }}
        >
            <div className="container mx-auto px-[2%] lg:px-[4%] h-full relative">
                <div className="flex items-center h-full gap-1 lg:gap-2">
                    {/* Left scroll button */}
                    {canScrollLeft && (
                        <button
                            onClick={() => scroll('left')}
                            className="
                                absolute left-2 z-10 
                                bg-white/95 backdrop-blur-sm 
                                shadow-md p-2 rounded-full 
                                hover:bg-gray-50 transition-all duration-200
                                border border-gray-100
                            "
                            aria-label={t('scrollLeft')}
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                    )}

                    {/* Categories scroll container */}
                    <div
                        ref={scrollContainerRef}
                        className="flex items-center gap-2 overflow-x-auto hide-scrollbar scroll-smooth flex-1 px-1"
                    >
                        {categories.map((category) => {
                            const isActive = activeCategory === category.id
                            return (
                                <Link
                                    key={category.id}
                                    href={`/categories/${category.slug}`}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`
                                        relative flex items-center gap-1.5 lg:gap-2 
                                        px-3 lg:px-5 py-2 lg:py-3 rounded-lg whitespace-nowrap
                                        transition-all duration-200 ease-smooth
                                        ${isActive
                                            ? 'bg-turquoise-600/[0.08] text-turquoise-600 font-semibold'
                                            : 'hover:bg-turquoise-600/[0.06] text-gray-700'
                                        }
                                    `}
                                >
                                    {/* Active indicator bar */}
                                    {isActive && (
                                        <span className="
                                            absolute bottom-0 left-0 right-0 h-[3px]
                                            bg-turquoise-700
                                            rounded-t-full
                                        " />
                                    )}
                                    
                                    {category.icon && (
                                        <span className="text-base lg:text-lg">{category.icon}</span>
                                    )}
                                    
                                    <span className={`
                                        text-xs lg:text-sm font-semibold uppercase tracking-[0.05em]
                                        ${category.isHot 
                                            ? 'text-orange-600 animate-pulse' 
                                            : ''
                                        }
                                    `}>
                                        {t(category.id)}
                                    </span>
                                    
                                    {category.isHot && (
                                        <Flame className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-orange-500 animate-pulse" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Right scroll button */}
                    {canScrollRight && (
                        <button
                            onClick={() => scroll('right')}
                            className="
                                absolute right-14 z-10 
                                bg-white/95 backdrop-blur-sm 
                                shadow-md p-2 rounded-full 
                                hover:bg-gray-50 transition-all duration-200
                                border border-gray-100
                            "
                            aria-label={t('scrollRight')}
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    )}

                    {/* More button */}
                    <div className="relative ml-auto">
                        <button
                            onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                            className="
                                flex items-center gap-1.5 px-4 py-3
                                bg-turquoise-600/[0.04] rounded-lg
                                text-gray-600 hover:text-turquoise-600
                                transition-all duration-200
                            "
                        >
                            <MoreHorizontal className="w-5 h-5" />
                            <span className="text-sm font-medium hidden lg:inline">{t('more')}</span>
                        </button>

                        {/* More dropdown */}
                        {showMoreDropdown && (
                            <div className="
                                absolute right-0 top-[calc(100%+8px)]
                                w-[280px] bg-white rounded-xl
                                shadow-[0_12px_48px_rgba(0,0,0,0.12)]
                                p-3 z-[50] animate-slide-down
                            ">
                                <div className="space-y-1">
                                    {DEFAULT_CATEGORIES.map((cat) => (
                                        <Link
                                            key={cat.id}
                                            href={`/categories/${cat.slug}`}
                                            className="
                                                flex items-center gap-3 px-3 py-2.5 rounded-lg
                                                hover:bg-turquoise-50 transition-colors
                                            "
                                            onClick={() => setShowMoreDropdown(false)}
                                        >
                                            <span className="text-lg">{cat.icon}</span>
                                            <span className="text-sm font-medium text-gray-700">{t(cat.id)}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

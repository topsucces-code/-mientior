'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useHeader } from '@/contexts/header-context'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { MegaMenuColumn } from '@/types'

interface MegaMenuProps {
    categories: MegaMenuColumn[]
}

export function MegaMenu({ categories }: MegaMenuProps) {
    const { activeDropdown, setActiveDropdown } = useHeader()
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
    const t = useTranslations('header')
    const dropdownRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    const isOpen = activeDropdown === 'megamenu'

    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node
            const isOutsideTrigger = triggerRef.current && !triggerRef.current.contains(target)
            const isOutsideMenu = menuRef.current && !menuRef.current.contains(target)
            
            if (isOutsideTrigger && isOutsideMenu) {
                setActiveDropdown(null)
                setHoveredCategory(null)
            }
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                setActiveDropdown(null)
                setHoveredCategory(null)
                triggerRef.current?.focus()
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            document.addEventListener('keydown', handleEscape)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isOpen, setActiveDropdown])

    const activeCategoryData = hoveredCategory
        ? categories.find(cat => cat.id === hoveredCategory)
        : categories[0]

    // Use a timeout to allow mouse to move to dropdown
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnterTrigger = () => {
        // Clear any pending close timeout
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = null
        }
        setActiveDropdown('megamenu')
    }

    const handleMouseLeaveTrigger = () => {
        // Delay closing to allow mouse to move to dropdown
        closeTimeoutRef.current = setTimeout(() => {
            setActiveDropdown(null)
            setHoveredCategory(null)
        }, 150)
    }

    const handleMouseEnterDropdown = () => {
        // Clear close timeout when entering dropdown
        if (closeTimeoutRef.current) {
            clearTimeout(closeTimeoutRef.current)
            closeTimeoutRef.current = null
        }
    }

    const handleMouseLeaveDropdown = () => {
        // Close immediately when leaving dropdown
        setActiveDropdown(null)
        setHoveredCategory(null)
    }

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (closeTimeoutRef.current) {
                clearTimeout(closeTimeoutRef.current)
            }
        }
    }, [])

    return (
        <div 
            className="relative" 
            ref={dropdownRef}
        >
            {/* Categories Button */}
            <button
                ref={triggerRef}
                onClick={() => setActiveDropdown(isOpen ? null : 'megamenu')}
                onMouseEnter={handleMouseEnterTrigger}
                onMouseLeave={handleMouseLeaveTrigger}
                className={`
                    flex items-center gap-2.5 h-12 px-5
                    bg-gradient-to-r from-turquoise-600 to-turquoise-500
                    rounded-lg text-white text-sm font-semibold
                    cursor-pointer transition-all duration-250 ease-smooth
                    shadow-[0_2px_8px_rgba(8,145,178,0.2)]
                    hover:from-turquoise-500 hover:to-turquoise-600
                    hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(8,145,178,0.3)]
                `}
                aria-label={`${t('categories')} - ${t('menu')}`}
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-controls="megamenu-dropdown"
            >
                {/* Animated Hamburger Icon */}
                <div className="flex flex-col gap-1">
                    <span className={`block w-[18px] h-0.5 bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
                    <span className={`block w-[18px] h-0.5 bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`} />
                    <span className={`block w-[18px] h-0.5 bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
                </div>
                <span>{t('categories')}</span>
            </button>

            {isOpen && (
                <div
                    ref={menuRef}
                    id="megamenu-dropdown"
                    role="menu"
                    aria-label={t('allCategories')}
                    onMouseEnter={handleMouseEnterDropdown}
                    onMouseLeave={handleMouseLeaveDropdown}
                    className="
                        fixed left-1/2 -translate-x-1/2 top-[116px]
                        w-[95vw] max-w-[1200px] bg-white rounded-xl 
                        shadow-[0_12px_48px_rgba(0,0,0,0.15)] 
                        z-[9999]
                    "
                    style={{ animation: 'fadeIn 150ms ease-out' }}
                >
                    {/* Top accent bar */}
                    <div className="h-1 bg-gradient-to-r from-turquoise-600 via-orange-500 to-turquoise-500" />
                    
                    <div className="flex max-h-[70vh] overflow-hidden">
                        {/* Column 1: Categories List (20%) */}
                        <nav
                            className="w-64 bg-gray-50 border-r border-gray-100 overflow-y-auto"
                            aria-label={t('allCategories')}
                        >
                            <div className="p-4">
                                <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 mb-4">
                                    {t('allCategories')}
                                </h3>
                                <ul className="space-y-1" role="menubar" aria-orientation="vertical">
                                    {categories.map((category, index) => {
                                        const isActive = hoveredCategory === category.id || (!hoveredCategory && category === categories[0])
                                        return (
                                            <li key={category.id} role="none" className="mega-menu-item">
                                                <button
                                                    role="menuitem"
                                                    tabIndex={isOpen ? 0 : -1}
                                                    onMouseEnter={() => setHoveredCategory(category.id)}
                                                    onFocus={() => setHoveredCategory(category.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'ArrowDown' && index < categories.length - 1) {
                                                            e.preventDefault()
                                                            const nextButton = e.currentTarget.parentElement?.nextElementSibling?.querySelector('button')
                                                                ; (nextButton as HTMLButtonElement)?.focus()
                                                        } else if (e.key === 'ArrowUp' && index > 0) {
                                                            e.preventDefault()
                                                            const prevButton = e.currentTarget.parentElement?.previousElementSibling?.querySelector('button')
                                                                ; (prevButton as HTMLButtonElement)?.focus()
                                                        }
                                                    }}
                                                    className={`
                                                        w-full flex items-center justify-between 
                                                        px-3 py-3 rounded-lg
                                                        transition-all duration-200 ease-smooth
                                                        ${isActive
                                                            ? 'bg-turquoise-600/10 border-l-4 border-turquoise-600 pl-2 text-turquoise-600 font-semibold'
                                                            : 'hover:bg-gradient-to-r hover:from-turquoise-600/[0.08] hover:to-transparent hover:pl-4'
                                                        }
                                                    `}
                                                    aria-current={isActive ? 'true' : undefined}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xl" aria-hidden="true">{category.icon}</span>
                                                        <span className="text-sm">{category.title}</span>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-turquoise-600' : 'text-gray-400'}`} aria-hidden="true" />
                                                </button>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        </nav>

                        {/* Column 2: Subcategories (30%) */}
                        <div className="w-80 p-6 border-r border-gray-100">
                            {activeCategoryData && (
                                <>
                                    {activeCategoryData.subcategories?.map((subcat) => (
                                        <div key={subcat.id} className="mb-6 last:mb-0">
                                            <h4 className="text-[13px] font-bold uppercase tracking-[0.1em] text-turquoise-600 mb-3">
                                                {subcat.title}
                                            </h4>
                                            {subcat.items && subcat.items.length > 0 && (
                                                <ul className="space-y-2">
                                                    {subcat.items.map((item) => (
                                                        <li key={item.id}>
                                                            <Link
                                                                href={item.link}
                                                                className="
                                                                    text-sm text-gray-600 
                                                                    hover:text-turquoise-600 hover:pl-1
                                                                    hover:underline hover:underline-offset-4
                                                                    transition-all duration-200
                                                                    flex items-center gap-2 pl-4
                                                                    relative before:content-['•'] before:absolute before:left-0 before:text-turquoise-500 before:font-bold
                                                                "
                                                            >
                                                                {item.title}
                                                                {item.badge && (
                                                                    <span className={`
                                                                        text-[10px] px-2 py-0.5 rounded-full font-semibold
                                                                        ${item.badge === 'Nouveau' ? 'bg-turquoise-100 text-turquoise-700' : 'bg-orange-100 text-orange-700'}
                                                                    `}>
                                                                        {item.badge}
                                                                    </span>
                                                                )}
                                                            </Link>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                            <Link
                                                href={subcat.link}
                                                className="
                                                    inline-flex items-center gap-1.5 mt-3
                                                    text-[13px] font-semibold text-orange-500
                                                    hover:gap-2.5 transition-all duration-200
                                                "
                                            >
                                                {t('viewAll')}
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>

                        {/* Column 3: Editorial Content (50%) */}
                        <div className="flex-1 p-6 bg-gradient-to-br from-turquoise-50 to-[#F0FDFF]">
                            {activeCategoryData && (
                                <>
                                    <div className="mb-6">
                                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                                            <span className="text-3xl">{activeCategoryData.icon}</span>
                                            {activeCategoryData.title}
                                        </h2>
                                        {activeCategoryData.description && (
                                            <p className="text-sm text-gray-600 mt-2">{activeCategoryData.description}</p>
                                        )}
                                    </div>

                                    {/* Featured Card */}
                                    {activeCategoryData.image && (
                                        <Link 
                                            href={activeCategoryData.link} 
                                            className="
                                                block relative rounded-xl overflow-hidden
                                                shadow-[0_4px_12px_rgba(0,0,0,0.08)]
                                                hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)]
                                                transition-all duration-300 group
                                            "
                                        >
                                            <Image
                                                src={activeCategoryData.image}
                                                alt={activeCategoryData.title}
                                                width={800}
                                                height={200}
                                                className="w-full h-48 object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-end p-6">
                                                <div className="text-white">
                                                    <p className="font-bold text-lg mb-1">{t('viewAll')} {activeCategoryData.title}</p>
                                                    <p className="text-sm opacity-90">{t('viewAll')} →</p>
                                                </div>
                                            </div>
                                            {/* CTA Button */}
                                            <button className="
                                                absolute bottom-5 right-5
                                                px-6 py-3 rounded-lg
                                                bg-orange-500 text-white font-semibold
                                                shadow-[0_4px_12px_rgba(249,115,22,0.3)]
                                                hover:bg-orange-600 hover:scale-105
                                                transition-all duration-250
                                            ">
                                                {t('viewAll')}
                                            </button>
                                        </Link>
                                    )}

                                    {/* Featured Products Grid */}
                                    <div className="grid grid-cols-4 gap-4 mt-6">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div 
                                                key={i}
                                                className="
                                                    bg-white rounded-lg p-3 text-center
                                                    hover:scale-105 hover:shadow-[0_4px_12px_rgba(8,145,178,0.15)]
                                                    transition-all duration-250 cursor-pointer
                                                "
                                            >
                                                <div className="w-full h-16 bg-gray-100 rounded-lg mb-2" />
                                                <p className="text-sm font-bold text-orange-500">À partir de 9 990 F</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

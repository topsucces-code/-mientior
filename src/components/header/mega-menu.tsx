'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useHeader } from '@/contexts/header-context'
import { useEffect, useRef, useState } from 'react'
import type { MegaMenuColumn } from '@/types'

interface MegaMenuProps {
    categories: MegaMenuColumn[]
}

export function MegaMenu({ categories }: MegaMenuProps) {
    const { activeDropdown, setActiveDropdown } = useHeader()
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLButtonElement>(null)

    const isOpen = activeDropdown === 'megamenu'

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                ref={triggerRef}
                onClick={() => setActiveDropdown(isOpen ? null : 'megamenu')}
                onMouseEnter={() => setActiveDropdown('megamenu')}
                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                aria-label="Catégories - Ouvrir le menu"
                aria-expanded={isOpen}
                aria-haspopup="menu"
                aria-controls="megamenu-dropdown"
            >
                <span className="text-2xl" aria-hidden="true">☰</span>
                <span>Catégories</span>
            </button>

            {isOpen && (
                <div
                    id="megamenu-dropdown"
                    role="menu"
                    aria-label="Menu des catégories"
                    className="absolute left-0 top-full mt-2 w-screen max-w-6xl bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-slide-down"
                >
                    <div className="flex">
                        {/* Left sidebar - Category list */}
                        <nav
                            className="w-64 bg-gray-50 border-r border-gray-200 rounded-l-lg"
                            aria-label="Liste des catégories principales"
                        >
                            <div className="p-4">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                                    Toutes les catégories
                                </h3>
                                <ul className="space-y-1" role="menubar" aria-orientation="vertical">
                                    {categories.map((category, index) => (
                                        <li key={category.id} role="none">
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
                                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md transition-colors ${hoveredCategory === category.id || (!hoveredCategory && category === categories[0])
                                                    ? 'bg-white text-blue-600 shadow-sm'
                                                    : 'hover:bg-white/50'
                                                    }`}
                                                aria-current={hoveredCategory === category.id || (!hoveredCategory && category === categories[0]) ? 'true' : undefined}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xl" aria-hidden="true">{category.icon}</span>
                                                    <span className="font-medium text-sm">{category.title}</span>
                                                </div>
                                                <ChevronRight className="w-4 h-4" aria-hidden="true" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </nav>

                        {/* Right content - Subcategories in 3 columns */}
                        <div className="flex-1 p-6">
                            {activeCategoryData && (
                                <>
                                    <div className="mb-6">
                                        <h2 className="text-xl font-bold flex items-center gap-3">
                                            <span className="text-3xl">{activeCategoryData.icon}</span>
                                            {activeCategoryData.title}
                                        </h2>
                                        {activeCategoryData.description && (
                                            <p className="text-sm text-gray-600 mt-2">{activeCategoryData.description}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-8">
                                        {activeCategoryData.subcategories?.map((subcat) => (
                                            <div key={subcat.id}>
                                                <Link
                                                    href={subcat.link}
                                                    className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors block mb-3"
                                                >
                                                    {subcat.title}
                                                </Link>
                                                {subcat.items && subcat.items.length > 0 && (
                                                    <ul className="space-y-2">
                                                        {subcat.items.map((item) => (
                                                            <li key={item.id}>
                                                                <Link
                                                                    href={item.link}
                                                                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-2"
                                                                >
                                                                    {item.title}
                                                                    {item.badge && (
                                                                        <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                                                                            {item.badge}
                                                                        </span>
                                                                    )}
                                                                </Link>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Featured image */}
                                    {activeCategoryData.image && (
                                        <div className="mt-6 pt-6 border-t border-gray-200">
                                            <Link href={activeCategoryData.link} className="block relative group">
                                                <Image
                                                    src={activeCategoryData.image}
                                                    alt={activeCategoryData.title}
                                                    width={800}
                                                    height={200}
                                                    className="rounded-lg object-cover w-full h-32 group-hover:opacity-90 transition-opacity"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent rounded-lg flex items-center px-6">
                                                    <div className="text-white">
                                                        <p className="font-bold text-lg">Découvrir {activeCategoryData.title}</p>
                                                        <p className="text-sm opacity-90">Voir tous les produits →</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

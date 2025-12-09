'use client'

import { useHeader } from '@/contexts/header-context'
import { Logo } from './logo'
import { MegaMenu } from './mega-menu'
import { AdvancedSearchBar } from './advanced-search-bar'
import { WishlistDropdown } from './wishlist-dropdown'
import { EnhancedCartPreview } from './enhanced-cart-preview'
import { UserAccountDropdown } from './user-account-dropdown'
import { Bell, Search, X } from 'lucide-react'
import { useState } from 'react'
import type { MegaMenuColumn } from '@/types'

const MOCK_CATEGORIES: MegaMenuColumn[] = [
    {
        id: 'electronics',
        title: 'Électronique',
        icon: '💻',
        link: '/categories/electronique',
        description: 'Tous vos appareils électroniques',
        image: '/images/categories/electronics.jpg',
        subcategories: [
            {
                id: 'computers',
                title: 'Ordinateurs',
                link: '/categories/electronique',
                items: [
                    { id: '1', title: 'PC Portables', link: '/categories/electronique' },
                    { id: '2', title: 'PC de Bureau', link: '/categories/electronique' },
                    { id: '3', title: 'Tablettes', link: '/categories/electronique', badge: 'Nouveau' }
                ]
            },
            {
                id: 'smartphones',
                title: 'Smartphones',
                link: '/categories/electronique',
                items: [
                    { id: '4', title: 'iPhone', link: '/categories/electronique' },
                    { id: '5', title: 'Samsung', link: '/categories/electronique' },
                    { id: '6', title: 'Xiaomi', link: '/categories/electronique', badge: 'Promo' }
                ]
            },
            {
                id: 'accessories',
                title: 'Accessoires',
                link: '/categories/electronique',
                items: [
                    { id: '7', title: 'Écouteurs', link: '/categories/electronique' },
                    { id: '8', title: 'Chargeurs', link: '/categories/electronique' },
                    { id: '9', title: 'Coques', link: '/categories/electronique' }
                ]
            }
        ]
    },
    {
        id: 'fashion',
        title: 'Mode',
        icon: '👔',
        link: '/categories/mode',
        description: 'Vêtements et accessoires de mode',
        subcategories: [
            {
                id: 'men',
                title: 'Homme',
                link: '/categories/homme',
                items: [
                    { id: '10', title: 'T-shirts', link: '/categories/homme' },
                    { id: '11', title: 'Pantalons', link: '/categories/homme' }
                ]
            },
            {
                id: 'women',
                title: 'Femme',
                link: '/categories/femme',
                items: [
                    { id: '12', title: 'Robes', link: '/categories/femme' },
                    { id: '13', title: 'Accessoires', link: '/categories/accessoires' }
                ]
            }
        ]
    },
    {
        id: 'home',
        title: 'Maison & Jardin',
        icon: '🏠',
        link: '/categories/maison',
        description: 'Tout pour embellir votre maison et votre jardin',
        subcategories: []
    },
    {
        id: 'sports',
        title: 'Sports & Loisirs',
        icon: '⚽',
        link: '/categories/sports',
        description: 'Équipements sportifs et articles de loisirs',
        subcategories: []
    },
    {
        id: 'beauty',
        title: 'Beauté & Santé',
        icon: '💄',
        link: '/categories/beaute',
        description: 'Produits de beauté et de santé pour votre bien-être',
        subcategories: []
    }
]

export function MainHeader() {
    const { isCompact, setMobileMenuOpen, setMobileSearchOpen, isMobileSearchOpen } = useHeader()
    const [isHamburgerActive, setIsHamburgerActive] = useState(false)

    const handleMenuToggle = () => {
        setIsHamburgerActive(!isHamburgerActive)
        setMobileMenuOpen(!isHamburgerActive)
    }

    const handleSearchToggle = () => {
        setMobileSearchOpen(!isMobileSearchOpen)
    }

    return (
        <div
            className={`
                bg-white border-b border-gray-200/60 
                relative z-[10] transition-all duration-300 ease-smooth
                h-14 md:h-20 ${isCompact ? 'md:h-16' : ''}
                ${isCompact ? 'shadow-[0_4px_12px_rgba(0,0,0,0.08)] backdrop-blur-sm bg-white/[0.98]' : ''}
            `}
        >
            <div className="container mx-auto px-4 md:px-[2%] lg:px-[4%] h-full">
                {/* ===== MOBILE LAYOUT (<768px) ===== */}
                <div className="flex md:hidden h-full items-center gap-3">
                    {/* Hamburger Menu Button */}
                    <button
                        onClick={handleMenuToggle}
                        className="
                            flex items-center justify-center
                            w-10 h-10 rounded-lg
                            hover:bg-turquoise-600/[0.08]
                            transition-all duration-200
                        "
                        aria-label="Menu"
                        aria-expanded={isHamburgerActive}
                    >
                        <div className="relative w-5 h-4 flex flex-col justify-between">
                            <span className={`
                                block w-full h-0.5 bg-gray-800 rounded-full
                                transition-all duration-300 origin-center
                                ${isHamburgerActive ? 'rotate-45 translate-y-[7px]' : ''}
                            `} />
                            <span className={`
                                block w-full h-0.5 bg-gray-800 rounded-full
                                transition-all duration-300
                                ${isHamburgerActive ? 'opacity-0 scale-0' : ''}
                            `} />
                            <span className={`
                                block w-full h-0.5 bg-gray-800 rounded-full
                                transition-all duration-300 origin-center
                                ${isHamburgerActive ? '-rotate-45 -translate-y-[7px]' : ''}
                            `} />
                        </div>
                    </button>

                    {/* Logo - Centered on mobile */}
                    <div className="flex-1 flex justify-center">
                        <Logo isCompact={true} />
                    </div>

                    {/* Mobile Action Icons */}
                    <div className="flex items-center gap-1">
                        {/* Search Button */}
                        <button
                            onClick={handleSearchToggle}
                            className="
                                flex items-center justify-center
                                w-10 h-10 rounded-full
                                hover:bg-turquoise-600/[0.08]
                                transition-all duration-200
                                text-gray-800 hover:text-turquoise-600
                            "
                            aria-label="Rechercher"
                        >
                            {isMobileSearchOpen ? (
                                <X className="w-5 h-5" />
                            ) : (
                                <Search className="w-5 h-5" />
                            )}
                        </button>

                        {/* Cart - Always visible on mobile */}
                        <EnhancedCartPreview />
                    </div>
                </div>

                {/* ===== TABLET LAYOUT (768px - 1023px) ===== */}
                <div className="hidden md:flex lg:hidden h-full items-center gap-3">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Logo isCompact={isCompact} />
                    </div>

                    {/* Search Bar - takes remaining space */}
                    <div className="flex-1 min-w-0">
                        <AdvancedSearchBar />
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Notifications */}
                        <ActionIconWrapper badge={2} badgeType="info" className="hidden sm:flex">
                            <Bell className="w-5 h-5" />
                        </ActionIconWrapper>
                        
                        {/* Wishlist */}
                        <WishlistDropdown />
                        
                        {/* Cart */}
                        <EnhancedCartPreview />
                    </div>

                    {/* User Account */}
                    <div className="flex-shrink-0">
                        <UserAccountDropdown />
                    </div>
                </div>

                {/* ===== DESKTOP LAYOUT (>=1024px) ===== */}
                <div className="hidden lg:flex h-full items-center gap-4 xl:gap-5">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Logo isCompact={isCompact} />
                    </div>

                    {/* Categories Button + Mega Menu */}
                    <div className="flex-shrink-0">
                        <MegaMenu categories={MOCK_CATEGORIES} />
                    </div>

                    {/* Search Bar - takes remaining space */}
                    <div className="flex-1 min-w-0 max-w-2xl xl:max-w-3xl">
                        <AdvancedSearchBar />
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-1 xl:gap-2 flex-shrink-0">
                        {/* Notifications */}
                        <ActionIconWrapper badge={2} badgeType="info">
                            <Bell className="w-5 h-5" />
                        </ActionIconWrapper>
                        
                        {/* Wishlist */}
                        <WishlistDropdown />
                        
                        {/* Cart */}
                        <EnhancedCartPreview />
                    </div>

                    {/* User Account */}
                    <div className="flex-shrink-0">
                        <UserAccountDropdown />
                    </div>
                </div>
            </div>
        </div>
    )
}

interface ActionIconWrapperProps {
    children: React.ReactNode
    badge?: number
    badgeType?: 'default' | 'success' | 'warning' | 'info'
    onClick?: () => void
    className?: string
}

function ActionIconWrapper({ children, badge, badgeType = 'default', onClick, className = '' }: ActionIconWrapperProps) {
    const badgeColors = {
        default: 'bg-error',
        success: 'bg-success',
        warning: 'bg-warning',
        info: 'bg-turquoise-600'
    }

    return (
        <button
            onClick={onClick}
            className={`
                relative flex flex-col items-center justify-center
                w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer
                transition-all duration-250 ease-smooth
                hover:bg-turquoise-600/[0.08] hover:-translate-y-0.5 hover:scale-[1.08]
                text-gray-800 hover:text-turquoise-600
                ${className}
            `}
        >
            {children}
            
            {badge !== undefined && badge > 0 && (
                <span className={`
                    absolute -top-0.5 -right-0.5
                    min-w-[20px] h-5 px-1.5
                    ${badgeColors[badgeType]} text-white
                    text-[11px] font-bold rounded-full
                    border-2 border-white
                    flex items-center justify-center
                    shadow-[0_2px_8px_rgba(239,68,68,0.3)]
                    animate-pulse-subtle
                `}>
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </button>
    )
}

'use client'

import { HEADER_CONFIG } from '@/lib/constants'
import { useHeader } from '@/contexts/header-context'
import { Logo } from './logo'
import { MegaMenu } from './mega-menu'
import { AdvancedSearchBar } from './advanced-search-bar'
import { NotificationsDropdown } from './notifications-dropdown'
import { WishlistDropdown } from './wishlist-dropdown'
import { ComparatorDropdown } from './comparator-dropdown'
import { EnhancedCartPreview } from './enhanced-cart-preview'
import { UserAccountDropdown } from './user-account-dropdown'
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
    const { isCompact } = useHeader()

    const height = isCompact ? HEADER_CONFIG.heights.compact : HEADER_CONFIG.heights.mainHeader

    return (
        <div
            className={`bg-white border-b border-taupe-200 transition-all duration-300 ${isCompact ? 'shadow-md' : ''
                }`}
            style={{ height: `${height}px` }}
        >
            <div className="container mx-auto px-4 h-full">
                <div className={`flex items-center justify-between h-full transition-all duration-300 ${isCompact ? 'gap-4' : 'gap-6'
                    }`}>
                    {/* Left: Logo + Mega Menu */}
                    <div className="flex items-center gap-4">
                        <Logo />
                        <div className="hidden lg:block">
                            <MegaMenu categories={MOCK_CATEGORIES} />
                        </div>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-2xl">
                        <AdvancedSearchBar />
                    </div>

                    {/* Right: Action Icons */}
                    <div className={`flex items-center transition-all duration-300 ${isCompact ? 'gap-1' : 'gap-2'
                        }`}>
                        <NotificationsDropdown />
                        <WishlistDropdown />
                        <ComparatorDropdown />
                        <EnhancedCartPreview />
                        <UserAccountDropdown />
                    </div>
                </div>
            </div>
        </div>
    )
}

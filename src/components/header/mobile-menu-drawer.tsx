'use client'

import { X, ChevronRight, User, Heart, ShoppingBag, MapPin, Headphones, HelpCircle, Settings, LogOut, Smartphone, Gift, Flame, Sparkles } from 'lucide-react'
import { useHeader } from '@/contexts/header-context'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LanguageCurrencySelector } from './language-currency-selector'

interface Category {
    id: string
    name: string
    slug: string
    icon: string
    isHot?: boolean
    isNew?: boolean
}

const CATEGORIES: Category[] = [
    { id: 'new', name: 'Nouveautés', slug: 'nouveautes', icon: '✨', isNew: true },
    { id: 'clothing', name: 'Vêtements', slug: 'vetements', icon: '👔' },
    { id: 'shoes', name: 'Chaussures', slug: 'chaussures', icon: '👟' },
    { id: 'accessories', name: 'Accessoires', slug: 'accessoires', icon: '👜' },
    { id: 'electronics', name: 'Électronique', slug: 'electronique', icon: '💻' },
    { id: 'beauty', name: 'Beauté', slug: 'beaute', icon: '💄' },
    { id: 'home', name: 'Maison', slug: 'maison', icon: '🏠' },
    { id: 'sports', name: 'Sports', slug: 'sports', icon: '⚽' },
    { id: 'brands', name: 'Marques', slug: 'marques', icon: '🏷️' },
    { id: 'sale', name: 'Soldes', slug: 'soldes', icon: '🔥', isHot: true },
]

const QUICK_LINKS = [
    { icon: User, label: 'Mon compte', href: '/account' },
    { icon: Heart, label: 'Mes favoris', href: '/wishlist' },
    { icon: ShoppingBag, label: 'Mes commandes', href: '/account/orders' },
    { icon: MapPin, label: 'Points de retrait', href: '/points-retrait' },
]

const SUPPORT_LINKS = [
    { icon: Headphones, label: 'Support client', href: '/support' },
    { icon: HelpCircle, label: 'Aide & FAQ', href: '/aide' },
    { icon: Smartphone, label: 'Télécharger l\'app', href: '/app' },
]

export function MobileMenuDrawer() {
    const { isMobileMenuOpen, setMobileMenuOpen } = useHeader()
    const [isAnimating, setIsAnimating] = useState(false)

    // Handle body scroll lock
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden'
            setIsAnimating(true)
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isMobileMenuOpen])

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMobileMenuOpen) {
                setMobileMenuOpen(false)
            }
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [isMobileMenuOpen, setMobileMenuOpen])

    const handleClose = () => {
        setIsAnimating(false)
        setTimeout(() => setMobileMenuOpen(false), 300)
    }

    if (!isMobileMenuOpen) return null

    return (
        <>
            {/* Backdrop */}
            <div 
                className={`
                    fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm
                    transition-opacity duration-300
                    ${isAnimating ? 'opacity-100' : 'opacity-0'}
                `}
                onClick={handleClose}
            />

            {/* Drawer */}
            <div 
                className={`
                    fixed top-0 left-0 bottom-0 z-[9999]
                    w-[85%] max-w-[320px] bg-white
                    shadow-2xl
                    transition-transform duration-300 ease-out
                    ${isAnimating ? 'translate-x-0' : '-translate-x-full'}
                    flex flex-col
                `}
            >
                {/* Header */}
                <div className="
                    flex items-center justify-between
                    p-4 border-b border-gray-100
                    bg-gradient-to-r from-turquoise-50 to-white
                ">
                    <div className="flex items-center gap-2">
                        <div className="
                            w-10 h-10 rounded-full
                            bg-gradient-to-br from-turquoise-600 to-turquoise-500
                            flex items-center justify-center
                        ">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Bienvenue</p>
                            <Link 
                                href="/auth/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="text-xs text-turquoise-600 font-medium hover:underline"
                            >
                                Se connecter / S'inscrire
                            </Link>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="
                            w-9 h-9 rounded-full
                            hover:bg-gray-100
                            flex items-center justify-center
                            transition-colors
                        "
                        aria-label="Fermer le menu"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    {/* Promo Banner */}
                    <div className="
                        mx-4 mt-4 p-3 rounded-xl
                        bg-gradient-to-r from-orange-500 to-orange-600
                        text-white
                    ">
                        <div className="flex items-center gap-2">
                            <Gift className="w-5 h-5" />
                            <div>
                                <p className="text-sm font-semibold">-10% sur votre 1ère commande</p>
                                <p className="text-xs opacity-90">Code: BIENVENUE10</p>
                            </div>
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="p-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Catégories
                        </h3>
                        <div className="space-y-1">
                            {CATEGORIES.map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/categories/${category.slug}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="
                                        flex items-center justify-between
                                        py-3 px-3 -mx-3 rounded-xl
                                        hover:bg-gray-50 active:bg-gray-100
                                        transition-colors group
                                    "
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{category.icon}</span>
                                        <span className={`
                                            text-[15px] font-medium
                                            ${category.isHot ? 'text-orange-600' : 'text-gray-700'}
                                        `}>
                                            {category.name}
                                        </span>
                                        {category.isHot && (
                                            <Flame className="w-4 h-4 text-orange-500" />
                                        )}
                                        {category.isNew && (
                                            <span className="
                                                px-2 py-0.5 rounded-full
                                                bg-turquoise-100 text-turquoise-700
                                                text-[10px] font-bold uppercase
                                            ">
                                                New
                                            </span>
                                        )}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-turquoise-600 transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-2 bg-gray-100" />

                    {/* Quick Links */}
                    <div className="p-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Mon espace
                        </h3>
                        <div className="space-y-1">
                            {QUICK_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="
                                        flex items-center gap-3
                                        py-3 px-3 -mx-3 rounded-xl
                                        hover:bg-gray-50 active:bg-gray-100
                                        transition-colors
                                    "
                                >
                                    <link.icon className="w-5 h-5 text-gray-500" />
                                    <span className="text-[15px] text-gray-700">{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-2 bg-gray-100" />

                    {/* Support Links */}
                    <div className="p-4">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                            Aide & Support
                        </h3>
                        <div className="space-y-1">
                            {SUPPORT_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="
                                        flex items-center gap-3
                                        py-3 px-3 -mx-3 rounded-xl
                                        hover:bg-gray-50 active:bg-gray-100
                                        transition-colors
                                    "
                                >
                                    <link.icon className="w-5 h-5 text-gray-500" />
                                    <span className="text-[15px] text-gray-700">{link.label}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="
                    p-4 border-t border-gray-100
                    bg-gray-50
                ">
                    {/* Language/Currency Selector */}
                    <div className="mb-3">
                        <LanguageCurrencySelector />
                    </div>
                    
                    {/* Version */}
                    <p className="text-xs text-gray-400 text-center">
                        Mientior v1.0 • © 2025
                    </p>
                </div>
            </div>
        </>
    )
}

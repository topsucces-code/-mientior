'use client'

import { User, LogOut, Package, Heart, Settings, CreditCard, MapPin, MessageCircle, Shield } from 'lucide-react'
import { useHeader } from '@/contexts/header-context'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/use-auth'

export function UserAccountDropdown() {
    const { activeDropdown, setActiveDropdown } = useHeader()
    const { session, isLoading, signOut } = useAuth()
    const dropdownRef = useRef<HTMLDivElement>(null)
    const t = useTranslations('header')

    const isOpen = activeDropdown === 'account'

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, setActiveDropdown])

    const handleSignOut = async () => {
        try {
            await signOut()
            setActiveDropdown(null)
        } catch (error) {
            console.error('Sign out failed:', error)
        }
    }

    if (isLoading) {
        return (
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors" aria-label={t('account')}>
                <User className="w-6 h-6 animate-pulse" />
            </button>
        )
    }

    if (!session?.user) {
        return (
            <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors font-medium"
            >
                <User className="w-5 h-5" />
                <span className="hidden lg:inline">{t('login')}</span>
            </Link>
        )
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setActiveDropdown(isOpen ? null : 'account')}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label={t('account')}
                aria-expanded={isOpen}
            >
                <User className="w-6 h-6" />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-[110] animate-slide-down">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-taupe-50">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                {session.user.name?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{session.user.name || t('user')}</p>
                                <p className="text-sm text-gray-600 truncate">{session.user.email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="py-2">
                        <Link
                            href="/account/orders"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <Package className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">{t('myOrders')}</span>
                        </Link>

                        <Link
                            href="/wishlist"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <Heart className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">{t('myWishlist')}</span>
                        </Link>

                        <Link
                            href="/account/addresses"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <MapPin className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">{t('myAddresses')}</span>
                        </Link>

                        <Link
                            href="/account/payment-methods"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <CreditCard className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">{t('paymentMethods')}</span>
                        </Link>

                        <Link
                            href="/account/settings"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <Settings className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">{t('settings')}</span>
                        </Link>

                        <Link
                            href="/account/security"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <Shield className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">{t('security')}</span>
                        </Link>
                    </div>

                    <div className="border-t border-gray-200 py-2">
                        <Link
                            href="/support"
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                            <MessageCircle className="w-5 h-5 text-gray-600" />
                            <span className="font-medium">{t('supportHelp')}</span>
                        </Link>
                    </div>

                    <div className="border-t border-gray-200 p-2">
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 text-red-600 rounded-md transition-colors font-medium"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>{t('logout')}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

'use client'

import { HEADER_CONFIG } from '@/lib/constants'
import { useHeader } from '@/contexts/header-context'
import { GeolocationSelector } from './geolocation-selector'
import { RotatingMessages } from './rotating-messages'
import { LanguageCurrencySelector } from './language-currency-selector'
import Link from 'next/link'
import { HelpCircle, Truck, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function TopBar() {
    const { isScrolled } = useHeader()
    const t = useTranslations('header')

    if (isScrolled) {
        return null
    }

    return (
        <div
            className="bg-taupe-50 border-b border-taupe-200 transition-all duration-300 animate-slide-down"
            style={{ height: HEADER_CONFIG.heights.topBar }}
        >
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                {/* Left: Geolocation */}
                <div className="flex items-center gap-6">
                    <GeolocationSelector />

                    <div className="hidden lg:flex items-center gap-4 text-xs text-gray-600">
                        <Link href="/livraison" className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                            <Truck className="w-3.5 h-3.5" />
                            <span>{t('freeShipping', { amount: '50€' })}</span>
                        </Link>
                        <Link href="/garantie" className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                            <Shield className="w-3.5 h-3.5" />
                            <span>{t('warranty')}</span>
                        </Link>
                    </div>
                </div>

                {/* Center: Rotating Messages */}
                <div className="hidden xl:block">
                    <RotatingMessages />
                </div>

                {/* Right: Language/Currency + Help */}
                <div className="flex items-center gap-4">
                    <LanguageCurrencySelector />

                    <Link
                        href="/aide"
                        className="flex items-center gap-1.5 text-sm hover:text-emerald-600 transition-colors"
                    >
                        <HelpCircle className="w-4 h-4" />
                        <span className="hidden md:inline font-medium">{t('help')}</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}

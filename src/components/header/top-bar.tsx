'use client'

import { HEADER_CONFIG } from '@/lib/constants'
import { useHeader } from '@/contexts/header-context'
import { GeolocationSelector } from './geolocation-selector'
import { LanguageCurrencySelector } from './language-currency-selector'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { 
    Smartphone, 
    Headphones, 
    HelpCircle, 
    MapPin as MapPinIcon,
    Package
} from 'lucide-react'

export function TopBar() {
    const { isScrolled } = useHeader()
    const t = useTranslations('header')

    if (isScrolled) {
        return null
    }

    return (
        <div
            className="
                hidden md:block
                bg-turquoise-50 
                border-b border-turquoise-600/[0.08] 
                transition-all duration-300 animate-slide-down
            "
            style={{ height: HEADER_CONFIG.heights.topBar }}
        >
            <div className="container mx-auto px-[2%] lg:px-[4%] h-full">
                <div className="flex items-center justify-between h-full">
                    {/* Section Gauche (40%) - Géolocalisation + Message Promo */}
                    <div className="flex items-center gap-3 lg:gap-5 flex-1 lg:flex-none lg:w-[40%]">
                        <GeolocationSelector />

                        {/* Message Promotionnel Rotatif */}
                        <div className="hidden xl:flex items-center gap-2 text-[12px] xl:text-[13px] font-medium tracking-[0.02em]">
                            <Package className="w-4 h-4 text-success flex-shrink-0" />
                            <span className="text-gray-500">{t('freeShippingShort')}</span>
                            <span className="text-turquoise-600 font-semibold">{t('freeShippingLabel')}</span>
                            <span className="text-gray-500 hidden xl:inline">{t('freeShippingAmount')}</span>
                        </div>
                    </div>

                    {/* Section Centre (20%) - Langue/Devise - Desktop only */}
                    <div className="hidden xl:flex items-center justify-center w-[20%]">
                        <LanguageCurrencySelector />
                    </div>

                    {/* Section Droite (40%) - Liens Utilitaires */}
                    <div className="flex items-center justify-end gap-1 lg:gap-2 flex-1 lg:flex-none lg:w-[40%]">
                        {/* App Download */}
                        <UtilityLink href="/app" icon={<Smartphone className="w-4 h-4" />} label={t('app')} className="hidden lg:flex" />

                        <span className="text-gray-300 mx-1 hidden lg:inline">│</span>

                        {/* Support */}
                        <UtilityLink href="/support" icon={<Headphones className="w-4 h-4" />} label={t('support')} className="hidden lg:flex" />

                        <span className="text-gray-300 mx-1 hidden md:inline">│</span>

                        {/* Aide */}
                        <UtilityLink href="/aide" icon={<HelpCircle className="w-4 h-4" />} label={t('help')} className="hidden md:flex" />
                        
                        <span className="text-gray-300 mx-1 lg:mx-2 hidden xl:inline">│</span>
                        
                        {/* Points de retrait */}
                        <UtilityLink 
                            href="/points-retrait" 
                            icon={<MapPinIcon className="w-4 h-4" />} 
                            label={t('pickupPoints')} 
                            className="hidden xl:flex"
                        />
                        
                        {/* Tablet/Mobile Language Selector */}
                        <div className="xl:hidden ml-1 lg:ml-2">
                            <LanguageCurrencySelector compact />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface UtilityLinkProps {
    href: string
    icon: React.ReactNode
    label: string
    className?: string
}

function UtilityLink({ href, icon, label, className = '' }: UtilityLinkProps) {
    return (
        <Link
            href={href}
            className={`
                inline-flex items-center gap-1.5 px-4 py-2 rounded-md
                text-[13px] font-medium tracking-[0.02em] text-gray-800
                transition-all duration-200 ease-smooth
                hover:bg-turquoise-600/[0.06] hover:text-turquoise-600
                relative group
                ${className}
            `}
        >
            <span className="transition-colors duration-200 group-hover:text-turquoise-600">
                {icon}
            </span>
            <span className="hidden md:inline">{label}</span>
            
            {/* Underline animation */}
            <span className="
                absolute bottom-0.5 left-3 right-3 h-0.5 
                bg-turquoise-600 transform scale-x-0 origin-left
                transition-transform duration-250 ease-smooth
                group-hover:scale-x-100
            " />
        </Link>
    )
}

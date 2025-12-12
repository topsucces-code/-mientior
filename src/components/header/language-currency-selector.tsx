'use client'

import { ChevronDown, Globe, Check, Search, X } from 'lucide-react'
import { usePreferencesStore } from '@/stores/preferences.store'
import { LANGUAGES, CURRENCIES } from '@/lib/constants'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface LanguageCurrencySelectorProps {
    compact?: boolean
    variant?: 'default' | 'minimal' | 'full'
}

export function LanguageCurrencySelector({ 
    compact = false, 
    variant = 'default' 
}: LanguageCurrencySelectorProps) {
    const { language, currency, setLanguage, setCurrency } = usePreferencesStore()
    const [isOpen, setIsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<'language' | 'currency'>('language')
    const [searchQuery, setSearchQuery] = useState('')
    const [isChanging, setIsChanging] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()
    const t = useTranslations('header')

    // Sync store with cookies on mount
    useEffect(() => {
        // Read cookies
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=')
            if (key && value) acc[key] = value
            return acc
        }, {} as Record<string, string>)

        // Sync language from cookie if different
        const cookieLocale = cookies['NEXT_LOCALE']
        if (cookieLocale && cookieLocale !== language && LANGUAGES.some(l => l.code === cookieLocale)) {
            setLanguage(cookieLocale)
        }

        // Sync currency from cookie if different
        const cookieCurrency = cookies['NEXT_CURRENCY']
        if (cookieCurrency && cookieCurrency !== currency && CURRENCIES.some(c => c.code === cookieCurrency)) {
            setCurrency(cookieCurrency)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const currentLanguage = LANGUAGES.find((l) => l.code === language)
    const currentCurrency = CURRENCIES.find((c) => c.code === currency)

    // Filter currencies based on search
    const filteredCurrencies = useMemo(() => {
        if (!searchQuery) return CURRENCIES
        const query = searchQuery.toLowerCase()
        return CURRENCIES.filter(
            (curr) =>
                curr.code.toLowerCase().includes(query) ||
                curr.name.toLowerCase().includes(query) ||
                curr.symbol.toLowerCase().includes(query)
        )
    }, [searchQuery])

    // Handle language change with cookie-based locale switching
    const handleLanguageChange = useCallback(async (langCode: string) => {
        if (langCode === language) {
            setIsOpen(false)
            return
        }

        setIsChanging(true)
        
        // Set cookie for next-intl (cookie-based approach, no URL prefixes)
        document.cookie = `NEXT_LOCALE=${langCode};path=/;max-age=31536000;SameSite=Lax`
        setLanguage(langCode)
        
        // Refresh the page to apply new locale from cookie
        // Small delay for visual feedback
        setTimeout(() => {
            router.refresh()
            // Force a full page reload to ensure all server components re-render with new locale
            window.location.reload()
        }, 150)
        
    }, [language, router, setLanguage])

    // Handle currency change
    const handleCurrencyChange = useCallback((currCode: string) => {
        if (currCode === currency) return
        
        // Set cookie for currency preference
        document.cookie = `NEXT_CURRENCY=${currCode};path=/;max-age=31536000;SameSite=Lax`
        setCurrency(currCode)
    }, [currency, setCurrency])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setSearchQuery('')
            }
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false)
                setSearchQuery('')
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [])

    // Focus search input when switching to currency tab
    useEffect(() => {
        if (isOpen && activeTab === 'currency' && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 100)
        }
    }, [isOpen, activeTab])

    // Reset search when closing
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('')
        }
    }, [isOpen])

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isChanging}
                className={cn(
                    'flex items-center gap-2 cursor-pointer transition-all duration-200',
                    'rounded-lg border border-transparent',
                    'hover:border-turquoise-200 hover:bg-turquoise-50/50',
                    compact ? 'px-2 py-1.5' : 'px-3 py-2',
                    isOpen && 'border-turquoise-300 bg-turquoise-50/50',
                    isChanging && 'opacity-50 cursor-wait'
                )}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-label={t('language') + ' / ' + t('currency')}
            >
                {/* Globe icon for minimal variant */}
                {variant === 'minimal' && (
                    <Globe className="w-4 h-4 text-gray-600" />
                )}

                {/* Flag */}
                <span className="text-lg leading-none" role="img" aria-label={currentLanguage?.name}>
                    {currentLanguage?.flag}
                </span>
                
                {!compact && variant !== 'minimal' && (
                    <>
                        <span className="font-semibold text-sm text-gray-800">
                            {currentLanguage?.code?.toUpperCase()}
                        </span>
                        <span className="text-gray-300 mx-0.5">│</span>
                        <span className="text-sm text-gray-600">
                            {currentCurrency?.symbol}
                        </span>
                    </>
                )}

                {variant === 'full' && (
                    <span className="text-xs text-gray-500 hidden sm:inline">
                        {currentCurrency?.code}
                    </span>
                )}
                
                <ChevronDown 
                    className={cn(
                        'w-3 h-3 text-gray-500 transition-transform duration-200',
                        isOpen && 'rotate-180'
                    )} 
                />

                {/* Loading indicator */}
                {isChanging && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <div className="w-4 h-4 border-2 border-turquoise-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div 
                    className={cn(
                        'absolute right-0 top-[calc(100%+4px)]',
                        'w-[300px] bg-white rounded-xl',
                        'border border-gray-200',
                        'z-[9999] overflow-hidden',
                        'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
                        'duration-150'
                    )}
                    role="dialog"
                    aria-label={t('selectLanguageCurrency')}
                >
                    
                    {/* Tabs */}
                    <div className="flex bg-gray-50">
                        <button
                            onClick={() => setActiveTab('language')}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5',
                                'text-sm font-medium transition-colors duration-150',
                                activeTab === 'language'
                                    ? 'text-turquoise-600 bg-white border-b-2 border-turquoise-500'
                                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                            )}
                        >
                            <span className="text-base">🌍</span>
                            <span>{t('language')}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('currency')}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5',
                                'text-sm font-medium transition-colors duration-150',
                                activeTab === 'currency'
                                    ? 'text-turquoise-600 bg-white border-b-2 border-turquoise-500'
                                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                            )}
                        >
                            <span className="text-base">💱</span>
                            <span>{t('currency')}</span>
                        </button>
                    </div>

                    {/* Language Tab Content */}
                    {activeTab === 'language' && (
                        <div className="p-2">
                            <div className="space-y-0.5">
                                {LANGUAGES.map((lang) => {
                                    const isSelected = language === lang.code
                                    return (
                                        <button
                                            key={lang.code}
                                            onClick={() => handleLanguageChange(lang.code)}
                                            disabled={isChanging}
                                            className={cn(
                                                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                                                'transition-colors duration-150',
                                                isSelected
                                                    ? 'bg-turquoise-50'
                                                    : 'hover:bg-gray-50',
                                                isChanging && 'opacity-50'
                                            )}
                                        >
                                            <span className="text-xl">{lang.flag}</span>
                                            <div className="flex-1 text-left">
                                                <div className={cn(
                                                    'font-medium text-sm',
                                                    isSelected ? 'text-turquoise-600' : 'text-gray-700'
                                                )}>
                                                    {lang.name}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {lang.nativeName}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Check className="w-4 h-4 text-turquoise-500" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Currency Tab Content */}
                    {activeTab === 'currency' && (
                        <div className="p-2">
                            {/* Search Input */}
                            <div className="relative mb-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder={t('searchCurrency')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={cn(
                                        'w-full pl-9 pr-9 py-2',
                                        'bg-gray-50 border-0 rounded-lg',
                                        'text-sm placeholder:text-gray-400',
                                        'focus:outline-none focus:bg-gray-100',
                                        'transition-colors duration-150'
                                    )}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded"
                                    >
                                        <X className="w-3.5 h-3.5 text-gray-400" />
                                    </button>
                                )}
                            </div>

                            {/* Currency List */}
                            <div className="space-y-0.5 max-h-[220px] overflow-y-auto">
                                {filteredCurrencies.length > 0 ? (
                                    filteredCurrencies.map((curr) => {
                                        const isSelected = currency === curr.code
                                        return (
                                            <button
                                                key={curr.code}
                                                onClick={() => handleCurrencyChange(curr.code)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                                                    'transition-colors duration-150',
                                                    isSelected
                                                        ? 'bg-turquoise-50'
                                                        : 'hover:bg-gray-50'
                                                )}
                                            >
                                                <span className={cn(
                                                    'text-sm font-semibold w-14 text-left',
                                                    isSelected ? 'text-turquoise-600' : 'text-gray-600'
                                                )}>
                                                    {curr.symbol}
                                                </span>
                                                <div className="flex-1 text-left">
                                                    <div className={cn(
                                                        'font-medium text-sm',
                                                        isSelected ? 'text-turquoise-600' : 'text-gray-700'
                                                    )}>
                                                        {curr.code}
                                                    </div>
                                                    <div className="text-xs text-gray-400 truncate">
                                                        {curr.name}
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <Check className="w-4 h-4 text-turquoise-500 flex-shrink-0" />
                                                )}
                                            </button>
                                        )
                                    })
                                ) : (
                                    <div className="py-6 text-center text-gray-400">
                                        <p className="text-sm">{t('noCurrencyFound')}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-3 py-2.5 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1.5">
                                <span>{currentLanguage?.flag}</span>
                                <span>{currentLanguage?.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-medium text-gray-700">{currentCurrency?.symbol}</span>
                                <span>{currentCurrency?.code}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

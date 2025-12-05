'use client'

import { Globe, ChevronDown } from 'lucide-react'
import { usePreferencesStore } from '@/stores/preferences.store'
import { LANGUAGES, CURRENCIES } from '@/lib/constants'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function LanguageCurrencySelector() {
    const { language, currency, setLanguage, setCurrency } = usePreferencesStore()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const t = useTranslations('header')

    const currentLanguage = LANGUAGES.find((l) => l.code === language)
    const currentCurrency = CURRENCIES.find((c) => c.code === currency)
    
    // Handle language change with cookie for next-intl
    const handleLanguageChange = useCallback((langCode: string) => {
        // Set cookie for next-intl
        document.cookie = `NEXT_LOCALE=${langCode};path=/;max-age=31536000`
        setLanguage(langCode)
        setIsOpen(false)
        // Refresh to apply new locale
        router.refresh()
    }, [setLanguage, router])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm hover:text-emerald-600 transition-colors"
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <Globe className="w-4 h-4" />
                <span className="font-medium">
                    {currentLanguage?.flag} {currentLanguage?.name} • {currentCurrency?.symbol}{' '}
                    {currentCurrency?.code}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[280px] z-50 animate-slide-down">
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('language')}</h3>
                        <div className="space-y-1">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${language === lang.code
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-xl">{lang.flag}</span>
                                    <span className="font-medium">{lang.name}</span>
                                    {language === lang.code && (
                                        <span className="ml-auto text-emerald-600">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('currency')}</h3>
                        <div className="space-y-1">
                            {CURRENCIES.map((curr) => (
                                <button
                                    key={curr.code}
                                    onClick={() => {
                                        setCurrency(curr.code)
                                        setIsOpen(false)
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${currency === curr.code
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-lg">{curr.symbol}</span>
                                    <div className="flex-1 text-left">
                                        <div className="font-medium">{curr.code}</div>
                                        <div className="text-xs text-gray-500">{curr.name}</div>
                                    </div>
                                    {currency === curr.code && (
                                        <span className="text-emerald-600">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

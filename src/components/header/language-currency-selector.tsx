'use client'

import { ChevronDown } from 'lucide-react'
import { usePreferencesStore } from '@/stores/preferences.store'
import { LANGUAGES, CURRENCIES } from '@/lib/constants'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface LanguageCurrencySelectorProps {
    compact?: boolean
}

export function LanguageCurrencySelector({ compact = false }: LanguageCurrencySelectorProps) {
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
                className={`
                    flex items-center gap-2 cursor-pointer
                    transition-all duration-200 ease-smooth
                    ${compact 
                        ? 'text-[13px] text-gray-800 hover:text-turquoise-600' 
                        : 'text-[13px] font-semibold text-gray-800 hover:text-turquoise-600'
                    }
                `}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                {/* Flag */}
                <span className="text-lg leading-none">{currentLanguage?.flag}</span>
                
                {!compact && (
                    <>
                        <span className="font-bold">{currentLanguage?.code?.toUpperCase()}</span>
                        <span className="text-gray-300 mx-1">│</span>
                        <span>{currentCurrency?.symbol} {currentCurrency?.code}</span>
                    </>
                )}
                
                <ChevronDown 
                    className={`w-2.5 h-2.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                />
            </button>

            {isOpen && (
                <div className="
                    absolute right-0 top-[calc(100%+8px)] 
                    w-[280px] bg-white rounded-xl 
                    shadow-[0_12px_48px_rgba(8,145,178,0.12)] 
                    p-4 z-[9999] animate-slide-down
                ">
                    {/* Arrow indicator */}
                    <div className="
                        absolute -top-1.5 right-6 w-3 h-3 
                        bg-white rotate-45 
                        shadow-[-2px_-2px_4px_rgba(0,0,0,0.03)]
                    " />
                    
                    {/* Language Section */}
                    <div className="mb-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 mb-3">
                            🌍 {t('language')}
                        </h3>
                        <div className="space-y-1">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => handleLanguageChange(lang.code)}
                                    className={`
                                        w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg
                                        transition-all duration-200 ease-smooth
                                        ${language === lang.code
                                            ? 'bg-turquoise-600/[0.04] border-l-[3px] border-turquoise-600 pl-2'
                                            : 'hover:bg-turquoise-50'
                                        }
                                    `}
                                >
                                    <span className="text-lg">{lang.flag}</span>
                                    <span className={`font-medium text-sm ${language === lang.code ? 'text-turquoise-600' : 'text-gray-800'}`}>
                                        {lang.name}
                                    </span>
                                    {language === lang.code && (
                                        <span className="ml-auto text-turquoise-600">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Currency Section */}
                    <div className="border-t border-gray-200 pt-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-500 mb-3">
                            💱 {t('currency')}
                        </h3>
                        <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                            {CURRENCIES.map((curr) => (
                                <button
                                    key={curr.code}
                                    onClick={() => {
                                        setCurrency(curr.code)
                                        setIsOpen(false)
                                    }}
                                    className={`
                                        w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg
                                        transition-all duration-200 ease-smooth
                                        ${currency === curr.code
                                            ? 'bg-turquoise-600/[0.04] border-l-[3px] border-turquoise-600 pl-2'
                                            : 'hover:bg-turquoise-50'
                                        }
                                    `}
                                >
                                    <span className="text-base font-semibold text-gray-600 w-8">{curr.symbol}</span>
                                    <div className="flex-1 text-left">
                                        <div className={`font-medium text-sm ${currency === curr.code ? 'text-turquoise-600' : 'text-gray-800'}`}>
                                            {curr.code}
                                        </div>
                                        <div className="text-xs text-gray-500">{curr.name}</div>
                                    </div>
                                    {currency === curr.code && (
                                        <span className="text-turquoise-600">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Apply Button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="
                            w-full mt-4 py-2.5 rounded-lg
                            bg-turquoise-600 text-white text-sm font-semibold
                            hover:bg-turquoise-500 transition-colors duration-200
                        "
                    >
                        Appliquer
                    </button>
                </div>
            )}
        </div>
    )
}

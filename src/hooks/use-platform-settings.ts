'use client'

import useSWR from 'swr'

export interface PlatformCurrency {
  code: string
  name: string
  symbol: string
  rate: number
  decimals: number
}

export interface PlatformLanguage {
  code: string
  name: string
  nativeName: string
  flag: string
  rtl: boolean
}

export interface PlatformCountry {
  code: string
  name: string
  nameLocal: string
  currency: string
  language: string
}

export interface PlatformPaymentMethod {
  id: string
  name: string
  type: string
  icon: string
  countries: string[]
}

export interface PlatformFeatures {
  enableMultiCurrency: boolean
  enableMultiLanguage: boolean
  enableGuestCheckout: boolean
  enableReviews: boolean
  enableWishlist: boolean
  enableCompare: boolean
  enableQuickView: boolean
  enableMobileMoneyPayments: boolean
  enableCOD: boolean
  enableExpressCheckout: boolean
}

export interface PlatformSettings {
  currencies: PlatformCurrency[]
  languages: PlatformLanguage[]
  countries: PlatformCountry[]
  defaultCurrency: string
  defaultLanguage: string
  features: PlatformFeatures
  paymentMethods: PlatformPaymentMethod[]
}

// Default settings for SSR and fallback
const defaultSettings: PlatformSettings = {
  currencies: [
    { code: 'XOF', name: 'CFA Franc BCEAO', symbol: 'FCFA', rate: 655.957, decimals: 0 },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 1, decimals: 2 },
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.08, decimals: 2 },
  ],
  languages: [
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', rtl: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  ],
  countries: [
    { code: 'SN', name: 'Senegal', nameLocal: 'Sénégal', currency: 'XOF', language: 'fr' },
    { code: 'CI', name: "Côte d'Ivoire", nameLocal: "Côte d'Ivoire", currency: 'XOF', language: 'fr' },
    { code: 'FR', name: 'France', nameLocal: 'France', currency: 'EUR', language: 'fr' },
  ],
  defaultCurrency: 'XOF',
  defaultLanguage: 'fr',
  features: {
    enableMultiCurrency: true,
    enableMultiLanguage: true,
    enableGuestCheckout: true,
    enableReviews: true,
    enableWishlist: true,
    enableCompare: true,
    enableQuickView: true,
    enableMobileMoneyPayments: true,
    enableCOD: true,
    enableExpressCheckout: true,
  },
  paymentMethods: [
    { id: 'card', name: 'Credit/Debit Card', type: 'card', icon: 'credit-card', countries: [] },
    { id: 'orange-money', name: 'Orange Money', type: 'mobile_money', icon: 'orange-money', countries: ['SN', 'CI', 'ML', 'BF', 'CM'] },
    { id: 'wave', name: 'Wave', type: 'mobile_money', icon: 'wave', countries: ['SN', 'CI', 'ML', 'BF'] },
  ],
}

const fetcher = async (url: string): Promise<PlatformSettings> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch settings')
  return res.json()
}

/**
 * Hook to fetch and use platform settings
 * Settings are cached and revalidated in the background
 */
export function usePlatformSettings() {
  const { data, error, isLoading, mutate } = useSWR<PlatformSettings>(
    '/api/public/settings',
    fetcher,
    {
      fallbackData: defaultSettings,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      refreshInterval: 300000, // 5 minutes
    }
  )

  const settings = data || defaultSettings

  // Helper functions
  const getCurrency = (code: string) => 
    settings.currencies.find(c => c.code === code)

  const getLanguage = (code: string) => 
    settings.languages.find(l => l.code === code)

  const getCountry = (code: string) => 
    settings.countries.find(c => c.code === code)

  const getPaymentMethodsForCountry = (countryCode: string) =>
    settings.paymentMethods.filter(
      p => p.countries.length === 0 || p.countries.includes(countryCode)
    )

  const isFeatureEnabled = (feature: keyof PlatformFeatures) =>
    settings.features[feature] ?? false

  return {
    settings,
    currencies: settings.currencies,
    languages: settings.languages,
    countries: settings.countries,
    paymentMethods: settings.paymentMethods,
    features: settings.features,
    defaultCurrency: settings.defaultCurrency,
    defaultLanguage: settings.defaultLanguage,
    isLoading,
    error,
    refresh: mutate,
    // Helpers
    getCurrency,
    getLanguage,
    getCountry,
    getPaymentMethodsForCountry,
    isFeatureEnabled,
  }
}

/**
 * Get platform settings for server components
 * This fetches directly without SWR
 */
export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/public/settings`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    })
    if (!res.ok) return defaultSettings
    return res.json()
  } catch {
    return defaultSettings
  }
}

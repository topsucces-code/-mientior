'use client'

import { useCallback, useMemo } from 'react'
import { usePreferencesStore } from '@/stores/preferences.store'
import { usePlatformSettings } from '@/hooks/use-platform-settings'
import { currencies, type CurrencyCode } from '@/i18n/config'
import { CURRENCIES } from '@/lib/constants'

/**
 * Hook to format prices using the user's selected currency
 * Uses dynamic platform settings when available
 */
export function useCurrency() {
  const { currency, language } = usePreferencesStore()
  const { currencies: platformCurrencies } = usePlatformSettings()

  // Get currency config from platform settings, i18n config, or constants (in priority order)
  const currencyConfig = useMemo(() => {
    // First try platform settings (dynamic from admin)
    const fromPlatform = platformCurrencies?.find(c => c.code === currency)
    if (fromPlatform) {
      return {
        code: currency,
        symbol: fromPlatform.symbol,
        decimals: fromPlatform.decimals,
        rate: fromPlatform.rate,
        name: fromPlatform.name,
      }
    }

    // Fallback to static config
    const fromI18n = currencies[currency as CurrencyCode]
    const fromConstants = CURRENCIES.find(c => c.code === currency)
    
    return {
      code: currency,
      symbol: fromI18n?.symbol || fromConstants?.symbol || '€',
      decimals: fromI18n?.decimals ?? 2,
      rate: fromI18n?.rate || fromConstants?.rate || 1,
      name: fromI18n?.name || fromConstants?.name || currency,
    }
  }, [currency, platformCurrencies])

  // Get locale for formatting
  const locale = useMemo(() => {
    switch (language) {
      case 'ar': return 'ar-MA'
      case 'en': return 'en-US'
      default: return 'fr-FR'
    }
  }, [language])

  /**
   * Format a price in cents to the user's selected currency
   * Prices are stored in EUR cents, converted to target currency
   */
  const formatPrice = useCallback((priceInCents: number, options?: {
    showSymbol?: boolean
    convertFromEur?: boolean
  }) => {
    const { showSymbol = true, convertFromEur = true } = options || {}
    
    // Convert from cents to base unit
    let amount = priceInCents / 100
    
    // Convert from EUR to target currency if needed
    if (convertFromEur && currencyConfig.rate !== 1) {
      amount = amount * currencyConfig.rate
    }

    // For CFA francs, round to whole numbers
    if (currency === 'XOF' || currency === 'XAF') {
      amount = Math.round(amount)
      const formatted = amount.toLocaleString(locale)
      return showSymbol ? `${formatted} FCFA` : formatted
    }

    // For other currencies, use Intl.NumberFormat
    if (showSymbol) {
      try {
        const formatter = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyConfig.code,
          minimumFractionDigits: currencyConfig.decimals,
          maximumFractionDigits: currencyConfig.decimals,
        })
        return formatter.format(amount)
      } catch {
        // Fallback if currency code is not recognized
        const formatted = amount.toLocaleString(locale, {
          minimumFractionDigits: currencyConfig.decimals,
          maximumFractionDigits: currencyConfig.decimals,
        })
        return `${formatted} ${currencyConfig.symbol}`
      }
    }

    return amount.toLocaleString(locale, {
      minimumFractionDigits: currencyConfig.decimals,
      maximumFractionDigits: currencyConfig.decimals,
    })
  }, [currency, currencyConfig, locale])

  /**
   * Format a price that's already in the target currency (not EUR)
   */
  const formatLocalPrice = useCallback((amount: number, options?: {
    showSymbol?: boolean
  }) => {
    const { showSymbol = true } = options || {}

    // For CFA francs, round to whole numbers
    if (currency === 'XOF' || currency === 'XAF') {
      const rounded = Math.round(amount)
      const formatted = rounded.toLocaleString(locale)
      return showSymbol ? `${formatted} FCFA` : formatted
    }

    if (showSymbol) {
      try {
        const formatter = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currencyConfig.code,
          minimumFractionDigits: currencyConfig.decimals,
          maximumFractionDigits: currencyConfig.decimals,
        })
        return formatter.format(amount)
      } catch {
        const formatted = amount.toLocaleString(locale, {
          minimumFractionDigits: currencyConfig.decimals,
          maximumFractionDigits: currencyConfig.decimals,
        })
        return `${formatted} ${currencyConfig.symbol}`
      }
    }

    return amount.toLocaleString(locale, {
      minimumFractionDigits: currencyConfig.decimals,
      maximumFractionDigits: currencyConfig.decimals,
    })
  }, [currency, currencyConfig, locale])

  /**
   * Convert price from EUR cents to target currency
   */
  const convertPrice = useCallback((priceInEurCents: number): number => {
    const amountInEur = priceInEurCents / 100
    return amountInEur * currencyConfig.rate
  }, [currencyConfig.rate])

  /**
   * Get the currency symbol
   */
  const getSymbol = useCallback(() => {
    if (currency === 'XOF' || currency === 'XAF') {
      return 'FCFA'
    }
    return currencyConfig.symbol
  }, [currency, currencyConfig.symbol])

  return {
    currency,
    currencyConfig,
    locale,
    formatPrice,
    formatLocalPrice,
    convertPrice,
    getSymbol,
  }
}

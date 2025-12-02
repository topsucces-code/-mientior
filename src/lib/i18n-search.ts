/**
 * Multilingual Search Support (i18n)
 * 
 * Provides language detection, locale normalization, and field selection
 * for bilingual (French/English) search functionality.
 */

import { franc } from 'franc-min'

// Supported locales
export const SUPPORTED_LOCALES = ['fr', 'en'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

// Configuration from environment
const I18N_SEARCH_ENABLED = process.env.I18N_SEARCH_ENABLED !== 'false'
const I18N_DEFAULT_LOCALE = (process.env.I18N_DEFAULT_LOCALE || 'fr') as SupportedLocale
const I18N_DETECTION_THRESHOLD = parseFloat(process.env.I18N_DETECTION_THRESHOLD || '0.5')
const I18N_CACHE_TTL = parseInt(process.env.I18N_CACHE_TTL || '3600', 10)

// Simple in-memory cache for language detection results
const detectionCache = new Map<string, { locale: SupportedLocale; timestamp: number }>()

/**
 * Detect the language of a search query
 * Uses franc-min for language detection with caching
 * 
 * @param query - Search query text
 * @returns Detected locale ('fr' or 'en')
 */
export async function detectLanguage(query: string): Promise<SupportedLocale> {
  if (!I18N_SEARCH_ENABLED || !query || query.trim().length < 3) {
    return I18N_DEFAULT_LOCALE
  }

  const normalizedQuery = query.toLowerCase().trim()

  // Check cache
  const cached = detectionCache.get(normalizedQuery)
  if (cached && Date.now() - cached.timestamp < I18N_CACHE_TTL * 1000) {
    return cached.locale
  }

  try {
    // Detect language using franc-min
    // franc returns ISO 639-3 codes, we need to map to our locales
    const detected = franc(normalizedQuery, { minLength: 3 })
    
    // Map franc language codes to our supported locales
    // fra = French, eng = English
    let locale: SupportedLocale
    if (detected === 'fra' || detected === 'frn') {
      locale = 'fr'
    } else if (detected === 'eng') {
      locale = 'en'
    } else {
      // If uncertain or unsupported language, use default
      locale = I18N_DEFAULT_LOCALE
    }

    // Cache the result
    detectionCache.set(normalizedQuery, { locale, timestamp: Date.now() })

    // Clean up old cache entries (simple LRU)
    if (detectionCache.size > 1000) {
      const oldestKey = detectionCache.keys().next().value
      if (oldestKey) detectionCache.delete(oldestKey)
    }

    return locale
  } catch (error) {
    console.warn('[i18n-search] Language detection error:', error)
    return I18N_DEFAULT_LOCALE
  }
}

/**
 * Normalize a locale string to a supported locale
 * 
 * @param locale - Locale string (e.g., 'fr', 'en', 'fr-FR', 'en-US')
 * @returns Normalized locale ('fr' or 'en')
 */
export function normalizeLocale(locale: string | undefined | null): SupportedLocale {
  if (!locale) return I18N_DEFAULT_LOCALE

  const normalized = locale.toLowerCase().split('-')[0] as SupportedLocale
  
  if (SUPPORTED_LOCALES.includes(normalized)) {
    return normalized
  }

  return I18N_DEFAULT_LOCALE
}

/**
 * Get the appropriate searchable field names for a given locale
 * 
 * @param locale - Target locale
 * @returns Object with field names for name and description
 */
export function getSearchableFields(locale: SupportedLocale): {
  name: string
  description: string
  nameCoalesce: string
  descriptionCoalesce: string
} {
  if (locale === 'en') {
    return {
      name: 'nameEn',
      description: 'descriptionEn',
      nameCoalesce: 'COALESCE(name_en, name)',
      descriptionCoalesce: 'COALESCE(description_en, description)',
    }
  }

  // Default to French
  return {
    name: 'name',
    description: 'description',
    nameCoalesce: 'name',
    descriptionCoalesce: 'description',
  }
}

/**
 * Get the PostgreSQL text search configuration for a locale
 * 
 * @param locale - Target locale
 * @returns PostgreSQL text search config name
 */
export function getTextSearchConfig(locale: SupportedLocale): string {
  return locale === 'en' ? 'english' : 'french'
}

/**
 * Check if language detection is enabled
 * 
 * @returns True if detection is enabled
 */
export function shouldDetectLanguage(): boolean {
  return I18N_SEARCH_ENABLED
}

/**
 * Get the default locale
 * 
 * @returns Default locale
 */
export function getDefaultLocale(): SupportedLocale {
  return I18N_DEFAULT_LOCALE
}

/**
 * Clear the language detection cache
 * Useful for testing or when memory needs to be freed
 */
export function clearDetectionCache(): void {
  detectionCache.clear()
}

/**
 * Get cache statistics
 * Useful for monitoring and debugging
 */
export function getCacheStats(): {
  size: number
  enabled: boolean
  defaultLocale: SupportedLocale
  threshold: number
} {
  return {
    size: detectionCache.size,
    enabled: I18N_SEARCH_ENABLED,
    defaultLocale: I18N_DEFAULT_LOCALE,
    threshold: I18N_DETECTION_THRESHOLD,
  }
}

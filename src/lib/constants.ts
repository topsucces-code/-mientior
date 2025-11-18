import type { HeaderConfig, Language, Currency, RotatingMessage } from '@/types'

// ==================== HEADER CONFIGURATION ====================

export const HEADER_CONFIG: HeaderConfig = {
    heights: {
        promotionalBanner: 40,
        topBar: 36,
        mainHeader: 72,
        categoryNavBar: 48,
        total: 196, // 40 + 36 + 72 + 48
        compact: 120 // mainHeader + categoryNavBar when compact
    },
    scrollThresholds: {
        hide: 50, // Hide promotional banner
        compact: 100 // Compact header mode
    }
}

// ==================== LANGUAGES ====================

export const LANGUAGES: Language[] = [
    {
        code: 'fr',
        name: 'Français',
        nativeName: 'Français',
        flag: '🇫🇷'
    },
    {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇬🇧'
    },
    {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        flag: '🇪🇸'
    }
]

export const DEFAULT_LANGUAGE = 'fr'

// ==================== CURRENCIES ====================

export const CURRENCIES: Currency[] = [
    {
        code: 'EUR',
        symbol: '€',
        name: 'Euro',
        rate: 1
    },
    {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        rate: 1.08
    },
    {
        code: 'GBP',
        symbol: '£',
        name: 'British Pound',
        rate: 0.86
    },
    {
        code: 'XOF',
        symbol: 'CFA',
        name: 'CFA Franc',
        rate: 655.96
    }
]

export const DEFAULT_CURRENCY = 'EUR'

// ==================== ROTATING MESSAGES ====================

export const DEFAULT_ROTATING_MESSAGES: RotatingMessage[] = [
    {
        id: '1',
        text: '🎉 Livraison gratuite pour toutes commandes supérieures à 50€',
        type: 'promo',
        link: '/promo/livraison-gratuite'
    },
    {
        id: '2',
        text: '✨ Nouveautés : Découvrez notre collection printemps',
        type: 'info',
        link: '/nouveautes'
    },
    {
        id: '3',
        text: '🔥 Soldes d\'été : Jusqu\'à -70% sur une sélection d\'articles',
        type: 'promo',
        link: '/soldes'
    },
    {
        id: '4',
        text: '📦 Retours gratuits sous 30 jours',
        type: 'success'
    },
    {
        id: '5',
        text: '💳 Paiement en 3x sans frais dès 100€',
        type: 'info',
        link: '/paiement-fractionne'
    }
]

export const ROTATING_MESSAGES_INTERVAL = 5000 // 5 seconds

// ==================== NOTIFICATION ICONS ====================

export const NOTIFICATION_ICONS = {
    order: '📦',
    promo: '🎁',
    system: '🔔',
    message: '💬'
} as const

// ==================== SEARCH CONFIGURATION ====================

export const SEARCH_CONFIG = {
    minQueryLength: 2,
    debounceDelay: 300,
    maxSuggestions: 8,
    recentSearchesLimit: 5
}

// ==================== CART CONFIGURATION ====================

export const CART_CONFIG = {
    maxItems: 99,
    minQuantity: 1,
    maxQuantity: 10,
    freeShippingThreshold: 50
}

// ==================== WISHLIST CONFIGURATION ====================

export const WISHLIST_CONFIG = {
    maxItems: 100
}

// ==================== COMPARATOR CONFIGURATION ====================

export const COMPARATOR_CONFIG = {
    maxItems: 4,
    allowDifferentCategories: false
}

// ==================== GEOLOCATION CONFIGURATION ====================

export const GEOLOCATION_CONFIG = {
    apiUrl: 'https://ipapi.co/json/',
    defaultCountry: 'France',
    timeout: 10000, // 10 seconds
    enableHighAccuracy: true,
    maximumAge: 300000 // 5 minutes cache
}

// ==================== ANIMATION DURATIONS ====================

export const ANIMATION_DURATIONS = {
    fast: 150,
    normal: 300,
    slow: 500
}

// ==================== BREAKPOINTS ====================

export const BREAKPOINTS = {
    xs: 475,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
}

// ==================== COLOR HEX MAPPING ====================
export const COLOR_HEX_MAP: Record<string, string> = {
  'Noir': '#000000',
  'Blanc': '#FFFFFF',
  'Rouge': '#EF4444',
  'Bleu': '#3B82F6',
  'Vert': '#10B981',
  'Jaune': '#F59E0B',
  'Orange': '#FF6B00',
  'Rose': '#EC4899',
  'Violet': '#8B5CF6',
  'Gris': '#6B7280',
  'Marron': '#92400E',
  'Beige': '#D4C5B9',
  'Turquoise': '#14B8A6',
  'Bordeaux': '#991B1B'
}

// ==================== PLP CONFIGURATION ====================
export const PLP_CONFIG = {
  defaultItemsPerPage: 24,
  itemsPerPageOptions: [24, 48, 96],
  loadMoreIncrement: 24,
  maxFiltersShown: 5, // Show "+ X more" after this
  priceHistogramBins: 10,
  recentlyViewedLimit: 20,
  stickyOffsetDesktop: 120, // Header compact height
  stickyOffsetMobile: 80
}

// ==================== PDP CONFIGURATION ====================
export const PDP_CONFIG = {
  // Gallery
  maxImages: 10,
  thumbnailSize: 80, // px
  lightboxEnabled: true,

  // 360 Viewer
  view360Sensitivity: 2, // pixels per frame
  view360MinFrames: 24,

  // Stock
  lowStockThreshold: 10,
  stockWarningThreshold: 20,

  // Quantity
  minQuantity: 1,
  maxQuantity: 10,

  // Reviews
  reviewsPerPage: 10,
  reviewImageMaxSize: 5, // MB
  reviewMaxImages: 5,

  // Q&A
  qaPerPage: 10,
  qaSearchMinLength: 2,
  qaMaxQuestionLength: 500,
  qaMaxAnswerLength: 1000,

  // Bundle
  maxBundleProducts: 3,
  bundleDiscount: 5, // percentage

  // Recommendations
  maxRecommendations: 12,

  // Sticky Panel
  stickyPanelOffset: 400, // px scroll before showing

  // Returns
  defaultReturnDays: 30, // Default return period in days
}

// ==================== SIZE GUIDES ====================
export const SIZE_GUIDES = {
  shoes: [
    { eu: 36, us: 5.5, uk: 3.5, cm: 23.0 },
    { eu: 37, us: 6, uk: 4, cm: 23.5 },
    { eu: 38, us: 7, uk: 5, cm: 24.0 },
    { eu: 39, us: 7.5, uk: 5.5, cm: 24.5 },
    { eu: 40, us: 8, uk: 6, cm: 25.0 },
    { eu: 41, us: 8.5, uk: 7, cm: 25.5 },
    { eu: 42, us: 9, uk: 7.5, cm: 26.0 },
    { eu: 43, us: 10, uk: 8.5, cm: 26.5 },
    { eu: 44, us: 10.5, uk: 9, cm: 27.0 },
    { eu: 45, us: 11, uk: 10, cm: 27.5 },
  ],
  clothing: [
    { size: 'XS', chest: '86-91', waist: '71-76', hips: '91-96' },
    { size: 'S', chest: '92-97', waist: '77-82', hips: '97-102' },
    { size: 'M', chest: '98-103', waist: '83-88', hips: '103-108' },
    { size: 'L', chest: '104-109', waist: '89-94', hips: '109-114' },
    { size: 'XL', chest: '110-115', waist: '95-100', hips: '115-120' },
    { size: 'XXL', chest: '116-121', waist: '101-106', hips: '121-126' },
  ],
}

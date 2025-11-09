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

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserPreferences } from '@/types'
import { LANGUAGES, CURRENCIES } from '@/lib/constants'

interface PreferencesState extends UserPreferences {
    setLanguage: (language: string) => void
    setCurrency: (currency: string) => void
    setTheme: (theme: 'light' | 'dark' | 'system') => void
    setLocation: (location: string) => void
    toggleNotifications: () => void
    updatePreferences: (preferences: Partial<UserPreferences>) => void
    resetToDefaults: () => void
    syncFromCookies: () => void
}

// Helper to read cookies
function getCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift()
    return undefined
}


const DEFAULT_PREFERENCES: UserPreferences = {
    language: 'fr',
    currency: 'XOF', // Default to XOF for African market
    theme: 'system',
    location: 'Sénégal',
    notifications: true
}

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set, get) => ({
            ...DEFAULT_PREFERENCES,

            setLanguage: (language) => {
                // Validate language exists
                const validLanguage = LANGUAGES.find((l) => l.code === language)
                if (validLanguage) {
                    set({ language })

                    // Update document lang attribute for accessibility
                    if (typeof window !== 'undefined') {
                        document.documentElement.lang = language
                    }
                }
            },

            setCurrency: (currency) => {
                // Validate currency exists
                const validCurrency = CURRENCIES.find((c) => c.code === currency)
                if (validCurrency) {
                    set({ currency })
                }
            },

            setTheme: (theme) => {
                set({ theme })
                // Apply theme to document
                if (typeof window !== 'undefined') {
                    const root = window.document.documentElement
                    root.classList.remove('light', 'dark')

                    if (theme === 'system') {
                        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                            ? 'dark'
                            : 'light'
                        root.classList.add(systemTheme)
                    } else {
                        root.classList.add(theme)
                    }
                }
            },

            setLocation: (location) => {
                set({ location })
            },

            toggleNotifications: () => {
                set((state) => ({ notifications: !state.notifications }))
            },

            updatePreferences: (preferences) => {
                set((state) => ({ ...state, ...preferences }))

                // Apply theme if updated
                if (preferences.theme) {
                    get().setTheme(preferences.theme)
                }
            },

            resetToDefaults: () => {
                set(DEFAULT_PREFERENCES)
                get().setTheme(DEFAULT_PREFERENCES.theme)
            },

            syncFromCookies: () => {
                const cookieLocale = getCookie('NEXT_LOCALE')
                const cookieCurrency = getCookie('NEXT_CURRENCY')

                if (cookieLocale && LANGUAGES.some(l => l.code === cookieLocale)) {
                    set({ language: cookieLocale })
                }

                if (cookieCurrency && CURRENCIES.some(c => c.code === cookieCurrency)) {
                    set({ currency: cookieCurrency })
                }
            }
        }),
        {
            name: 'user-preferences-storage',
            onRehydrateStorage: () => (state) => {
                // After rehydration from localStorage, sync with cookies
                // Cookies take priority as they're used by next-intl
                if (state) {
                    state.syncFromCookies()
                }
            }
        }
    )
)

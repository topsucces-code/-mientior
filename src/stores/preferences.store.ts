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
}

const DEFAULT_PREFERENCES: UserPreferences = {
    language: 'fr',
    currency: 'EUR',
    theme: 'system',
    location: 'France',
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
            }
        }),
        {
            name: 'user-preferences-storage'
        }
    )
)

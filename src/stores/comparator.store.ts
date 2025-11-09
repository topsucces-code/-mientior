import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ComparatorItem } from '@/types'
import { COMPARATOR_CONFIG } from '@/lib/constants'

interface ComparatorState {
    items: ComparatorItem[]
    addItem: (item: ComparatorItem) => boolean
    removeItem: (id: string) => void
    clearAll: () => void
    isInComparator: (id: string) => boolean
    canAdd: (category?: string) => boolean
}

export const useComparatorStore = create<ComparatorState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item) => {
                const { items } = get()

                // Check if already in comparator
                if (items.some((i) => i.id === item.id)) {
                    return false
                }

                // Check max items limit
                if (items.length >= COMPARATOR_CONFIG.maxItems) {
                    return false
                }

                // Check category consistency if not allowed to mix
                if (!COMPARATOR_CONFIG.allowDifferentCategories && items.length > 0) {
                    const firstCategory = items[0]?.category
                    if (firstCategory && item.category !== firstCategory) {
                        return false
                    }
                }

                set({ items: [...items, { ...item, addedAt: new Date() }] })
                return true
            },

            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== id)
                }))
            },

            clearAll: () => {
                set({ items: [] })
            },

            isInComparator: (id) => {
                return get().items.some((item) => item.id === id)
            },

            canAdd: (category) => {
                const { items } = get()

                if (items.length >= COMPARATOR_CONFIG.maxItems) {
                    return false
                }

                if (!COMPARATOR_CONFIG.allowDifferentCategories && category && items.length > 0) {
                    const firstCategory = items[0]?.category
                    return !firstCategory || category === firstCategory
                }

                return true
            }
        }),
        {
            name: 'comparator-storage'
        }
    )
)

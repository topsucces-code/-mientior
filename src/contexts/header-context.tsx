'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { HEADER_CONFIG } from '@/lib/constants'

interface HeaderContextValue {
    scrollY: number
    isScrolled: boolean
    isCompact: boolean
    isHidden: boolean
    scrollDirection: 'up' | 'down' | null
    activeDropdown: string | null
    setActiveDropdown: (dropdown: string | null) => void
    closeAllDropdowns: () => void
    searchQuery: string
    setSearchQuery: (query: string) => void
    getVisibleHeight: () => number
}

const HeaderContext = createContext<HeaderContextValue | undefined>(undefined)

export function HeaderProvider({ children }: { children: React.ReactNode }) {
    const [scrollY, setScrollY] = useState(0)
    const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null)
    const [isHidden, setIsHidden] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const lastScrollY = useRef(0)
    const ticking = useRef(false)

    useEffect(() => {
        const handleScroll = () => {
            if (!ticking.current) {
                window.requestAnimationFrame(() => {
                    const currentScrollY = window.scrollY

                    // Determine scroll direction
                    if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                        setScrollDirection('down')
                        // Hide header when scrolling down past 200px
                        if (currentScrollY > 200) {
                            setIsHidden(true)
                        }
                    } else if (currentScrollY < lastScrollY.current) {
                        setScrollDirection('up')
                        setIsHidden(false)
                    }

                    lastScrollY.current = currentScrollY
                    setScrollY(currentScrollY)
                    ticking.current = false
                })
                ticking.current = true
            }
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const closeAllDropdowns = useCallback(() => {
        setActiveDropdown(null)
    }, [])

    // Close dropdowns on scroll
    useEffect(() => {
        if (scrollY > 0 && activeDropdown) {
            closeAllDropdowns()
        }
    }, [scrollY, activeDropdown, closeAllDropdowns])

    const isScrolled = scrollY > HEADER_CONFIG.scrollThresholds.hide
    const isCompact = scrollY > HEADER_CONFIG.scrollThresholds.compact

    // Calculate current visible header height
    const getVisibleHeight = useCallback(() => {
        let height = 0

        // Promotional banner (hidden when scrolled)
        if (!isScrolled) {
            height += HEADER_CONFIG.heights.promotionalBanner
        }

        // Top bar (hidden when scrolled)
        if (!isScrolled) {
            height += HEADER_CONFIG.heights.topBar
        }

        // Main header (compact or normal)
        height += isCompact ? HEADER_CONFIG.heights.compact : HEADER_CONFIG.heights.mainHeader

        // Category nav bar (always visible)
        height += HEADER_CONFIG.heights.categoryNavBar

        return height
    }, [isScrolled, isCompact])

    const value: HeaderContextValue = {
        scrollY,
        isScrolled,
        isCompact,
        isHidden,
        scrollDirection,
        activeDropdown,
        setActiveDropdown,
        closeAllDropdowns,
        searchQuery,
        setSearchQuery,
        getVisibleHeight
    }

    return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
}

export function useHeader() {
    const context = useContext(HeaderContext)
    if (context === undefined) {
        throw new Error('useHeader must be used within HeaderProvider')
    }
    return context
}


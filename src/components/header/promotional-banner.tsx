'use client'

import { useHeader } from '@/contexts/header-context'
import { HEADER_CONFIG } from '@/lib/constants'
import { X } from 'lucide-react'
import { useState } from 'react'

export function PromotionalBanner() {
    const { isScrolled } = useHeader()
    const [isVisible, setIsVisible] = useState(true)

    if (!isVisible || isScrolled) {
        return null
    }

    return (
        <div
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white"
            style={{ height: HEADER_CONFIG.heights.promotionalBanner }}
        >
            <div className="container mx-auto px-4 h-full flex items-center justify-between">
                <div className="flex-1 text-center text-sm font-medium">
                    🎉 Offre spéciale : <span className="font-bold">-20%</span> sur tout le site avec le code{' '}
                    <span className="bg-white text-purple-600 px-2 py-0.5 rounded font-bold">WELCOME20</span>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="hover:bg-white/20 p-1 rounded transition-colors"
                    aria-label="Fermer la bannière"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

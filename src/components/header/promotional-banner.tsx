'use client'

import { useHeader } from '@/contexts/header-context'
import { HEADER_CONFIG } from '@/lib/constants'
import { X, ShoppingBag } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export function PromotionalBanner() {
    const { isScrolled } = useHeader()
    const [isVisible, setIsVisible] = useState(true)
    const [isMounted, setIsMounted] = useState(false)
    const [countdown, setCountdown] = useState({ hours: 42, mins: 46, secs: 0 })

    // Mark as mounted to avoid hydration mismatch
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Countdown timer - ticks every second
    useEffect(() => {
        if (!isMounted) return

        // Don't start timer if already at 0
        if (countdown.hours === 0 && countdown.mins === 0 && countdown.secs === 0) {
            return
        }

        const timer = setInterval(() => {
            setCountdown(prev => {
                let { hours, mins, secs } = prev

                // Already at 0, stop
                if (hours === 0 && mins === 0 && secs === 0) {
                    return prev
                }

                if (secs > 0) {
                    secs--
                } else if (mins > 0) {
                    mins--
                    secs = 59
                } else if (hours > 0) {
                    hours--
                    mins = 59
                    secs = 59
                }

                return { hours, mins, secs }
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [isMounted, countdown.hours, countdown.mins, countdown.secs])

    if (!isVisible || isScrolled) {
        return null
    }

    return (
        <div
            className="
                hidden md:block
                bg-orange-600 
                text-white relative overflow-hidden
                animate-[bannerSlideIn_400ms_ease]
            "
            style={{ height: HEADER_CONFIG.heights.promotionalBanner }}
        >
            <div className="container mx-auto px-[2%] lg:px-[4%] h-full flex items-center justify-center relative">
                {/* Promo content */}
                <div className="flex items-center gap-1.5 lg:gap-3 text-[13px] lg:text-[15px] font-semibold">
                    {/* Icon */}
                    <span className="text-lg lg:text-xl">🔥</span>
                    
                    <span className="hidden lg:inline">Season Sale Ends In...</span>
                    <span className="lg:hidden">Sale Ends...</span>

                    {/* Countdown - only render after mount to avoid hydration mismatch */}
                    {isMounted && (
                        <div className="flex items-center gap-1 ml-1 lg:ml-2">
                            <CountdownUnit value={countdown.hours} label="Hours" />
                            <CountdownUnit value={countdown.mins} label="Mins" />
                            <CountdownUnit value={countdown.secs} label="Secs" />
                        </div>
                    )}
                    
                    {/* CTA Button */}
                    <Link
                        href="/soldes"
                        className="
                            ml-2 lg:ml-4 px-3 lg:px-5 py-1 lg:py-1.5 rounded-full
                            bg-white text-orange-600 font-bold text-xs lg:text-sm
                            hover:bg-orange-50
                            transition-all duration-200
                            flex items-center gap-1 lg:gap-2
                        "
                    >
                        <ShoppingBag className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                        <span className="hidden lg:inline">Shop Now</span>
                        <span className="lg:hidden">Shop</span>
                    </Link>
                </div>
                
                {/* Close button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="
                        absolute right-2 lg:right-5
                        w-6 h-6 lg:w-7 lg:h-7 rounded-full
                        bg-white/20 hover:bg-white/30
                        flex items-center justify-center
                        transition-all duration-200
                    "
                    aria-label="Fermer la bannière"
                >
                    <X className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </button>
            </div>
        </div>
    )
}

interface CountdownUnitProps {
    value: number
    label: string
}

function CountdownUnit({ value, label }: CountdownUnitProps) {
    return (
        <div className="
            flex flex-col items-center
            bg-black/20 rounded-md px-1.5 lg:px-2.5 py-0.5 lg:py-1
            min-w-[32px] lg:min-w-[40px]
        ">
            <span className="
                text-sm lg:text-lg font-bold leading-none
                font-[tabular-nums] tracking-[0.05em]
            ">
                {value.toString().padStart(2, '0')}
            </span>
            <span className="text-xs uppercase tracking-wider opacity-80">
                {label}
            </span>
        </div>
    )
}

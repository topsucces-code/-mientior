'use client'

import Link from 'next/link'
import { Store } from 'lucide-react'

interface LogoProps {
    isCompact?: boolean
}

export function Logo({ isCompact = false }: LogoProps) {
    return (
        <Link 
            href="/" 
            className="flex items-center gap-1.5 md:gap-2 group transition-all duration-300 ease-smooth"
        >
            {/* Logo Icon */}
            <div className={`
                bg-gradient-to-br from-turquoise-600 to-turquoise-500 
                rounded-lg transition-all duration-300 ease-smooth
                group-hover:scale-110 group-hover:shadow-[0_4px_8px_rgba(8,145,178,0.2)]
                ${isCompact ? 'p-1 md:p-1.5' : 'p-1.5 md:p-2'}
            `}>
                <Store className={`text-white transition-all duration-300 ${isCompact ? 'w-4 h-4 md:w-5 md:h-5' : 'w-5 h-5 md:w-6 md:h-6'}`} />
            </div>
            
            {/* Logo Text */}
            <div className="flex flex-col">
                <span className={`
                    font-bold bg-gradient-to-r from-turquoise-600 to-turquoise-500 
                    bg-clip-text text-transparent transition-all duration-300
                    ${isCompact ? 'text-base md:text-lg' : 'text-lg md:text-xl'}
                `}>
                    Mientior
                </span>
                {/* Tagline - hidden when compact or on mobile */}
                <span className={`
                    hidden md:block
                    text-[9px] lg:text-[10px] text-gray-500 -mt-1 tracking-[0.15em] uppercase
                    transition-all duration-200
                    ${isCompact ? 'md:opacity-0 md:h-0' : 'md:opacity-100'}
                `}>
                    Marketplace
                </span>
            </div>
        </Link>
    )
}

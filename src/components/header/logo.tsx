'use client'

import Link from 'next/link'
import { Store } from 'lucide-react'

export function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-2 rounded-lg group-hover:scale-110 transition-transform">
                <Store className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                    Mientior
                </span>
                <span className="text-[10px] text-taupe-500 -mt-1">Luxe Naturel</span>
            </div>
        </Link>
    )
}
